import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildFiles, CURVE_THRESHOLDS, LEVELS } from "../scripts/build-data.mjs";
import { AGES, AGE_FILE, buildGateMap, gatedResources, upgradeOnlyGatedUnits } from "../scripts/gate-map.mjs";

// Data gate: the invariants that crash the game or mislead it, checked on the files that ship.
//   - data/ is exactly what scripts/build-data.mjs writes (no hand edit drifts from the gate map).
//   - No player-resource requirement on an EFFECT_ATTACH_MODIFIERS parent: it crashes the game (DESIGN.md 7b).
//   - Every modifier is reached: attached by a parent in the same file, or registered in GameModifiers by its group.
//   - Every requirement on a child is a known shape, and every cancel equals its penalty.
//   - The gate lists per age are the ones written into DESIGN.md section 4.
//   - Every unit and resource the data names exists in the game's tables, as dumped from lab games
//     (devtools/gate-map/<age>.json) and, for the age last played, in the live compiled database
//     (Debug/gameplay-copy.sqlite). The live check is skipped with a message when that file is absent.

const DATA = "data";
const read = (/** @type {string} */ f) => fs.readFileSync(path.join(DATA, f), "utf8");

// 1. Generated files are current.
for (const [name, text] of buildFiles()) {
  assert.equal(read(name), text, `data/${name} differs from scripts/build-data.mjs output; run npm run data`);
}

/**
 * @typedef {object} ModifierInfo
 * @property {string} id
 * @property {string} collection
 * @property {string} effect
 * @property {Record<string, string>} args
 * @property {string[]} ownerRequirements
 * @property {string[]} subjectRequirements
 * @property {string} body
 */

/** @param {string} xml @returns {ModifierInfo[]} */
function parseModifiers(xml) {
  return [...xml.matchAll(/<Modifier id="([^"]+)" collection="([^"]+)" effect="([^"]+)">([\s\S]*?)<\/Modifier>/g)]
    .map((m) => {
      const body = m[4];
      const section = (/** @type {string} */ name) => (body.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))
        || ["", ""])[1];
      const types = (/** @type {string} */ s) => [...s.matchAll(/<Requirement type="([^"]+)"/g)].map((r) => r[1]);
      const outside = body.replace(/<(Owner|Subject)Requirements[\s\S]*?<\/\1Requirements>/g, "");
      const args = Object.fromEntries([...outside.matchAll(/<Argument name="([^"]+)">([^<]*)<\/Argument>/g)]
        .map((a) => [a[1], a[2]]));
      return {
        id: m[1], collection: m[2], effect: m[3], args, body,
        ownerRequirements: types(section("OwnerRequirements")),
        subjectRequirements: types(section("SubjectRequirements"))
      };
    });
}

/** @param {string} xml */
const gameModifierRows = (xml) => [...xml.matchAll(/<Row ModifierId="([^"]+)"\/>/g)].map((m) => m[1]);

const RESOURCE_REQUIREMENT = /^REQUIREMENT_PLAYER_HAS_.*RESOURCE/;
let modifiersChecked = 0;

