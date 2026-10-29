// Which resource a unit draws on, and what the player pays without it. Pure: the inputs are rows already read
// from the game's database and the player's resource list, so the tests run it without the engine.
//
// The data files mark every gated unit with a tag per resource it draws on, SR_SUPPLY_<NAME>, and the resource is
// RESOURCE_<NAME>. A unit carries one tag, or two with the Modern Supply Chains option on; the penalties stack.
// Where another resource stands in for one (Pitch for Hardwood in Exploration), the unit also carries
// SR_EITHER_<NAME>_OR_<OTHER>, and a copy of either supplies it: the copies below are counted for the pair.
// The penalty sizes are read back from the loaded modifiers rather than kept here as well, so the panel always
// shows what the game is actually applying under the setup option chosen.

export const SUPPLY_TAG_PREFIX = "SR_SUPPLY_";
export const COMBAT_PENALTY_PREFIX = "SR_COMBAT_PENALTY_";
export const PRODUCTION_PENALTY_PREFIX = "SR_PRODUCTION_PENALTY_";
export const EITHER_TAG_PREFIX = "SR_EITHER_";

/**
 * @typedef {object} Penalty
 * @property {number} combat combat strength change without the resource (negative)
 * @property {number} productionPercent production rate change without the resource (negative)
 */

/**
 * @typedef {object} SupplyStatus
 * @property {string} resourceType
 * @property {number} combat
 * @property {number} productionPercent
 */

/**
 * @typedef {object} SupplyQuery
 * @property {string} unitType
 * @property {Map<string, string[]>} supply unit type to the resources it draws on, in the data's order
 * @property {Map<string, Penalty>} penalties resource type to its penalty
 * @property {(resourceType: string) => number} copiesOf the owner's copies of a resource
 */

/**
 * The resource a supply tag stands for, or null for any other tag.
 * @param {string} tag
 * @returns {string | null}
 */
export function resourceForSupplyTag(tag) {
  if (typeof tag !== "string" || !tag.startsWith(SUPPLY_TAG_PREFIX)) return null;
  const name = tag.slice(SUPPLY_TAG_PREFIX.length);
  return name ? `RESOURCE_${name}` : null;
}

/**
 * Unit type to the resources it draws on, from TypeTags rows, each once, in the rows' order.
 * @param {Iterable<{ Type?: string, Tag?: string }>} typeTags
 * @returns {Map<string, string[]>}
 */
export function buildSupplyIndex(typeTags) {
  /** @type {Map<string, string[]>} */
  const index = new Map();
  for (const row of typeTags) {
    const resource = resourceForSupplyTag(row?.Tag ?? "");
    if (!resource || !row.Type) continue;
    const list = index.get(row.Type) ?? [];
    if (!list.includes(resource)) list.push(resource);
    index.set(row.Type, list);
  }
  return index;
}

/**
 * Resource type to the resources that stand in for it, from the either tags on the units: SR_EITHER_HARDWOOD_OR_PITCH
 * gives Hardwood the stand-in Pitch.
 * @param {Iterable<{ Type?: string, Tag?: string }>} typeTags
 * @returns {Map<string, string[]>}
 */
export function buildAlternativeIndex(typeTags) {
  /** @type {Map<string, string[]>} */
  const index = new Map();
  for (const row of typeTags) {
    const tag = row?.Tag ?? "";
    if (!tag.startsWith(EITHER_TAG_PREFIX)) continue;
    const [first, ...others] = tag.slice(EITHER_TAG_PREFIX.length).split("_OR_").map((name) => `RESOURCE_${name}`);
    if (!others.length || others.some((name) => name === "RESOURCE_")) continue;
    index.set(first, [...new Set([...(index.get(first) ?? []), ...others])]);
  }
  return index;
}

/** The tag data/sr-carry-over.sql puts on the units an age change carries armies into, which are never locked. */
export const CARRIED_TAG = "SR_CARRIED_FREE";

/**
 * The units an age change carries a player's army into (and the uniques that replace them): free to train under
 * every value, though they keep the Unsupplied penalty (data/sr-carry-over.sql).
 * @param {Iterable<{ Type?: string, Tag?: string }>} typeTags
 * @returns {Set<string>}
 */
export function buildCarriedIndex(typeTags) {
  const out = new Set();
  for (const row of typeTags) if (row?.Tag === CARRIED_TAG && row.Type) out.add(row.Type);
  return out;
}

