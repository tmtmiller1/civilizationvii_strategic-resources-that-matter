import assert from "node:assert/strict";
import {
  countGatedCopies,
  forcePlayerRecheck,
  forceRecheckAll,
  isMultiplayerGame,
  lostSinceLastLook,
  readMajorPlayers,
  resolveRecheckHash,
  RECHECK_RESOURCE
} from "/tower-strategic-resources/ui/sr-recheck-core.js";

// The loss re-check's logic, driven with plain objects in place of the engine.

/** A player whose Resources record every call. */
function player(id, { isMajor = true, gain = (h) => (h === 77 ? 0 : null), throws = false } = {}) {
  const calls = [];
  return {
    id,
    isMajor,
    calls,
    Resources: {
      gainOffMapResource: (hash) => {
        if (throws) throw new Error("engine said no");
        calls.push(["gain", hash]);
        return gain(hash);
      },
      removeOffMapResource: (value) => calls.push(["remove", value])
    }
  };
}

assert.equal(RECHECK_RESOURCE, "RESOURCE_CRABS");

// readMajorPlayers
const alive = [player(0), player(1, { isMajor: false }), null];
assert.deepEqual(readMajorPlayers({ getAlive: () => alive }).map((p) => p.id), [0]);
assert.deepEqual(readMajorPlayers(undefined), []);
assert.deepEqual(readMajorPlayers({ getAlive: () => { throw new Error("x"); } }), []);
assert.deepEqual(readMajorPlayers({}), []);

// isMultiplayerGame: unknown counts as multiplayer
assert.equal(isMultiplayerGame({ getGame: () => ({ isAnyMultiplayer: false }) }), false);
assert.equal(isMultiplayerGame({ getGame: () => ({ isAnyMultiplayer: true }) }), true);
assert.equal(isMultiplayerGame({ getGame: () => ({}) }), true);
assert.equal(isMultiplayerGame({ getGame: () => null }), true);
assert.equal(isMultiplayerGame(undefined), true);
assert.equal(isMultiplayerGame({ getGame: () => { throw new Error("x"); } }), true);

// resolveRecheckHash
assert.equal(resolveRecheckHash({ Resources: { lookup: (t) => (t === "RESOURCE_CRABS" ? { $hash: 77 } : null) } }), 77);
assert.equal(resolveRecheckHash({ Resources: { lookup: () => null } }), null);
assert.equal(resolveRecheckHash({ Resources: { lookup: () => ({ $hash: "77" }) } }), null);
assert.equal(resolveRecheckHash(undefined), null);
assert.equal(resolveRecheckHash({ Resources: { lookup: () => { throw new Error("x"); } } }), null);

// forcePlayerRecheck: gain then remove the value the gain returned, even when it is 0
const one = player(3);
assert.equal(forcePlayerRecheck(one, 77), true);
assert.deepEqual(one.calls, [["gain", 77], ["remove", 0]]);
const refused = player(4);
assert.equal(forcePlayerRecheck(refused, 12), false, "a gain that returns nothing is not removed");
assert.deepEqual(refused.calls, [["gain", 12]]);
assert.equal(forcePlayerRecheck({ id: 5, isMajor: true }, 77), false, "no Resources");
const noRemove = { id: 6, isMajor: true, Resources: { gainOffMapResource: () => 1 } };
assert.equal(forcePlayerRecheck(/** @type {*} */ (noRemove), 77), false);

// forceRecheckAll: every player, failures listed, one failure does not stop the rest
const players = [player(0), player(1, { throws: true }), player(2, { gain: () => null }), player(3)];
assert.deepEqual(forceRecheckAll(players, 77), { forced: 2, failed: [1, 2] });
assert.deepEqual(players[3].calls, [["gain", 77], ["remove", 0]]);
assert.deepEqual(forceRecheckAll([], 77), { forced: 0, failed: [] });

// countGatedCopies and lostSinceLastLook: the lost-supply notification's look at each turn start
const held = { RESOURCE_IRON: 2, RESOURCE_HORSES: 0 };
const counts = countGatedCopies(["RESOURCE_IRON", "RESOURCE_HORSES", "RESOURCE_NITER"],
  (r) => /** @type {Record<string, number>} */ (held)[r] ?? 0);
assert.deepEqual([...counts], [["RESOURCE_IRON", 2], ["RESOURCE_HORSES", 0], ["RESOURCE_NITER", 0]]);
assert.deepEqual([...countGatedCopies([], () => 1)], []);
const look = (/** @type {Record<string, number>} */ o) => new Map(Object.entries(o));
assert.deepEqual(
  lostSinceLastLook(look({ RESOURCE_IRON: 1, RESOURCE_OIL: 3 }), look({ RESOURCE_IRON: 0, RESOURCE_OIL: 0 })),
  ["RESOURCE_IRON", "RESOURCE_OIL"], "two losses in one turn, in the order of the new look");
assert.deepEqual(lostSinceLastLook(look({ RESOURCE_IRON: 0 }), look({ RESOURCE_IRON: 0 })), [],
  "still at zero: reported once, not every turn");
assert.deepEqual(lostSinceLastLook(look({ RESOURCE_IRON: 3 }), look({ RESOURCE_IRON: 1 })), [],
  "a drop to one is no loss");
assert.deepEqual(lostSinceLastLook(look({ RESOURCE_IRON: 0 }), look({ RESOURCE_IRON: 2 })), [], "a gain is no loss");
assert.deepEqual(lostSinceLastLook(new Map(), look({ RESOURCE_IRON: 0 })), [],
  "a resource missing from the last look is never reported");

console.log("sr-recheck-core tests passed");
