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
  const { describeProductionItem, productionLineElement, shortenInRow, wrapProductionModInfo } =
    await import("/tower-strategic-resources/ui/sr-production-line.js");

  // describeProductionItem
  assert.deepEqual(describeProductionItem("UNIT_FIELD_CANNON"), {
    text: "LOC_SR_PRODUCTION_NEEDS_NONE|LOC_RESOURCE_NITER_NAME|-3",
    short: "LOC_SR_PRODUCTION_NEEDS_NONE_SHORT|LOC_RESOURCE_NITER_NAME|-3", unsupplied: true
  });
  holdings = [{ uniqueResource: { resource: niter.$hash }, isOffMap: false }];
  assert.deepEqual(describeProductionItem("UNIT_FIELD_CANNON"), {
    text: "LOC_SR_PRODUCTION_NEEDS_HELD|LOC_RESOURCE_NITER_NAME|1",
    short: "LOC_SR_PRODUCTION_NEEDS_HELD_SHORT|LOC_RESOURCE_NITER_NAME|1", unsupplied: false
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

  // productionLineElement
  holdings = [];
  const unsupplied = productionLineElement("UNIT_FIELD_CANNON");
  assert.equal(unsupplied?.textContent, "LOC_SR_PRODUCTION_NEEDS_NONE|LOC_RESOURCE_NITER_NAME|-3");
  assert.ok(unsupplied?.classList.contains("sr-production-line"));
  assert.ok(unsupplied?.classList.contains("text-negative-light"), "a missing resource reads as a warning");
  assert.equal(unsupplied?.attributes.role, "paragraph");
  holdings = [{ uniqueResource: { resource: niter.$hash }, isOffMap: false }];
  const held = productionLineElement("UNIT_FIELD_CANNON");
  assert.equal(held?.classList.contains("text-negative-light"), false, "a held resource does not");
  assert.equal(productionLineElement("UNIT_INFANTRY"), null);
  const savedPlayers = globalThis.Players;
  globalThis.Players = { get: () => { throw new Error("engine gone"); } };
  assert.equal(productionLineElement("UNIT_FIELD_CANNON"), null, "a failure draws nothing");
  globalThis.Players = savedPlayers;
  assert.ok(log.lines.some(([, text]) => text.includes("could not draw the production line")));

  // shortenInRow: the short form only where the slot's container lays out as a row.
  const placed = (direction) => {
    const line = element();
    line.textContent = "long";
    const container = { direction };
    line.parentElement = { parentElement: direction ? container : null };
    return line;
  };
  globalThis.getComputedStyle = (node) => ({ flexDirection: node.direction });
  const inRow = placed("row");
  shortenInRow(inRow, "short");
  assert.equal(inRow.textContent, "short");
  assert.ok(inRow.classList.contains("whitespace-nowrap"));
  const inColumn = placed("column");
  shortenInRow(inColumn, "short");
  assert.equal(inColumn.textContent, "long", "the game's own column keeps the sentence");
  const loose = placed(null);
  shortenInRow(loose, "short");
  assert.equal(loose.textContent, "long", "not placed: left alone");
  globalThis.getComputedStyle = () => { throw new Error("no layout"); };
  shortenInRow(inColumn, "short");
  assert.equal(inColumn.textContent, "long");
  assert.ok(log.lines.some(([, text]) => text.includes("could not fit the production line")));
  // The check runs after the element is placed.
  globalThis.getComputedStyle = (node) => ({ flexDirection: node.direction });
  holdings = [];
  const later = productionLineElement("UNIT_FIELD_CANNON");
  later.parentElement = { parentElement: { direction: "row" } };
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(later.textContent, "LOC_SR_PRODUCTION_NEEDS_NONE_SHORT|LOC_RESOURCE_NITER_NAME|-3");

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
} finally {
  log.restore();
  restoreGlobals();
}

console.log("sr-production-line tests passed");