/**
 * The name key of a resource with its stand-ins, LOC_SR_EITHER_HARDWOOD_OR_PITCH_NAME ("Hardwood or Pitch").
 * @param {string} resourceType @param {string[]} others
 */
export const eitherNameKey = (resourceType, others) =>
  `LOC_${EITHER_TAG_PREFIX}${[resourceType, ...others].map((r) => r.replace(/^RESOURCE_/, "")).join("_OR_")}_NAME`;

/**
 * Unit type to the resources it draws on, each followed by its stand-ins: what supplies the unit, for the resource
 * line on each of them.
 * @param {Map<string, string[]>} supply @param {Map<string, string[]>} alternatives
 * @returns {Map<string, string[]>}
 */
export function withAlternatives(supply, alternatives) {
  if (alternatives.size === 0) return supply;
  return new Map([...supply].map(([unitType, resources]) =>
    [unitType, [...new Set(resources.flatMap((r) => [r, ...(alternatives.get(r) ?? [])]))]]));
}

/**
 * Resource type to the penalty the loaded modifiers apply without it. A resource with no penalty modifier is left
 * out, which is how the Off setting shows up.
 * @param {Iterable<{ ModifierId?: string, Name?: string, Value?: string | number }>} modifierArguments
 * @returns {Map<string, Penalty>}
 */
export function buildPenaltyIndex(modifierArguments) {
  /** @type {Map<string, Penalty>} */
  const index = new Map();
  const entry = (/** @type {string} */ resource) => {
    let penalty = index.get(resource);
    if (!penalty) {
      penalty = { combat: 0, productionPercent: 0 };
      index.set(resource, penalty);
    }
    return penalty;
  };
  for (const row of modifierArguments) {
    const id = row?.ModifierId ?? "";
    const value = Number(row?.Value);
    if (!Number.isFinite(value)) continue;
    if (id.startsWith(COMBAT_PENALTY_PREFIX) && row.Name === "Amount") {
      entry(`RESOURCE_${id.slice(COMBAT_PENALTY_PREFIX.length)}`).combat = value;
    } else if (id.startsWith(PRODUCTION_PENALTY_PREFIX) && row.Name === "Percent") {
      entry(`RESOURCE_${id.slice(PRODUCTION_PENALTY_PREFIX.length)}`).productionPercent = value;
    }
  }
  return index;
}

/**
 * How many copies of a resource a player holds on the map. Off-map entries count for nothing in the engine's own
 * checks, so they are left out here too.
 * @param {Iterable<{ resourceType: string | null, isOffMap?: boolean }>} holdings
 * @param {string} resourceType
 * @returns {number}
 */
export function countCopies(holdings, resourceType) {
  let copies = 0;
  for (const holding of holdings) {
    if (holding && !holding.isOffMap && holding.resourceType === resourceType) copies += 1;
  }
  return copies;
}

/**
 * The copies that supply a resource: its own and those of its stand-ins.
 * @param {Iterable<{ resourceType: string | null, isOffMap?: boolean }>} holdings
 * @param {string} resourceType
 * @param {Map<string, string[]>} alternatives
 * @returns {number}
 */
export function countSupply(holdings, resourceType, alternatives) {
  const list = [...holdings];
  return [resourceType, ...(alternatives.get(resourceType) ?? [])]
    .reduce((total, r) => total + countCopies(list, r), 0);
}

/**
 * The unsupplied statuses of one unit type for its owner: one per resource the unit draws on that the owner holds
 * none of and that carries a penalty. Empty when the unit is supplied, draws on nothing, or the penalty is off.
 * @param {SupplyQuery} input
 * @returns {SupplyStatus[]}
 */
export function computeSupplyStatuses({ unitType, supply, penalties, copiesOf }) {
  /** @type {SupplyStatus[]} */
  const statuses = [];
  for (const resourceType of supply.get(unitType) ?? []) {
    const penalty = penalties.get(resourceType);
    if (!penalty || (penalty.combat === 0 && penalty.productionPercent === 0)) continue;
    if (copiesOf(resourceType) > 0) continue;
    statuses.push({ resourceType, combat: penalty.combat, productionPercent: penalty.productionPercent });
  }
  return statuses;
}

/**
 * The first unsupplied status of a unit type, or null: what the callout names.
 * @param {SupplyQuery} input
 * @returns {SupplyStatus | null}
 */
