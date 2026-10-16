// Keeps a unit the hard gate locks in the production and purchase lists, greyed, so the player sees what a copy
// would unlock. The engine's unit query answers a bare failure (no reason, no requirements) for a unit whose
// StrategicResource the player holds none of, and the game's chooser drops such an entry unless the hidden view is
// on. This wraps Game.CityOperations.canStartQuery and Game.CityCommands.canStartQuery for the local player's
// cities and rewrites that one entry into the shape the chooser keeps and greys: a failure with one reason (empty,
// so the game's own red line stays off; the mod's slot line carries the sentence), marked as short of funds, which is
// the one failure the list keeps. Activating the item goes through the engine's own check, which still refuses it.
// A unit the player could not train anyway (its tech or civic not known, obsolete, or never trainable) is left out,
// as the engine leaves it out, by the same rows the tech tree reads.
// The units the gate makes grant-only (data/sr-<age>-gate-lines.sql: the Bombard, the Spearman, a civilization's
// later tiers) aren't in the engine's answer at all without the resource, so they're added back the same way, for
// the players the grant would reach once they have a copy (its SR_LINE_IS_ and SR_LINE_NOT_ trait requirements).

import { log } from "/tower-strategic-resources-that-matter/ui/sr-log.js";
import { copiesCounter, readIndexes } from "/tower-strategic-resources-that-matter/ui/sr-player-supply.js";
import { lockedBy } from "/tower-strategic-resources-that-matter/ui/sr-supply.js";

/** The game's ProgressionTreeNodeState values the check needs. */
const NODE_UNLOCKED = 4;
const NODE_FULLY_UNLOCKED = 5;

/**
 * @typedef {object} TrainingFacts
 * @property {Iterable<{ TargetType?: string, TargetKind?: string, ProgressionTreeNodeType?: string,
 *   UnlockDepth?: number }>} unlocks
 *   ProgressionTreeNodeUnlocks rows
 * @property {Iterable<{ Unit?: string, UpgradeUnit?: string }>} upgrades UnitUpgrades rows
 * @property {(nodeType: string) => number} nodeState the player's state of a node (ProgressionTreeNodeState)
 * @property {(unitType: string) => boolean} canTrain the unit's CanTrain flag
 */

/**
 * Whether the player has unlocked everything that unlocks a unit: every node that lists it, to the depth it asks.
 * A unit no node unlocks is available from the start.
 * @param {string} unitType
 * @param {TrainingFacts} facts
 * @returns {boolean}
 */
export function hasUnlocked(unitType, facts) {
  for (const row of facts.unlocks) {
    if (row?.TargetType !== unitType || (row.TargetKind && row.TargetKind !== "KIND_UNIT")) continue;
    if (!row.ProgressionTreeNodeType) continue;
    const needed = (row.UnlockDepth ?? 1) >= 2 ? NODE_FULLY_UNLOCKED : NODE_UNLOCKED;
    if (facts.nodeState(row.ProgressionTreeNodeType) < needed) return false;
  }
  return true;
}

/**
 * Whether a unit would be in the player's list but for the gate: trainable at all, its unlocks known, and not
 * obsolete (the engine retires a unit once a unit it upgrades into is unlocked).
 * @param {string} unitType
 * @param {TrainingFacts} facts
 * @returns {boolean}
 */
export function couldTrainButForGate(unitType, facts) {
  if (!facts.canTrain(unitType) || !hasUnlocked(unitType, facts)) return false;
  for (const row of facts.upgrades) {
    if (row?.Unit === unitType && row.UpgradeUnit && facts.canTrain(row.UpgradeUnit) !== false
      && hasUnlocked(row.UpgradeUnit, facts)) return false;
  }
  return true;
}

/**
 * A query result the chooser keeps and greys: not a success, one (empty) reason, short of funds.
 * @returns {{ Success: false, InsufficientFunds: true, FailureReasons: string[],
 *   Requirements: { MeetsRequirements: false } }}
 */
export function lockedResult() {
  return { Success: false, InsufficientFunds: true, FailureReasons: [""], Requirements: { MeetsRequirements: false } };
}

/**
 * Whether a query entry is the engine's bare refusal: not a success, with no reason and no requirements.
 * @param {*} result
 */
export const isBareRefusal = (result) =>
  Boolean(result) && !result.Success && !result.FailureReasons && !result.Requirements && !result.InsufficientFunds;

/**
 * Rewrites, in place, the bare refusals of locked units the player could otherwise train. Pure: the entries, the
 * lookups and the facts come in as arguments.
 * @param {{ index: number, result: * }[]} entries
 * @param {{ unitTypeOf: (index: number) => string | undefined, locked: (unitType: string) => string | null,
 *   facts: TrainingFacts }} deps
 * @returns {string[]} the unit types rewritten
 */
export function keepLockedEntries(entries, { unitTypeOf, locked, facts }) {
  /** @type {string[]} */
  const kept = [];
  for (const entry of entries) {
    if (!entry || !isBareRefusal(entry.result)) continue;
    const unitType = unitTypeOf(entry.index);
    if (!unitType || !locked(unitType) || !couldTrainButForGate(unitType, facts)) continue;
    entry.result = lockedResult();
    kept.push(unitType);
  }
  return kept;
}

/**
 * Adds a greyed entry for each grant-only unit the query left out that the player could otherwise train and is
 * locked out of. Pure, like keepLockedEntries.
 * @param {{ index: number, result: * }[]} entries
 * @param {{ lineUnits: string[], indexOf: (unitType: string) => number | undefined,
 *   unitTypeOf: (index: number) => string | undefined, locked: (unitType: string) => string | null,
 *   facts: TrainingFacts }} deps
 * @returns {string[]} the unit types added
 */
