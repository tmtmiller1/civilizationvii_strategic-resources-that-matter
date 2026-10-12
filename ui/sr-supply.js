// Which resource a unit draws on, and what the player pays without it. Pure: the inputs are rows already read
// from the game's database and the player's resource list, so the tests run it without the engine.
//
// The data files mark every gated unit with one tag, SR_SUPPLY_<NAME>, and the resource it needs is RESOURCE_<NAME>.
// The penalty sizes are read back from the loaded modifiers rather than kept here as well, so the panel always
// shows what the game is actually applying under the setup option chosen.

export const SUPPLY_TAG_PREFIX = "SR_SUPPLY_";
export const COMBAT_PENALTY_PREFIX = "SR_COMBAT_PENALTY_";
export const PRODUCTION_PENALTY_PREFIX = "SR_PRODUCTION_PENALTY_";

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
 * @property {Map<string, string>} supply unit type to the resource it draws on
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
 * Unit type to the resource it draws on, from TypeTags rows.
 * @param {Iterable<{ Type?: string, Tag?: string }>} typeTags
 * @returns {Map<string, string>}
 */
export function buildSupplyIndex(typeTags) {
  /** @type {Map<string, string>} */
  const index = new Map();
  for (const row of typeTags) {
    const resource = resourceForSupplyTag(row?.Tag ?? "");
    if (resource && row.Type) index.set(row.Type, resource);
  }
  return index;
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
 * The unsupplied status of one unit type for a player holding `copies` of what it needs, or null when the unit is
 * supplied, draws on nothing, or the penalty is off.
 * @param {SupplyQuery} input
 * @returns {SupplyStatus | null}
 */
export function computeSupplyStatus({ unitType, supply, penalties, copiesOf }) {
  const resourceType = supply.get(unitType);
  if (!resourceType) return null;
  const penalty = penalties.get(resourceType);
  if (!penalty || (penalty.combat === 0 && penalty.productionPercent === 0)) return null;
  if (copiesOf(resourceType) > 0) return null;
  return { resourceType, combat: penalty.combat, productionPercent: penalty.productionPercent };
}

// The resource line names this many units before "and N more".
export const SUPPLIED_UNITS_SHOWN = 3;

/**
 * The units a resource supplies, by display name, for the resource line. A unit missing from `unitNames` is left
 * out, which is how the caller drops other civilizations' unique units.
 * @param {string} resourceType
 * @param {Map<string, string>} supply unit type to the resource it draws on
 * @param {Map<string, string>} unitNames unit type to its display name
 * @returns {{ names: string[], more: number } | null} the first names in order and how many follow, or null
 */
export function unitsSuppliedBy(resourceType, supply, unitNames) {
  const names = new Set();
  for (const [unitType, resource] of supply) {
    const name = resource === resourceType ? unitNames.get(unitType) : undefined;
    if (name) names.add(name);
  }
  if (names.size === 0) return null;
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  return { names: sorted.slice(0, SUPPLIED_UNITS_SHOWN), more: Math.max(0, sorted.length - SUPPLIED_UNITS_SHOWN) };
}

/**
 * The line for a unit's item in the production list: what it needs and, with none held, what that costs. Reads
 * the same status as the unit panel line, so the two never disagree. Null when the unit draws on nothing or the
 * penalty is off.
 * Under the hard gate, a unit the owner cannot train for want of its resource reads the locked form instead.
 * @param {string} unitType
 * @param {Omit<SupplyQuery, "unitType"> & { gate?: Gate }} query
 * @returns {{ key: string, args: (string | number)[] } | null} a text key and its arguments, the resource first
 */
export function describeProductionCost(unitType, { supply, penalties, copiesOf, gate }) {
  const locked = gate ? lockedBy(unitType, gate, copiesOf) : null;
  if (locked) return { key: "LOC_SR_PRODUCTION_LOCKED", args: [locked] };
  const status = computeSupplyStatus({ unitType, supply, penalties, copiesOf });
  if (status) return { key: "LOC_SR_PRODUCTION_NEEDS_NONE", args: [status.resourceType, status.combat] };
  const resourceType = supply.get(unitType);
  const penalty = resourceType ? penalties.get(resourceType) : undefined;
  if (!resourceType || !penalty || (penalty.combat === 0 && penalty.productionPercent === 0)) return null;
  return { key: "LOC_SR_PRODUCTION_NEEDS_HELD", args: [resourceType, copiesOf(resourceType)] };
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
 * @param {{ supply: Map<string, string>, penalties: Map<string, Penalty>, gate?: Gate }} indexes
 * @returns {SupplyLoss | null}
 */
export function describeSupplyLoss(resourceType, unitTypes, { supply, penalties, gate }) {
  const locked = gateNames(gate, resourceType);
  const penalty = penalties.get(resourceType);
  if (!penalty || (penalty.combat === 0 && penalty.productionPercent === 0)) {
    if (!locked) return null;
    return { key: "LOC_SR_NOTIFY_LOCKED", resourceType, unitType: null, others: 0, combat: 0, locked };
  }
  const reached = [...unitTypes].filter((unitType) => supply.get(unitType) === resourceType);
  return {
    key: lossKey(reached.length),
    resourceType,
    unitType: mostCommon(reached),
    others: Math.max(0, reached.length - 1),
    combat: penalty.combat,
    locked
  };
}

/**
 * Whether the gate is on and some unit's column names the resource.
 * @param {Gate | undefined} gate
 * @param {string} resourceType
 * @returns {boolean}
 */
function gateNames(gate, resourceType) {
  if (!gate?.on) return false;
  for (const resource of gate.columns.values()) {
    if (resource === resourceType) return true;
  }
  return false;
}

/**
 * The notification's text for a loss that reaches this many units.
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
 */

/**
 * The gate as the loaded data has it. It is on only when the thresholds are the ones the option writes (one copy
 * to train or buy) and every unit of the gate map carries its column: another mod's thresholds or columns are that
 * mod's rule, which its own texts explain, so the mod's lock texts step back to the 1.0 lines.
 * @param {Iterable<{ UnitType?: string, StrategicResource?: string | null }>} units GameInfo.Units rows
 * @param {Iterable<{ Name?: string, Value?: string | number }>} globalParameters GameInfo.GlobalParameters rows
 * @param {Map<string, string>} supply unit type to the resource it draws on
 * @returns {Gate}
 */
export function buildGateIndex(units, globalParameters, supply) {
  const rows = [...units];
  const params = readParameters(globalParameters);
  const own = params.get(GATE_PRODUCTION_PARAMETER) === 1 && params.get(GATE_PURCHASE_PARAMETER) === 1;
  if (!own) return { on: false, upgrade: false, columns: new Map() };
  /** @type {Map<string, string>} */
  const columns = new Map();
  for (const row of rows) {
    if (row?.UnitType && row.StrategicResource) columns.set(row.UnitType, row.StrategicResource);
  }
  const on = coversSupply(columns, new Set(rows.map((row) => row?.UnitType)), supply);
  if (!on) columns.clear();
  return { on, upgrade: on && (params.get(GATE_UPGRADING_PARAMETER) ?? 0) >= 1, columns };
}

/**
 * GlobalParameters as name to number, leaving out rows without a name or a numeric value.
 * @param {Iterable<{ Name?: string, Value?: string | number }>} globalParameters
 * @returns {Map<string, number>}
 */
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
 * Whether every unit of the gate map the game knows carries its resource in the column, which is what the option's
 * groups write; another mod's column covers only some of them. False when the game knows none of them.
 * @param {Map<string, string>} columns
 * @param {Set<string | undefined>} known the unit types in the table
 * @param {Map<string, string>} supply
 * @returns {boolean}
 */
function coversSupply(columns, known, supply) {
  let seen = 0;
  for (const [unitType, resource] of supply) {
    if (!known.has(unitType)) continue;
    if (columns.get(unitType) !== resource) return false;
    seen += 1;
  }
  return seen > 0;
}

/**
 * The resource a unit cannot be trained or bought without, when the owner holds none of it; null otherwise.
 * @param {string} unitType
 * @param {Gate} gate
 * @param {(resourceType: string) => number} copiesOf
 * @returns {string | null}
 */
export function lockedBy(unitType, gate, copiesOf) {
  const resource = gate.columns.get(unitType);
  if (!resource || copiesOf(resource) > 0) return null;
  return resource;
}
