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
  const { CALLOUT_ID, SEEN_KEY, calloutItem, hasSeen } = await import("/tower-strategic-resources/ui/sr-callout.js");

  // Added once, at the advisor-warning level, triggered by unit selection, and processed under its own name.
  assert.equal(TutorialManager.added.length, 1);
  assert.equal(TutorialManager.added[0], calloutItem);
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
  await import("/tower-strategic-resources/ui/sr-callout.js?refused");
  assert.ok(log.lines.some(([, text]) => text.includes("could not add the first-time callout")));
} finally {
  log.restore();
  restoreGlobals();
}

console.log("sr-callout tests passed");
