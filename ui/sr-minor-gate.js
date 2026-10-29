// Game-scope entry for the minor gate (see sr-minor-gate-core.js for the rule and why it's a script). At the start of
// the local player's turn, and once when a game loads, it notes which unit types each major has fielded, then swaps
// every minor unit the gate still holds back for its replacement. Only under the locked values; off in multiplayer,
// where a swap sent from one machine would put the players' games out of step.

import { log } from "/tower-strategic-resources-that-matter/ui/sr-log.js";
import { readIndexes } from "/tower-strategic-resources-that-matter/ui/sr-player-supply.js";
import { isMultiplayerGame } from "/tower-strategic-resources-that-matter/ui/sr-recheck-core.js";
import {
  buildReplacementTable, buildReplacesIndex, buildTagIndex, keptAfterScan, parseFielded, parseKept, serializeFielded,
  unitsToSwap, unlockedBy
} from "/tower-strategic-resources-that-matter/ui/sr-minor-gate-core.js";

// The fielded list lives in each major's Tutorial property bag, which the save keeps and the age change clears
// (engine-closed.md); a reload can come back empty, so every scan also adds the units each major has now.
const FIELDED_KEY = "SrMinorGateFielded";
// The minor units the gate let stay, in the local player's bag: a unit kept once stays, whoever becomes suzerain later.
const KEPT_KEY = "SrMinorGateKept";
// A destroy and a create on the same plot in one breath can meet the old unit still standing (writes land late).
const CREATE_DELAY_MS = 1200;

/** @type {{ on: boolean, needs: Map<string, string[]>, replacement: Map<string, string | null>,
 *   replaces: Map<string, string>, fielded: Map<number, Set<string>>, kept: Set<string> | null }} */
const state = {
  on: false, needs: new Map(), replacement: new Map(), replaces: new Map(), fielded: new Map(), kept: null
};

/** @template T @param {() => T} f @param {T} fallback @returns {T} */
function safe(f, fallback) {
  try {
    return f() ?? fallback;
  } catch (_) {
    return fallback;
  }
}

/** @param {*} unit @returns {string} */
const unitTypeOf = (unit) => safe(() => GameInfo.Units.lookup(unit.type)?.UnitType ?? "", "");

/** @param {*} player @returns {Set<string>} */
function readStoredFielded(player) {
  return parseFielded(safe(() => player.Tutorial.getProperty(FIELDED_KEY), ""));
}

/** @param {*} player @param {Set<string>} fielded */
function storeFielded(player, fielded) {
  safe(() => player.Tutorial.setProperty(FIELDED_KEY, serializeFielded(fielded)), null);
}

/** Adds each alive major's current unit types to its fielded list, and stores any list that grew. */
function noteFielded() {
  for (const player of safe(() => Players.getAlive(), [])) {
    if (!player?.isMajor) continue;
    const known = state.fielded.get(player.id) ?? readStoredFielded(player);
    const before = known.size;
    for (const unit of safe(() => player.Units.getUnits(), [])) {
      const type = unitTypeOf(unit);
      if (type) known.add(type);
    }
    state.fielded.set(player.id, known);
    if (known.size !== before) storeFielded(player, known);
  }
}

/** @returns {import("./sr-minor-gate-core.js").MinorUnit[]} */
function readMinorUnits() {
  const out = [];
  for (const player of safe(() => Players.getAlive(), [])) {
    if (!player || player.isMajor) continue;
    for (const unit of safe(() => player.Units.getUnits(), [])) {
      const id = safe(() => unit.id.id, -1);
      const type = unitTypeOf(unit);
      if (id < 0 || !type) continue;
      const l = safe(() => unit.location, null);
      out.push({ owner: player.id, id, type, location: l && typeof l.x === "number" ? { x: l.x, y: l.y } : null });
    }
  }
  return out;
}

/** @param {number} owner @returns {number} */
const suzerainOf = (owner) => safe(() => {
  const influence = Players.get(owner).Influence;
  return influence.hasSuzerain ? influence.getSuzerain() : -1;
}, -1);

