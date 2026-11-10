// Adds one pill to a gated unit's item in the production list: "Needs Niter" with none held, "Niter: 2" with some,
// and under the hard gate "Locked: no Niter" on the greyed item sr-production-lock.js keeps listed. A unit that
// draws on two resources (Modern Supply Chains) gets one part per resource in the pill, "Needs Oil, Needs Coal", and
// one sentence per resource in the tooltip. The pill goes in
// ProductionModInfo, the empty slot the game renders under each item's name and error line for mods, so the game's
// own text stays where it is; it is the mod's status pill (sr-pill.js), red while the unit is short. From game
// 1.5.1 that slot is rendered only in rows that list base yields (buildings), so in a unit's row the pill is put
// under the name by the tooltip wrapper instead, which the game still creates once per row (syncRowPill). The
// whole sentence ("Needs Niter. Without it: -3 Combat Strength, slower to train.", "Needs Niter: cannot be trained
// without it.", "... bought ..." on the purchase list) goes into the item's hover tooltip, under the unit's
// description. Mods that draw their own production items and render that slot show the pill too.

import { log } from "/tower-strategic-resources-that-matter/ui/sr-log.js";
import { copiesCounter, readIndexes, resourceNameKey } from "/tower-strategic-resources-that-matter/ui/sr-player-supply.js";
import { keepWrapped } from "/tower-strategic-resources-that-matter/ui/sr-registry.js";
import { negative, statusPill } from "/tower-strategic-resources-that-matter/ui/sr-pill.js";
import { describeProductionCost } from "/tower-strategic-resources-that-matter/ui/sr-supply.js";

const LINE_CLASS = "sr-production-line";

/**
 * The line for the local player's production item, or null when there is nothing to say. `short` is the form for a
 * one-row item (City Hall's compact list), where the sentence would squeeze the unit's name.
 * `buyText` is the form for the purchase list, where a locked item says what cannot be bought.
 * A unit that draws on two resources gets one part per resource: the sentences on separate lines, the short forms
 * in one list.
 * @param {string | undefined} unitType
 * @returns {{ text: string, buyText: string | null, short: string, unsupplied: boolean } | null}
 */
export function describeProductionItem(unitType) {
  if (!unitType) return null;
  const player = Players.get(GameContext.localPlayerID);
  if (!player?.isMajor) return null;
  const { supply, penalties, gate } = readIndexes();
  if (!supply.has(unitType) && !gate.needs.has(unitType)) return null;
  const lines = describeProductionCost(unitType, { supply, penalties, copiesOf: copiesCounter(player), gate });
  if (lines.length === 0) return null;
  const parts = lines.map((line) => {
    const [resourceType, value] = line.args;
    const name = resourceNameKey(String(resourceType));
    const locked = line.key === "LOC_SR_PRODUCTION_LOCKED";
    return {
      text: Locale.compose(line.key, name, value),
      buyText: locked ? Locale.compose("LOC_SR_PRODUCTION_LOCKED_BUY", name) : Locale.compose(line.key, name, value),
      short: Locale.compose(`${line.key}_SHORT`, name, value),
      unsupplied: line.key === "LOC_SR_PRODUCTION_NEEDS_NONE" || locked,
      locked
    };
  });
  // A key of the form "{1_First}, {2_Second}" carries the spacing: the game trims a separator key's own spaces.
  const list = (/** @type {string[]} */ items) =>
    items.reduce((first, second) => Locale.compose("LOC_SR_LIST_PAIR", first, second));
  return {
    text: parts.map((p) => p.text).join("[N]"),
    buyText: parts.some((p) => p.locked) ? parts.map((p) => p.buyText).join("[N]") : null,
    short: list(parts.map((p) => p.short)),
    unsupplied: parts.some((p) => p.unsupplied)
  };
}

/**
 * The pill, or null. Never throws: a failure here must not break the production list.
 * @param {string | undefined} unitType
 * @returns {HTMLElement | null}
 */
export function productionLineElement(unitType) {
  try {
    const line = describeProductionItem(unitType);
    return line ? statusPill(line.short, { warning: line.unsupplied, className: LINE_CLASS }) : null;
  } catch (e) {
    log.warn("could not draw the production line:", e);
    return null;
  }
}

/**
 * The item's hover tooltip with the whole sentence under the unit's description. The game's ProductionTooltip takes
 * the item's attributes as props (`category`, `type`, `description`, `isPurchase`); for a unit the mod has a line
 * for, the description handed on gains the line, composed, on a new line. Anything else passes through untouched.
 * @param {Function} previous the factory registered before
 * @param {(...sources: object[]) => object} [mergeProps] Solid's, so the props handed down stay reactive
 * @param {(props: *) => void} [watchRow] called once per tooltip made, to keep the row's own pill (rowWatcher)
 * @returns {Function}
 */
export function wrapProductionTooltip(previous, mergeProps = (...sources) => Object.assign({}, ...sources),
  watchRow = undefined) {
  return function StrategicResourcesThatMatterProductionTooltip(/** @type {*} */ props) {
    try {
      watchRow?.(props);
    } catch (e) {
      log.warn("could not watch the production row:", e);
    }
    try {
      if (props?.category !== "units" || !describeProductionItem(props.type)) return previous(props);
      return previous(mergeProps(props, {
        get description() {
          return withProductionLine(props.type, props.description, props.isPurchase);
        }
      }));
    } catch (e) {
      log.warn("could not add the production line to the tooltip:", e);
      return previous(props);
    }
  };
}