// 2-4. Every modifier file and its GameModifiers file, one setup group at a time.
const groups = AGES.flatMap((age) => [...Object.keys(LEVELS), "curve"].map((kind) => ({ age, kind })));
for (const { age, kind } of groups) {
  const base = `sr-${AGE_FILE[age]}-${kind}`;
  const modifiers = parseModifiers(read(`${base}-modifiers.xml`));
  const registered = gameModifierRows(read(`${base}-game.xml`));
  const byId = new Map(modifiers.map((m) => [m.id, m]));
  assert.equal(byId.size, modifiers.length, `${base}: a modifier id is defined twice`);
  const reached = new Set(registered);
  for (const m of modifiers) {
    if (m.effect !== "EFFECT_ATTACH_MODIFIERS") continue;
    const parentRequirements = [...m.ownerRequirements, ...m.subjectRequirements];
    assert.ok(!parentRequirements.some((r) => RESOURCE_REQUIREMENT.test(r)),
      `${base}: ${m.id} carries a resource requirement on an attach parent (crashes the game)`);
    assert.equal(parentRequirements.length, 0, `${base}: ${m.id} attach parent has requirements`);
    assert.equal(m.collection, "COLLECTION_MAJOR_PLAYERS", `${base}: ${m.id} attaches to ${m.collection}`);
    assert.ok(byId.has(m.args.ModifierId), `${base}: ${m.id} attaches ${m.args.ModifierId}, which is not defined`);
    reached.add(m.args.ModifierId);
  }
  for (const id of registered) assert.ok(byId.has(id), `${base}: GameModifiers names ${id}, which is not defined`);
  for (const m of modifiers) {
    assert.ok(reached.has(m.id), `${base}: ${m.id} is never attached or registered`);
    assert.ok(m.ownerRequirements.every((r) => r === "REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE"),
      `${base}: ${m.id} has an unexpected owner requirement`);
    assert.ok(m.subjectRequirements.every((r) => r === "REQUIREMENT_UNIT_TAG_MATCHES"),
      `${base}: ${m.id} has an unexpected subject requirement`);
    modifiersChecked += 1;
  }
  if (kind !== "curve") {
    const level = LEVELS[/** @type {keyof typeof LEVELS} */ (kind)];
    for (const resource of gatedResources(age)) {
      const name = resource.replace("RESOURCE_", "");
      assert.equal(Number(byId.get(`SR_COMBAT_PENALTY_${name}`)?.args.Amount), level.combat, `${base} ${name}`);
      assert.equal(Number(byId.get(`SR_COMBAT_SUPPLIED_${name}`)?.args.Amount), -level.combat, `${base} ${name}`);
      assert.equal(Number(byId.get(`SR_PRODUCTION_PENALTY_${name}`)?.args.Percent), level.productionPercent);
      assert.equal(Number(byId.get(`SR_PRODUCTION_SUPPLIED_${name}`)?.args.Percent), -level.productionPercent);
      assert.equal(byId.get(`SR_PRODUCTION_PENALTY_${name}`)?.args.UnitClass, `SR_SUPPLY_${name}`);
      // The penalty is unconditional; only the cancel waits for the resource.
      assert.equal(byId.get(`SR_COMBAT_PENALTY_${name}`)?.ownerRequirements.length, 0);
      assert.match(byId.get(`SR_COMBAT_SUPPLIED_${name}`)?.body ?? "", new RegExp(`<Argument name="ResourceType">${resource}<`));
    }
  } else {
    const thresholds = modifiers.filter((m) => m.id.startsWith("SR_CURVE_"))
      .map((m) => Number((m.body.match(/<Argument name="Amount">(\d+)<\/Argument>\s*<\/Requirement>/) || [])[1]));
    assert.ok(thresholds.length > 0 && thresholds.every((t) => CURVE_THRESHOLDS.includes(t)), `${base} thresholds`);
  }
}

