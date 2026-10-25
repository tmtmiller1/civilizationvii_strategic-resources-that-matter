// The game reads the panel, production and resource lines share: which units draw on what, the penalty sizes, and
// a player's copies. The pure work is in sr-supply.js; this file only fetches its inputs from the engine.

import {
  buildAlternativeIndex, buildGateIndex, buildPenaltyIndex, buildSupplyIndex, countSupply, eitherNameKey
} from "/tower-strategic-resources-that-matter/ui/sr-supply.js";

/**
 * @typedef {object} Indexes
 * @property {Map<string, string[]>} supply
 * @property {Map<string, string[]>} alternatives resource type to the resources that stand in for it
 * @property {Map<string, import("./sr-supply.js").Penalty>} penalties
 * @property {import("./sr-supply.js").Gate} gate
 */

/** @type {Indexes | null} */
let indexes = null;

/**
 * The unit tags, modifier sizes and the gate's column, fixed for the whole game, so read once.
 * @returns {Indexes}
 */
export function readIndexes() {
  if (!indexes) {
    const supply = buildSupplyIndex(/** @type {*} */ (GameInfo.TypeTags) ?? []);
    const alternatives = buildAlternativeIndex(/** @type {*} */ (GameInfo.TypeTags) ?? []);
    indexes = {
      supply,
      alternatives,
      penalties: buildPenaltyIndex(/** @type {*} */ (GameInfo.ModifierArguments) ?? []),
      gate: buildGateIndex(/** @type {*} */ (GameInfo.Units) ?? [],
        /** @type {*} */ (GameInfo.GlobalParameters) ?? [], supply, alternatives)
    };
  }
  return indexes;
}

/** Forgets the indexes, so the next read takes the tables again (the tests change them; a game never does). */
export function resetIndexes() {
  indexes = null;
}

/**
 * @param {*} player
 * @returns {{ resourceType: string | null, isOffMap: boolean }[]}
 */
export function readHoldings(player) {
  const entries = player?.Resources?.getResources?.() ?? [];
  return entries.map((/** @type {*} */ entry) => ({
    resourceType: GameInfo.Resources.lookup(entry?.uniqueResource?.resource)?.ResourceType ?? null,
    isOffMap: entry?.isOffMap === true
  }));
}

/**
 * A player's copies of each resource, read once per call of this function. A resource with stand-ins counts theirs
 * too, so Pitch supplies a unit that needs Hardwood wherever the mod reads a count.
 * @param {*} player
 * @returns {(resourceType: string) => number}
 */
export function copiesCounter(player) {
  const holdings = readHoldings(player);
  const { alternatives } = readIndexes();
  return (resourceType) => countSupply(holdings, resourceType, alternatives);
}

/**
 * The resource's name key, for Locale.compose: "Hardwood or Pitch" for a resource with stand-ins.
 * @param {string} resourceType
 * @returns {string}
 */
export function resourceNameKey(resourceType) {
  const others = readIndexes().alternatives.get(resourceType);
  if (others?.length) return eitherNameKey(resourceType, others);
  return GameInfo.Resources.lookup(resourceType)?.Name ?? resourceType;
}
