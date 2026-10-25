// The gate map as rules, and the vanilla per-copy bonus the late curve extends. Pure: scripts/build-data.mjs turns
// it into the data files, and tests/data.mjs checks the files against it and against the game's own tables
// (devtools/gate-map/<age>.json, dumped from lab games by scripts/dump-gate-tables.mjs).
//
// A unique unit follows the unit it replaces (UnitReplaces): it is judged by that unit's tags, domain and tier, so a
// civilization's own Spearman needs Iron exactly when the Spearman does. A unit that replaces nothing is judged by
// its own. Each unit draws on at most one resource; the first rule that matches wins. Hardwood is an Empire resource
// like the six the base game ties to units, placed in every age, with no unit of its own in the base game: the mod
// gives it the Exploration heavy warships (the hull), and leaves Niter to the guns (the Bombard) and the Ironclad
// line to Coal.

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
 * The war elephants (1.3): the Khmer's Yuthahathi and the Maurya's Purabhettarah draw on Ivory, not on the Horses of
 * the Chariot and Horseman they replace. They are judged by this list before the rules, since a rule only sees the
 * unit a unique replaces. Ivory is an Empire resource in Antiquity like Horses (a Bonus one after, so the Exploration
 * and Modern elephants keep what the unit they replace needs). Each carries the ELEPHANT_TAG, which the data uses to
 * give them +1 Combat Strength per Ivory, capped by the engine at six like Horses, in place of the game's +1 per
 * Horses, and the late curve on Ivory in place of the Horses one (docs/elephants-on-ivory.md).
 */
export const ELEPHANT_TAG = "SR_ELEPHANT";
export const ELEPHANTS = ["UNIT_DANTINAS_TATHA", "UNIT_DANTINAS_TATHA_2", "UNIT_PURABHETTARAH", "UNIT_PURABHETTARAH_2"];
/** @type {Record<string, Record<string, string>>} per age, unit type to the resource it draws on, before the rules */
export const UNIT_OVERRIDES = {
  AGE_ANTIQUITY: Object.fromEntries(ELEPHANTS.map((u) => [u, "RESOURCE_IVORY"]))
};

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
    {
      resource: "RESOURCE_NITER",
      rule: "land siege from tier 3 (the Catapult and Trebuchet are free)",
      test: (u) => has(u, "SIEGE") && u.Domain === "DOMAIN_LAND" && u.Tier >= 3
    },
    {
      resource: "RESOURCE_HARDWOOD",
      rule: "heavy warships from tier 2 (the Cog is free): hulls, not powder",
      test: (u) => has(u, "NAVAL") && has(u, "HEAVY") && u.Tier >= 2
    }
  ],
  AGE_MODERN: [
    {
      resource: "RESOURCE_NITER",
      rule: "field artillery: land ranged up to tier 2 (the powder guns)",
      test: (u) => u.Domain === "DOMAIN_LAND" && has(u, "RANGED") && u.Tier <= 2
    },
    {
      resource: "RESOURCE_OIL",
      rule: "the heavier artillery: land siege, and land ranged from tier 3 (motorised; 1.2.0)",
      test: (u) => u.Domain === "DOMAIN_LAND" && (has(u, "SIEGE") || has(u, "RANGED"))
    },
    { resource: "RESOURCE_HORSES", rule: "the Cuirassier: cavalry at tier 1 (1.3)", test: (u) => has(u, "CAVALRY") && u.Tier <= 1 },
    { resource: "RESOURCE_OIL", rule: "armour (cavalry from tier 2)", test: (u) => has(u, "CAVALRY") && u.Tier >= 2 },
    {
      resource: "RESOURCE_HARDWOOD",
      rule: "the Ship of the Line: heavy warships at tier 1, a wooden hull (1.3)",
      test: (u) => has(u, "NAVAL") && has(u, "HEAVY") && u.Tier <= 1
    },
    {
      resource: "RESOURCE_OIL",
      rule: "battleships (heavy warships from tier 2)",
      test: (u) => has(u, "NAVAL") && has(u, "HEAVY") && u.Tier >= 2
    },
    { resource: "RESOURCE_COAL", rule: "light warships", test: (u) => has(u, "NAVAL") && has(u, "LIGHT") },
    {
      resource: "RESOURCE_OIL",
      rule: "submarines: naval, neither heavy nor light (1.3)",
      test: (u) => has(u, "NAVAL") && !has(u, "HEAVY") && !has(u, "LIGHT")
    },
    { resource: "RESOURCE_RUBBER", rule: "aircraft", test: (u) => has(u, "AIRCRAFT") }
  ]
};

