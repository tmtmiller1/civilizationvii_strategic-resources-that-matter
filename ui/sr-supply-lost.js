// The lost-supply notification. At each turn start sr-recheck.js calls checkSupplyLost: when the local player holds
// no copy of a resource it held at the previous turn start, one notification in the train says which units the loss
// reaches and what it costs, "Supply lost: no Niter. Your Field Cannon and 3 other units fight at -3 and train slower
// until you get Niter back." The engine keeps one notification of a type at a time and drops a second, so every
// loss of one turn goes into the same one. The counts live in memory: startSupplyLost takes the first look when a
// game loads, so a load never reports a loss. sr-recheck.js is off in multiplayer, and so is this.

import { log } from "/tower-strategic-resources/ui/sr-log.js";
import { copiesCounter, readIndexes, resourceNameKey } from "/tower-strategic-resources/ui/sr-player-supply.js";
import { countGatedCopies, lostSinceLastLook } from "/tower-strategic-resources/ui/sr-recheck-core.js";
import { describeSupplyLoss } from "/tower-strategic-resources/ui/sr-supply.js";

export const NOTIFICATION_TYPE = "NOTIFICATION_SR_SUPPLY_LOST";

/** @type {Map<string, number> | null} the local player's copies at the last look */
let lastLook = null;

/** @returns {*} the local player, or null under Autoplay or before the game has one */
function localPlayer() {
  const player = Players.get(GameContext.localPlayerID);
  return player?.isMajor ? player : null;
}

/** @param {*} player @returns {Map<string, number>} */
function look(player) {
  const { penalties } = readIndexes();
  const gated = [...penalties].filter(([, p]) => p.combat !== 0 || p.productionPercent !== 0).map(([r]) => r);
  return countGatedCopies(gated, copiesCounter(player));
}

/** @param {*} player @returns {string[]} one unit type per unit */
function unitTypesOf(player) {
  /** @type {string[]} */
  const types = [];
  for (const id of player.Units?.getUnitIds?.() ?? []) {
    const type = GameInfo.Units.lookup(Units.get(id)?.type)?.UnitType;
    if (type) types.push(type);
  }
  return types;
}

/** @param {import("./sr-supply.js").SupplyLoss} loss @returns {string} */
function sentence(loss) {
  const resource = resourceNameKey(loss.resourceType);
  const unit = loss.unitType ? GameInfo.Units.lookup(loss.unitType)?.Name ?? loss.unitType : "";
  if (loss.key === "LOC_SR_NOTIFY_LOST_MANY") return Locale.compose(loss.key, resource, unit, loss.others, loss.combat);
  if (loss.key === "LOC_SR_NOTIFY_LOST_ONE") return Locale.compose(loss.key, resource, unit, loss.combat);
  return Locale.compose(loss.key, resource, loss.combat);
}

/** Takes the first look, when a game loads. */
export function startSupplyLost() {
  const player = localPlayer();
  lastLook = player ? look(player) : null;
}

/** Looks again at a turn start and raises the notification for what was lost since the last look. */
export function checkSupplyLost() {
  const player = localPlayer();
  if (!player) {
    lastLook = null;
    return;
  }
  const now = look(player);
  const lost = lastLook ? lostSinceLastLook(lastLook, now) : [];
  lastLook = now;
  if (lost.length === 0) return;
  const indexes = readIndexes();
  const units = unitTypesOf(player);
  const losses = lost.flatMap((resourceType) => describeSupplyLoss(resourceType, units, indexes) ?? []);
  if (losses.length === 0) return;
  // A key of the form "{1_First}, {2_Second}" carries the spacing: the game trims a separator key's own spaces.
  const names = losses.map((loss) => Locale.compose(resourceNameKey(loss.resourceType)));
  const message = Locale.compose("LOC_SR_NOTIFY_LOST_MESSAGE",
    names.reduce((first, second) => Locale.compose("LOC_SR_LIST_PAIR", first, second)));
  const summary = losses.map(sentence).join(" ");
  Game.Notifications.send({ Type: Game.getHash(NOTIFICATION_TYPE), Message: message, Summary: summary }, player.id);
  log.info(`supply lost, turn ${Game.turn}: ${losses.map((loss) => loss.resourceType).join(", ")}`);
}
