// The first-time callout. The first time the local player selects one of its own units while it is unsupplied, the
// game's tutorial callout says what that means in two sentences, with the game's "Tell me more" button opening the
// mod's Civilopedia page. It goes through the game's tutorial manager at the advisor-warning level, so it shows
// when the player has tutorials or advisor warnings on and never when both are off, and never in multiplayer (the
// manager drops every item there).
//
// The manager keeps an item's state in the save, so on its own the callout would come back in every new game and
// every age. A flag in the profile's storage, written when the callout shows, keeps it to once per profile; the
// Tower Settings Keeper this mod ships is what lets a mod read its own key back.

import TutorialManager from "/base-standard/ui/tutorial/tutorial-manager.js";
import { log } from "/tower-strategic-resources-that-matter/ui/sr-log.js";
import { copiesCounter, readIndexes, resourceNameKey } from "/tower-strategic-resources-that-matter/ui/sr-player-supply.js";
import { computeSupplyStatus } from "/tower-strategic-resources-that-matter/ui/sr-supply.js";

export const CALLOUT_ID = "tower_sr_unsupplied_first";
export const SEEN_KEY = "tower-strategic-resources-that-matter.unsuppliedCalloutSeen";
const PEDIA_TITLE = "LOC_PEDIA_CONCEPTS_PAGE_SR_STRATEGIC_RESOURCES_TITLE";
// The game's TutorialLevel.WarningsOnly and TutorialAnchorPosition.MiddleRight.
const WARNINGS_LEVEL = 2;
const ANCHOR = "middle-right";

/** @type {string[]} the body's arguments, read when the callout is allowed to show */
let bodyParams = [];

/** @returns {boolean} */
export function hasSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch (_) {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
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

try {
  TutorialManager.add(calloutItem);
  TutorialManager.process("tower strategic resources items");
} catch (e) {
  log.warn("could not add the first-time callout:", e);
}