/** @returns {*} */
const localPlayer = () => safe(() => Players.get(GameContext.localPlayerID), null);

/** The kept list, read from the save the first time it's needed. @returns {Set<string>} */
function kept() {
  if (!state.kept) state.kept = parseKept(safe(() => localPlayer().Tutorial.getProperty(KEPT_KEY), ""));
  return state.kept;
}

/** @param {Set<string>} next */
function storeKept(next) {
  const before = [...kept()].sort().join(",");
  const after = [...next].sort().join(",");
  state.kept = next;
  if (after !== before) safe(() => localPlayer().Tutorial.setProperty(KEPT_KEY, after), null);
}

/** @param {string} kind @param {object} args @returns {boolean} */
function request(kind, args) {
  const me = safe(() => GameContext.localPlayerID, -1);
  if (me < 0) return false;
  return safe(() => {
    Game.PlayerOperations.sendRequest(me, kind, args);
    return true;
  }, false);
}

/** @param {string} why */
function scan(why) {
  if (!state.on) return;
  noteFielded();
  const human = safe(() => GameContext.localPlayerID, -1);
  const units = readMinorUnits();
  const swaps = unitsToSwap({
    units,
    suzerainOf,
    human,
    unlocked: (player) => unlockedBy(state.fielded.get(player) ?? new Set(), state.replaces),
    needs: state.needs,
    replacement: state.replacement,
    kept: kept()
  });
  storeKept(keptAfterScan({ units, needs: state.needs, swapped: swaps }));
  for (const { unit, replacement, unlockOwner } of swaps) {
    request("DESTROY_ELEMENT", { Kind: "UNIT", Owner: unit.owner, LocalID: unit.id });
    if (replacement && unit.location) {
      const at = unit.location;
      setTimeout(() => request("CREATE_ELEMENT", { Kind: "UNIT", Type: replacement, Location: at, Owner: unit.owner }),
        CREATE_DELAY_MS);
    }
    log.debug(`minor gate (${why}): player ${unit.owner}'s ${unit.type} -> ${replacement ?? "nothing"} ` +
      `(player ${unlockOwner} hasn't fielded one)`);
  }
}

/** @param {{ player?: number }} [data] */
function onPlayerTurnActivated(data) {
  if ((data?.player ?? -1) !== safe(() => GameContext.localPlayerID, -2)) return;
  try {
    scan("turn start");
  } catch (e) {
    log.warn("minor gate scan failed:", e);
  }
}

/** Reads the gate's tables into the state; false when no unit is held back (not a locked value). */
function readTables() {
  const { gate } = readIndexes();
  if (!gate.on) return false;
  const tags = buildTagIndex(/** @type {*} */ (GameInfo.TypeTags) ?? []);
  /** @type {Map<string, number>} */
  const strength = new Map();
  for (const row of /** @type {*} */ (GameInfo.Unit_Stats) ?? []) {
    strength.set(row.UnitType, Math.max(row.Combat ?? 0, row.RangedCombat ?? 0, row.Bombard ?? 0));
  }
  state.needs = gate.needs;
  state.replacement = buildReplacementTable({ units: /** @type {*} */ (GameInfo.Units) ?? [], tags, strength,
    needs: gate.needs });
  state.replaces = buildReplacesIndex(/** @type {*} */ (GameInfo.UnitReplaces) ?? []);
  return true;
}

function start() {
  if (isMultiplayerGame(typeof Configuration === "undefined" ? undefined : Configuration)) {
    log.info("multiplayer game: minors aren't held back from units that need a resource");
    return;
  }
  if (!readTables()) return;
  state.on = true;
  engine.on("PlayerTurnActivated", onPlayerTurnActivated);
  log.info(`minor gate on: ${state.needs.size} units held back from minors until their suzerain or you field one`);
  log.debug("minor gate replacements:",
    [...state.replacement].map(([unit, with_]) => `${unit}->${with_ ?? "none"}`).join(" "));
  setTimeout(() => onPlayerTurnActivated({ player: safe(() => GameContext.localPlayerID, -1) }), 2000);
}

try {
  start();
} catch (e) {
  log.error("minor gate failed to start:", e);
}
