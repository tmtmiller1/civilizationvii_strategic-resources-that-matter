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
