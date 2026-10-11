import assert from "node:assert/strict";
import { captureConsole, element, snapshotGlobals, table } from "./_engine-stubs.mjs";

// The unit panel line: the decorator wraps setupUnitInfo, keeps the panel's own work, and shows, updates or hides
// one line under the stats.

const restoreGlobals = snapshotGlobals(["Controls", "GameInfo", "Players", "Units", "Locale", "document"]);
const log = captureConsole();

/** @type {(component: any) => any} */
let factory = () => null;
globalThis.Controls = { decorate: (name, fn) => { assert.equal(name, "unit-actions"); factory = fn; } };
globalThis.document = { createElement: () => element() };
globalThis.Locale = { compose: (key, ...args) => `${key}|${args.join("|")}` };
globalThis.GameInfo = {
  Units: table([{ UnitType: "UNIT_SPEARMAN" }, { UnitType: "UNIT_WARRIOR" }], "UnitType"),
  Resources: table([{ ResourceType: "RESOURCE_IRON", Name: "LOC_RESOURCE_IRON_NAME" }], "ResourceType"),
  TypeTags: [{ Type: "UNIT_SPEARMAN", Tag: "SR_SUPPLY_IRON" }],
  ModifierArguments: [{ ModifierId: "SR_COMBAT_PENALTY_IRON", Name: "Amount", Value: "-3" }]
};
const iron = globalThis.GameInfo.Resources.lookup("RESOURCE_IRON");
let holdings = [];
const owners = { 0: { isMajor: true, Resources: { getResources: () => holdings } }, 9: { isMajor: false } };
globalThis.Players = { get: (id) => owners[id] ?? null };
const units = {
  spear: { owner: 0, type: globalThis.GameInfo.Units.lookup("UNIT_SPEARMAN").$hash },
  warrior: { owner: 0, type: globalThis.GameInfo.Units.lookup("UNIT_WARRIOR").$hash },
  minor: { owner: 9, type: globalThis.GameInfo.Units.lookup("UNIT_SPEARMAN").$hash },
  unknown: { owner: 0, type: 12345 }
};
globalThis.Units = { get: (id) => units[id] ?? null };

try {
  const { describeUnit } = await import("/tower-strategic-resources/ui/sr-unit-panel.js");

  // describeUnit
  assert.equal(describeUnit(units.spear), "LOC_SR_UNSUPPLIED_LINE|LOC_RESOURCE_IRON_NAME|-3");
  assert.equal(describeUnit(units.warrior), null);
  assert.equal(describeUnit(units.minor), null, "independents and city-states pay no penalty");
  assert.equal(describeUnit(units.unknown), null);
  holdings = [{ uniqueResource: { resource: iron.$hash }, isOffMap: false }];
  assert.equal(describeUnit(units.spear), null, "one copy supplies the unit");
  holdings = [{ uniqueResource: { resource: iron.$hash }, isOffMap: true }, { uniqueResource: null }];
  assert.match(describeUnit(units.spear) ?? "", /UNSUPPLIED/, "an off-map copy supplies nothing");
  holdings = [];

  // The decorator around a panel whose prototype owns setupUnitInfo.
  const stats = element(["unit-actions__stats_container"]);
  const root = element();
  root.appendChild(stats);
  let ownCalls = 0;
  class Panel {
    setupUnitInfo() {
      ownCalls += 1;
      return "drawn";
    }
  }
  const panel = Object.assign(new Panel(), { Root: root, unitId: "spear" });
  factory(panel);
  for (const hook of ["beforeAttach", "afterAttach", "beforeDetach", "afterDetach", "onAttributeChanged"]) {
    assert.equal(typeof factory(new Panel())[hook], "function");
  }
  assert.equal(panel.setupUnitInfo(), "drawn", "the panel's own result is returned");
  assert.equal(ownCalls, 1);
  const line = stats.querySelector(".sr-unsupplied-line");
  assert.ok(line, "the line is added under the stats");
  assert.equal(line.textContent, "LOC_SR_UNSUPPLIED_LINE|LOC_RESOURCE_IRON_NAME|-3");
  assert.equal(line.classList.contains("hidden"), false);

  // A later prototype patch still runs: the wrapper looks the method up at call time.
  Panel.prototype.setupUnitInfo = function () {
    ownCalls += 10;
    return "patched";
  };
  panel.unitId = "warrior";
  assert.equal(panel.setupUnitInfo(), "patched");
  assert.equal(ownCalls, 11);
  assert.equal(stats.children.length, 1, "the same line is reused");
  assert.equal(line.classList.contains("hidden"), true, "a supplied or ungated unit hides it");
  panel.unitId = null;
  panel.setupUnitInfo();
  assert.equal(line.classList.contains("hidden"), true);

  // An own-property method is the one wrapped.
  let instanceCalls = 0;
  const ownPanel = { Root: element(), unitId: "spear", setupUnitInfo: () => { instanceCalls += 1; } };
  factory(ownPanel);
  ownPanel.setupUnitInfo();
  assert.equal(instanceCalls, 1);
  assert.equal(ownPanel.Root.children.length, 0, "no stats container, nothing drawn");

  // A hidden line that never existed stays absent.
  const emptyRoot = element();
  const emptyStats = element(["unit-actions__stats_container"]);
  emptyRoot.appendChild(emptyStats);
  const quiet = Object.assign(new Panel(), { Root: emptyRoot, unitId: "warrior" });
  factory(quiet);
  quiet.setupUnitInfo();
  assert.equal(emptyStats.children.length, 0);

  // A throw while describing is logged, and the panel's result still comes back.
  const throwing = Object.assign(new Panel(), { Root: root, unitId: "spear" });
  factory(throwing);
  const savedUnits = globalThis.Units;
  globalThis.Units = { get: () => { throw new Error("engine gone"); } };
  assert.equal(throwing.setupUnitInfo(), "patched");
  globalThis.Units = savedUnits;
  assert.ok(log.lines.some(([, text]) => text.includes("could not draw the unsupplied line")));

  // A panel without setupUnitInfo is left alone and the miss is logged.
  const bare = {};
  factory(bare);
  assert.equal(bare.setupUnitInfo, undefined);
  assert.ok(log.lines.some(([, text]) => text.includes("has no setupUnitInfo")));
} finally {
  log.restore();
  restoreGlobals();
}

console.log("sr-unit-panel tests passed");
