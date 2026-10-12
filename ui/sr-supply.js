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
 * @param {string} unitType
 * @param {Omit<SupplyQuery, "unitType">} query
 * @returns {{ key: string, args: (string | number)[] } | null} a text key and its arguments, the resource first
 */
export function describeProductionCost(unitType, { supply, penalties, copiesOf }) {
  const status = computeSupplyStatus({ unitType, supply, penalties, copiesOf });
  if (status) return { key: "LOC_SR_PRODUCTION_NEEDS_NONE", args: [status.resourceType, status.combat] };
  const resourceType = supply.get(unitType);
  const penalty = resourceType ? penalties.get(resourceType) : undefined;
  if (!resourceType || !penalty || (penalty.combat === 0 && penalty.productionPercent === 0)) return null;
  return { key: "LOC_SR_PRODUCTION_NEEDS_HELD", args: [resourceType, copiesOf(resourceType)] };
}
