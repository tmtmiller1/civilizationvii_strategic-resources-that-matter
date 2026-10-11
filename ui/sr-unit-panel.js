// Adds one line under the stats of the selected-unit panel when the unit is unsupplied, for example
// "Unsupplied: no Iron (-3 combat strength, slower to train)". The panel is the game's own; this wraps the panel
// instance's setupUnitInfo and leaves everything it draws in place. The wrapper looks up the method it wraps at
// call time, so a mod that patches the panel's prototype after this one still runs.

import { log } from "/tower-strategic-resources/ui/sr-log.js";
import {
  buildPenaltyIndex,
  buildSupplyIndex,
  computeSupplyStatus,
  countCopies
} from "/tower-strategic-resources/ui/sr-supply.js";

const LINE_CLASS = "sr-unsupplied-line";
const LINE_CLASSES = [LINE_CLASS, "font-body", "text-xs", "text-negative-light", "text-center", "mt-1", "px-2"];
const STATS_SELECTOR = ".unit-actions__stats_container";

/** @type {{ supply: Map<string, string>, penalties: Map<string, import("./sr-supply.js").Penalty> } | null} */
let indexes = null;

// The unit tags and modifier sizes are fixed for the whole game, so they are read once.
function readIndexes() {
  if (!indexes) {
    indexes = {
      supply: buildSupplyIndex(/** @type {*} */ (GameInfo.TypeTags) ?? []),
      penalties: buildPenaltyIndex(/** @type {*} */ (GameInfo.ModifierArguments) ?? [])
    };
  }
  return indexes;
}

/**
 * @param {*} player
 * @returns {{ resourceType: string | null, isOffMap: boolean }[]}
 */
function readHoldings(player) {
  const entries = player?.Resources?.getResources?.() ?? [];
  return entries.map((/** @type {*} */ entry) => ({
    resourceType: GameInfo.Resources.lookup(entry?.uniqueResource?.resource)?.ResourceType ?? null,
    isOffMap: entry?.isOffMap === true
  }));
}

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
  const { supply, penalties } = readIndexes();
  const holdings = readHoldings(owner);
  const status = computeSupplyStatus({
    unitType,
    supply,
    penalties,
    copiesOf: (resourceType) => countCopies(holdings, resourceType)
  });
  if (!status) return null;
  const resourceName = GameInfo.Resources.lookup(status.resourceType)?.Name ?? status.resourceType;
  return Locale.compose("LOC_SR_UNSUPPLIED_LINE", resourceName, status.combat);
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
    line = document.createElement("div");
    line.classList.add(...LINE_CLASSES);
    line.setAttribute("role", "paragraph");
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
