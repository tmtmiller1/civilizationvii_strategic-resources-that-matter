import assert from "node:assert/strict";
import { captureConsole, element, snapshotGlobals, table } from "./_engine-stubs.mjs";

// The production item line: what the local player's gated unit needs, in the game's ProductionModInfo slot after
// whatever was there, never throwing into the production list.

const restoreGlobals = snapshotGlobals([
  "GameInfo", "GameContext", "Players", "Locale", "document", "getComputedStyle"
]);
const log = captureConsole();

globalThis.document = { createElement: () => element() };
globalThis.Locale = { compose: (key, ...args) => `${key}|${args.join("|")}` };
globalThis.GameContext = { localPlayerID: 0 };
globalThis.GameInfo = {
  Resources: table([{ ResourceType: "RESOURCE_NITER", Name: "LOC_RESOURCE_NITER_NAME" }], "ResourceType"),
  TypeTags: [{ Type: "UNIT_FIELD_CANNON", Tag: "SR_SUPPLY_NITER" }],
  ModifierArguments: [
    { ModifierId: "SR_COMBAT_PENALTY_NITER", Name: "Amount", Value: "-3" },
    { ModifierId: "SR_PRODUCTION_PENALTY_NITER", Name: "Percent", Value: "-33" }
  ]
};
const niter = globalThis.GameInfo.Resources.lookup("RESOURCE_NITER");
let holdings = [];
const players = { 0: { isMajor: true, Resources: { getResources: () => holdings } }, 5: { isMajor: false } };
globalThis.Players = { get: (id) => players[id] ?? null };

