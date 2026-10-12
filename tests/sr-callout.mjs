import assert from "node:assert/strict";
import { captureConsole, snapshotGlobals, table } from "./_engine-stubs.mjs";
import TutorialManager from "/base-standard/ui/tutorial/tutorial-manager.js";

// The first-time callout: what it hands the game's tutorial manager, when its check lets it show, and the profile
// flag that keeps it to once.

const restoreGlobals = snapshotGlobals(["GameInfo", "Players", "Units", "Locale", "GameContext", "UI", "engine",
  "localStorage"]);
const log = captureConsole();

globalThis.Locale = { compose: (key, ...args) => (args.length ? `${key}(${args.join(",")})` : `<${key}>`) };
globalThis.GameInfo = {
  Units: table([
    { UnitType: "UNIT_FIELD_CANNON", Name: "LOC_UNIT_FIELD_CANNON_NAME" },
    { UnitType: "UNIT_INFANTRY", Name: "LOC_UNIT_INFANTRY_NAME" }
  ], "UnitType"),
  Resources: table([{ ResourceType: "RESOURCE_NITER", Name: "LOC_RESOURCE_NITER_NAME" }], "ResourceType"),
  TypeTags: [{ Type: "UNIT_FIELD_CANNON", Tag: "SR_SUPPLY_NITER" }],
  ModifierArguments: [{ ModifierId: "SR_COMBAT_PENALTY_NITER", Name: "Amount", Value: "-3" }]
};
const unitHash = (/** @type {string} */ type) => globalThis.GameInfo.Units.lookup(type).$hash;
/** @type {any[]} */
let holdings = [];
const owners = { 0: { isMajor: true, Resources: { getResources: () => holdings } } };
globalThis.Players = { get: (id) => owners[id] ?? null };
globalThis.GameContext = { localPlayerID: 0 };
const units = {
  cannon: { owner: 0, type: unitHash("UNIT_FIELD_CANNON") },
  infantry: { owner: 0, type: unitHash("UNIT_INFANTRY") },
  enemy: { owner: 3, type: unitHash("UNIT_FIELD_CANNON") }
};
globalThis.Units = { get: (id) => units[id] ?? null };
let selected = "cannon";
globalThis.UI = { Player: { getHeadSelectedUnit: () => selected } };
/** @type {any[]} */
const triggered = [];
globalThis.engine = { trigger: (...args) => triggered.push(args) };
/** @type {Map<string, string>} */
const store = new Map();
globalThis.localStorage = /** @type {*} */ ({
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v))
});

