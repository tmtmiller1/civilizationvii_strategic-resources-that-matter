// Adds one stat cell to the selected-unit panel's stats row per resource the unit is short of: the resource's icon
// with the penalty in red, like the panel's own cells, and the whole sentence as the cell's tooltip, for example
// "Unsupplied: no Iron (-3 combat strength, slower to train)", with "New ones cannot be trained." under the hard gate.
// A unit short of two resources (Modern Supply Chains) gets two cells. The panel
// is the game's own; this wraps the panel instance's setupUnitInfo and leaves everything it draws in place. The
// wrapper looks up the method it wraps at call time, so a mod that patches the panel's prototype after this one
// still runs.

import { log } from "/tower-strategic-resources-that-matter/ui/sr-log.js";
import { copiesCounter, readIndexes, resourceNameKey } from "/tower-strategic-resources-that-matter/ui/sr-player-supply.js";
import { computeSupplyStatuses } from "/tower-strategic-resources-that-matter/ui/sr-supply.js";

const LINE_CLASS = "sr-unsupplied-line";
const STATS_SELECTOR = ".unit-actions__stats_container";
// The game's stats row and its cells (unit-actions.js): a divider, then an icon over a value.
const ROW_SELECTOR = ".unit-actions__unit-stats-container";
// The game's divider class is "w-0\.5" (the backslash is part of the name); the width is set outright instead.
const DIVIDER_CLASSES = ["unit-actions__stat-div", "flex", "sr-unsupplied-divider"];
const DIVIDER_WIDTH = "0.1111rem";
const CELL_CLASSES = [LINE_CLASS, "unit-info__stat-container", "pointer-events-auto", "flex", "flex-col",
  "justify-end", "items-center", "bg-no-repeat"];
const ICON_CLASSES = ["unit-info__stat-icon", "flex", "size-7", "bg-contain", "bg-no-repeat"];
const VALUE_CLASSES = ["unit-info__stat-value", "font-body-base", "self-center", "text-negative-light"];
const VALUE_COLOR = "#FF7A66";

/**
 * @typedef {object} PanelStatus
 * @property {string} text the whole sentence, the cell's tooltip
 * @property {string} resourceType
 * @property {number} combat the penalty, the cell's value
 */

/**
 * The panel cells for a unit, one per resource it is short of; empty when there is nothing to say.
 * @param {*} unit
 * @returns {PanelStatus[]}
 */
export function describeUnit(unit) {
  const owner = Players.get(unit?.owner);
  if (!owner?.isMajor) return [];
  const unitType = GameInfo.Units.lookup(unit.type)?.UnitType;
  if (!unitType) return [];
  const { supply, penalties, gate } = readIndexes();
  const statuses = computeSupplyStatuses({ unitType, supply, penalties, copiesOf: copiesCounter(owner) });
  const key = gate.on && gate.needs.has(unitType) ? "LOC_SR_UNSUPPLIED_LINE_GATED" : "LOC_SR_UNSUPPLIED_LINE";
  return statuses.map((status) => ({
    text: Locale.compose(key, resourceNameKey(status.resourceType), status.combat),
    resourceType: status.resourceType,
    combat: status.combat
  }));
}

/** @param {HTMLElement} row */
function addCell(row) {
  const divider = document.createElement("div");
  divider.classList.add(...DIVIDER_CLASSES);
  divider.style.width = DIVIDER_WIDTH;
  row.appendChild(divider);
  const cell = document.createElement("div");
  cell.classList.add(...CELL_CLASSES);
  const icon = document.createElement("div");
  icon.classList.add(...ICON_CLASSES);
  const value = document.createElement("div");
  value.classList.add(...VALUE_CLASSES);
  value.style.color = VALUE_COLOR;
  cell.appendChild(icon);
  cell.appendChild(value);
  row.appendChild(cell);
  return cell;
}

/**
 * The icon the game draws for a resource, as a CSS url; empty where the UI object is not there.
 * @param {string} resourceType
 * @returns {string}
 */
