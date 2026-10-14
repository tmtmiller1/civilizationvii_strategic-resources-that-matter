// The first-time callouts. The first time the local player selects one of its own units while it is unsupplied, the
// game's tutorial callout says what that means in two sentences, with the game's "Tell me more" button opening the
// mod's Civilopedia page. Under the hard gate a second callout, with its own once-per-profile flag, explains the lock
// the first time the player selects a unit of a locked kind or a city whose production list shows a locked unit.
// Both go through the game's tutorial manager at the advisor-warning level, so they show
// when the player has tutorials or advisor warnings on and never when both are off, and never in multiplayer (the
// manager drops every item there).
//
// The manager keeps an item's state in the save, so on its own the callout would come back in every new game and
// every age. A flag in the profile's storage, written when the callout shows, keeps it to once per profile; the
// Tower Settings Keeper this mod ships is what lets a mod read its own key back.

import TutorialManager from "/base-standard/ui/tutorial/tutorial-manager.js";
import { log } from "/tower-strategic-resources-that-matter/ui/sr-log.js";
import { copiesCounter, readIndexes, resourceNameKey } from "/tower-strategic-resources-that-matter/ui/sr-player-supply.js";
import { computeSupplyStatus, lockedBy } from "/tower-strategic-resources-that-matter/ui/sr-supply.js";

export const CALLOUT_ID = "tower_sr_unsupplied_first";
export const SEEN_KEY = "tower-strategic-resources-that-matter.unsuppliedCalloutSeen";
export const GATE_CALLOUT_ID = "tower_sr_locked_first";
export const GATE_SEEN_KEY = "tower-strategic-resources-that-matter.lockedCalloutSeen";
const PEDIA_TITLE = "LOC_PEDIA_CONCEPTS_PAGE_SR_STRATEGIC_RESOURCES_TITLE";
// The game's TutorialLevel.WarningsOnly and TutorialAnchorPosition.MiddleRight.
const WARNINGS_LEVEL = 2;
const ANCHOR = "middle-right";

/** @type {string[]} the body's arguments, read when the callout is allowed to show */
let bodyParams = [];
/** @type {string[]} the gate callout's arguments */
let gateParams = [];

/** @param {string} [key] @returns {boolean} */
export function hasSeen(key = SEEN_KEY) {
  try {
    return localStorage.getItem(key) === "1";
  } catch (_) {
    return false;
  }
}

function markSeen(/** @type {string} */ key = SEEN_KEY) {
  try {
    localStorage.setItem(key, "1");
  } catch (e) {
    log.warn("could not keep the callout's seen flag:", e);
  }
}

/**
 * The selected unit's name, resource and penalty when it is the local player's and unsupplied, else null.
 * @returns {string[] | null}
 */
export function selectedUnsupplied() {
  // A deselection raises the same event with nothing selected; the engine logs a script error for Units.get(null).
  const unitId = UI.Player.getHeadSelectedUnit();
  if (!unitId) return null;
  const unit = Units.get(unitId);
  if (!unit || unit.owner !== GameContext.localPlayerID) return null;
  const owner = Players.get(unit.owner);
  const unitInfo = GameInfo.Units.lookup(unit.type);
  if (!owner?.isMajor || !unitInfo) return null;
  const { supply, penalties } = readIndexes();
  const copiesOf = copiesCounter(owner);
  const status = computeSupplyStatus({ unitType: unitInfo.UnitType, supply, penalties, copiesOf });
  if (!status) return null;
  return [Locale.compose(unitInfo.Name), Locale.compose(resourceNameKey(status.resourceType)), String(status.combat)];
}

function selectedOwnUnitType() {
  const unitId = UI.Player.getHeadSelectedUnit();
  const unit = unitId ? Units.get(unitId) : null;
  if (!unit || unit.owner !== GameContext.localPlayerID) return undefined;
  return GameInfo.Units.lookup(unit.type)?.UnitType;
}

/**
 * The unit types the selected city of the local player's lists as locked: the kept entries of
 * sr-production-lock.js, which the query answers with one empty reason.
 * @returns {string[]}
 */
function selectedCityLockedTypes() {
  const cityId = UI.Player.getHeadSelectedCity?.();
  if (!cityId || cityId.owner !== GameContext.localPlayerID) return [];
  const entries = Game.CityOperations.canStartQuery(cityId, CityOperationTypes.BUILD, CityQueryType.Unit) ?? [];
  const types = [];
  for (const entry of entries) {
    const unitType = isKeptLocked(entry) ? GameInfo.Units.lookup(entry.index)?.UnitType : undefined;
    if (unitType) types.push(unitType);
  }
  return types;
}

