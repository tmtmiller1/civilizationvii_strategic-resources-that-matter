// The loss re-check. The engine re-evaluates a player's resource requirements when the player gains a resource,
// never when one is lost, so a penalty cancelled by "has Iron" stays cancelled after the Iron is gone. Gaining any
// off-map resource makes the next turn roll re-evaluate every requirement of that player. Gaining and dropping one
// off-map copy of a resource that nothing in the mod reads, for every major player at every turn start, keeps each
// player's penalties at most one roll behind the map. Every player is forced unconditionally: a gain and a loss
// inside one turn leave the count unchanged and slip past any scheme that forces only on a seen drop.
//
// Everything engine-side comes in as arguments so the tests can drive it with plain objects.

/** A resource valid in every age that no gate, penalty or curve of this mod reads. */
export const RECHECK_RESOURCE = "RESOURCE_CRABS";

/**
 * @typedef {object} RecheckResources
 * @property {(resource: number) => unknown} gainOffMapResource
 * @property {(value: unknown) => unknown} removeOffMapResource
 */

/**
 * @typedef {object} RecheckPlayer
 * @property {number} id
 * @property {boolean} isMajor
 * @property {boolean} [isAlive]
 * @property {RecheckResources} [Resources]
 */

/**
 * @typedef {object} RecheckResult
 * @property {number} forced players whose re-check was triggered
 * @property {number[]} failed ids of players whose engine call threw
 */

/**
 * The alive major players, or none if the player list cannot be read.
 * @param {{ getAlive?: () => RecheckPlayer[] } | undefined} playersApi
 * @returns {RecheckPlayer[]}
 */
export function readMajorPlayers(playersApi) {
  try {
    const alive = playersApi?.getAlive?.() ?? [];
    return alive.filter((player) => player?.isMajor === true);
  } catch (_) {
    return [];
  }
}

/**
 * Whether this is any kind of multiplayer game (internet, LAN or hotseat). Unknown counts as multiplayer, so the
 * re-check never runs where it cannot be sure it is alone.
 * @param {{ getGame?: () => { isAnyMultiplayer?: boolean } } | undefined} configurationApi
 * @returns {boolean}
 */
export function isMultiplayerGame(configurationApi) {
  try {
    const game = configurationApi?.getGame?.();
    if (!game || typeof game.isAnyMultiplayer !== "boolean") return true;
    return game.isAnyMultiplayer;
  } catch (_) {
    return true;
  }
}

/**
 * The hash the engine expects for the re-check resource, or null when the resource is missing from this game.
 * @param {{ Resources?: { lookup?: (type: string) => { $hash?: number } | null | undefined } } | undefined} gameInfo
 * @returns {number | null}
 */
export function resolveRecheckHash(gameInfo) {
  try {
    const hash = gameInfo?.Resources?.lookup?.(RECHECK_RESOURCE)?.$hash;
    return typeof hash === "number" ? hash : null;
  } catch (_) {
    return null;
  }
}

/**
 * Gains and drops one off-map copy of the re-check resource for one player.
 * @param {RecheckPlayer} player
 * @param {number} resourceHash
 * @returns {boolean} true when both calls went through
 */
export function forcePlayerRecheck(player, resourceHash) {
  const resources = player.Resources;
  if (!resources || typeof resources.gainOffMapResource !== "function") return false;
  const value = resources.gainOffMapResource(resourceHash);
  if (value == null || typeof resources.removeOffMapResource !== "function") return false;
  resources.removeOffMapResource(value);
  return true;
}

/**
 * Forces the re-check for every player given. One player's failure does not stop the others.
 * @param {RecheckPlayer[]} players
 * @param {number} resourceHash
 * @returns {RecheckResult}
 */
export function forceRecheckAll(players, resourceHash) {
  /** @type {RecheckResult} */
  const result = { forced: 0, failed: [] };
  for (const player of players) {
    try {
      if (forcePlayerRecheck(player, resourceHash)) result.forced += 1;
      else result.failed.push(player.id);
    } catch (_) {
      result.failed.push(player.id);
    }
  }
  return result;
}
