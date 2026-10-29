// Holding minors back from units that need a strategic resource, under the locked values (the owner, 2026-10-28):
// a city-state may field such a unit once its suzerain has fielded one; an independent, or a city-state with no
// suzerain, once the human player has. The game exempts minors from the resource column
// (CivilizationLevels.IgnoresUnitStrategicResourceRequirements), their spawns ignore EFFECT_PLAYER_DISABLE_BUILD_UNIT,
// and a trait on the unit takes it out of their spawns for good (verification-runs.md Phase 21), so no data shape can
// hold them back and let them have it later. The script swaps such a unit, once it appears, for the strongest unit of
// the same role that needs no resource. This file is the logic, with plain inputs; sr-minor-gate.js runs it in game.

/** The role ladder: a unit's role is the first of these tags it carries. */
export const ROLE_TAGS = ["UNIT_CLASS_SIEGE", "UNIT_CLASS_CAVALRY", "UNIT_CLASS_RANGED", "UNIT_CLASS_MELEE"];
const COMBAT_TAG = "UNIT_CLASS_COMBAT";
const MILITARY = "CORE_CLASS_MILITARY";

/**
 * @typedef {object} UnitRow
 * @property {string} UnitType
 * @property {string} [Domain]
 * @property {string} [CoreClass]
 * @property {string | null} [TraitType]
 * @property {boolean | number} [CanTrain]
 * @property {number} [Tier]
 */

/**
 * Every unit's tags, by unit.
 * @param {Iterable<{ Type?: string, Tag?: string }>} typeTags
 * @returns {Map<string, Set<string>>}
 */
export function buildTagIndex(typeTags) {
  /** @type {Map<string, Set<string>>} */
  const tags = new Map();
  for (const row of typeTags) {
    if (!row?.Type || !row?.Tag) continue;
    if (!tags.has(row.Type)) tags.set(row.Type, new Set());
    tags.get(row.Type)?.add(row.Tag);
  }
  return tags;
}

/**
 * A unit's role: its domain and the first role tag it carries, or null for a unit with no combat role.
 * @param {UnitRow | undefined} row @param {Map<string, Set<string>>} tags
 * @returns {string | null}
 */
export function roleOf(row, tags) {
  const own = row ? tags.get(row.UnitType) : undefined;
  if (!row || !own?.has(COMBAT_TAG)) return null;
  const role = ROLE_TAGS.find((tag) => own.has(tag));
  return role ? `${row.Domain ?? "?"}|${role}` : null;
}

/**
 * The replacement for each unit a minor may be held back from: the strongest unit of the same role that needs no
 * resource, no civilization's own unit and one the game lets anyone train, at no higher tier than the unit it
 * replaces (a tier 1 Field Cannon never turns into a tier 3 Infantry Company); with none at or below that tier, the
 * role's lowest-tier unit. With no free unit of the role, the domain's melee units the same way; with none of those,
 * null (the unit is removed and nothing placed).
 * @param {{ units: Iterable<UnitRow>, tags: Map<string, Set<string>>, strength: Map<string, number>,
 *   needs: Map<string, string[]> }} tables
 * @returns {Map<string, string | null>}
 */
export function buildReplacementTable({ units, tags, strength, needs }) {
  const rows = [...units].filter((row) => row?.UnitType);
  const free = rows.filter((row) => row.CoreClass === MILITARY && !row.TraitType && row.CanTrain !== false &&
    row.CanTrain !== 0 && !needs.has(row.UnitType) && roleOf(row, tags));
  const tierOf = (/** @type {UnitRow} */ row) => (Number.isFinite(row.Tier) ? Number(row.Tier) : 1);
  const byStrength = (/** @type {UnitRow} */ a, /** @type {UnitRow} */ b) =>
    (strength.get(b.UnitType) ?? 0) - (strength.get(a.UnitType) ?? 0) || a.UnitType.localeCompare(b.UnitType);
  /** @param {UnitRow[]} list @param {number} cap @returns {string | null} */
  const pick = (list, cap) => {
    const within = list.filter((r) => tierOf(r) <= cap).sort(byStrength);
    if (within.length) return within[0].UnitType;
    const lowest = Math.min(...list.map(tierOf));
    return list.filter((r) => tierOf(r) === lowest).sort(byStrength)[0]?.UnitType ?? null;
  };
  /** @type {Map<string, string | null>} */
  const table = new Map();
  for (const unitType of needs.keys()) {
    const row = rows.find((r) => r.UnitType === unitType);
    const role = roleOf(row, tags);
    if (!row || !role) {
      table.set(unitType, null);
      continue;
    }
    const sameRole = free.filter((r) => roleOf(r, tags) === role);
    const melee = free.filter((r) => roleOf(r, tags) === `${row.Domain ?? "?"}|UNIT_CLASS_MELEE`);
    table.set(unitType, pick(sameRole, tierOf(row)) ?? pick(melee, tierOf(row)));
  }
  return table;
}

