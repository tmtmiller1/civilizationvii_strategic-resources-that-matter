// The game reads the panel, production and resource lines share: which units draw on what, the penalty sizes, and
// a player's copies. The pure work is in sr-supply.js; this file only fetches its inputs from the engine.

import {
  buildGateIndex, buildPenaltyIndex, buildSupplyIndex, countCopies
} from "/tower-strategic-resources-that-matter/ui/sr-supply.js";

/**
 * @typedef {object} Indexes
 * @property {Map<string, string>} supply
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
    indexes = {
      supply,
      penalties: buildPenaltyIndex(/** @type {*} */ (GameInfo.ModifierArguments) ?? []),
      gate: buildGateIndex(/** @type {*} */ (GameInfo.Units) ?? [],
        /** @type {*} */ (GameInfo.GlobalParameters) ?? [], supply)
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
 * A player's copies of each resource, read once per call of this function.
 * @param {*} player
 * @returns {(resourceType: string) => number}
 */
export function copiesCounter(player) {
  const holdings = readHoldings(player);
  return (resourceType) => countCopies(holdings, resourceType);
}

/**
 * The resource's name key, for Locale.compose.
 * @param {string} resourceType
 * @returns {string}
 */
export function resourceNameKey(resourceType) {
  return GameInfo.Resources.lookup(resourceType)?.Name ?? resourceType;
}
