import assert from "node:assert/strict";
import { captureConsole, snapshotGlobals, table } from "./_engine-stubs.mjs";

// The commander's Upgrade All under the hard gate: which packed units count as locked (their next unit behind a
// resource the owner holds none of, under either gate value), how the army's answer is rewritten (a refusal with one
// line per locked unit when nothing can go, the lines as warnings when something can), and the wrapper around the
// engine's check that does it for the local player's commanders only, never throwing into the unit panel.

const restoreGlobals = snapshotGlobals(["GameInfo", "GameContext", "Players", "Game", "Units", "Armies", "Locale",
  "engine"]);
const log = captureConsole();

try {
  const { ARMY_COMMAND, UNIT_COMMAND, LOCKED_LINE, describeArmyUpgrade, lockedUpgrade, wrapCanStart } =
    await import("/tower-strategic-resources-that-matter/ui/sr-army-upgrade.js");

  const upgrades = [{ Unit: "UNIT_WARRIOR", UpgradeUnit: "UNIT_SPEARMAN" },
    { Unit: "UNIT_CHARIOT", UpgradeUnit: "UNIT_HORSEMAN" }, { Unit: "UNIT_SCOUT" }];
  const columns = new Map([["UNIT_SPEARMAN", "RESOURCE_IRON"], ["UNIT_HORSEMAN", "RESOURCE_HORSES"],
    ["UNIT_CHARIOT", "RESOURCE_HORSES"]]);
  const needs = new Map([...columns].map(([unit, resource]) => [unit, [resource]]));
  const lineUnits = new Set(["UNIT_SPEARMAN"]);
  let copies = { RESOURCE_IRON: 0, RESOURCE_HORSES: 0 };
  const copiesOf = (/** @type {string} */ r) => copies[r] ?? 0;
  let known = new Set(["UNIT_SPEARMAN", "UNIT_HORSEMAN"]);
  const unlocked = (/** @type {string} */ u) => known.has(u);
  const deps = (/** @type {boolean} */ upgrade) =>
    ({ upgrades, gate: { on: true, upgrade, columns, needs }, lineUnits, copiesOf, unlocked });

  // lockedUpgrade: under Training and upgrade every gated next unit; under Training only the grant-only ones.
  assert.deepEqual(lockedUpgrade("UNIT_WARRIOR", deps(true)), { target: "UNIT_SPEARMAN", resource: "RESOURCE_IRON" });
  assert.deepEqual(lockedUpgrade("UNIT_CHARIOT", deps(true)), { target: "UNIT_HORSEMAN", resource: "RESOURCE_HORSES" });
  assert.deepEqual(lockedUpgrade("UNIT_WARRIOR", deps(false)), { target: "UNIT_SPEARMAN", resource: "RESOURCE_IRON" });
  assert.equal(lockedUpgrade("UNIT_CHARIOT", deps(false)), null, "the Horseman isn't grant-only: upgrades stay free");
  assert.equal(lockedUpgrade("UNIT_SCOUT", deps(true)), null, "no next unit");
  known = new Set(["UNIT_HORSEMAN"]);
  assert.equal(lockedUpgrade("UNIT_WARRIOR", deps(true)), null, "the Spearman's tech unknown: not the resource's fault");
  known = new Set(["UNIT_SPEARMAN", "UNIT_HORSEMAN"]);
  copies = { RESOURCE_IRON: 1, RESOURCE_HORSES: 0 };
  assert.equal(lockedUpgrade("UNIT_WARRIOR", deps(true)), null, "a copy held");
  const off = { on: false, upgrade: false, columns: new Map(), needs: new Map() };
  assert.equal(lockedUpgrade("UNIT_WARRIOR", { ...deps(true), gate: off }), null, "gate off");
  copies = { RESOURCE_IRON: 0, RESOURCE_HORSES: 0 };

  // describeArmyUpgrade: the engine's answer, rewritten only when a locked unit can't go.
  const line = (/** @type {string} */ u, /** @type {string} */ r) => `${u} needs ${r}`;
  const success = { Success: true, AdditionalDescription: ["Upgrade 1 units: 120 Gold"] };
  const refused = { Success: false };
  assert.equal(describeArmyUpgrade(refused, [], line), refused, "a refusal passes through");
  assert.equal(describeArmyUpgrade(success, [], line), success, "an empty army passes through");
  const warrior = { unitType: "UNIT_WARRIOR", locked: { target: "UNIT_SPEARMAN", resource: "RESOURCE_IRON" },
    own: { Success: false, FailureReasons: ["needs 1 Iron"] } };
  const founder = { unitType: "UNIT_FOUNDER", locked: null, own: { Success: false } };
  assert.deepEqual(describeArmyUpgrade(success, [founder, warrior, { ...warrior }], line),
    { Success: false, FailureReasons: ["UNIT_WARRIOR needs RESOURCE_IRON"] },
    "nothing can go: a refusal, one line per unit type, no cost line");
  const chariot = { unitType: "UNIT_CHARIOT", locked: null,
    own: { Success: true, AdditionalDescription: ["200 Gold"] } };
  assert.deepEqual(describeArmyUpgrade(success, [warrior, chariot], line),
    { Success: true, AdditionalDescription: ["Upgrade 1 units: 120 Gold", "UNIT_WARRIOR needs RESOURCE_IRON"] },
    "something can go: the success stays, the locked unit's line is a warning");
  const freed = { ...warrior, own: { Success: true } };
  assert.equal(describeArmyUpgrade(success, [freed], line), success, "a locked unit the engine lets go is left alone");
  assert.equal(describeArmyUpgrade(success, [founder], line), success, "no locked unit: untouched");

  // The wrapper: only the army command, only a success, only the local player's commander, only with the gate on.
  globalThis.GameContext = { localPlayerID: 0 };
  globalThis.GameInfo = {
    Units: table([{ UnitType: "UNIT_WARRIOR", Name: "LOC_WARRIOR" },
      { UnitType: "UNIT_SPEARMAN", Name: "LOC_SPEARMAN" },
      { UnitType: "UNIT_ARMY_COMMANDER", Name: "LOC_COMMANDER", StrategicResource: null }], "UnitType"),
    UnitUpgrades: upgrades,
    ProgressionTreeNodeUnlocks: [{ TargetType: "UNIT_SPEARMAN", TargetKind: "KIND_UNIT",
      ProgressionTreeNodeType: "NODE_BRONZE", UnlockDepth: 1 }],
    ProgressionTreeNodes: table([{ ProgressionTreeNodeType: "NODE_BRONZE" }], "ProgressionTreeNodeType"),
    RequirementSetRequirements: [{ RequirementSetId: "SR_LINE_REQS_UNIT_SPEARMAN", RequirementId: "SR_LINE_HAS_IRON" }],
    TypeTags: [{ Type: "UNIT_SPEARMAN", Tag: "SR_SUPPLY_IRON" }],
    ModifierArguments: [{ ModifierId: "SR_COMBAT_PENALTY_IRON", Name: "Amount", Value: -3 }],
    GlobalParameters: [{ Name: "STRATEGIC_RESOURCE_MINIMUM_FOR_PRODUCTION_ANYWHERE", Value: 1 },
      { Name: "STRATEGIC_RESOURCE_MINIMUM_FOR_PURCHASE_ANYWHERE", Value: 1 },
      { Name: "STRATEGIC_RESOURCE_MINIMUM_FOR_UNIT_UPGRADING", Value: 1 }],
    Resources: table([{ ResourceType: "RESOURCE_IRON", Name: "LOC_IRON" }], "ResourceType"),
    Civilizations: table([], "CivilizationType"), Leaders: table([], "LeaderType"),
    CivilizationTraits: [], LeaderTraits: []
  };
  // The column must be read from GameInfo.Units for the gate index: set it after the table is made.
  GameInfo.Units.lookup("UNIT_SPEARMAN").StrategicResource = "RESOURCE_IRON";
  const holdings = /** @type {{ uniqueResource: { resource: number }, isOffMap: boolean }[]} */ ([]);
  globalThis.Players = { get: (/** @type {number} */ id) => ({ isMajor: true, civilizationType: -1, leaderType: -1,
    Resources: { getResources: () => holdings }, id }) };
  const units = new Map([[1, { type: 2, isCommanderUnit: true, owner: 0, armyId: 7 }],
    [2, { type: 0, isCommanderUnit: false, owner: 0, armyId: 7 }],
    [3, { type: 2, isCommanderUnit: true, owner: 1, armyId: 8 }]]);
  globalThis.Units = { get: (/** @type {number} */ id) => units.get(id) ?? null };
  globalThis.Armies = { get: (/** @type {number} */ id) => (id === 7 ? { getUnitIds: () => [2] } : null) };
  globalThis.Locale = { compose: (/** @type {string} */ key, /** @type {string[]} */ ...args) =>
    `${key}(${args.join(",")})` };
  /** @type {string[]} */
  const calls = [];
  const engineCanStart = function (/** @type {number} */ id, /** @type {string} */ type) {
    calls.push(`${id}:${type}`);
    if (type === ARMY_COMMAND) return { Success: true, AdditionalDescription: ["Upgrade 1 units: 120 Gold"] };
    if (type === UNIT_COMMAND) return { Success: false, FailureReasons: ["needs 1 Iron"] };
    return { Success: true };
  };
  let bronze = 4;
  globalThis.Game = { UnitCommands: { canStart: engineCanStart }, ProgressionTrees: { getNodeState: () => bronze } };
  const { resetIndexes } = await import("/tower-strategic-resources-that-matter/ui/sr-player-supply.js");
  resetIndexes();
  const wrapped = wrapCanStart(engineCanStart);
  const args = { X: -9999, Y: -9999, UnitAbilityType: -1 };
  assert.deepEqual(wrapped.call(Game.UnitCommands, 1, ARMY_COMMAND, args, false),
    { Success: false, FailureReasons: [`${LOCKED_LINE}(LOC_WARRIOR,LOC_IRON)`] },
    "the local commander's army with one locked Warrior: refused, with the composed line");
  assert.deepEqual(calls, ["1:UNITCOMMAND_UPGRADE_ARMY", "2:UNITCOMMAND_UPGRADE"], "the packed unit asked once");
  calls.length = 0;
  assert.deepEqual(wrapped.call(Game.UnitCommands, 3, ARMY_COMMAND, args, false),
    { Success: true, AdditionalDescription: ["Upgrade 1 units: 120 Gold"] }, "another player's commander: untouched");
  assert.deepEqual(wrapped.call(Game.UnitCommands, 1, "UNITCOMMAND_PACK_ARMY", args, false), { Success: true },
    "another command: untouched");
  assert.deepEqual(calls, ["3:UNITCOMMAND_UPGRADE_ARMY", "1:UNITCOMMAND_PACK_ARMY"], "no per-unit reads for those");
  calls.length = 0;
  assert.deepEqual(wrapped.call(Game.UnitCommands, 1, ARMY_COMMAND, args, true),
    { Success: true, AdditionalDescription: ["Upgrade 1 units: 120 Gold"] }, "the exclusion pass: untouched");
  assert.deepEqual(calls, ["1:UNITCOMMAND_UPGRADE_ARMY"]);
  bronze = 1;
  assert.deepEqual(wrapped.call(Game.UnitCommands, 1, ARMY_COMMAND, args, false),
    { Success: true, AdditionalDescription: ["Upgrade 1 units: 120 Gold"] }, "Bronze Working unknown: untouched");
  bronze = 4;
  // A copy of Iron: the Warrior isn't locked, so the engine's answer stands even if its own check still refuses.
  holdings.push({ uniqueResource: { resource: 0 }, isOffMap: false });
  assert.deepEqual(wrapped.call(Game.UnitCommands, 1, ARMY_COMMAND, args, false),
    { Success: true, AdditionalDescription: ["Upgrade 1 units: 120 Gold"] });
  holdings.length = 0;
  // A failure inside never reaches the panel: the engine's answer is returned and a warning logged.
  globalThis.Armies = { get: () => { throw new Error("no armies"); } };
  assert.deepEqual(wrapped.call(Game.UnitCommands, 1, ARMY_COMMAND, args, false),
    { Success: true, AdditionalDescription: ["Upgrade 1 units: 120 Gold"] });
  assert.ok(log.lines.some(([, l]) => l.includes("could not read the army's upgrades")), "the failure is logged");
  // With the gate off (no parameters), nothing is read.
  GameInfo.GlobalParameters = [];
  resetIndexes();
  calls.length = 0;
  globalThis.Armies = { get: () => ({ getUnitIds: () => [2] }) };
  wrapped.call(Game.UnitCommands, 1, ARMY_COMMAND, args, false);
  assert.deepEqual(calls, ["1:UNITCOMMAND_UPGRADE_ARMY"], "gate off: no per-unit reads");
  console.log("sr-army-upgrade: ok");
} finally {
  log.restore();
  restoreGlobals();
}
