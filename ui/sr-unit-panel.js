// Adds one line under the stats of the selected-unit panel when the unit is unsupplied, for example "Unsupplied: no
// Iron (-3 combat strength, slower to train)", with "New ones cannot be trained." under the hard gate. The panel is the
// game's own; this wraps the panel instance's setupUnitInfo and leaves everything it draws in place. The wrapper looks
// up the method it wraps at call time, so a mod that patches the panel's prototype after this one still runs.

import { log } from "/tower-strategic-resources-that-matter/ui/sr-log.js";
import { copiesCounter, readIndexes, resourceNameKey } from "/tower-strategic-resources-that-matter/ui/sr-player-supply.js";
import { computeSupplyStatus } from "/tower-strategic-resources-that-matter/ui/sr-supply.js";
import { statusPill } from "/tower-strategic-resources-that-matter/ui/sr-pill.js";

const LINE_CLASS = "sr-unsupplied-line";
const LINE_CLASSES = [LINE_CLASS, "self-center"];
const STATS_SELECTOR = ".unit-actions__stats_container";

/**
 * The panel line for a unit, or null when there is nothing to say.
 * @param {*} unit
 * @returns {string | null}
 */
export function describeUnit(unit) {
  const owner = Players.get(unit?.owner);
  if (!owner?.isMajor) return null;
  const unitType = GameInfo.Units.lookup(unit.type)?.UnitType;
  if (!unitType) return null;
  const { supply, penalties, gate } = readIndexes();
  const status = computeSupplyStatus({ unitType, supply, penalties, copiesOf: copiesCounter(owner) });
  if (!status) return null;
  const key = gate.on && gate.columns.has(unitType) ? "LOC_SR_UNSUPPLIED_LINE_GATED" : "LOC_SR_UNSUPPLIED_LINE";
  return Locale.compose(key, resourceNameKey(status.resourceType), status.combat);
}

/**
 * Shows, updates or hides the line in the panel's root.
 * @param {HTMLElement} root
 * @param {string | null} text
 */
function renderLine(root, text) {
  const host = root?.querySelector?.(STATS_SELECTOR);
  if (!host) return;
  let line = /** @type {HTMLElement | null} */ (host.querySelector(`.${LINE_CLASS}`));
  if (!text) {
    line?.classList.add("hidden");
    return;
  }
  if (!line) {
    line = statusPill(text, { warning: true, compact: true });
    if (!line) return;
    line.classList.add(...LINE_CLASSES);
    host.appendChild(line);
  }
  line.textContent = text;
  line.classList.remove("hidden");
}

/** @param {*} panel the unit-actions component */
function refreshLine(panel) {
  const unit = panel.unitId ? Units.get(panel.unitId) : null;
  renderLine(panel.Root, unit ? describeUnit(unit) : null);
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
