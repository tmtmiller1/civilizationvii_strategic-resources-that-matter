// Adds one line to a gated unit's item in the production list: "Needs Niter. Without it: -3 Combat Strength, slower to
// train." with none held, "Needs Niter (you have 2)." with copies, and under the hard gate "Needs Niter: cannot be
// trained without it." (bought, in the purchase list) on the greyed item sr-production-lock.js keeps listed. The item
// is the game's own; the line goes in ProductionModInfo, the empty slot the game renders under each item's name and
// error line for mods, so the game's own text stays where it is. Mods that draw their own production items and render
// that slot show the line too.

import { log } from "/tower-strategic-resources-that-matter/ui/sr-log.js";
import { copiesCounter, readIndexes, resourceNameKey } from "/tower-strategic-resources-that-matter/ui/sr-player-supply.js";
import { keepWrapped } from "/tower-strategic-resources-that-matter/ui/sr-registry.js";
import { describeProductionCost } from "/tower-strategic-resources-that-matter/ui/sr-supply.js";

const LINE_CLASS = "sr-production-line";
const LINE_CLASSES = [LINE_CLASS, "font-body", "text-sm", "pointer-events-none"];
const UNSUPPLIED_CLASS = "text-negative-light";

/**
 * The line for the local player's production item, or null when there is nothing to say. `short` is the form for a
 * one-row item (City Hall's compact list), where the sentence would squeeze the unit's name.
 * `buyText` is the locked form for the purchase list, where the item says what cannot be bought.
 * @param {string | undefined} unitType
 * @returns {{ text: string, buyText: string | null, short: string, unsupplied: boolean } | null}
 */
export function describeProductionItem(unitType) {
  if (!unitType) return null;
  const player = Players.get(GameContext.localPlayerID);
  if (!player?.isMajor) return null;
  const { supply, penalties, gate } = readIndexes();
  if (!supply.has(unitType) && !gate.columns.has(unitType)) return null;
  const line = describeProductionCost(unitType, { supply, penalties, copiesOf: copiesCounter(player), gate });
  if (!line) return null;
  const [resourceType, value] = line.args;
  const name = resourceNameKey(String(resourceType));
  const locked = line.key === "LOC_SR_PRODUCTION_LOCKED";
  return {
    text: Locale.compose(line.key, name, value),
    buyText: locked ? Locale.compose("LOC_SR_PRODUCTION_LOCKED_BUY", name) : null,
    short: Locale.compose(`${line.key}_SHORT`, name, value),
    unsupplied: line.key === "LOC_SR_PRODUCTION_NEEDS_NONE" || locked
  };
}

/**
 * The line's element, or null. Never throws: a failure here must not break the production list.
 * @param {string | undefined} unitType
 * @returns {HTMLElement | null}
 */
export function productionLineElement(unitType) {
  try {
    const line = describeProductionItem(unitType);
    if (!line) return null;
    const element = document.createElement("div");
    element.classList.add(...LINE_CLASSES);
    if (line.unsupplied) element.classList.add(UNSUPPLIED_CLASS);
    element.setAttribute("role", "paragraph");
    element.textContent = line.text;
    // Placed by the time this runs: the item says whether it is for purchase, and the slot's container whether the
    // item is one row or a column.
    setTimeout(() => {
      fitPurchase(element, line.buyText);
      shortenInRow(element, line.short);
    }, 0);
    return element;
  } catch (e) {
    log.warn("could not draw the production line:", e);
    return null;
  }
}

/**
 * Puts the purchase form in when the line sits on a purchase item.
 * @param {HTMLElement} element
 * @param {string | null} buyText
 */
export function fitPurchase(element, buyText) {
  try {
    if (!buyText) return;
    const item = element.closest?.("production-chooser-item, [data-is-purchase]");
    if (item?.getAttribute("data-is-purchase") === "true") element.textContent = buyText;
  } catch (e) {
    log.warn("could not fit the production line:", e);
  }
}

/**
 * Puts the short form in when the line sits in a row beside the item's name rather than under it.
 * @param {HTMLElement} element
 * @param {string} short
 */
export function shortenInRow(element, short) {
  try {
    const container = element.parentElement?.parentElement;
    if (!container || getComputedStyle(container).flexDirection !== "row") return;
    element.textContent = short;
    element.classList.add("whitespace-nowrap");
  } catch (e) {
    log.warn("could not fit the production line:", e);
  }
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

async function start() {
  try {
    const { ComponentRegistry } = /** @type {*} */ (await import("/core/ui-next/services/component-registry.js"));
    const solid = /** @type {*} */ (await import("/core/vendor/solid-js/dist/solid.js"));
    const [holdingsChanged, setHoldingsChanged] = solid.createSignal(0);
    engine.on("PlayerResourceChanged", () => setHoldingsChanged((/** @type {number} */ n) => n + 1));
    await keepWrapped(ComponentRegistry, solid, "ProductionModInfo", (previous) =>
      wrapProductionModInfo(previous, holdingsChanged, solid.mergeProps));
  } catch (e) {
    log.warn("could not add the production line:", e);
  }
}

if (typeof engine !== "undefined") start();
