// The gate map as rules, and the vanilla per-copy bonus the late curve extends. Pure: scripts/build-data.mjs turns
// it into the data files, and tests/data.mjs checks the files against it and against the game's own tables
// (devtools/gate-map/<age>.json, dumped from lab games by scripts/dump-gate-tables.mjs).
//
// A unique unit follows the unit it replaces (UnitReplaces): it is judged by that unit's tags, domain and tier, so a
// civilization's own Spearman needs Iron exactly when the Spearman does. A unit that replaces nothing is judged by
// its own. Each unit draws on at most one resource; the first rule that matches wins.

export const AGES = ["AGE_ANTIQUITY", "AGE_EXPLORATION", "AGE_MODERN"];

/** The short name used in file names and in DESIGN.md. */
export const AGE_FILE = { AGE_ANTIQUITY: "antiquity", AGE_EXPLORATION: "exploration", AGE_MODERN: "modern" };

/**
 * @typedef {object} UnitFacts
 * @property {string} UnitType
 * @property {string} Domain
 * @property {number} Tier
 * @property {Set<string>} tags
 */

const has = (/** @type {UnitFacts} */ u, /** @type {string} */ tag) => u.tags.has(`UNIT_CLASS_${tag}`);

/**
 * Per age, in order: the resource and the test a unit (or the unit it replaces) must pass to draw on it.
 * @type {Record<string, { resource: string, rule: string, test: (u: UnitFacts) => boolean }[]>}
 */
export const GATES = {
  AGE_ANTIQUITY: [
    { resource: "RESOURCE_HORSES", rule: "cavalry", test: (u) => has(u, "CAVALRY") },
    {
      resource: "RESOURCE_IRON",
      rule: "infantry from tier 2 (not the Warrior line)",
      test: (u) => has(u, "INFANTRY") && u.Tier >= 2
    }
  ],
  AGE_EXPLORATION: [
    { resource: "RESOURCE_HORSES", rule: "cavalry", test: (u) => has(u, "CAVALRY") },
    { resource: "RESOURCE_IRON", rule: "infantry from tier 2", test: (u) => has(u, "INFANTRY") && u.Tier >= 2 },
    { resource: "RESOURCE_NITER", rule: "land siege", test: (u) => has(u, "SIEGE") && u.Domain === "DOMAIN_LAND" },
    {
      resource: "RESOURCE_NITER",
      rule: "heavy warships from tier 2 (ships of the line)",
      test: (u) => has(u, "NAVAL") && has(u, "HEAVY") && u.Tier >= 2
    }
  ],
  AGE_MODERN: [
    {
      resource: "RESOURCE_NITER",
      rule: "artillery (land siege and land ranged)",
      test: (u) => u.Domain === "DOMAIN_LAND" && (has(u, "SIEGE") || has(u, "RANGED"))
    },
    { resource: "RESOURCE_OIL", rule: "armour (cavalry from tier 2)", test: (u) => has(u, "CAVALRY") && u.Tier >= 2 },
    {
      resource: "RESOURCE_OIL",
      rule: "battleships (heavy warships from tier 2)",
      test: (u) => has(u, "NAVAL") && has(u, "HEAVY") && u.Tier >= 2
    },
    { resource: "RESOURCE_COAL", rule: "light warships", test: (u) => has(u, "NAVAL") && has(u, "LIGHT") },
    { resource: "RESOURCE_RUBBER", rule: "aircraft", test: (u) => has(u, "AIRCRAFT") }
  ]
};

/**
 * The resources whose vanilla per-copy combat bonus the late curve extends, with the unit tags vanilla gives that
 * bonus to (data/resources-gameeffects.xml in each age module, EFFECT_UNIT_ADJUST_COMBAT_STRENGTH_PER_RESOURCE).
 * @type {Record<string, { resource: string, tags: string[] }[]>}
 */