// 5. The gate lists, as DESIGN.md section 4 writes them.
const EXPECTED = {
  AGE_ANTIQUITY: {
    RESOURCE_HORSES: ["UNIT_CHARIOT", "UNIT_DANTINAS_TATHA", "UNIT_DANTINAS_TATHA_2", "UNIT_HORSEMAN", "UNIT_MAGARRU",
      "UNIT_MAGARRU_2", "UNIT_NUMIDIAN_CAVALRY", "UNIT_NUMIDIAN_CAVALRY_2", "UNIT_PURABHETTARAH",
      "UNIT_PURABHETTARAH_2"],
    RESOURCE_IRON: ["UNIT_GAISATAI_2", "UNIT_GAISATAI_3", "UNIT_HOPLITE_2", "UNIT_HOPLITE_3", "UNIT_IMMORTAL",
      "UNIT_IMMORTAL_2", "UNIT_LEGION", "UNIT_LEGION_2", "UNIT_MEDJAY_2", "UNIT_MEDJAY_3", "UNIT_PHALANX",
      "UNIT_SPEARMAN"]
  },
  AGE_EXPLORATION: {
    RESOURCE_HORSES: ["UNIT_BOYAR", "UNIT_BOYAR_2", "UNIT_BOYAR_3", "UNIT_CHEVALER", "UNIT_CHEVALER_2",
      "UNIT_CHEVALER_3", "UNIT_COURSER", "UNIT_KNIGHT", "UNIT_LANCER", "UNIT_MAMLUK", "UNIT_MAMLUK_2", "UNIT_MAMLUK_3",
      "UNIT_TOBANG", "UNIT_TOBANG_2", "UNIT_TOBANG_3"],
    RESOURCE_IRON: ["UNIT_GOLD_BANGLES_2", "UNIT_GOLD_BANGLES_3", "UNIT_KISPOKO_NENA_TO_2", "UNIT_KISPOKO_NENA_TO_3",
      "UNIT_LEIOMANO_2", "UNIT_LEIOMANO_3", "UNIT_MAN_AT_ARMS", "UNIT_PIKEMAN", "UNIT_SAMURAI_2", "UNIT_SAMURAI_3",
      "UNIT_TERCIO_2", "UNIT_TERCIO_3", "UNIT_XUNLEICHONG_2", "UNIT_XUNLEICHONG_3"],
    RESOURCE_NITER: ["UNIT_BOMBARD", "UNIT_CARRACK", "UNIT_CATAPULT", "UNIT_CETBANG_2", "UNIT_CETBANG_3",
      "UNIT_CORSAIR_2", "UNIT_CORSAIR_3", "UNIT_GALLEON", "UNIT_HWACHA", "UNIT_HWACHA_2", "UNIT_HWACHA_3",
      "UNIT_KALAM_2", "UNIT_KALAM_3", "UNIT_TREBUCHET", "UNIT_VIKINGR_2", "UNIT_VIKINGR_3"]
  },
  AGE_MODERN: {
    RESOURCE_NITER: ["UNIT_ASSAULT_GUN", "UNIT_AT_GUN", "UNIT_CHANG_BEUN", "UNIT_CHANG_BEUN_2", "UNIT_CHANG_BEUN_3",
      "UNIT_FIELD_CANNON", "UNIT_FIELD_GUN", "UNIT_HEAVY_ARTILLERY", "UNIT_KATYUSHA", "UNIT_KATYUSHA_2",
      "UNIT_MORTAR"],
    RESOURCE_OIL: ["UNIT_BATTLESHIP", "UNIT_COSSACK_2", "UNIT_COSSACK_3", "UNIT_DREADNOUGHT", "UNIT_GHILMAN_2",
      "UNIT_GHILMAN_3", "UNIT_HUSSAR_2", "UNIT_HUSSAR_3", "UNIT_LANDSHIP", "UNIT_MIKASA", "UNIT_MIKASA_2",
      "UNIT_REVENGE", "UNIT_REVENGE_2", "UNIT_TANK", "UNIT_TURTLE_SHIP_2", "UNIT_TURTLE_SHIP_3"],
    RESOURCE_COAL: ["UNIT_BARBARY_CORSAIR", "UNIT_BARBARY_CORSAIR_2", "UNIT_BARBARY_CORSAIR_3", "UNIT_CRUISER",
      "UNIT_DESTROYER", "UNIT_IRONCLAD"],
    RESOURCE_RUBBER: ["UNIT_BIPLANE", "UNIT_BOMBER", "UNIT_DIVEBOMBER", "UNIT_FIGHTER", "UNIT_HEAVY_BOMBER",
      "UNIT_STUKA", "UNIT_STUKA_2", "UNIT_TRENCH_FIGHTER", "UNIT_ZERO", "UNIT_ZERO_2"]
  }
};

