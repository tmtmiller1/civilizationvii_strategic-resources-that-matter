// Makes the commander's "Upgrade All Units" answer for the units in the army under the hard gate. The engine's own
// check for UNITCOMMAND_UPGRADE_ARMY ignores Units.StrategicResource and the grant-only lines: with Gated Units on,
// it says "Upgrade 1 units: 120 Gold" for an army whose only Warrior cannot become a Spearman for want of Iron, and
// the button is lit. Pressing it does nothing, since the engine refuses each unit's upgrade when it runs the command
// (watched: verification-runs.md, a1-army-upgrade). This wraps Game.UnitCommands.canStart for that command on the
// local player's commanders: each packed unit whose next unit the gate locks is asked for its own upgrade (the
// engine's per-unit check, which does read the resource), and when no packed unit can go, the army's answer becomes a
// refusal carrying one line per locked unit, so the button greys and the tooltip says why. When some can and some
// can't, the answer stays a success and gains the same lines as warnings, so the player knows which units stay.

import { log } from "/tower-strategic-resources-that-matter/ui/sr-log.js";
import { hasUnlocked, lineUnitsFor, playerTraits } from "/tower-strategic-resources-that-matter/ui/sr-production-lock.js";
import { copiesCounter, readIndexes, resourceNameKey } from "/tower-strategic-resources-that-matter/ui/sr-player-supply.js";
import { lockedBy } from "/tower-strategic-resources-that-matter/ui/sr-supply.js";

export const ARMY_COMMAND = "UNITCOMMAND_UPGRADE_ARMY";
export const UNIT_COMMAND = "UNITCOMMAND_UPGRADE";
export const LOCKED_LINE = "LOC_SR_ARMY_UPGRADE_LOCKED";

/**
 * The resource a unit's next unit is locked behind for its owner, or null. Only a next unit whose tech or civic the
 * owner knows counts: without it the unit couldn't upgrade anyway, and the line would blame the resource. Under
 * "Training and upgrade" every gated next unit counts; under "Training" only a grant-only one (the engine won't
 * upgrade into a unit the player can't build), which is what the line files make of the gated units a free unit
 * upgrades into.
 * @param {string} unitType
 * @param {{ upgrades: Iterable<{ Unit?: string, UpgradeUnit?: string }>, gate: import("./sr-supply.js").Gate,
 *   lineUnits: Set<string>, copiesOf: (resourceType: string) => number,
 *   unlocked: (unitType: string) => boolean }} deps
 * @returns {{ target: string, resource: string } | null}
 */
export function lockedUpgrade(unitType, { upgrades, gate, lineUnits, copiesOf, unlocked }) {
  if (!gate.on) return null;
  for (const row of upgrades) {
    if (row?.Unit !== unitType || !row.UpgradeUnit || !unlocked(row.UpgradeUnit)) continue;
    if (!gate.upgrade && !lineUnits.has(row.UpgradeUnit)) continue;
    const resource = lockedBy(row.UpgradeUnit, gate, copiesOf);
    if (resource) return { target: row.UpgradeUnit, resource };
  }
  return null;
}

/**
 * @typedef {object} PackedUnit
 * @property {string} unitType
 * @property {{ target: string, resource: string } | null} locked what the gate locks its next unit behind
 * @property {*} own the engine's answer for the unit's own upgrade command
 */

/**
 * The army command's answer, with the locked units' lines: a refusal when no packed unit can upgrade on its own,
 * otherwise the engine's success with the lines as warnings. Pure: the engine's answers come in as arguments.
 * @param {*} result the engine's answer for the army command
 * @param {PackedUnit[]} packed
 * @param {(unitType: string, resource: string) => string} line the composed sentence for one locked unit
 * @returns {*}
 */
