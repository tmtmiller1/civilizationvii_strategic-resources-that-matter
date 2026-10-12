// The game reads the panel, production and resource lines share: which units draw on what, the penalty sizes, and
// a player's copies. The pure work is in sr-supply.js; this file only fetches its inputs from the engine.

import { buildPenaltyIndex, buildSupplyIndex, countCopies } from "/tower-strategic-resources/ui/sr-supply.js";

/** @type {{ supply: Map<string, string>, penalties: Map<string, import("./sr-supply.js").Penalty> } | null} */
let indexes = null;

/**
 * The unit tags and modifier sizes, fixed for the whole game, so read once.
 * @returns {{ supply: Map<string, string>, penalties: Map<string, import("./sr-supply.js").Penalty> }}
 */
export function readIndexes() {
  if (!indexes) {
    indexes = {
      supply: buildSupplyIndex(/** @type {*} */ (GameInfo.TypeTags) ?? []),
      penalties: buildPenaltyIndex(/** @type {*} */ (GameInfo.ModifierArguments) ?? [])
    };
  }
  return indexes;
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