export function addLockedLines(entries, { lineUnits, indexOf, unitTypeOf, locked, facts }) {
  const present = new Set(entries.map((e) => e && unitTypeOf(e.index)));
  /** @type {string[]} */
  const added = [];
  for (const unitType of lineUnits) {
    const index = indexOf(unitType);
    if (index === undefined || present.has(unitType) || !locked(unitType)) continue;
    if (!couldTrainButForGate(unitType, facts)) continue;
    entries.push({ index, result: lockedResult() });
    added.push(unitType);
  }
  return added;
}

/**
 * The grant-only units a player would get with the resource: each grant's requirement set names the traits it asks
 * for (SR_LINE_IS_<trait>) and the ones it turns away (SR_LINE_NOT_<trait>).
 * @param {Iterable<{ RequirementSetId?: string, RequirementId?: string }>} setRows RequirementSetRequirements rows
 * @param {Set<string>} traits the player's civilization and leader traits
 * @returns {string[]}
 */
export function lineUnitsFor(setRows, traits) {
  /** @type {Map<string, string[]>} */
  const byUnit = new Map();
  for (const row of setRows) {
    const unit = row?.RequirementSetId?.startsWith("SR_LINE_REQS_") ? row.RequirementSetId.slice(13) : null;
    if (unit && row.RequirementId) byUnit.set(unit, [...(byUnit.get(unit) ?? []), row.RequirementId]);
  }
  const allows = (/** @type {string} */ r) => r.startsWith("SR_LINE_IS_") ? traits.has(r.slice(11))
    : r.startsWith("SR_LINE_NOT_") ? !traits.has(r.slice(12)) : true;
  return [...byUnit].filter(([, reqs]) => reqs.every(allows)).map(([unit]) => unit).sort();
}

/**
 * The traits a table gives one civilization or leader.
 * @param {*} rows CivilizationTraits or LeaderTraits
 * @param {string} column @param {string | undefined} type
 */
const traitsOf = (rows, column, type) => [...(rows ?? [])].filter((r) => r[column] === type).map((r) => r.TraitType);

/** @returns {Set<string>} the local player's civilization and leader traits */
function playerTraits() {
  const player = Players.get(GameContext.localPlayerID);
  const civ = GameInfo.Civilizations?.lookup(player?.civilizationType ?? -1)?.CivilizationType;
  const leader = GameInfo.Leaders?.lookup(player?.leaderType ?? -1)?.LeaderType;
  return new Set([...traitsOf(GameInfo.CivilizationTraits, "CivilizationType", civ),
    ...traitsOf(GameInfo.LeaderTraits, "LeaderType", leader)]);
}

/** @type {string[] | null} */
let lineUnitsCache = null;

/** @returns {TrainingFacts} the live rows and the local player's node states */
function liveFacts() {
  const playerId = GameContext.localPlayerID;
  return {
    unlocks: /** @type {*} */ (GameInfo.ProgressionTreeNodeUnlocks) ?? [],
    upgrades: /** @type {*} */ (GameInfo.UnitUpgrades) ?? [],
    nodeState: (nodeType) => {
      const node = GameInfo.ProgressionTreeNodes.lookup(nodeType);
      return node ? Number(Game.ProgressionTrees.getNodeState(playerId, node.$hash)) : 0;
    },
    canTrain: (unitType) => GameInfo.Units.lookup(unitType)?.CanTrain !== false
  };
}

/**
 * @param {Function} original
 * @param {(cityId: *, queryType: *) => boolean} applies
 */
function wrapQuery(original, applies) {
  return /** @this {*} */ function (/** @type {*} */ cityId, /** @type {*} */ operation, /** @type {*} */ queryType) {
    const entries = original.apply(this, arguments);
    try {
      if (!applies(cityId, queryType)) return entries;
      const player = Players.get(GameContext.localPlayerID);
      const { gate } = readIndexes();
      if (!player?.isMajor || gate.columns.size === 0) return entries;
      const copiesOf = copiesCounter(player);
      const unitTypeOf = (/** @type {number} */ index) => GameInfo.Units.lookup(index)?.UnitType;
      const locked = (/** @type {string} */ unitType) => lockedBy(unitType, gate, copiesOf);
      const facts = liveFacts();
      keepLockedEntries(entries, { unitTypeOf, locked, facts });
      lineUnitsCache ??= lineUnitsFor(/** @type {*} */ (GameInfo.RequirementSetRequirements) ?? [], playerTraits());
      addLockedLines(entries, {
        lineUnits: lineUnitsCache, indexOf: (unitType) => GameInfo.Units.lookup(unitType)?.$index, unitTypeOf, locked,
        facts
      });
    } catch (e) {
      log.warn("could not keep the locked units listed:", e);
    }
    return entries;
  };
}

const WRAPPED = "__strategicResourcesLockWrapped";

function start() {
  const applies = (/** @type {*} */ cityId, /** @type {*} */ queryType) =>
    cityId?.owner === GameContext.localPlayerID && queryType === CityQueryType.Unit;
  for (const api of [Game.CityOperations, Game.CityCommands]) {
    if (!api || typeof api.canStartQuery !== "function" || api.canStartQuery[WRAPPED]) continue;
    const wrapped = wrapQuery(api.canStartQuery, applies);
    /** @type {*} */ (wrapped)[WRAPPED] = true;
    api.canStartQuery = wrapped;
  }
}

if (typeof engine !== "undefined" && engine.whenReady) {
  engine.whenReady.then(() => {
    try {
      start();
    } catch (e) {
      log.warn("could not keep the locked units listed:", e);
    }
  });
}