try {
  const { CALLOUT_ID, GATE_CALLOUT_ID, GATE_SEEN_KEY, SEEN_KEY, calloutItem, gateCalloutItem, hasSeen,
      selectedLocked } =
    await import("/tower-strategic-resources-that-matter/ui/sr-callout.js");
  const { resetIndexes } = await import("/tower-strategic-resources-that-matter/ui/sr-player-supply.js");

  // Added once, at the advisor-warning level, triggered by unit selection, and processed under its own name.
  assert.equal(TutorialManager.added.length, 2);
  assert.equal(TutorialManager.added[0], calloutItem);
  assert.equal(TutorialManager.added[1], gateCalloutItem);
  assert.equal(calloutItem.ID, CALLOUT_ID);
  assert.equal(calloutItem.level, 2);
  assert.deepEqual(calloutItem.activationEngineEvents, ["UnitSelectionChanged"]);
  assert.deepEqual(TutorialManager.processed, ["tower strategic resources items"]);

  // The check: the local player's unsupplied unit passes, and the body gets its name, resource and penalty.
  assert.equal(calloutItem.onActivateCheck(), true);
  assert.deepEqual(calloutItem.callout.body.getLocParams(),
    ["<LOC_UNIT_FIELD_CANNON_NAME>", "<LOC_RESOURCE_NITER_NAME>", "-3"]);
  selected = "infantry";
  assert.equal(calloutItem.onActivateCheck(), false, "a unit that draws on nothing");
  selected = "enemy";
  assert.equal(calloutItem.onActivateCheck(), false, "another player's unit");
  selected = "nothing";
  assert.equal(calloutItem.onActivateCheck(), false, "an id that finds no unit");
  /** @type {unknown[]} */
  const looked = [];
  const units0 = globalThis.Units;
  globalThis.Units = { get: (id) => { looked.push(id); return null; } };
  selected = /** @type {*} */ (null);
  assert.equal(calloutItem.onActivateCheck(), false, "nothing selected (a deselection)");
  assert.deepEqual(looked, [], "Units.get is not called without a unit");
  globalThis.Units = units0;
  selected = "cannon";
  holdings = [{ uniqueResource: { resource: globalThis.GameInfo.Resources.lookup("RESOURCE_NITER").$hash } }];
  assert.equal(calloutItem.onActivateCheck(), false, "a supplied unit");
  holdings = [];

  // Shown once: the manager calls onActivate only when it shows the callout; after that the check says no.
  assert.equal(hasSeen(), false);
  calloutItem.onActivate();
  assert.equal(store.get(SEEN_KEY), "1");
  assert.equal(hasSeen(), true);
  assert.equal(calloutItem.onActivateCheck(), false, "once per profile");

  // The buttons: close does nothing more, Tell me more opens the mod's Civilopedia page by its title.
  calloutItem.callout.option1.callback();
  calloutItem.callout.option2.callback();
  assert.deepEqual(triggered, [["open-civilopedia", "<LOC_PEDIA_CONCEPTS_PAGE_SR_STRATEGIC_RESOURCES_TITLE>"]]);
  assert.equal(calloutItem.callout.option1.text, "LOC_TUTORIAL_CALLOUT_CLOSE");
  assert.equal(calloutItem.callout.option2.text, "LOC_TUTORIAL_CIVILOPEDIA_TELL_ME_MORE");


  // The gate callout: its own id, flag and events; raised by a locked unit of the player's or a list showing one.
  assert.equal(gateCalloutItem.ID, GATE_CALLOUT_ID);
  assert.equal(gateCalloutItem.level, 2);
  assert.deepEqual(gateCalloutItem.activationEngineEvents, ["UnitSelectionChanged", "CitySelectionChanged"]);
  assert.equal(gateCalloutItem.onActivateCheck(), false, "the gate is off");
  assert.equal(selectedLocked(), null);
  globalThis.GameInfo.Units = table([
    { UnitType: "UNIT_FIELD_CANNON", Name: "LOC_UNIT_FIELD_CANNON_NAME", StrategicResource: "RESOURCE_NITER" },
    { UnitType: "UNIT_INFANTRY", Name: "LOC_UNIT_INFANTRY_NAME" }
  ], "UnitType");
  globalThis.GameInfo.GlobalParameters = [{ Name: "STRATEGIC_RESOURCE_MINIMUM_FOR_PRODUCTION_ANYWHERE", Value: "1" }];
  resetIndexes();
  units.cannon.type = unitHash("UNIT_FIELD_CANNON");
  units.infantry.type = unitHash("UNIT_INFANTRY");
  units.enemy.type = unitHash("UNIT_FIELD_CANNON");
  selected = "cannon";
  assert.equal(gateCalloutItem.callout.body.text, "LOC_SR_CALLOUT_GATE_BODY");
  assert.equal(gateCalloutItem.onActivateCheck(), true, "a unit of a locked kind");
  assert.deepEqual(gateCalloutItem.callout.body.getLocParams(),
      ["<LOC_UNIT_FIELD_CANNON_NAME>", "<LOC_RESOURCE_NITER_NAME>"]);
  selected = "enemy";
  assert.equal(gateCalloutItem.onActivateCheck(), false, "another player's unit, no city selected");
  const query = [{ index: unitHash("UNIT_INFANTRY"), result: { Success: true } },
    { index: unitHash("UNIT_FIELD_CANNON"),
        result: { Success: false, FailureReasons: [""], InsufficientFunds: true } }];
  Object.defineProperty(globalThis, "Game", { configurable: true, writable: true,
    value: { CityOperations: { canStartQuery: () => query } } });
  globalThis.CityOperationTypes = { BUILD: 1 };
  globalThis.CityQueryType = { Unit: 7 };
  selected = /** @type {*} */ (null);
  globalThis.UI.Player.getHeadSelectedCity = () => ({ owner: 0, id: 5 });
  assert.equal(gateCalloutItem.onActivateCheck(), true, "a list with a greyed locked unit");
  assert.deepEqual(gateCalloutItem.callout.body.getLocParams(),
      ["<LOC_UNIT_FIELD_CANNON_NAME>", "<LOC_RESOURCE_NITER_NAME>"]);
  globalThis.UI.Player.getHeadSelectedCity = () => ({ owner: 2, id: 5 });
  assert.equal(gateCalloutItem.onActivateCheck(), false, "another player's city");
  globalThis.UI.Player.getHeadSelectedCity = () => ({ owner: 0, id: 5 });
  query[1].result = { Success: false };
  assert.equal(gateCalloutItem.onActivateCheck(), false, "a bare refusal is not a kept entry");
  query[1].result = { Success: false, FailureReasons: [""], InsufficientFunds: true };
  holdings = [{ uniqueResource: { resource: globalThis.GameInfo.Resources.lookup("RESOURCE_NITER").$hash } }];
  assert.equal(gateCalloutItem.onActivateCheck(), false, "a copy held: nothing locked");
  holdings = [];
  globalThis.GameInfo.GlobalParameters.push({ Name: "STRATEGIC_RESOURCE_MINIMUM_FOR_UNIT_UPGRADING", Value: "1" });
  resetIndexes();
  assert.equal(gateCalloutItem.callout.body.text, "LOC_SR_CALLOUT_GATE_BODY_UPGRADE");
  assert.equal(hasSeen(GATE_SEEN_KEY), false);
  gateCalloutItem.onActivate();
  assert.equal(store.get(GATE_SEEN_KEY), "1");
  assert.equal(gateCalloutItem.onActivateCheck(), false, "once per profile, on its own flag");
  assert.equal(store.get(SEEN_KEY), "1", "the 1.0 flag untouched");
  gateCalloutItem.callout.option2.callback();
  assert.equal(triggered.length, 2, "Tell me more opens the page");
  globalThis.Game = { CityOperations: { canStartQuery: () => { throw new Error("gone"); } } };
  store.delete(GATE_SEEN_KEY);
  assert.equal(gateCalloutItem.onActivateCheck(), false);
  assert.ok(log.lines.some(([, text]) => text.includes("could not read the selection for the gate callout")));
  globalThis.GameInfo.GlobalParameters = [];
  resetIndexes();
  selected = "cannon";

  // Storage that throws: the check treats the callout as unseen, and a failed write is logged, not thrown.
  globalThis.localStorage = /** @type {*} */ ({
    getItem: () => { throw new Error("no storage"); },
    setItem: () => { throw new Error("no storage"); }
  });
  assert.equal(hasSeen(), false);
  calloutItem.onActivate();
  assert.ok(log.lines.some(([, text]) => text.includes("could not keep the callout's seen flag")));
  // A unit lookup that throws is contained.
  globalThis.Units = { get: () => { throw new Error("gone"); } };
  assert.equal(calloutItem.onActivateCheck(), false);
  assert.ok(log.lines.some(([, text]) => text.includes("could not read the selected unit")));

  // A manager that refuses the item is logged, not thrown.
  TutorialManager.throws = true;
  await import("/tower-strategic-resources-that-matter/ui/sr-callout.js?refused");
  assert.ok(log.lines.some(([, text]) => text.includes("could not add the first-time callout")));
} finally {
  log.restore();
  restoreGlobals();
}

console.log("sr-callout tests passed");
