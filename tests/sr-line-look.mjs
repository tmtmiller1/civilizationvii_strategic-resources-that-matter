import assert from "node:assert/strict";
import fs from "node:fs";
import { captureConsole, snapshotGlobals } from "./_engine-stubs.mjs";

// The line units' look: the plain portrait frame on the tagged units (the base units the gate locks by trait, the
// copies), the mod's remaps kept out of the Options list and switched back on, and the two engine calls wrapped
// once, never throwing into the game's panels.

const restoreGlobals = snapshotGlobals(["GameInfo", "WorldUI", "VisualRemaps", "VisualRemapSelection", "engine"]);
const log = captureConsole();

try {
  const { PLAIN_TAG, REMAP_PREFIX, plainUnits, portraitSources, wrapAvailableRemaps, wrapRequestPortrait } =
    await import("/tower-strategic-resources-that-matter/ui/sr-line-look.js");

  // The tag and the remap prefix are the ones the data writes.
  const buildData = fs.readFileSync("scripts/build-data.mjs", "utf8");
  assert.ok(buildData.includes(`export const PLAIN_TAG = "${PLAIN_TAG}";`), "the tag differs from build-data's");
  assert.ok(buildData.includes("`REMAP_SR_${"), "the remap prefix differs from build-data's");
  assert.equal(REMAP_PREFIX, "REMAP_SR_");

  // plainUnits: the tagged types, other tags and bad rows ignored.
  const tags = [{ Type: "UNIT_BOMBARD", Tag: PLAIN_TAG }, { Type: "UNIT_WARRIOR_SR_ROME", Tag: PLAIN_TAG },
    { Type: "UNIT_LEGION", Tag: "UNIT_CLASS_INFANTRY" }, null, { Tag: PLAIN_TAG }];
  assert.deepEqual([...plainUnits(tags)].sort(), ["UNIT_BOMBARD", "UNIT_WARRIOR_SR_ROME"]);

  // wrapRequestPortrait: the unique frame becomes the plain one for tagged units only; everything else passes through.
  const calls = [];
  const original = function (...args) { calls.push([this, ...args]); return "ok"; };
  const world = {};
  const wrapped = wrapRequestPortrait(original, plainUnits(tags));
  assert.equal(wrapped.call(world, "UNIT_BOMBARD", "UNIT_BOMBARD", "UnitPortraitsBG_UNIQUE"), "ok");
  assert.deepEqual(calls.at(-1), [world, "UNIT_BOMBARD", "UNIT_BOMBARD", "UnitPortraitsBG_BASE"]);
  wrapped.call(world, "UNIT_LEGION", "UNIT_LEGION", "UnitPortraitsBG_UNIQUE");
  assert.deepEqual(calls.at(-1), [world, "UNIT_LEGION", "UNIT_LEGION", "UnitPortraitsBG_UNIQUE"], "a unique stays");
  wrapped.call(world, "UNIT_BOMBARD", "UNIT_BOMBARD", "UnitPortraitsBG_BASE", "extra");
  assert.deepEqual(calls.at(-1), [world, "UNIT_BOMBARD", "UNIT_BOMBARD", "UnitPortraitsBG_BASE", "extra"],
    "a plain call and its extra arguments pass through");

  // portraitSources and the borrowed portrait: a tagged stand-in shows the portrait of the unit it stands in for,
  // under its own key; a base unit and a real unique keep their own.
  const replaces = [{ CivUniqueUnitType: "UNIT_WARRIOR_SR_ROME", ReplacesUnitType: "UNIT_WARRIOR" },
    { CivUniqueUnitType: "UNIT_LEGION", ReplacesUnitType: "UNIT_SPEARMAN" }, null];
  const sources = portraitSources(replaces, plainUnits(tags));
  assert.deepEqual([...sources], [["UNIT_WARRIOR_SR_ROME", "UNIT_WARRIOR"]]);
  const borrowed = wrapRequestPortrait(original, plainUnits(tags), sources);
  borrowed.call(world, "UNIT_WARRIOR_SR_ROME", "UNIT_WARRIOR_SR_ROME", "UnitPortraitsBG_UNIQUE");
  assert.deepEqual(calls.at(-1), [world, "UNIT_WARRIOR", "UNIT_WARRIOR_SR_ROME", "UnitPortraitsBG_BASE"],
    "the Warrior's portrait, under the copy's key");
  borrowed.call(world, "UNIT_LEGION", "UNIT_LEGION", "UnitPortraitsBG_UNIQUE");
  assert.deepEqual(calls.at(-1), [world, "UNIT_LEGION", "UNIT_LEGION", "UnitPortraitsBG_UNIQUE"]);
  borrowed.call(world, "OTHER_ASSET", "UNIT_WARRIOR_SR_ROME", "UnitPortraitsBG_UNIQUE");
  assert.deepEqual(calls.at(-1), [world, "OTHER_ASSET", "UNIT_WARRIOR_SR_ROME", "UnitPortraitsBG_BASE"],
    "an asset asked for by another name is left alone; the frame still follows the key");

  // wrapAvailableRemaps: the mod's entries dropped, the game's kept, a missing list tolerated.
  const list = [{ id: "REMAP_SCOUT_FOUNDER" }, { id: "REMAP_SR_WARRIOR_SR_ROME" }, null,
    { id: "REMAP_SR_FRIGATE_SR_MEIJI" }];
  assert.deepEqual(wrapAvailableRemaps(() => list)(), [{ id: "REMAP_SCOUT_FOUNDER" }, null]);
  assert.deepEqual(wrapAvailableRemaps(() => undefined)(), []);

  // start: the engine objects wrapped once, a disabled remap of the mod's switched back on, the game's left alone.
  const states = { REMAP_SR_WARRIOR_SR_ROME: 1, REMAP_SCOUT_FOUNDER: 1, REMAP_SR_FRIGATE_SR_MEIJI: 2 };
  globalThis.VisualRemapSelection = { Disabled: 1, Enabled: 2 };
  globalThis.VisualRemaps = {
    getAvailableRemaps: () => Object.keys(states).map((id) => ({ id, displayName: id })),
    getRemapState: (id) => states[id],
    setRemapState: (id, v) => { states[id] = v; }
  };
  const portraits = [];
  globalThis.WorldUI = { requestPortrait: (...args) => { portraits.push(args); } };
  globalThis.GameInfo = { TypeTags: tags, UnitReplaces: replaces };
  let ready;
  globalThis.engine = { whenReady: { then: (fn) => { ready = fn; } } };
  await import("/tower-strategic-resources-that-matter/ui/sr-line-look.js?start");
  ready();
  assert.deepEqual(states, { REMAP_SR_WARRIOR_SR_ROME: 2, REMAP_SCOUT_FOUNDER: 1, REMAP_SR_FRIGATE_SR_MEIJI: 2 },
    "only the mod's disabled remap switched on");
  assert.deepEqual(globalThis.VisualRemaps.getAvailableRemaps().map((r) => r.id), ["REMAP_SCOUT_FOUNDER"]);
  globalThis.WorldUI.requestPortrait("UNIT_WARRIOR_SR_ROME", "UNIT_WARRIOR_SR_ROME", "UnitPortraitsBG_UNIQUE");
  assert.deepEqual(portraits.at(-1), ["UNIT_WARRIOR", "UNIT_WARRIOR_SR_ROME", "UnitPortraitsBG_BASE"]);
  const before = { remaps: globalThis.VisualRemaps.getAvailableRemaps, portrait: globalThis.WorldUI.requestPortrait };
  ready();
  assert.equal(globalThis.VisualRemaps.getAvailableRemaps, before.remaps, "ready again wraps nothing twice");
  assert.equal(globalThis.WorldUI.requestPortrait, before.portrait);
  assert.ok(log.lines.some(([, t]) => t.includes("switched back on")));
  assert.ok(log.lines.some(([, t]) => t.includes("plain portrait frame kept on 2 units, 1 with a borrowed portrait")));

  // The shell: no GameInfo, no WorldUI; the remap half still runs and nothing throws.
  delete globalThis.GameInfo;
  delete globalThis.WorldUI;
  globalThis.VisualRemaps = { getAvailableRemaps: () => [{ id: "REMAP_SR_X" }], getRemapState: () => 2,
    setRemapState: () => {} };
  await import("/tower-strategic-resources-that-matter/ui/sr-line-look.js?shell");
  ready();
  assert.deepEqual(globalThis.VisualRemaps.getAvailableRemaps(), []);

  console.log("sr-line-look tests passed");
} finally {
  log.restore();
  restoreGlobals();
}
