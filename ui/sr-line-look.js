// Keeps the gate's unit copies and re-traited base units looking like the ordinary units they are.
// Two things the game decides from a unit's trait or from the remap list, both set by data/sr-<age>-gate-lines.sql:
//   - The unit panel and the army panel put a unit's portrait in the unique-unit frame when the unit has any trait
//     (WorldUI.requestPortrait(asset, key, background), both the unit's type), and ask for the portrait by the
//     unit's own type. The
//     six base units the gate locks by trait, and a civilization's copy of its Warrior or Frigate, carry the
//     SR_LINE_PLAIN tag; for them the frame stays the plain one, and a copy (a tagged unit that stands in for
//     another, by UnitReplaces) gets the portrait of the unit it copies, since only that unit has one. Game scope
//     only: the tags are gameplay data.
//   - The Options screen lists every visual remap as a checkbox under Game, Extras (VisualRemaps.getAvailableRemaps).
//     The mod's remaps (REMAP_SR_...) only give a copy the look of the unit it copies; there's nothing to choose, so
//     they're left out of the list, and any one switched off by an earlier build is switched back on. Shell and game.

import { log } from "/tower-strategic-resources-that-matter/ui/sr-log.js";

/** The tag on units whose portrait keeps the plain frame. */
export const PLAIN_TAG = "SR_LINE_PLAIN";
/** The mod's remap ids start with this. */
export const REMAP_PREFIX = "REMAP_SR_";
const UNIQUE_FRAME = "UnitPortraitsBG_UNIQUE";
const PLAIN_FRAME = "UnitPortraitsBG_BASE";
const WRAPPED = "__strategicResourcesLineLook";

/**
 * The unit types carrying the plain tag.
 * @param {Iterable<{ Type?: string, Tag?: string }>} typeTags TypeTags rows
 * @returns {Set<string>}
 */
export function plainUnits(typeTags) {
  const out = new Set();
  for (const row of typeTags) if (row?.Tag === PLAIN_TAG && row.Type) out.add(row.Type);
  return out;
}

/**
 * For each tagged unit that stands in for another, the unit it stands in for, whose portrait it borrows.
 * @param {Iterable<{ CivUniqueUnitType?: string, ReplacesUnitType?: string }>} replaces UnitReplaces rows
 * @param {Set<string>} plain
 * @returns {Map<string, string>}
 */
export function portraitSources(replaces, plain) {
  const out = new Map();
  for (const row of replaces) {
    if (row?.CivUniqueUnitType && row.ReplacesUnitType && plain.has(row.CivUniqueUnitType)) {
      out.set(row.CivUniqueUnitType, row.ReplacesUnitType);
    }
  }
  return out;
}

/**
 * The portrait call with the frame put back to plain for the tagged units, and a copy's portrait taken from the
 * unit it copies. The engine takes (asset, key, background): the asset is the unit whose portrait is drawn, the key
 * is what the panel reads the image back by (`live:/<key>`), watched 2026-10-15 with two test boxes. The game's
 * panels pass the unit's type as both; for a copy the asset becomes the unit it stands in for, the key stays. Pure.
 * @param {(asset: string, key: string, background: string, ...rest: unknown[]) => unknown} original
 * @param {Set<string>} plain
 * @param {Map<string, string>} [sources] copy to the unit whose portrait it shows
 */
export function wrapRequestPortrait(original, plain, sources = new Map()) {
  return /** @this {*} */ function (/** @type {string} */ asset, /** @type {string} */ key,
    /** @type {string} */ background, /** @type {unknown[]} */ ...rest) {
    const frame = background === UNIQUE_FRAME && plain.has(key) ? PLAIN_FRAME : background;
    const image = asset === key ? sources.get(key) ?? asset : asset;
    return original.call(this, image, key, frame, ...rest);
  };
}

/**
 * The remap list without the mod's own entries.
 * @param {() => { id?: string }[] | undefined} original
 */
export function wrapAvailableRemaps(original) {
  return /** @this {*} */ function () {
    const remaps = original.call(this) ?? [];
    return remaps.filter((r) => !String(r?.id ?? "").startsWith(REMAP_PREFIX));
  };
}

/** The ids of the mod's remaps in a list. @param {{ id?: string }[] | undefined} remaps */
const ownRemapIds = (remaps) =>
  (remaps ?? []).map((r) => String(r?.id ?? "")).filter((id) => id.startsWith(REMAP_PREFIX));

/** Switches every remap of the mod's back on, for a player who turned one off in an earlier build. */
function restoreRemaps() {
  const api = /** @type {*} */ (globalThis).VisualRemaps;
  const selection = /** @type {*} */ (globalThis).VisualRemapSelection;
  if (!api?.setRemapState || !selection) return;
  for (const id of ownRemapIds(api.getAvailableRemaps())) {
    if (api.getRemapState(id) !== selection.Disabled) continue;
    api.setRemapState(id, selection.Enabled);
    log.info(`remap ${id} switched back on`);
  }
}

/** Leaves the mod's remaps out of the Options list, once. */
function hideRemaps() {
  const remaps = /** @type {*} */ (globalThis).VisualRemaps;
  if (!remaps || typeof remaps.getAvailableRemaps !== "function" || remaps.getAvailableRemaps[WRAPPED]) return;
  restoreRemaps();
  const wrapped = wrapAvailableRemaps(remaps.getAvailableRemaps.bind(remaps));
  /** @type {*} */ (wrapped)[WRAPPED] = true;
  remaps.getAvailableRemaps = wrapped;
}

/** Keeps the plain frame and the borrowed portrait on the tagged units, once; nothing without the gameplay tables. */
function keepPlainFrames() {
  const world = /** @type {*} */ (globalThis).WorldUI;
  const info = /** @type {*} */ (globalThis).GameInfo;
  if (!world || typeof world.requestPortrait !== "function" || world.requestPortrait[WRAPPED] || !info?.TypeTags) return;
  const plain = plainUnits(info.TypeTags);
  if (plain.size === 0) return;
  const sources = portraitSources(info.UnitReplaces ?? [], plain);
  const wrapped = wrapRequestPortrait(world.requestPortrait, plain, sources);
  /** @type {*} */ (wrapped)[WRAPPED] = true;
  world.requestPortrait = wrapped;
  log.info(`plain portrait frame kept on ${plain.size} units, ${sources.size} with a borrowed portrait`);
}

function start() {
  hideRemaps();
  keepPlainFrames();
}

if (typeof engine !== "undefined" && engine.whenReady) {
  engine.whenReady.then(() => {
    try {
      start();
    } catch (e) {
      log.warn("could not keep the line units' look:", e);
    }
  });
}