export function computeSupplyStatus(input) {
  return computeSupplyStatuses(input)[0] ?? null;
}

// The resource line names this many units before "and N more".
export const SUPPLIED_UNITS_SHOWN = 3;

/**
 * The units a resource supplies, by display name, for the resource line. A unit missing from `unitNames` is left
 * out, which is how the caller drops other civilizations' unique units.
 * @param {string} resourceType
 * @param {Map<string, string[]>} supply unit type to the resources it draws on
 * @param {Map<string, string>} unitNames unit type to its display name
 * @returns {{ names: string[], more: number } | null} the first names in order and how many follow, or null
 */
export function unitsSuppliedBy(resourceType, supply, unitNames) {
  const names = new Set();
  for (const [unitType, resources] of supply) {
    const name = resources.includes(resourceType) ? unitNames.get(unitType) : undefined;
    if (name) names.add(name);
  }
  if (names.size === 0) return null;
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  return { names: sorted.slice(0, SUPPLIED_UNITS_SHOWN), more: Math.max(0, sorted.length - SUPPLIED_UNITS_SHOWN) };
}

/**
 * @typedef {object} ProductionLine
 * @property {"LOC_SR_PRODUCTION_LOCKED" | "LOC_SR_PRODUCTION_NEEDS_NONE" | "LOC_SR_PRODUCTION_NEEDS_HELD"} key
 * @property {(string | number)[]} args the text's arguments, the resource first
 */

/**
 * The lines for a unit's item in the production list, one per resource it draws on: what it needs and, with none
 * held, what that costs. Reads the same statuses as the unit panel, so the two never disagree. Under the hard
 * gate, a resource the owner cannot train the unit without reads the locked form instead. Empty when the unit draws
 * on nothing, or when the penalty is off and nothing is locked.
 * @param {string} unitType
 * @param {Omit<SupplyQuery, "unitType"> & { gate?: Gate }} query
 * @returns {ProductionLine[]}
 */
export function describeProductionCost(unitType, { supply, penalties, copiesOf, gate }) {
  const locked = new Set(gate ? lockedResources(unitType, gate, copiesOf) : []);
  const resources = [...new Set([...locked, ...(supply.get(unitType) ?? [])])];
  /** @type {ProductionLine[]} */
  const lines = [];
  for (const resourceType of resources) {
    if (locked.has(resourceType)) {
      lines.push({ key: "LOC_SR_PRODUCTION_LOCKED", args: [resourceType] });
      continue;
    }
    const penalty = penalties.get(resourceType);
    if (!penalty || (penalty.combat === 0 && penalty.productionPercent === 0)) continue;
    const copies = copiesOf(resourceType);
    lines.push(copies > 0 ? { key: "LOC_SR_PRODUCTION_NEEDS_HELD", args: [resourceType, copies] }
      : { key: "LOC_SR_PRODUCTION_NEEDS_NONE", args: [resourceType, penalty.combat] });
  }
  return lines;
}

/**
 * @typedef {object} SupplyLoss
 * @property {"LOC_SR_NOTIFY_LOST_NONE" | "LOC_SR_NOTIFY_LOST_ONE" | "LOC_SR_NOTIFY_LOST_MANY"
 *   | "LOC_SR_NOTIFY_LOCKED"} key
 * @property {string} resourceType
 * @property {string | null} unitType the unit the sentence names, the type the player has most of
 * @property {number} others how many more of the player's units the loss reaches
 * @property {number} combat
 * @property {boolean} locked under the hard gate: new units of the kind cannot be trained until the resource is back
 */

/**
 * What losing the last copy of a resource does to a player's army, for the lost-supply notification: the unit type
 * to name, how many others, and the penalty. Under the hard gate with the penalty off, the loss still locks the
 * units that need the resource (LOC_SR_NOTIFY_LOCKED, with nothing to count). Null when neither applies.
 * @param {string} resourceType
 * @param {Iterable<string>} unitTypes the player's units, one entry per unit
 * @param {{ supply: Map<string, string[]>, penalties: Map<string, Penalty>, gate?: Gate }} indexes
 * @returns {SupplyLoss | null}
 */
