import assert from "node:assert/strict";
import { captureConsole, snapshotGlobals, table } from "./_engine-stubs.mjs";

// The locked units kept in the production and purchase lists: which bare refusals are rewritten (a locked unit
// the player could otherwise train), into the one shape the chooser keeps and greys, and the wrapper around the
// engine's query that does it for the local player's cities only, never throwing into the list.

const restoreGlobals = snapshotGlobals(["GameInfo", "GameContext", "Players", "Game", "CityQueryType", "engine"]);
const log = captureConsole();

const UNLOCKS = [
  { TargetType: "UNIT_SPEARMAN", TargetKind: "KIND_UNIT", ProgressionTreeNodeType: "NODE_BRONZE", UnlockDepth: 1 },
  { TargetType: "UNIT_PHALANX", TargetKind: "KIND_UNIT", ProgressionTreeNodeType: "NODE_IRON", UnlockDepth: 1 },
  { TargetType: "UNIT_CHARIOT", TargetKind: "KIND_UNIT", ProgressionTreeNodeType: "NODE_AGRICULTURE", UnlockDepth: 1 },
  { TargetType: "UNIT_CHARIOT", TargetKind: "KIND_UNIT", ProgressionTreeNodeType: "NODE_WHEEL", UnlockDepth: 2 },
  { TargetType: "BUILDING_X", TargetKind: "KIND_CONSTRUCTIBLE", ProgressionTreeNodeType: "NODE_IRON", UnlockDepth: 1 }
];
const UPGRADES = [{ Unit: "UNIT_WARRIOR", UpgradeUnit: "UNIT_SPEARMAN" },
    { Unit: "UNIT_SPEARMAN", UpgradeUnit: "UNIT_PHALANX" },
  { Unit: "UNIT_SAMURAI", UpgradeUnit: "UNIT_SAMURAI_2" }];
/** @type {Record<string, number>} */
let states = { NODE_BRONZE: 4, NODE_IRON: 1, NODE_AGRICULTURE: 5, NODE_WHEEL: 4 };
const canTrainOf = { UNIT_SAMURAI_2: false };
const facts = () => ({
  unlocks: UNLOCKS, upgrades: UPGRADES, nodeState: (/** @type {string} */ n) => states[n] ?? 0,
  canTrain: (/** @type {string} */ u) => canTrainOf[u] !== false
});

