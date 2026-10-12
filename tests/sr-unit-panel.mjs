import assert from "node:assert/strict";
import { captureConsole, element, snapshotGlobals, table } from "./_engine-stubs.mjs";

// The unit panel cell: the decorator wraps setupUnitInfo, keeps the panel's own work, and shows, updates or hides
// one stat cell (icon, penalty, the sentence as its tooltip) in the stats row.

const restoreGlobals = snapshotGlobals(["Controls", "GameInfo", "Players", "Units", "Locale", "document", "UI"]);
const log = captureConsole();

/** @type {(component: any) => any} */
let factory = () => null;
globalThis.Controls = { decorate: (name, fn) => { assert.equal(name, "unit-actions"); factory = fn; } };
globalThis.document = { createElement: () => element() };
globalThis.UI = { getIconURL: (name) => `blp:icon_${String(name).toLowerCase()}` };
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
  const { describeUnit } = await import("/tower-strategic-resources-that-matter/ui/sr-unit-panel.js");
  const { resetIndexes } = await import("/tower-strategic-resources-that-matter/ui/sr-player-supply.js");

  // describeUnit
  assert.deepEqual(describeUnit(units.spear),
    { text: "LOC_SR_UNSUPPLIED_LINE|LOC_RESOURCE_IRON_NAME|-3", resourceType: "RESOURCE_IRON", combat: -3 });
  assert.equal(describeUnit(units.warrior), null);
  assert.equal(describeUnit(units.minor), null, "independents and city-states pay no penalty");
  assert.equal(describeUnit(units.unknown), null);
  holdings = [{ uniqueResource: { resource: iron.$hash }, isOffMap: false }];
  assert.equal(describeUnit(units.spear), null, "one copy supplies the unit");
  holdings = [{ uniqueResource: { resource: iron.$hash }, isOffMap: true }, { uniqueResource: null }];
  assert.match(describeUnit(units.spear)?.text ?? "", /UNSUPPLIED/, "an off-map copy supplies nothing");
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
  assert.ok(line, "the cell is added to the stats");
  assert.equal(line.attributes["data-tooltip-content"], "LOC_SR_UNSUPPLIED_LINE|LOC_RESOURCE_IRON_NAME|-3",
    "the whole sentence is the cell's tooltip");
  assert.equal(line.classList.contains("hidden"), false);
  assert.ok(line.classList.contains("unit-info__stat-container"), "shaped like the panel's own cells");
  const [icon, value] = line.children;
  assert.equal(icon.style.backgroundImage, "url(blp:icon_resource_iron)", "the resource's icon");
  assert.equal(value.textContent, "-3", "the penalty as the value");
  assert.ok(value.classList.contains("text-negative-light"));
  assert.equal(stats.children.length, 2, "a divider, then the cell");
  assert.equal(stats.children[0].style.width, "0.1111rem", "the divider has the game's width");

  // A later prototype patch still runs: the wrapper looks the method up at call time.
  Panel.prototype.setupUnitInfo = function () {
    ownCalls += 10;
    return "patched";
  };
  panel.unitId = "warrior";
  assert.equal(panel.setupUnitInfo(), "patched");
  assert.equal(ownCalls, 11);
  assert.equal(stats.children.length, 2, "the same cell is reused");
  panel.unitId = "spear";
  stats.appendChild(element(["unit-info__stat-container"]));
  panel.setupUnitInfo();
  assert.deepEqual(stats.children.map((c) => c.classList.contains("sr-unsupplied-line")), [false, false, true],
    "the cell goes back to the end after the panel rebuilds its cells");
  panel.unitId = "warrior";
  panel.setupUnitInfo();
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

  // Under the hard gate the line adds that new ones cannot be trained; a fielded unit keeps the penalty line only.
  holdings = [];
  globalThis.GameInfo.Units = table(
    [{ UnitType: "UNIT_SPEARMAN", StrategicResource: "RESOURCE_IRON" }, { UnitType: "UNIT_WARRIOR" }], "UnitType");
  globalThis.GameInfo.GlobalParameters = [{ Name: "STRATEGIC_RESOURCE_MINIMUM_FOR_PRODUCTION_ANYWHERE", Value: "1" },
    { Name: "STRATEGIC_RESOURCE_MINIMUM_FOR_PURCHASE_ANYWHERE", Value: "1" }];
  resetIndexes();
  units.spear.type = globalThis.GameInfo.Units.lookup("UNIT_SPEARMAN").$hash;
  assert.equal(describeUnit(units.spear)?.text, "LOC_SR_UNSUPPLIED_LINE_GATED|LOC_RESOURCE_IRON_NAME|-3");
  holdings = [{ uniqueResource: { resource: iron.$hash }, isOffMap: false }];
  assert.equal(describeUnit(units.spear), null, "supplied: nothing to say, gate or not");
  holdings = [];
  globalThis.GameInfo.GlobalParameters = [];
  resetIndexes();
  assert.equal(describeUnit(units.spear)?.text, "LOC_SR_UNSUPPLIED_LINE|LOC_RESOURCE_IRON_NAME|-3",
    "gate off: the 1.0 line");

} finally {
  log.restore();
  restoreGlobals();
}

console.log("sr-unit-panel tests passed");