export function describeSupplyLoss(resourceType, unitTypes, { supply, penalties, gate }) {
  const locked = gateNames(gate, resourceType);
  const penalty = penalties.get(resourceType);
  if (!penalty || (penalty.combat === 0 && penalty.productionPercent === 0)) {
    if (!locked) return null;
    return { key: "LOC_SR_NOTIFY_LOCKED", resourceType, unitType: null, others: 0, combat: 0, locked };
  }
  const reached = [...unitTypes].filter((unitType) => (supply.get(unitType) ?? []).includes(resourceType));
  return {
    key: lossKey(reached.length),
    resourceType,
    unitType: mostCommon(reached),
    others: Math.max(0, reached.length - 1),
    combat: penalty.combat,
    locked
  };
}

/** @param {Gate | undefined} gate @param {string} resourceType */
function gateNames(gate, resourceType) {
  if (!gate?.on) return false;
  for (const resources of gate.needs.values()) {
    if (resources.includes(resourceType)) return true;
  }
  return false;
}

/**
 * @param {number} total
 * @returns {"LOC_SR_NOTIFY_LOST_NONE" | "LOC_SR_NOTIFY_LOST_ONE" | "LOC_SR_NOTIFY_LOST_MANY"}
 */
function lossKey(total) {
  if (total === 0) return "LOC_SR_NOTIFY_LOST_NONE";
  return total === 1 ? "LOC_SR_NOTIFY_LOST_ONE" : "LOC_SR_NOTIFY_LOST_MANY";
}

/**
 * The entry that occurs most often, the first seen on a tie; null for none.
 * @param {string[]} entries
 * @returns {string | null}
 */
function mostCommon(entries) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const entry of entries) counts.set(entry, (counts.get(entry) ?? 0) + 1);
  let best = null;
  let most = 0;
  for (const [entry, count] of counts) {
    if (count > most) [best, most] = [entry, count];
  }
  return best;
}

// The hard gate (1.1). A gated unit carries Units.StrategicResource, which the engine checks against the owner's
// live copy count for training and purchase once the production minimum parameter is set (vanilla defines none).
// Whether the mod's own option is on is read from the data too: every unit of the gate map carries the column, and
// the thresholds read one copy, only when one of the option's groups loaded and no later mod wrote its own.

export const GATE_PRODUCTION_PARAMETER = "STRATEGIC_RESOURCE_MINIMUM_FOR_PRODUCTION_ANYWHERE";
export const GATE_PURCHASE_PARAMETER = "STRATEGIC_RESOURCE_MINIMUM_FOR_PURCHASE_ANYWHERE";
export const GATE_UPGRADING_PARAMETER = "STRATEGIC_RESOURCE_MINIMUM_FOR_UNIT_UPGRADING";

/**
 * @typedef {object} Gate
 * @property {boolean} on the option is on: every gated unit carries the column and the engine checks it
 * @property {boolean} upgrade upgrading into a gated unit needs a copy too
 * @property {Map<string, string>} columns unit type to the resource its StrategicResource column names
 * @property {Map<string, string[]>} needs unit type to every resource the gate locks it behind: the column's, then
 *   any other the unit draws on (Modern Supply Chains), which the grant-only lines lock it behind; and for a unit with
 *   stand-ins, which carries no column, what it draws on (a copy of a stand-in counts for it)
 */

/**
 * The gate as the loaded data has it. It is on only when the thresholds are the ones the option writes (one copy
 * to train or buy) and every unit of the gate map carries its column: another mod's thresholds or columns are that
 * mod's rule, which its own texts explain, so the mod's lock texts step back to the 1.0 lines.
 * @param {Iterable<{ UnitType?: string, StrategicResource?: string | null }>} units GameInfo.Units rows
 * @param {Iterable<{ Name?: string, Value?: string | number }>} globalParameters GameInfo.GlobalParameters rows
 * @param {Map<string, string[]>} supply unit type to the resources it draws on
 * @param {Map<string, string[]>} [alternatives] resource type to its stand-ins
 * @param {Set<string>} [carried] units the age change carries armies into: never locked, so left out of the check
 * @returns {Gate}
 */
