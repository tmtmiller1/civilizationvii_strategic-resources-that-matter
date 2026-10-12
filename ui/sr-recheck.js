// Game-scope entry for the loss re-check (see sr-recheck-core.js for why it exists). At every turn start, and once
// when a game loads, it triggers a resource re-check for every alive major player. In a multiplayer game it does
// nothing: the call changes state on this machine only and is not a network request, so it could put players'
// games out of step. It says so once in UI.log. The lost-supply notification (sr-supply-lost.js) rides on the same
// turn start, so it is off in multiplayer too.

import { log } from "/tower-strategic-resources/ui/sr-log.js";
import {
  forceRecheckAll,
  isMultiplayerGame,
  readMajorPlayers,
  resolveRecheckHash,
  RECHECK_RESOURCE
} from "/tower-strategic-resources/ui/sr-recheck-core.js";
import { checkSupplyLost, startSupplyLost } from "/tower-strategic-resources/ui/sr-supply-lost.js";

/** @type {{ resourceHash: number | null, isOff: boolean }} */
const state = { resourceHash: null, isOff: false };

/** @param {string} why */
function recheck(why) {
  if (state.isOff || state.resourceHash == null) return;
  const players = readMajorPlayers(typeof Players === "undefined" ? undefined : Players);
  const result = forceRecheckAll(players, state.resourceHash);
  if (result.failed.length) log.warn(`re-check (${why}) failed for players ${result.failed.join(", ")}`);
  log.debug(`re-check (${why}) turn ${safeTurn()}: ${result.forced} of ${players.length} major players`);
}

function safeTurn() {
  try {
    return Game.turn;
  } catch (_) {
    return "?";
  }
}

function onTurnBegin() {
  try {
    checkSupplyLost();
  } catch (e) {
    log.warn("could not check for a lost resource:", e);
  }
  try {
    recheck("turn start");
  } catch (e) {
    log.error("re-check failed at turn start:", e);
  }
}

function start() {
  if (isMultiplayerGame(typeof Configuration === "undefined" ? undefined : Configuration)) {
    state.isOff = true;
    log.info("multiplayer game: the loss re-check is off; a lost resource brings its penalty back only after that " +
      "player next gains a resource");
    return;
  }
  state.resourceHash = resolveRecheckHash(typeof GameInfo === "undefined" ? undefined : GameInfo);
  if (state.resourceHash == null) {
    log.warn(`${RECHECK_RESOURCE} is not in this game; the loss re-check is off`);
    return;
  }
  engine.on("TurnBegin", onTurnBegin);
  try {
    startSupplyLost();
  } catch (e) {
    log.warn("could not take the first look for the lost-supply notification:", e);
  }
  recheck("game loaded");
  log.info("loss re-check on");
}

if (typeof engine !== "undefined" && engine.whenReady) {
  engine.whenReady.then(() => {
    try {
      start();
    } catch (e) {
      log.error("could not start the loss re-check:", e);
    }
  });
}