/** @type {Record<string, any>} */
const dumps = {};
for (const age of AGES) {
  dumps[age] = JSON.parse(fs.readFileSync(path.join("devtools/gate-map", `${AGE_FILE[age]}.json`), "utf8"));
  assert.equal(dumps[age].age, age, `devtools/gate-map/${AGE_FILE[age]}.json holds ${dumps[age].age}`);
  /** @type {Record<string, string[]>} */
  const byResource = {};
  for (const [unit, resource] of buildGateMap(dumps[age])) (byResource[resource] ??= []).push(unit);
  assert.deepEqual(byResource, EXPECTED[age], `${age}: the gate map differs from DESIGN.md section 4`);
  const tagged = [...read(`sr-${AGE_FILE[age]}-supply.xml`).matchAll(/<Row Type="([^"]+)" Tag="SR_SUPPLY_([A-Z]+)"\/>/g)];
  const known = new Set(dumps[age].units.map((/** @type {{ UnitType: string }} */ u) => u.UnitType));
  for (const [, unit] of tagged) assert.ok(known.has(unit), `${age}: ${unit} is not a unit of this age`);
}

// The upgrade gate is left out of 1.0 (DESIGN.md section 7e): the only units it could gate are Samurai tiers 2
// and 3, which the Sengoku player can get no other way. This pins that finding to the dumps.
assert.deepEqual(AGES.flatMap((age) => upgradeOnlyGatedUnits(dumps[age])),
  dumps.AGE_EXPLORATION.upgrades.length ? ["UNIT_SAMURAI_2", "UNIT_SAMURAI_3"] : []);
assert.ok(!fs.readdirSync(DATA).some((f) => /\bStrategicResource\s*=/.test(read(f))), "data sets Units.StrategicResource");

// Every data file is loaded by exactly one action group, and nothing else is.
const modinfo = fs.readFileSync("strategic-resources.modinfo", "utf8").replace(/<!--[\s\S]*?-->/g, "");
const listed = [...modinfo.matchAll(/<Item>(data\/[^<]+)<\/Item>/g)].map((m) => m[1]);
assert.equal(new Set(listed).size, listed.length, "a data file is listed twice in the modinfo");
assert.deepEqual([...listed].sort(), fs.readdirSync(DATA).map((f) => `data/${f}`).sort(), "modinfo and data/ differ");

// 6. The live compiled database, for the age it holds.
const live = path.join(os.homedir(), "Library/Application Support/Civilization VII/Debug/gameplay-copy.sqlite");
if (!fs.existsSync(live)) {
  console.warn(`data: SKIPPED the live database check (no ${live}); the dumps were checked instead`);
} else {
  const query = (/** @type {string} */ sql) =>
    execFileSync("sqlite3", ["-readonly", live, sql], { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  const liveUnits = new Set(query("SELECT UnitType FROM Units"));
  const liveResources = new Set(query("SELECT ResourceType FROM Resources"));
  const liveAge = AGES.find((age) => [...buildGateMap(dumps[age]).keys()].every((u) => liveUnits.has(u)));
  for (const age of AGES) {
    for (const resource of gatedResources(age)) assert.ok(liveResources.has(resource), `${resource} not in live DB`);
  }
  assert.ok(liveResources.has("RESOURCE_CRABS"), "the re-check resource is not in the live DB");
  if (liveAge) {
    console.log(`data: live database holds ${liveAge}; all ${buildGateMap(dumps[liveAge]).size} gated units present`);
  } else {
    console.warn("data: the live database holds none of the dumped ages in full (another mod set?); dumps checked");
  }
}

console.log(`data harness passed (${modifiersChecked} modifiers in ${groups.length} groups, ` +
  `${Object.values(EXPECTED).flatMap((r) => Object.values(r)).flat().length} gated units)`);