export function buildGateIndex(units, globalParameters, supply, alternatives = new Map(), carried = new Set()) {
  const rows = [...units];
  const params = readParameters(globalParameters);
  const own = params.get(GATE_PRODUCTION_PARAMETER) === 1 && params.get(GATE_PURCHASE_PARAMETER) === 1;
  if (!own) return { on: false, upgrade: false, columns: new Map(), needs: new Map() };
  const columns = readColumns(rows);
  // A carried unit counts as one the game lacks: no column, no lock, and no say in whether the gate is on.
  const known = new Set(rows.map((row) => row?.UnitType).filter((unitType) => !unitType || !carried.has(unitType)));
  for (const unitType of carried) columns.delete(unitType);
  const on = coversSupply(columns, known, supply, alternatives);
  if (!on) columns.clear();
  const upgrade = on && (params.get(GATE_UPGRADING_PARAMETER) ?? 0) >= 1;
  const needs = needsOf(columns, supply);
  if (on) addStandInNeeds(needs, { supply, columns, known, alternatives });
  return { on, upgrade, columns, needs };
}

/**
 * A unit whose every resource has stand-ins carries no column: the line file's grant locks it.
 * @param {string[]} resources @param {Map<string, string[]>} alternatives
 */
const hasStandIns = (resources, alternatives) => resources.length > 0 && resources.every((r) => alternatives.has(r));

/**
 * Adds the units with stand-ins to the gate's needs, behind what they draw on.
 * @param {Map<string, string[]>} needs
 * @param {{ supply: Map<string, string[]>, columns: Map<string, string>, known: Set<string | undefined>,
 *   alternatives: Map<string, string[]> }} tables
 */
function addStandInNeeds(needs, { supply, columns, known, alternatives }) {
  for (const [unitType, resources] of supply) {
    if (known.has(unitType) && !columns.has(unitType) && hasStandIns(resources, alternatives)) {
      needs.set(unitType, resources);
    }
  }
}

/** @param {{ UnitType?: string, StrategicResource?: string | null }[]} rows @returns {Map<string, string>} */
function readColumns(rows) {
  /** @type {Map<string, string>} */
  const columns = new Map();
  for (const row of rows) {
    if (row?.UnitType && row.StrategicResource) columns.set(row.UnitType, row.StrategicResource);
  }
  return columns;
}

/**
 * Every resource the gate locks each column unit behind: the column's first, then the rest it draws on.
 * @param {Map<string, string>} columns @param {Map<string, string[]>} supply @returns {Map<string, string[]>}
 */
function needsOf(columns, supply) {
  /** @type {Map<string, string[]>} */
  const needs = new Map();
  for (const [unitType, resource] of columns) {
    needs.set(unitType, [...new Set([resource, ...(supply.get(unitType) ?? [])])]);
  }
  return needs;
}

/** @param {Iterable<{ Name?: string, Value?: string | number }>} globalParameters */
function readParameters(globalParameters) {
  /** @type {Map<string, number>} */
  const params = new Map();
  for (const row of globalParameters) {
    const value = Number(row?.Value);
    if (row?.Name && Number.isFinite(value)) params.set(row.Name, value);
  }
  return params;
}

/**
 * Whether every unit of the gate map the game knows carries one of its resources in the column, which is what the
 * option's groups write; another mod's column covers only some of them. A unit with stand-ins is left out: it
 * carries no column, and the line file's grant locks it. False when the game knows no column unit.
 * @param {Map<string, string>} columns
 * @param {Set<string | undefined>} known the unit types in the table
 * @param {Map<string, string[]>} supply
 * @param {Map<string, string[]>} alternatives
 * @returns {boolean}
 */
function coversSupply(columns, known, supply, alternatives) {
  let seen = 0;
  for (const [unitType, resources] of supply) {
    if (!known.has(unitType) || (!columns.has(unitType) && hasStandIns(resources, alternatives))) continue;
    const column = columns.get(unitType);
    if (!column || !resources.includes(column)) return false;
    seen += 1;
  }
  return seen > 0;
}

/**
 * The resources a unit cannot be trained or bought without that the owner holds none of, in the gate's order.
 * @param {string} unitType
 * @param {Gate} gate
 * @param {(resourceType: string) => number} copiesOf
 * @returns {string[]}
 */
export function lockedResources(unitType, gate, copiesOf) {
  return (gate.needs.get(unitType) ?? []).filter((resource) => copiesOf(resource) === 0);
}

/**
 * The first resource a unit cannot be trained or bought without, when the owner holds none of it; null otherwise.
 * @param {string} unitType
 * @param {Gate} gate
 * @param {(resourceType: string) => number} copiesOf
 * @returns {string | null}
 */
export function lockedBy(unitType, gate, copiesOf) {
  return lockedResources(unitType, gate, copiesOf)[0] ?? null;
}