export function describeArmyUpgrade(result, packed, line) {
  if (!result?.Success) return result;
  const lockedUnits = packed.filter((u) => u.locked && !u.own?.Success);
  if (lockedUnits.length === 0) return result;
  /** @type {string[]} */
  const lines = [];
  const seen = new Set();
  for (const u of lockedUnits) {
    const key = `${u.unitType}:${/** @type {*} */ (u.locked).resource}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(line(u.unitType, /** @type {*} */ (u.locked).resource));
  }
  if (packed.some((u) => u.own?.Success)) {
    return { ...result, AdditionalDescription: [...(result.AdditionalDescription ?? []), ...lines] };
  }
  const { AdditionalDescription, ...rest } = result;
  void AdditionalDescription;
  return { ...rest, Success: false, FailureReasons: lines };
}

/** @type {Set<string> | null} */
let lineUnitsCache = null;

/**
 * The packed units of a commander with their own upgrade answers, read through the engine.
 * @param {*} commander
 * @param {(unitId: *, commandType: string, args: *, exclusion: boolean) => *} canStart the engine's own
 * @param {*} args @param {boolean} exclusion
 * @returns {PackedUnit[]}
 */
function readPacked(commander, canStart, args, exclusion) {
  const army = Armies.get(commander.armyId);
  if (!army) return [];
  const player = Players.get(commander.owner);
  const { gate } = readIndexes();
  const copiesOf = copiesCounter(player);
  lineUnitsCache ??= new Set(lineUnitsFor(/** @type {*} */ (GameInfo.RequirementSetRequirements) ?? [],
    playerTraits()));
  const playerId = commander.owner;
  const facts = {
    unlocks: /** @type {*} */ (GameInfo.ProgressionTreeNodeUnlocks) ?? [],
    nodeState: (/** @type {string} */ nodeType) => {
      const node = GameInfo.ProgressionTreeNodes.lookup(nodeType);
      return node ? Number(Game.ProgressionTrees.getNodeState(playerId, node.$hash)) : 0;
    }
  };
  const deps = {
    upgrades: /** @type {*} */ (GameInfo.UnitUpgrades) ?? [], gate, lineUnits: lineUnitsCache, copiesOf,
    unlocked: (/** @type {string} */ unitType) => hasUnlocked(unitType, /** @type {*} */ (facts))
  };
  /** @type {PackedUnit[]} */
  const packed = [];
  for (const id of army.getUnitIds()) {
    const unitType = GameInfo.Units.lookup(Units.get(id)?.type)?.UnitType;
    if (!unitType) continue;
    const locked = lockedUpgrade(unitType, deps);
    packed.push({ unitType, locked, own: canStart(id, UNIT_COMMAND, args, exclusion) });
  }
  return packed;
}

/** @param {string} unitType @param {string} resource */
function lockedLine(unitType, resource) {
  const unit = GameInfo.Units.lookup(unitType);
  return Locale.compose(LOCKED_LINE, unit?.Name ?? unitType, resourceNameKey(resource));
}

/**
 * @param {Function} original Game.UnitCommands.canStart
 * @returns {Function}
 */
export function wrapCanStart(original) {
  return /** @this {*} */ function (/** @type {*} */ unitId, /** @type {*} */ commandType, /** @type {*} */ args,
    /** @type {boolean} */ exclusion) {
    const result = original.apply(this, arguments);
    try {
      // The exclusion pass asks whether the command applies at all; only the enabled pass is rewritten.
      if (commandType !== ARMY_COMMAND || exclusion || !result?.Success) return result;
      const unit = Units.get(unitId);
      if (!unit?.isCommanderUnit || unit.owner !== GameContext.localPlayerID) return result;
      if (!readIndexes().gate.on) return result;
      const canStart = (/** @type {*} */ id, /** @type {string} */ type, /** @type {*} */ a,
        /** @type {boolean} */ x) => original.call(this, id, type, a, x);
      return describeArmyUpgrade(result, readPacked(unit, canStart, args, exclusion), lockedLine);
    } catch (e) {
      log.warn("could not read the army's upgrades:", e);
      return result;
    }
  };
}

const WRAPPED = "__strategicResourcesArmyWrapped";

function start() {
  const api = /** @type {*} */ (Game.UnitCommands);
  if (!api || typeof api.canStart !== "function" || api.canStart[WRAPPED]) return;
  const wrapped = wrapCanStart(api.canStart);
  /** @type {*} */ (wrapped)[WRAPPED] = true;
  api.canStart = wrapped;
}

if (typeof engine !== "undefined" && engine.whenReady) {
  engine.whenReady.then(() => {
    try {
      start();
    } catch (e) {
      log.warn("could not wrap the army upgrade check:", e);
    }
  });
}