/**
 * Per age, the resources that stand in for a gated one: a unit that draws on the key is supplied by a copy of the
 * key or of any resource listed (1.4). Pitch for Hardwood in Exploration: both are woodland resources the game places
 * that age, Hardwood only on tundra and in the tropics, Pitch on temperate forest, so a temperate start isn't left
 * without warships. Pitch is a Bonus resource; the game counts one on the player's land in getResources() (watched
 * with Whales). The engine's column takes one resource, so a unit with stand-ins carries no column: every one of
 * them is grant-only behind any of its resources (eitherLocks), and its penalty is cancelled by a copy of any.
 * @type {Record<string, Record<string, string[]>>}
 */
export const ALTERNATIVES = {
  AGE_EXPLORATION: { RESOURCE_HARDWOOD: ["RESOURCE_PITCH"] }
};

/**
 * The resource and its stand-ins in one age, the resource first.
 * @param {string} age @param {string} resource
 * @returns {string[]}
 */
export const suppliers = (age, resource) => [resource, ...(ALTERNATIVES[age]?.[resource] ?? [])];

/**
 * Modern Supply Chains (a setup option, off by default): the second resource each Modern unit draws on, by the same
 * tests as GATES. Iron isn't placed on Modern maps (Resource_ValidAges), so Coal stands for steel: guns, armour and
 * hulls need it beside their powder or fuel; the light warships need powder beside their coal; aircraft need fuel
 * beside their rubber. The option adds a tag per unit for the second resource, so the penalties stack, and the
 * grant-only lines lock the unit behind both resources under the locked levels (DESIGN.md 7h).
 * @type {Record<string, { resource: string, rule: string, test: (u: UnitFacts) => boolean }[]>}
 */
export const CHAINS = {
  AGE_MODERN: [
    {
      resource: "RESOURCE_COAL",
      rule: "artillery: steel for the guns",
      test: (u) => u.Domain === "DOMAIN_LAND" && (has(u, "SIEGE") || has(u, "RANGED"))
    },
    { resource: "RESOURCE_NITER", rule: "the Cuirassier: powder for the carbines", test: (u) => has(u, "CAVALRY") && u.Tier <= 1 },
    { resource: "RESOURCE_COAL", rule: "armour: steel", test: (u) => has(u, "CAVALRY") && u.Tier >= 2 },
    {
      resource: "RESOURCE_NITER",
      rule: "the Ship of the Line: powder for the broadside",
      test: (u) => has(u, "NAVAL") && has(u, "HEAVY") && u.Tier <= 1
    },
    {
      resource: "RESOURCE_COAL",
      rule: "battleships: steel hulls",
      test: (u) => has(u, "NAVAL") && has(u, "HEAVY") && u.Tier >= 2
    },
    { resource: "RESOURCE_NITER", rule: "light warships: powder for the guns", test: (u) => has(u, "NAVAL") && has(u, "LIGHT") },
    {
      resource: "RESOURCE_RUBBER",
      rule: "submarines: rubber for the seals",
      test: (u) => has(u, "NAVAL") && !has(u, "HEAVY") && !has(u, "LIGHT")
    },
    { resource: "RESOURCE_OIL", rule: "aircraft: fuel", test: (u) => has(u, "AIRCRAFT") }
  ]
};

/**
 * Unit type to the second resource it draws on with Modern Supply Chains on: every gated unit of an age that has
 * chain rules gets one, never the same as its first.
 * @param {AgeDump} dump
 * @returns {Map<string, string>}
 */
export function buildChainMap(dump) {
  const rules = CHAINS[dump.age];
  /** @type {Map<string, string>} */
  const map = new Map();
  if (!rules) return map;
  const facts = unitFacts(dump);
  const replaced = new Map(dump.replaces.map((r) => [r.CivUniqueUnitType, r.ReplacesUnitType]));
  for (const [unit, first] of buildGateMap(dump)) {
    const judged = facts.get(replaced.get(unit) ?? "") ?? facts.get(unit);
    const chain = judged ? rules.find((g) => g.test(judged)) : undefined;
    if (!chain) throw new Error(`${unit}: a gated unit of ${dump.age} with no chain rule`);
    if (chain.resource === first) throw new Error(`${unit}: its chain names its own resource ${first}`);
    map.set(unit, chain.resource);
  }
  return map;
}