/**
 * A unit's description with the mod's sentence after it, or the description as it was.
 * @param {string} unitType
 * @param {string | undefined} description the tooltip's own, a text key or text
 * @param {boolean | string | undefined} isPurchase
 * @returns {string | undefined}
 */
export function withProductionLine(unitType, description, isPurchase) {
  const line = describeProductionItem(unitType);
  if (!line) return description;
  const base = description ?? GameInfo.Units.lookup(unitType)?.Description ?? "";
  const sentence = isPurchase === true || isPurchase === "true" ? line.buyText ?? line.text : line.text;
  return `${Locale.compose(base)}[N]${line.unsupplied ? negative(sentence) : sentence}`;
}

/** Set on the props this factory hands down, so a copy of it nested further in draws no second line. */
const LINE_DRAWN = "__strategicResourcesLineDrawn";

/**
 * The ProductionModInfo factory: whatever was registered before, then the line. The line is drawn again when
 * `holdingsChanged` changes, so an open list follows a copy gained or lost. A copy of this factory reached through
 * another mod's (one that calls the factory it replaced, wrapped again by the registry wrapper) draws only what is
 * inside it: the outermost copy draws the line.
 * @param {Function} previous
 * @param {() => unknown} [holdingsChanged] a signal read for its change only
 * @param {(...sources: object[]) => object} [mergeProps] Solid's, so the props handed down stay reactive
 * @returns {Function}
 */
export function wrapProductionModInfo(previous, holdingsChanged = () => 0,
  mergeProps = (...sources) => Object.assign({}, ...sources)) {
  return function StrategicResourcesThatMatterProductionModInfo(/** @type {*} */ props) {
    if (props?.[LINE_DRAWN]) return previous(props);
    return [previous(mergeProps(props ?? {}, { [LINE_DRAWN]: true })), () => {
      holdingsChanged();
      return productionLineElement(props?.constructibleType);
    }];
  };
}

const ROW_CLASS = "sr-production-line-row";
const ROW_TAG = "PRODUCTION-CHOOSER-ITEM";

/**
 * Keeps one pill under the name in a unit's production row, for game versions whose row leaves the mod slot out
 * for units. The pill sits in a row of its own, as the slot's did, so it keeps its width. A pill the slot drew (an
 * older game, or another mod's row that renders the slot) wins, so a row never shows two. Never throws.
 * @param {*} host the production-chooser-item element
 * @param {string | undefined} unitType the row's unit, or undefined for a row that isn't a unit
 */
export function syncRowPill(host, unitType) {
  try {
    if (!isRow(host)) return;
    for (const ours of [...host.querySelectorAll(`.${ROW_CLASS}`)]) ours.remove();
    if (unitType && host.querySelectorAll(`.${LINE_CLASS}`).length === 0) addRowPill(host, unitType);
  } catch (e) {
    log.warn("could not draw the production row's line:", e);
  }
}

/** @param {*} host @returns {boolean} */
const isRow = (host) => !!host && String(host.tagName).toUpperCase() === ROW_TAG;

/** @param {*} host @param {string} unitType */
function addRowPill(host, unitType) {
  const column = host.querySelector(".items-stretch")?.firstElementChild;
  const pill = column ? productionLineElement(unitType) : null;
  if (!pill) return;
  const slot = document.createElement("div");
  slot.classList.add("flex", "flex-row", ROW_CLASS);
  slot.appendChild(pill);
  column.appendChild(slot);
}

/**
 * The `watchRow` for wrapProductionTooltip: finds the row element the tooltip is made in and keeps its pill in step
 * with the row's unit (rows are reused) and the player's holdings. The pill is placed after the row has rendered.
 * @param {{ hostOf: () => *, effect: (fn: () => void) => void, holdingsChanged: () => unknown,
 *   later: (fn: () => void) => void }} hooks
 * @returns {(props: *) => void}
 */
export function rowWatcher({ hostOf, effect, holdingsChanged, later }) {
  return (props) => {
    const host = hostOf();
    if (!isRow(host)) return;
    effect(() => {
      holdingsChanged();
      const unitType = props?.category === "units" ? props.type : undefined;
      later(() => syncRowPill(host, unitType));
    });
  };
}

async function start() {
  try {
    const { ComponentRegistry } = /** @type {*} */ (await import("/core/ui-next/services/component-registry.js"));
    const solid = /** @type {*} */ (await import("/core/vendor/solid-js/dist/solid.js"));
    const [holdingsChanged, setHoldingsChanged] = solid.createSignal(0);
    engine.on("PlayerResourceChanged", () => setHoldingsChanged((/** @type {number} */ n) => n + 1));
    await keepWrapped(ComponentRegistry, solid, "ProductionModInfo", (previous) =>
      wrapProductionModInfo(previous, holdingsChanged, solid.mergeProps));
    const adapter = /** @type {*} */ (await import("/core/ui-next/components/fxs-solid-component.js")
      .catch(() => null))?.SolidAdapterContext;
    const watchRow = adapter ? rowWatcher({
      hostOf: () => solid.useContext(adapter)?.rootElement,
      effect: solid.createEffect,
      holdingsChanged,
      later: (fn) => (globalThis.requestAnimationFrame ?? setTimeout)(fn)
    }) : undefined;
    await keepWrapped(ComponentRegistry, solid, "ProductionTooltip", (previous) =>
      wrapProductionTooltip(previous, solid.mergeProps, watchRow));
  } catch (e) {
    log.warn("could not add the production line:", e);
  }
}

if (typeof engine !== "undefined") start();