try {
  const { describeProductionItem, productionLineElement, rowWatcher, syncRowPill, withProductionLine,
    wrapProductionModInfo, wrapProductionTooltip } = await import("/tower-strategic-resources-that-matter/ui/sr-production-line.js");
  const { resetIndexes } = await import("/tower-strategic-resources-that-matter/ui/sr-player-supply.js");

  // describeProductionItem
  assert.deepEqual(describeProductionItem("UNIT_FIELD_CANNON"), {
    text: "LOC_SR_PRODUCTION_NEEDS_NONE|LOC_RESOURCE_NITER_NAME|-3",
    short: "LOC_SR_PRODUCTION_NEEDS_NONE_SHORT|LOC_RESOURCE_NITER_NAME|-3", unsupplied: true, buyText: null
  });
  holdings = [{ uniqueResource: { resource: niter.$hash }, isOffMap: false }];
  assert.deepEqual(describeProductionItem("UNIT_FIELD_CANNON"), {
    text: "LOC_SR_PRODUCTION_NEEDS_HELD|LOC_RESOURCE_NITER_NAME|1",
    short: "LOC_SR_PRODUCTION_NEEDS_HELD_SHORT|LOC_RESOURCE_NITER_NAME|1", unsupplied: false, buyText: null
  });
  holdings.push({ uniqueResource: { resource: niter.$hash }, isOffMap: false });
  holdings.push({ uniqueResource: { resource: niter.$hash }, isOffMap: true });
  assert.equal(describeProductionItem("UNIT_FIELD_CANNON")?.text,
    "LOC_SR_PRODUCTION_NEEDS_HELD|LOC_RESOURCE_NITER_NAME|2", "on-map copies only");
  assert.equal(describeProductionItem("UNIT_INFANTRY"), null, "an ungated unit");
  assert.equal(describeProductionItem("BUILDING_GROCER"), null, "a building in the same slot");
  assert.equal(describeProductionItem(undefined), null);
  globalThis.GameContext.localPlayerID = 5;
  assert.equal(describeProductionItem("UNIT_FIELD_CANNON"), null, "no line for a player the penalty skips");
  globalThis.GameContext.localPlayerID = 0;

  // productionLineElement: the short form as a pill, tinted while the unit is short.
  holdings = [];
  const unsupplied = productionLineElement("UNIT_FIELD_CANNON");
  assert.equal(unsupplied?.textContent, "LOC_SR_PRODUCTION_NEEDS_NONE_SHORT|LOC_RESOURCE_NITER_NAME|-3");
  assert.ok(unsupplied?.classList.contains("sr-production-line"));
  assert.ok(unsupplied?.classList.contains("rounded-full"), "drawn as a pill");
  assert.ok(unsupplied?.classList.contains("sr-pill--warning"), "a missing resource reads as a warning");
  assert.equal(unsupplied?.style.background, "#A8201A", "red");
  assert.equal(unsupplied?.style.color, "#FFF3E3", "light text on the red");
  assert.equal(unsupplied?.attributes.role, "paragraph");
  holdings = [{ uniqueResource: { resource: niter.$hash }, isOffMap: false }];
  const held = productionLineElement("UNIT_FIELD_CANNON");
  assert.equal(held?.textContent, "LOC_SR_PRODUCTION_NEEDS_HELD_SHORT|LOC_RESOURCE_NITER_NAME|1");
  assert.equal(held?.classList.contains("sr-pill--warning"), false, "a held resource does not");
  assert.equal(held?.style.background, "#23252b", "the game's plain pill");
  assert.equal(productionLineElement("UNIT_INFANTRY"), null);
  const savedPlayers = globalThis.Players;
  globalThis.Players = { get: () => { throw new Error("engine gone"); } };
  assert.equal(productionLineElement("UNIT_FIELD_CANNON"), null, "a failure draws nothing");
  globalThis.Players = savedPlayers;
  assert.ok(log.lines.some(([, text]) => text.includes("could not draw the production line")));

  // withProductionLine and wrapProductionTooltip: the whole sentence under the unit's description.
  holdings = [];
  globalThis.GameInfo.Units = table(
    [{ UnitType: "UNIT_FIELD_CANNON", Description: "LOC_UNIT_FIELD_CANNON_DESCRIPTION" }], "UnitType");
  const NONE = "[STYLE:text-negative]LOC_SR_PRODUCTION_NEEDS_NONE|LOC_RESOURCE_NITER_NAME|-3[/STYLE]";
  assert.equal(withProductionLine("UNIT_FIELD_CANNON", "LOC_GIVEN", false), `LOC_GIVEN|[N]${NONE}`,
    "in the game's negative style while the unit is short");
  assert.equal(withProductionLine("UNIT_FIELD_CANNON", undefined, false),
    `LOC_UNIT_FIELD_CANNON_DESCRIPTION|[N]${NONE}`, "the unit's own description when the tooltip gives none");
  holdings = [{ uniqueResource: { resource: niter.$hash }, isOffMap: false }];
  assert.equal(withProductionLine("UNIT_FIELD_CANNON", "LOC_GIVEN", false),
    "LOC_GIVEN|[N]LOC_SR_PRODUCTION_NEEDS_HELD|LOC_RESOURCE_NITER_NAME|1", "plain once held");
  holdings = [];
  assert.equal(withProductionLine("UNIT_INFANTRY", "LOC_GIVEN", false), "LOC_GIVEN", "an ungated unit: as it was");
  const tipDrawn = [];
  const tooltip = wrapProductionTooltip((props) => { tipDrawn.push(props); return "tip"; });
  const cannon = { category: "units", type: "UNIT_FIELD_CANNON", description: "LOC_D", isPurchase: false };
  assert.equal(tooltip(cannon), "tip");
  assert.equal(tipDrawn[0].description, `LOC_D|[N]${NONE}`);
  assert.equal(tipDrawn[0].type, "UNIT_FIELD_CANNON", "the other props stay");
  const building = { category: "buildings", type: "BUILDING_GROCER", description: "LOC_B" };
  tooltip(building);
  assert.equal(tipDrawn[1], building, "a building's tooltip passes through untouched");
  const free = { category: "units", type: "UNIT_INFANTRY", description: "LOC_I" };
  tooltip(free);
  assert.equal(tipDrawn[2], free, "an ungated unit's too");
  tooltip(undefined);
  assert.equal(tipDrawn[3], undefined, "no props: handed on as they came");
  globalThis.Players = { get: () => { throw new Error("engine gone"); } };
  const failing = { category: "units", type: "UNIT_FIELD_CANNON", description: "LOC_D" };
  assert.equal(tooltip(failing), "tip");
  assert.equal(tipDrawn[4], failing, "a failure hands the props on unchanged");
  globalThis.Players = savedPlayers;
  delete globalThis.GameInfo.Units;

  // wrapProductionModInfo: the earlier factory's output first, then the line, drawn again on a holdings change.
  let reads = 0;
  const factory = wrapProductionModInfo((props) => `before:${props.constructibleType}`, () => { reads += 1; });
  const [before, line] = factory({ constructibleType: "UNIT_FIELD_CANNON" });
  assert.equal(before, "before:UNIT_FIELD_CANNON");
  assert.equal(typeof line, "function", "a function child, so the slot redraws it");
  holdings = [];
  assert.match(line()?.textContent ?? "", /NEEDS_NONE/);
  assert.equal(reads, 1, "the holdings signal is read each time the line is drawn");
  holdings = [{ uniqueResource: { resource: niter.$hash }, isOffMap: false }];
  assert.match(line()?.textContent ?? "", /NEEDS_HELD/);
  const [, buildingLine] = wrapProductionModInfo(() => [])({ constructibleType: "BUILDING_GROCER" });
  assert.equal(buildingLine(), null, "nothing for a building; the default signal is a no-op");
  const [, noProps] = wrapProductionModInfo(() => [])(undefined);
  assert.equal(noProps(), null);

  // Nested: ours around another mod's that calls the factory it replaced, which is ours again (the registry wrapper
  // re-wrapping a newcomer). The outermost copy draws the line; the inner copy draws only what is inside it.
  const inner = wrapProductionModInfo((props) => `game:${props.constructibleType}`);
  const theirs = (/** @type {*} */ props) => ["theirs", inner(props)];
  const outer = wrapProductionModInfo(theirs);
  const drawn = outer({ constructibleType: "UNIT_FIELD_CANNON" });
  const flat = (/** @type {*} */ x) => (Array.isArray(x) ? x.flatMap(flat) : [x]);
  const lines = flat(drawn).filter((part) => typeof part === "function");
  assert.equal(lines.length, 1, "one line however deep the nesting");
  assert.ok(flat(drawn).includes("game:UNIT_FIELD_CANNON"), "what is inside is still drawn");
  assert.equal(drawn[0][1], "game:UNIT_FIELD_CANNON", "the inner copy hands its props straight through");

  // syncRowPill and rowWatcher: from game 1.5.1 a unit's row has no mod slot, so the pill goes under its name.
  const fakeRow = (tagName = "PRODUCTION-CHOOSER-ITEM") => {
    /** @type {*[]} */
    const children = [];
    const column = { appendChild: (/** @type {*} */ el) => {
      el.remove = () => children.splice(children.indexOf(el), 1);
      children.push(el);
    } };
    const has = (/** @type {*} */ el, /** @type {string} */ name) =>
      el.classList.contains(name) || el.children.some((/** @type {*} */ c) => has(c, name));
    return {
      tagName, children, column,
      querySelectorAll: (/** @type {string} */ selector) => children.filter((el) => has(el, selector.slice(1))),
      querySelector: () => ({ firstElementChild: column })
    };
  };
  holdings = [];
  const row = fakeRow();
  syncRowPill(row, "UNIT_FIELD_CANNON");
  assert.equal(row.children.length, 1, "one pill in the unit's row");
  assert.ok(row.children[0].classList.contains("flex-row"), "in a row of its own, so it keeps its width");
  assert.match(row.children[0].children[0].textContent, /NEEDS_NONE_SHORT/);
  holdings = [{ uniqueResource: { resource: niter.$hash }, isOffMap: false }];
  syncRowPill(row, "UNIT_FIELD_CANNON");
  assert.equal(row.children.length, 1, "redrawn, not doubled");
  assert.match(row.children[0].children[0].textContent, /NEEDS_HELD_SHORT/);
  syncRowPill(row, "UNIT_INFANTRY");
  assert.equal(row.children.length, 0, "a reused row for an ungated unit loses the pill");
  syncRowPill(row, "UNIT_FIELD_CANNON");
  syncRowPill(row, undefined);
  assert.equal(row.children.length, 0, "and so does one that isn't a unit any more");
  const slotRow = fakeRow();
  const slotPill = productionLineElement("UNIT_FIELD_CANNON");
  slotRow.column.appendChild(slotPill);
  syncRowPill(slotRow, "UNIT_FIELD_CANNON");
  assert.deepEqual(slotRow.children, [slotPill], "a row whose mod slot drew the pill keeps just that one");
  const otherHost = fakeRow("FXS-TOOLTIP");
  syncRowPill(otherHost, "UNIT_FIELD_CANNON");
  assert.equal(otherHost.children.length, 0, "only the production row");
  syncRowPill(null, "UNIT_FIELD_CANNON");
  const broken = { tagName: "PRODUCTION-CHOOSER-ITEM", querySelectorAll: () => { throw new Error("x"); } };
  syncRowPill(broken, "UNIT_X");

  /** @type {(() => void)[]} */
  const effects = [];
  /** @type {(() => void)[]} */
  const deferred = [];
  let rowReads = 0;
  const watched = fakeRow();
  let hostNow = /** @type {*} */ (watched);
  const watch = rowWatcher({
    hostOf: () => hostNow, effect: (fn) => { effects.push(fn); fn(); },
    holdingsChanged: () => { rowReads += 1; }, later: (fn) => deferred.push(fn)
  });
  const rowProps = { category: "units", type: "UNIT_FIELD_CANNON" };
  const watchedTip = wrapProductionTooltip(() => "tip", undefined, watch);
  holdings = [];
  assert.equal(watchedTip(rowProps), "tip");
  assert.equal(watched.children.length, 0, "placed after the row has rendered");
  deferred.splice(0).forEach((fn) => fn());
  assert.match(watched.children[0].children[0].textContent, /NEEDS_NONE_SHORT/);
  rowProps.type = "UNIT_INFANTRY";
  effects[0]();
  deferred.splice(0).forEach((fn) => fn());
  assert.equal(watched.children.length, 0, "follows the row's unit");
  assert.equal(rowReads, 2, "and the holdings signal");
  rowProps.category = "buildings";
  rowProps.type = "UNIT_FIELD_CANNON";
  effects[0]();
  deferred.splice(0).forEach((fn) => fn());
  assert.equal(watched.children.length, 0, "nothing in a building's row");
  hostNow = undefined;
  assert.equal(wrapProductionTooltip(() => "tip", undefined, watch)({ category: "units", type: "UNIT_FIELD_CANNON" }),
    "tip", "a tooltip outside a row is left alone");
  hostNow = fakeRow("OTHER-ITEM");
  watch({ category: "units", type: "UNIT_FIELD_CANNON" });
  assert.equal(effects.length, 1, "no effect for another element");
  assert.equal(wrapProductionTooltip(() => "tip", undefined, () => { throw new Error("x"); })({}), "tip",
    "a failing watcher never breaks the tooltip");

  // Under the hard gate a locked unit reads the locked form (bought, on a purchase item), red; a copy unlocks it.
  holdings = [];
  globalThis.GameInfo.Units = table([{ UnitType: "UNIT_FIELD_CANNON", StrategicResource: "RESOURCE_NITER" }],
      "UnitType");
  globalThis.GameInfo.GlobalParameters = [{ Name: "STRATEGIC_RESOURCE_MINIMUM_FOR_PRODUCTION_ANYWHERE", Value: "1" },
    { Name: "STRATEGIC_RESOURCE_MINIMUM_FOR_PURCHASE_ANYWHERE", Value: "1" }];
  resetIndexes();
  assert.deepEqual(describeProductionItem("UNIT_FIELD_CANNON"), {
    text: "LOC_SR_PRODUCTION_LOCKED|LOC_RESOURCE_NITER_NAME|",
        buyText: "LOC_SR_PRODUCTION_LOCKED_BUY|LOC_RESOURCE_NITER_NAME",
    short: "LOC_SR_PRODUCTION_LOCKED_SHORT|LOC_RESOURCE_NITER_NAME|", unsupplied: true
  });
  holdings = [{ uniqueResource: { resource: niter.$hash }, isOffMap: false }];
  assert.equal(describeProductionItem("UNIT_FIELD_CANNON")?.text,
      "LOC_SR_PRODUCTION_NEEDS_HELD|LOC_RESOURCE_NITER_NAME|1");
  holdings = [];
  const locked = productionLineElement("UNIT_FIELD_CANNON");
  assert.equal(locked?.textContent, "LOC_SR_PRODUCTION_LOCKED_SHORT|LOC_RESOURCE_NITER_NAME|");
  assert.ok(locked?.classList.contains("sr-pill--warning"), "a lock reads as a warning");
  const BUY = "[STYLE:text-negative]LOC_SR_PRODUCTION_LOCKED_BUY|LOC_RESOURCE_NITER_NAME[/STYLE]";
  assert.equal(withProductionLine("UNIT_FIELD_CANNON", "LOC_D", true), `LOC_D|[N]${BUY}`,
    "the purchase tooltip says what cannot be bought");
  assert.equal(withProductionLine("UNIT_FIELD_CANNON", "LOC_D", "true"), `LOC_D|[N]${BUY}`, "the attribute form too");
  assert.equal(withProductionLine("UNIT_FIELD_CANNON", "LOC_D", false),
    "LOC_D|[N][STYLE:text-negative]LOC_SR_PRODUCTION_LOCKED|LOC_RESOURCE_NITER_NAME|[/STYLE]");
  globalThis.GameInfo.GlobalParameters = [];
  resetIndexes();
  assert.equal(describeProductionItem("UNIT_FIELD_CANNON")?.text,
      "LOC_SR_PRODUCTION_NEEDS_NONE|LOC_RESOURCE_NITER_NAME|-3",
    "the column without the engine's parameter locks nothing");

} finally {
  log.restore();
  restoreGlobals();
}

console.log("sr-production-line tests passed");