try {
  const { couldTrainButForGate, hasUnlocked, isBareRefusal, keepLockedEntries, lockedResult } =
    await import("/tower-strategic-resources-that-matter/ui/sr-production-lock.js");

  // hasUnlocked: every node that lists the unit, to the depth it asks; a unit no node lists is open.
  assert.equal(hasUnlocked("UNIT_SPEARMAN", facts()), true);
  assert.equal(hasUnlocked("UNIT_PHALANX", facts()), false, "its node is closed");
  assert.equal(hasUnlocked("UNIT_CHARIOT", facts()), false, "the Wheel row asks depth 2 and the node is at 4");
  states = { ...states, NODE_WHEEL: 5 };
  assert.equal(hasUnlocked("UNIT_CHARIOT", facts()), true);
  assert.equal(hasUnlocked("UNIT_WARRIOR", facts()), true, "no node lists it");
  const nodeless = { TargetType: "UNIT_SPEARMAN", TargetKind: "KIND_UNIT" };
  assert.equal(hasUnlocked("UNIT_SPEARMAN", { ...facts(), unlocks: [...UNLOCKS, nodeless] }),
    true, "a row with no node is skipped");

  // couldTrainButForGate: trainable, unlocked, not obsolete.
  assert.equal(couldTrainButForGate("UNIT_SPEARMAN", facts()), true);
  assert.equal(couldTrainButForGate("UNIT_WARRIOR", facts()), false,
      "obsolete: the Spearman it upgrades into is unlocked");
  assert.equal(couldTrainButForGate("UNIT_PHALANX", facts()), false, "not unlocked");
  assert.equal(couldTrainButForGate("UNIT_SAMURAI_2", facts()), false, "never trainable");
  assert.equal(couldTrainButForGate("UNIT_SAMURAI", facts()), true,
      "its upgrade cannot be trained, so it is not obsolete");
  states = { ...states, NODE_BRONZE: 1 };
  assert.equal(couldTrainButForGate("UNIT_WARRIOR", facts()), true,
      "not obsolete while the Spearman is locked by tech");
  states = { ...states, NODE_BRONZE: 4 };

  // The shapes.
  assert.deepEqual(lockedResult(), { Success: false, InsufficientFunds: true, FailureReasons: [""],
    Requirements: { MeetsRequirements: false } });
  assert.equal(isBareRefusal({ Success: false }), true);
  assert.equal(isBareRefusal({ Success: true, Requirements: { MeetsRequirements: true } }), false);
  assert.equal(isBareRefusal({ Success: false, Requirements: { NeededProgressionTreeNode: 5 } }), false, "a tech need");
  assert.equal(isBareRefusal({ Success: false, FailureReasons: ["x"] }), false, "a reason");
  assert.equal(isBareRefusal(lockedResult()), false, "already rewritten");
  assert.equal(isBareRefusal(null), false);

  // keepLockedEntries: in place, only the locked units the player could otherwise train.
  const types = ["UNIT_SCOUT", "UNIT_WARRIOR", "UNIT_SPEARMAN", "UNIT_PHALANX", "UNIT_CHARIOT", "UNIT_FOEDERATI"];
  const locked = (/** @type {string} */ u) => ({ UNIT_SPEARMAN: "RESOURCE_IRON", UNIT_PHALANX: "RESOURCE_IRON",
    UNIT_CHARIOT: "RESOURCE_HORSES", UNIT_WARRIOR: "RESOURCE_IRON" })[u] ?? null;
  const entries = [
    { index: 0, result: { Success: true, Requirements: { MeetsRequirements: true } } },
    { index: 1, result: { Success: false } }, { index: 2, result: { Success: false } },
    { index: 3, result: { Success: false } }, { index: 4, result: { Success: false } },
    { index: 5, result: { Success: false } }, null
  ];
  const kept = keepLockedEntries(entries, { unitTypeOf: (i) => types[i], locked, facts: facts() });
  assert.deepEqual(kept, ["UNIT_SPEARMAN", "UNIT_CHARIOT"],
    "the Warrior is obsolete, the Phalanx not unlocked, the Foederati not locked");
  assert.deepEqual(entries[2].result, lockedResult());
  assert.deepEqual(entries[1].result, { Success: false }, "left as the engine answered");
  assert.deepEqual(entries[0].result, { Success: true, Requirements: { MeetsRequirements: true } });
  assert.deepEqual(keepLockedEntries(entries, { unitTypeOf: (i) => types[i], locked, facts: facts() }), [],
    "a second pass rewrites nothing");
  const nameless = { unitTypeOf: () => undefined, locked, facts: facts() };
  assert.deepEqual(keepLockedEntries([{ index: 9, result: { Success: false } }], nameless),
    [], "an index that names no unit");

  // The wrapper: the local player's unit query only, the engine's array handed back, a failure contained.
  globalThis.GameContext = { localPlayerID: 0 };
  globalThis.CityQueryType = { Unit: 7, Constructible: 8 };
  globalThis.GameInfo = {
    Units: table([{ UnitType: "UNIT_SCOUT" }, { UnitType: "UNIT_SPEARMAN", StrategicResource: "RESOURCE_IRON" }],
      "UnitType"),
    GlobalParameters: [{ Name: "STRATEGIC_RESOURCE_MINIMUM_FOR_PRODUCTION_ANYWHERE", Value: "1" },
    { Name: "STRATEGIC_RESOURCE_MINIMUM_FOR_PURCHASE_ANYWHERE", Value: "1" }],
    TypeTags: [{ Type: "UNIT_SPEARMAN", Tag: "SR_SUPPLY_IRON" }],
    ModifierArguments: [],
    Resources: table([{ ResourceType: "RESOURCE_IRON", Name: "LOC_RESOURCE_IRON_NAME" }], "ResourceType"),
    ProgressionTreeNodeUnlocks: [], UnitUpgrades: [], ProgressionTreeNodes: table([], "ProgressionTreeNodeType")
  };
  let holdings = [];
  globalThis.Players = { get: (id) => (id === 0 ? { isMajor: true, id: 0,
      Resources: { getResources: () => holdings } } : null) };
  const calls = [];
  const answer = () => [{ index: 0, result: { Success: true } }, { index: 1, result: { Success: false } }];
  const ops = { canStartQuery: function (...args) { calls.push(["ops", this === ops, ...args]); return answer(); } };
  const cmds = { canStartQuery: function (...args) { calls.push(["cmds", ...args]); return answer(); } };
  let ready;
  globalThis.engine = { whenReady: { then: (fn) => { ready = fn; } } };
  Object.defineProperty(globalThis, "Game", { configurable: true, writable: true,
    value: { CityOperations: ops, CityCommands: cmds, ProgressionTrees: { getNodeState: () => 4 } } });
  await import("/tower-strategic-resources-that-matter/ui/sr-production-lock.js?wrap");
  ready();
  assert.notEqual(ops.canStartQuery, undefined);
  const mine = { owner: 0, id: 1 };
  let out = ops.canStartQuery(mine, "BUILD", 7);
  assert.deepEqual(out[1].result, lockedResult(), "the local player's locked Spearman kept");
  assert.deepEqual(out[0].result, { Success: true });
  assert.deepEqual(calls.at(-1), ["ops", true, mine, "BUILD", 7], "the engine's own function called on its object");
  out = cmds.canStartQuery(mine, "PURCHASE", 7);
  assert.deepEqual(out[1].result, lockedResult(), "the purchase list the same");
  holdings = [{ uniqueResource: { resource: globalThis.GameInfo.Resources.lookup("RESOURCE_IRON").$hash },
      isOffMap: false }];
  out = ops.canStartQuery(mine, "BUILD", 7);
  assert.deepEqual(out[1].result, { Success: false }, "with a copy the engine's answer stands (it would be a success)");
  holdings = [];
  assert.deepEqual(ops.canStartQuery({ owner: 3, id: 1 }, "BUILD", 7)[1].result, { Success: false },
      "another player's city");
  assert.deepEqual(ops.canStartQuery(mine, "BUILD", 8)[1].result, { Success: false }, "a constructible query");
  const broken = globalThis.Players;
  globalThis.Players = { get: () => { throw new Error("gone"); } };
  assert.deepEqual(ops.canStartQuery(mine, "BUILD", 7).length, 2, "a failure hands the engine's array back");
  assert.ok(log.lines.some(([, t]) => t.includes("could not keep the locked units listed")));
  globalThis.Players = broken;
  ready();
  assert.equal(calls.length, 5 + 1, "ready again wraps nothing twice");
  ops.canStartQuery(mine, "BUILD", 7);
  assert.equal(calls.length, 7, "one engine call per query");

  console.log("sr-production-lock tests passed");
} finally {
  log.restore();
  restoreGlobals();
}