/**
 * The unit types that count as a fielded copy of each unit: itself, and every civilization's unique unit that
 * replaces it (a Hoplite counts for the unit it stands in for).
 * @param {Iterable<{ CivUniqueUnitType?: string, ReplacesUnitType?: string }>} unitReplaces
 * @returns {Map<string, string>} unique unit -> the unit it replaces
 */
export function buildReplacesIndex(unitReplaces) {
  /** @type {Map<string, string>} */
  const replaces = new Map();
  for (const row of unitReplaces) {
    if (row?.CivUniqueUnitType && row?.ReplacesUnitType) replaces.set(row.CivUniqueUnitType, row.ReplacesUnitType);
  }
  return replaces;
}

/**
 * The unit types a player's fielded units unlock: each unit's own type, and the type its unique unit replaces.
 * @param {Iterable<string>} fieldedTypes @param {Map<string, string>} replaces
 * @returns {Set<string>}
 */
export function unlockedBy(fieldedTypes, replaces) {
  const out = new Set();
  for (const type of fieldedTypes) {
    out.add(type);
    const base = replaces.get(type);
    if (base) out.add(base);
  }
  return out;
}

/**
 * Whose fielded units unlock a minor's: its suzerain, or the human player when it has none.
 * @param {number} suzerain the minor's suzerain, below 0 for none @param {number} human
 * @returns {number}
 */
export const unlockOwner = (suzerain, human) => (Number.isInteger(suzerain) && suzerain >= 0 ? suzerain : human);

/**
 * @typedef {object} MinorUnit
 * @property {number} owner
 * @property {number} id the unit's local id
 * @property {string} type
 * @property {{ x: number, y: number } | null} location
 */

/** A minor unit's key in the kept list: owner, local id and type (a reused id on another type doesn't count). */
export const unitKey = (/** @type {MinorUnit} */ unit) => `${unit.owner}:${unit.id}:${unit.type}`;

/**
 * The minor units to swap: each one whose type the gate holds back and its unlock owner hasn't fielded. A unit the
 * gate let stay once is in `kept` and stays for good, so a village that becomes a city-state under a suzerain who
 * hasn't fielded one keeps the units it already had (the owner, 2026-10-29); only units that appear later wait.
 * @param {{ units: MinorUnit[], suzerainOf: (owner: number) => number, human: number,
 *   unlocked: (player: number) => Set<string>, needs: Map<string, string[]>,
 *   replacement: Map<string, string | null>, kept?: Set<string> }} input
 * @returns {{ unit: MinorUnit, replacement: string | null, unlockOwner: number }[]}
 */
export function unitsToSwap({ units, suzerainOf, human, unlocked, needs, replacement, kept = new Set() }) {
  const out = [];
  for (const unit of units) {
    if (!needs.has(unit.type) || kept.has(unitKey(unit))) continue;
    const owner = unlockOwner(suzerainOf(unit.owner), human);
    if (unlocked(owner).has(unit.type)) continue;
    out.push({ unit, replacement: replacement.get(unit.type) ?? null, unlockOwner: owner });
  }
  return out;
}

/**
 * The kept list after a scan: every held-back minor unit still on the map that wasn't swapped. Units that died drop
 * out, so the list stays the size of the minors' armies.
 * @param {{ units: MinorUnit[], needs: Map<string, string[]>, swapped: { unit: MinorUnit }[] }} input
 * @returns {Set<string>}
 */
export function keptAfterScan({ units, needs, swapped }) {
  const gone = new Set(swapped.map((s) => unitKey(s.unit)));
  return new Set(units.filter((u) => needs.has(u.type)).map(unitKey).filter((k) => !gone.has(k)));
}

/**
 * The stored kept list, read back from its comma-joined form; junk entries are dropped.
 * @param {unknown} stored
 * @returns {Set<string>}
 */
export function parseKept(stored) {
  if (typeof stored !== "string" || !stored) return new Set();
  return new Set(stored.split(",").filter((k) => /^\d+:\d+:UNIT_[A-Z0-9_]+$/.test(k)));
}

/**
 * The stored list of unit types a player has fielded, read back from its comma-joined form.
 * @param {unknown} stored
 * @returns {Set<string>}
 */
export function parseFielded(stored) {
  if (typeof stored !== "string" || !stored) return new Set();
  return new Set(stored.split(",").filter((t) => /^UNIT_[A-Z0-9_]+$/.test(t)));
}

/** @param {Set<string>} fielded @returns {string} */
export const serializeFielded = (fielded) => [...fielded].sort().join(",");