/**
 * The resources whose per-copy combat bonus the late curve extends, with the unit tags that bonus goes to: vanilla's
 * (data/resources-gameeffects.xml in each age module, EFFECT_UNIT_ADJUST_COMBAT_STRENGTH_PER_RESOURCE) and, in
 * Antiquity, the mod's own +1 per Ivory on the war elephants, which are taken out of the Horses one (`exclude`).
 * @type {Record<string, { resource: string, tags: string[], exclude?: string[] }[]>}
 */
export const VANILLA_PER_COPY = {
  AGE_ANTIQUITY: [
    { resource: "RESOURCE_HORSES", tags: ["UNIT_CLASS_CAVALRY"], exclude: [ELEPHANT_TAG] },
    { resource: "RESOURCE_IRON", tags: ["UNIT_CLASS_INFANTRY"] },
    { resource: "RESOURCE_IVORY", tags: [ELEPHANT_TAG] }
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
  return [...new Set([...GATES[age].map((g) => g.resource), ...Object.values(UNIT_OVERRIDES[age] ?? {})])];
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
  if (dump.age === "AGE_ANTIQUITY") for (const unit of ELEPHANTS) facts.get(unit)?.tags.add(ELEPHANT_TAG);
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
  const overrides = UNIT_OVERRIDES[dump.age] ?? {};
  for (const unit of facts.values()) {
    const judged = facts.get(replaced.get(unit.UnitType) ?? "") ?? unit;
    if (!judged.tags.has("UNIT_CLASS_COMBAT")) continue;
    const gate = GATES[dump.age].find((g) => g.test(judged));
    const resource = overrides[unit.UnitType] ?? gate?.resource;
    if (resource) map.set(unit.UnitType, resource);
  }
  return new Map([...map].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

/**
 * Units the game tiers up on its own after a number of kills (the Sengoku DLC's UnitUpgradeKills rows: three kills
 * at each tier). The engine swaps the unit without the upgrade command, so neither the gold cost nor the upgrading
 * minimum applies: watch run 2, block 1, run X1 saw a Samurai with no Iron reach tier 2 and 3 under "Training and
 * upgrade". Their page carries the training line under both gate values. The dumps don't carry the kills table, so
 * the list is named here; tests/data.mjs keeps it inside upgradeOnlyGatedUnits.
 */
export const KILL_TIER_UNITS = new Set(["UNIT_SAMURAI_2", "UNIT_SAMURAI_3"]);

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

/**
 * Upgrades into a gated unit from a unit that both can be trained and doesn't need that resource: a free one, or
 * one on another resource (the Ship of the Line on Hardwood into the Dreadnought on Oil, 1.3). The engine retires a
 * unit as obsolete once the unit it upgrades into is unlocked by tech, whether or not the column lets the player
 * train that unit, so under the gate a player without the resource would lose the earlier unit too (the Trebuchet
 * once Gunpowder unlocks the Bombard: verification-runs.md, p16-siege-order). An upgrade into a unit nobody trains
 * (the Samurai tiers) is left alone: it's the only way to get that unit, and the gate doesn't change it.
 * @param {AgeDump} dump
 * @returns {{ Unit: string, UpgradeUnit: string }[]}
 */
export function strandingUpgrades(dump) {
  const gates = buildGateMap(dump);
  const trainable = new Set(dump.units.filter((u) => u.CanTrain === 1).map((u) => u.UnitType));
  return dump.upgrades
    .filter((r) => trainable.has(r.Unit) && trainable.has(r.UpgradeUnit) && gates.has(r.UpgradeUnit) &&
      gates.get(r.Unit) !== gates.get(r.UpgradeUnit))
    .sort((a, b) => (a.Unit < b.Unit ? -1 : a.Unit > b.Unit ? 1 : 0));
}

/** The trait the game's own city-state units carry (the Corsair): city-states hold it, majors only through a grant. */
export const MINOR_CIV_TRAIT = "TRAIT_LEADER_MINOR_CIV";
/** A trait nobody holds, for a civilization's unique unit that the gate makes grant-only. */
export const LOCKED_TRAIT = "TRAIT_SR_LOCKED";

/**
 * @typedef {object} LineLock
 * @property {string} unit the gated unit a free unit upgrades into, or a unique that replaces one
 * @property {string} resource what it needs (the first of `resources`)
 * @property {string[]} resources every resource the grant waits for: one, or two under Modern Supply Chains
 * @property {"base" | "unique" | "granted"} kind base: no trait in the game, gets the city-state trait; unique: a
 *   civilization's own unit, gets a trait nobody holds; granted: already reached only through the game's grants (the
 *   Corsair tiers), which get the resource added
 * @property {string | null} trait the trait the game gives it
 * @property {string[]} predecessors the free units that upgrade into it
 */

/**
 * The gated units whose availability has to follow the resource for each player, so that the free unit before them
 * is only made obsolete once the player could train them. The engine skips a unit the player isn't allowed to build
 * (a trait it lacks, with no grant) when it decides what's obsolete, but not one the column refuses
 * (verification-runs.md, p16-trait). Each one gets a trait and a grant behind the resource: without a copy the free
 * unit stays trainable, with one the line works as in the base game, upgrades included. Every target from
 * strandingUpgrades, and every gated unique that replaces one (the Legion for the Spearman), since a civilization's
 * free unit upgrades into its own unique.
 * @param {AgeDump & { units: { UnitType: string, CanTrain: number, TraitType?: string | null }[] }} dump
 * @returns {LineLock[]}
 */
export function lineLocks(dump) {
  const gates = buildGateMap(dump);
  const units = new Map(dump.units.map((u) => [u.UnitType, u]));
  const targets = new Set(strandingUpgrades(dump).map((r) => r.UpgradeUnit));
  for (const r of dump.replaces) {
    if (targets.has(r.ReplacesUnitType) && gates.has(r.CivUniqueUnitType) &&
      units.get(r.CivUniqueUnitType)?.CanTrain === 1) targets.add(r.CivUniqueUnitType);
  }
  // A unit with stand-ins carries no column, so the grant is its only lock (ALTERNATIVES).
  for (const [unit, resource] of gates) {
    if (ALTERNATIVES[dump.age]?.[resource] && units.get(unit)?.CanTrain === 1) targets.add(unit);
  }
  return [...targets].sort().map((unit) => {
    const lock = lockOf(dump, unit, [/** @type {string} */ (gates.get(unit))]);
    // A predecessor on the same resource is locked the same way: keeping it granted without the resource would
    // hand it to a player who has none.
    return { ...lock, predecessors: lock.predecessors.filter((pre) => gates.get(pre) !== lock.resource) };
  });
}

/**
 * The units that carry the engine's column: every gated unit but those with stand-ins (ALTERNATIVES).
 * @param {AgeDump} dump
 * @returns {Map<string, string>}
 */
export function columnMap(dump) {
  return new Map([...buildGateMap(dump)].filter(([, resource]) => !ALTERNATIVES[dump.age]?.[resource]));
}

/**
 * One lock entry: the unit's kind by its trait, what it waits for, and the units that upgrade into it.
 * @param {AgeDump & { units: { UnitType: string, TraitType?: string | null }[] }} dump
 * @param {string} unit @param {string[]} resources
 * @returns {LineLock}
 */
function lockOf(dump, unit, resources) {
  const trait = dump.units.find((u) => u.UnitType === unit)?.TraitType ?? null;
  return {
    unit,
    resource: resources[0],
    resources,
    kind: trait === null ? "base" : trait === MINOR_CIV_TRAIT ? "granted" : "unique",
    trait,
    predecessors: dump.upgrades.filter((r) => r.UpgradeUnit === unit).map((r) => r.Unit).sort()
  };
}

/**
 * Under Modern Supply Chains every gated unit of the age is grant-only behind both its resources: the engine's
 * column takes one resource, so the second is held by the same grant-only shape as the lines (DESIGN.md 7h). The
 * units the plain lines already lock are among them, with the second resource added to their grant.
 * @param {AgeDump & { units: { UnitType: string, CanTrain: number, TraitType?: string | null }[] }} dump
 * @returns {LineLock[]}
 */
export function chainLocks(dump) {
  const gates = buildGateMap(dump);
  const chains = buildChainMap(dump);
  const locks = [...chains.keys()].sort()
    .map((unit) => lockOf(dump, unit, [/** @type {string} */ (gates.get(unit)), /** @type {string} */ (chains.get(unit))]));
  // A civilization's copy of a gated free unit (Meiji's Ship of the Line) carries the base unit's column and tags, so
  // the engine locks it on the first resource; the second needs the same grant as the base unit, under the copy's
  // own trait.
  for (const copy of lineCopies(dump)) {
    if (!chains.has(copy.base)) continue;
    locks.push({ unit: copy.unit, resource: /** @type {string} */ (gates.get(copy.base)),
      resources: [/** @type {string} */ (gates.get(copy.base)), /** @type {string} */ (chains.get(copy.base))],
      kind: "unique", trait: copy.trait, predecessors: [] });
  }
  return locks;
}

/**
 * @typedef {object} LineCopy
 * @property {string} unit the copy's type, <base>_SR_<civilization>
 * @property {string} base the free unit it copies and stands in for
 * @property {string} trait the civilization's trait
 * @property {string} upgradeTo the civilization's unique, which the copy upgrades straight into
 */

/**
 * A civilization's own copy of a free unit, for each unique that replaces a line target without a line of its own
 * (the Legion replaces the Spearman; nothing upgrades into the Legion). Such a civilization's free unit (the Warrior)
 * upgrades by the game's row into the base unit, and the engine resolves that to the unique only while the unique
 * isn't granted (verification-runs.md, p16-rome-grant), so under the gate the Warrior would upgrade into a Spearman.
 * The copy is the shape the Hoplite, the Medjay and the Gaisatai already have: it stands in for the Warrior
 * (UnitReplaces) and upgrades by its own row into the unique, which needs no resolving. A civilization that already
 * has its own stand-in for the free unit needs none.
 * @param {AgeDump & { units: { UnitType: string, TraitType?: string | null }[] }} dump
 * @returns {LineCopy[]}
 */
export function lineCopies(dump) {
  const units = new Map(dump.units.map((u) => [u.UnitType, u]));
  const standsIn = (/** @type {string} */ base, /** @type {string} */ trait) =>
    dump.replaces.some((r) => r.ReplacesUnitType === base && units.get(r.CivUniqueUnitType)?.TraitType === trait);
  /** @type {LineCopy[]} */
  const out = [];
  for (const lock of lineLocks(dump)) {
    if (lock.kind !== "unique" || lock.predecessors.length || !lock.trait) continue;
    for (const r of dump.replaces) {
      if (r.CivUniqueUnitType !== lock.unit) continue;
      for (const up of dump.upgrades) {
        if (up.UpgradeUnit !== r.ReplacesUnitType || !units.has(up.Unit) || standsIn(up.Unit, lock.trait)) continue;
        out.push({ unit: `${up.Unit}_SR_${lock.trait.replace(/^TRAIT_/, "")}`, base: up.Unit, trait: lock.trait,
          upgradeTo: lock.unit });
      }
    }
  }
  return out.sort((a, b) => (a.unit < b.unit ? -1 : a.unit > b.unit ? 1 : 0));
}

/**
 * The strength types the penalty and the curve change, and the Unit_Stats column each one reads. A unit is only ever
 * given a change on a strength it has: a melee unit's ranged and bombard strength are 0 because it has no such attack,
 * and raising one above 0 could turn on ranged behaviour, so those rows never reach it.
 */
export const STRENGTHS = [
  { type: "MELEE", stat: "Combat" },
  { type: "RANGED", stat: "RangedCombat" },
  { type: "BOMBARD", stat: "Bombard" }
];

/**
 * Per resource of one age, the units each strength row may change: the gated units (penalty) and the units vanilla's
 * per-copy bonus covers (curve), each kept only where the unit's base value for that strength is above 0. With a
 * `gates` map given (the chain map), the penalty side is read for that map instead.
 * @param {AgeDump & { units: { UnitType: string, Combat?: number, RangedCombat?: number, Bombard?: number }[] }} dump
 * @param {Map<string, string>} [gates]
 * @returns {{ penalty: Map<string, Record<string, string[]>>, curve: Map<string, Record<string, string[]>> }}
 */
export function strengthUnits(dump, gates = buildGateMap(dump)) {
  const stats = new Map(dump.units.map((u) => [u.UnitType, u]));
  const facts = unitFacts(dump);
  const keep = (/** @type {string[]} */ units, /** @type {string} */ stat) =>
    units.filter((unit) => Number(/** @type {*} */ (stats.get(unit))?.[stat] ?? 0) > 0).sort();
  const split = (/** @type {string[]} */ units) =>
    Object.fromEntries(STRENGTHS.map(({ type, stat }) => [type, keep(units, stat)]));
  const used = new Set(gates.values());
  const resources = [...gatedResources(dump.age).filter((r) => used.has(r)),
    ...[...used].filter((r) => !gatedResources(dump.age).includes(r)).sort()];
  const penalty = new Map(resources.map((resource) =>
    [resource, split([...gates].filter(([, r]) => r === resource).map(([unit]) => unit))]));
  const curve = new Map(VANILLA_PER_COPY[dump.age].map(({ resource, tags, exclude = [] }) =>
    [resource, split([...facts.values()].filter((u) => tags.some((t) => u.tags.has(t)) &&
      !exclude.some((t) => u.tags.has(t))).map((u) => u.UnitType))]));
  return { penalty, curve };
}