export const VANILLA_PER_COPY = {
  AGE_ANTIQUITY: [
    { resource: "RESOURCE_HORSES", tags: ["UNIT_CLASS_CAVALRY"] },
    { resource: "RESOURCE_IRON", tags: ["UNIT_CLASS_INFANTRY"] }
  ],
  AGE_EXPLORATION: [
    { resource: "RESOURCE_HORSES", tags: ["UNIT_CLASS_CAVALRY"] },
    { resource: "RESOURCE_IRON", tags: ["UNIT_CLASS_INFANTRY"] },
    { resource: "RESOURCE_NITER", tags: ["UNIT_CLASS_NAVAL", "UNIT_CLASS_SIEGE"] }
  ],
  AGE_MODERN: [
    { resource: "RESOURCE_NITER", tags: ["UNIT_CLASS_RANGED", "UNIT_CLASS_SIEGE"] },
    { resource: "RESOURCE_OIL", tags: ["UNIT_CLASS_CAVALRY", "UNIT_CLASS_HEAVY"] },
    { resource: "RESOURCE_COAL", tags: ["UNIT_CLASS_LIGHT"] },
    { resource: "RESOURCE_RUBBER", tags: ["UNIT_CLASS_INFANTRY", "UNIT_CLASS_AIRCRAFT"] }
  ]
};

/**
 * The resources an age gates, in a stable order.
 * @param {string} age
 * @returns {string[]}
 */
export function gatedResources(age) {
  return [...new Set(GATES[age].map((g) => g.resource))];
}

/**
 * @typedef {object} AgeDump
 * @property {string} age
 * @property {{ UnitType: string, CoreClass: string, Domain: string, Tier: number, CanTrain: number }[]} units
 * @property {{ Type: string, Tag: string }[]} tags
 * @property {{ CivUniqueUnitType: string, ReplacesUnitType: string }[]} replaces
 * @property {{ Unit: string, UpgradeUnit: string }[]} upgrades
 */

/**
 * Unit facts keyed by type, for the military units of one age's dump.
 * @param {AgeDump} dump
 * @returns {Map<string, UnitFacts>}
 */
export function unitFacts(dump) {
  /** @type {Map<string, UnitFacts>} */
  const facts = new Map();
  for (const u of dump.units) {
    if (u.CoreClass !== "CORE_CLASS_MILITARY") continue;
    facts.set(u.UnitType, { UnitType: u.UnitType, Domain: u.Domain, Tier: u.Tier ?? 0, tags: new Set() });
  }
  for (const row of dump.tags) facts.get(row.Type)?.tags.add(row.Tag);
  return facts;
}

/**
 * Unit type to the resource it draws on, for every combat unit of one age that has one.
 * @param {AgeDump} dump
 * @returns {Map<string, string>}
 */
export function buildGateMap(dump) {
  const facts = unitFacts(dump);
  const replaced = new Map(dump.replaces.map((r) => [r.CivUniqueUnitType, r.ReplacesUnitType]));
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const unit of facts.values()) {
    const judged = facts.get(replaced.get(unit.UnitType) ?? "") ?? unit;
    if (!judged.tags.has("UNIT_CLASS_COMBAT")) continue;
    const gate = GATES[dump.age].find((g) => g.test(judged));
    if (gate) map.set(unit.UnitType, gate.resource);
  }
  return new Map([...map].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

/**
 * Gated units that no one can train (CanTrain 0) but that an upgrade leads to: the only units on which
 * Units.StrategicResource would gate an upgrade without also blocking training (DESIGN.md section 7a, P1 and P2).
 * @param {AgeDump} dump
 * @returns {string[]}
 */
export function upgradeOnlyGatedUnits(dump) {
  const gates = buildGateMap(dump);
  const upgradeTargets = new Set(dump.upgrades.map((u) => u.UpgradeUnit));
  return dump.units
    .filter((u) => u.CanTrain === 0 && gates.has(u.UnitType) && upgradeTargets.has(u.UnitType))
    .map((u) => u.UnitType);
}