/**
 * Whether a query entry is one sr-production-lock.js kept: a refusal with exactly one empty reason.
 * @param {*} entry
 * @returns {boolean}
 */
function isKeptLocked(entry) {
  const reasons = entry?.result?.FailureReasons;
  return Array.isArray(reasons) && reasons.length === 1 && reasons[0] === "";
}

/**
 * The locked unit the player is looking at, as the gate callout's arguments: the selected unit of the local
 * player's whose kind is locked, else the first locked unit in the selected city's list; null when there is none.
 * @returns {string[] | null}
 */
export function selectedLocked() {
  const player = Players.get(GameContext.localPlayerID);
  if (!player?.isMajor) return null;
  const { gate } = readIndexes();
  if (!gate.on) return null;
  const copiesOf = copiesCounter(player);
  const unitType = selectedOwnUnitType();
  const candidates = unitType ? [unitType, ...selectedCityLockedTypes()] : selectedCityLockedTypes();
  for (const candidate of candidates) {
    const resource = lockedBy(candidate, gate, copiesOf);
    if (resource) {
      const unitName = GameInfo.Units.lookup(candidate)?.Name ?? candidate;
      return [Locale.compose(unitName), Locale.compose(resourceNameKey(resource))];
    }
  }
  return null;
}

/** The item, in the shape the game's own tutorial files give TutorialManager.add. */
export const calloutItem = {
  ID: CALLOUT_ID,
  level: WARNINGS_LEVEL,
  callout: {
    anchorPosition: ANCHOR,
    title: "LOC_SR_CALLOUT_TITLE",
    body: { text: "LOC_SR_CALLOUT_BODY", getLocParams: () => bodyParams },
    option1: { callback: () => {}, text: "LOC_TUTORIAL_CALLOUT_CLOSE", actionKey: "inline-cancel", closes: true },
    option2: {
      callback: () => engine.trigger("open-civilopedia", Locale.compose(PEDIA_TITLE)),
      text: "LOC_TUTORIAL_CIVILOPEDIA_TELL_ME_MORE",
      actionKey: "inline-accept",
      closes: true
    }
  },
  activationEngineEvents: ["UnitSelectionChanged"],
  onActivateCheck: () => {
    if (hasSeen()) return false;
    try {
      const params = selectedUnsupplied();
      if (params) bodyParams = params;
      return params != null;
    } catch (e) {
      log.warn("could not read the selected unit for the callout:", e);
      return false;
    }
  },
  // Runs only when the manager is about to show the callout, past its level check.
  onActivate: () => markSeen()
};

/** The gate's item: the same shape, its own flag, raised by a unit or a city selection. */
export const gateCalloutItem = {
  ID: GATE_CALLOUT_ID,
  level: WARNINGS_LEVEL,
  callout: {
    anchorPosition: ANCHOR,
    title: "LOC_SR_CALLOUT_GATE_TITLE",
    body: {
      get text() {
        return readIndexes().gate.upgrade ? "LOC_SR_CALLOUT_GATE_BODY_UPGRADE" : "LOC_SR_CALLOUT_GATE_BODY";
      },
      getLocParams: () => gateParams
    },
    option1: { callback: () => {}, text: "LOC_TUTORIAL_CALLOUT_CLOSE", actionKey: "inline-cancel", closes: true },
    option2: {
      callback: () => engine.trigger("open-civilopedia", Locale.compose(PEDIA_TITLE)),
      text: "LOC_TUTORIAL_CIVILOPEDIA_TELL_ME_MORE",
      actionKey: "inline-accept",
      closes: true
    }
  },
  activationEngineEvents: ["UnitSelectionChanged", "CitySelectionChanged"],
  onActivateCheck: () => {
    if (hasSeen(GATE_SEEN_KEY)) return false;
    try {
      const params = selectedLocked();
      if (params) gateParams = params;
      return params != null;
    } catch (e) {
      log.warn("could not read the selection for the gate callout:", e);
      return false;
    }
  },
  onActivate: () => markSeen(GATE_SEEN_KEY)
};

try {
  TutorialManager.add(calloutItem);
  TutorialManager.add(gateCalloutItem);
  TutorialManager.process("tower strategic resources items");
} catch (e) {
  log.warn("could not add the first-time callout:", e);
}