function iconUrl(resourceType) {
  const url = typeof UI !== "undefined" && typeof UI.getIconURL === "function" ? UI.getIconURL(resourceType) : "";
  return url ? `url(${url})` : "";
}

/**
 * @param {HTMLElement} cell
 * @param {PanelStatus} status
 */
function fillCell(cell, status) {
  const [icon, value] = /** @type {HTMLElement[]} */ ([...cell.children]);
  const url = iconUrl(status.resourceType);
  if (icon && url) icon.style.backgroundImage = url;
  if (value) value.textContent = String(status.combat);
  cell.setAttribute("data-tooltip-content", status.text);
}

/**
 * The mod's dividers and cells in the stats container, as many as `count` asks for, made on first use. Each cell's
 * divider is the element before it.
 * @param {HTMLElement} host
 * @param {number} count
 * @returns {{ cell: HTMLElement, divider: HTMLElement | null }[]} every cell made so far
 */
function parts(host, count) {
  const row = /** @type {HTMLElement} */ (host.querySelector(ROW_SELECTOR) ?? host);
  const all = (/** @type {string} */ className) => /** @type {HTMLElement[]} */ ([...host.querySelectorAll(`.${className}`)]);
  const cells = all(LINE_CLASS);
  while (cells.length < count) cells.push(addCell(row));
  const dividers = all("sr-unsupplied-divider");
  return cells.map((cell, i) => ({ cell, divider: dividers[i] ?? null }));
}

/** @param {HTMLElement} root @param {PanelStatus[]} statuses */
function renderLine(root, statuses) {
  const host = /** @type {HTMLElement | null} */ (root?.querySelector?.(STATS_SELECTOR));
  if (!host) return;
  const made = parts(host, statuses.length);
  made.forEach(({ cell, divider }, i) => {
    const status = statuses[i];
    if (status) showCell(host, cell, divider, status);
    for (const part of [cell, divider]) part?.classList.toggle("hidden", !status);
  });
}

/**
 * Fills the cell and puts it, with its divider, back at the end of the row: the panel rebuilds its own cells after
 * the first two on every refresh.
 * @param {HTMLElement} host
 * @param {HTMLElement} cell
 * @param {HTMLElement | null} divider
 * @param {PanelStatus} status
 */
function showCell(host, cell, divider, status) {
  fillCell(cell, status);
  const row = /** @type {HTMLElement} */ (host.querySelector(ROW_SELECTOR) ?? host);
  for (const part of [divider, cell]) if (part) row.appendChild(part);
}

/** @param {*} panel the unit-actions component */
function refreshLine(panel) {
  const unit = panel.unitId ? Units.get(panel.unitId) : null;
  renderLine(panel.Root, unit ? describeUnit(unit) : []);
}

class UnitPanelSupplyLine {
  /** @param {*} component the unit-actions panel */
  constructor(component) {
    const own = Object.prototype.hasOwnProperty.call(component, "setupUnitInfo") ? component.setupUnitInfo : null;
    if (typeof (own ?? component.setupUnitInfo) !== "function") {
      log.warn("unit-actions has no setupUnitInfo; the unsupplied line will not show");
      return;
    }
    component.setupUnitInfo = function (/** @type {unknown[]} */ ...args) {
      const original = own ?? Object.getPrototypeOf(this).setupUnitInfo;
      const result = original.apply(this, args);
      try {
        refreshLine(this);
      } catch (e) {
        log.warn("could not draw the unsupplied line:", e);
      }
      return result;
    };
  }

  beforeAttach() {}

  afterAttach() {}

  beforeDetach() {}

  afterDetach() {}

  onAttributeChanged() {}
}

if (typeof Controls !== "undefined" && typeof Controls.decorate === "function") {
  Controls.decorate("unit-actions", (/** @type {*} */ component) => new UnitPanelSupplyLine(component));
}
