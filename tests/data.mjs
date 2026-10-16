import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildFiles, CURVE_THRESHOLDS, GATES_OPTION, gateLineFor, gateParameters, ICON_PATHS, LEVELS, PEDIA, pediaGateTag,
  PREVIEW_TEXT, remapId, remapLabelTag, resourceNameTag
} from "../scripts/build-data.mjs";
import {
  AGES, AGE_FILE, STRENGTHS, VANILLA_PER_COPY, KILL_TIER_UNITS, LOCKED_TRAIT, MINOR_CIV_TRAIT, buildGateMap,
  gatedResources, lineCopies, lineLocks, upgradeOnlyGatedUnits
} from "../scripts/gate-map.mjs";

// Data gate: the invariants that crash the game or mislead it, checked on the files that ship.
//   - data/ is exactly what scripts/build-data.mjs writes (no hand edit drifts from the gate map).
//   - No player-resource requirement on an EFFECT_ATTACH_MODIFIERS parent: it crashes the game (DESIGN.md 7b).
//   - Every modifier is reached: attached by a parent in the same file, or registered in GameModifiers by its group.
//   - Every requirement on a child is a known shape, and every cancel equals its penalty.
//   - No strength row can reach a unit whose base value for that strength is 0: a melee unit has ranged and bombard 0
//     because it has no such attack, and a row that moved it off 0 could turn on ranged behaviour.
//   - Every penalty and every curve step has exactly one combat preview line, behind the same requirements, and a
//     preview line never changes combat (Amount 0). No other modifier carries a string, and the mod adds no string
//     to a modifier it does not define.
//   - The gate lists per age are the ones written into DESIGN.md section 4.
//   - The hard gate's files (sr-<age>-gate-<value>.xml) set Units.StrategicResource on exactly the gated units of
//     the age, write exactly the six STRATEGIC_RESOURCE_MINIMUM parameters (upgrading 0 under Training, 1 under
//     Training and upgrade, healing 0), carry one page line per gated unit, and touch no other table; no other
//     file sets the column (DESIGN.md 7f). Nothing of the gate reaches independents: the engine's own exemption
//     covers them, and the files carry no grant and no trait.
//   - The line files (sr-<age>-gate-lines.sql) make exactly lineLocks' units grant-only, each statement guarded by
//     its unit so a missing DLC skips it, every grant on the major players, the traits changed last, and no unit
//     upgrade row deleted (an upgrade into a gated unit works once the player holds the resource). The copies
//     (lineCopies) come last, each from a temp table that is dropped, each adding exactly one upgrade row, with an
//     icon in sr-line-icons.xml and a remap with a labelled checkbox in sr-line-visuals.xml.
//   - Every unit and resource the data names exists in the game's tables, as dumped from lab games
//     (devtools/gate-map/<age>.json) and, for the age last played, in the live compiled database
//     (Debug/gameplay-copy.sqlite). The live check is skipped with a message when that file is absent.

const DATA = "data";
const read = (/** @type {string} */ f) => fs.readFileSync(path.join(DATA, f), "utf8");
/** The [unit, tag] rows of an age's supply file, each statement guarded by `FROM Types WHERE Type IN (...)`. */
const supplyRows = (/** @type {string} */ age) => [...read(`sr-${AGE_FILE[age]}-supply.sql`)
  .matchAll(/INSERT OR IGNORE INTO TypeTags \(Type, Tag\) SELECT Type, '([A-Z_]+)' FROM Types WHERE Type IN \(([^)]*)\);/g)]
  .flatMap((m) => [...m[2].matchAll(/'([A-Z0-9_]+)'/g)].map((u) => [u[1], m[1]]));

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
const STAT_OF = Object.fromEntries(STRENGTHS.map(({ type, stat }) => [type, stat]));

/** @type {Map<string, { stats: Map<string, any>, tagsOf: Map<string, Set<string>> }>} per age: unit stats and tags */
const ageUnits = new Map();
for (const age of AGES) {
  const dump = JSON.parse(fs.readFileSync(path.join("devtools/gate-map", `${AGE_FILE[age]}.json`), "utf8"));
  const tagsOf = new Map();
  const tagRows = [...dump.tags,
    ...supplyRows(age).map(([Type, Tag]) => ({ Type, Tag }))];
  for (const row of tagRows) {
    if (!tagsOf.has(row.Type)) tagsOf.set(row.Type, new Set());
    tagsOf.get(row.Type).add(row.Tag);
  }
  ageUnits.set(age, { stats: new Map(dump.units.map((u) => [u.UnitType, u])), tagsOf });
}

/** A strength row: a known type, and every unit its tags reach has that strength above 0. */
function checkStrengthRow(/** @type {string} */ age, /** @type {string} */ base, /** @type {ModifierInfo} */ m) {
  const stat = STAT_OF[m.args.Type];
  assert.ok(stat, `${base}: ${m.id} changes strength type ${m.args.Type}; only MELEE, RANGED and BOMBARD are used`);
  const tags = [...m.body.matchAll(/<Argument name="Tag">([^<]+)<\/Argument>/g)].map((t) => t[1]);
  const { stats, tagsOf } = ageUnits.get(age);
  let reached = 0;
  for (const [unit, unitTags] of tagsOf) {
    if (!tags.some((t) => unitTags.has(t)) || !stats.has(unit)) continue;
    reached += 1;
    assert.ok(Number(stats.get(unit)[stat]) > 0,
      `${base}: ${m.id} (${m.args.Type}) reaches ${unit}, whose base ${stat} is ${stats.get(unit)[stat]}`);
  }
  assert.ok(reached > 0, `${base}: ${m.id} reaches no unit`);
}
let modifiersChecked = 0;

/** The owner requirements of a modifier, as written. @param {ModifierInfo} m */
function ownerShapes(m) {
  const section = (m.body.match(/<OwnerRequirements>([\s\S]*?)<\/OwnerRequirements>/) || ["", ""])[1];
  return [...section.matchAll(/<Requirement type="([^"]+)"( inverse="true")?>([\s\S]*?)<\/Requirement>/g)].map((r) => ({
    type: r[1], inverse: Boolean(r[2]),
    resource: (r[3].match(/name="ResourceType">([^<]+)</) || [])[1], amount: Number((r[3].match(/name="Amount">(\d+)</) || [])[1])
  }));
}
/** @param {ModifierInfo} m */
const subjectTags = (m) => [...(m.body.match(/<SubjectRequirements[^>]*>([\s\S]*?)<\/SubjectRequirements>/) || ["", ""])[1]
  .matchAll(/<Argument name="Tag">([^<]+)<\/Argument>/g)].map((t) => t[1]);

/**
 * A preview line: a strength modifier of 0 on the combat collection, with one Preview string.
 * @param {string} base @param {ModifierInfo} m @param {string} text
 */
function checkPreviewLine(base, m, text) {
  assert.equal(m.effect, "EFFECT_ADJUST_UNIT_STRENGTH_MODIFIER", `${base}: ${m.id} effect`);
  assert.equal(m.collection, "COLLECTION_PLAYER_COMBAT", `${base}: ${m.id} collection`);
  assert.equal(m.args.Amount, "0", `${base}: ${m.id} is a preview line and must not change combat`);
  const strings = [...m.body.matchAll(/<String context="([^"]+)">([^<]+)<\/String>/g)].map((x) => `${x[1]}:${x[2]}`);
  assert.deepEqual(strings, [`Preview:${text}`], `${base}: ${m.id} strings`);
}
let previewLines = 0;

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
    if (m.effect === "EFFECT_ADJUST_UNIT_BASE_COMBAT_STRENGTH") checkStrengthRow(age, base, m);
    if (!m.id.startsWith("SR_PREVIEW_")) {
      assert.ok(!/<String\b/.test(m.body), `${base}: ${m.id} carries a string; only preview lines do`);
      assert.notEqual(m.effect, "EFFECT_ADJUST_UNIT_STRENGTH_MODIFIER", `${base}: ${m.id} is a combat-time change`);
    }
    modifiersChecked += 1;
  }
  if (kind !== "curve") {
    const level = LEVELS[/** @type {keyof typeof LEVELS} */ (kind)];
    for (const resource of gatedResources(age)) {
      const name = resource.replace("RESOURCE_", "");
      for (const prefix of ["SR_COMBAT", "SR_RANGED", "SR_BOMBARD"]) {
        const penalty = byId.get(`${prefix}_PENALTY_${name}`);
        if (!penalty) continue;
        assert.equal(Number(byId.get(`${prefix}_SUPPLIED_${name}`)?.args.Amount), -level.combat, `${base} ${prefix}`);
        assert.equal(byId.get(`${prefix}_SUPPLIED_${name}`)?.args.Type, penalty.args.Type, `${base} ${prefix} type`);
      }
      assert.equal(Number(byId.get(`SR_COMBAT_PENALTY_${name}`)?.args.Amount), level.combat, `${base} ${name}`);
      assert.equal(Number(byId.get(`SR_COMBAT_SUPPLIED_${name}`)?.args.Amount), -level.combat, `${base} ${name}`);
      assert.equal(Number(byId.get(`SR_PRODUCTION_PENALTY_${name}`)?.args.Percent), level.productionPercent);
      assert.equal(Number(byId.get(`SR_PRODUCTION_SUPPLIED_${name}`)?.args.Percent), -level.productionPercent);
      assert.equal(byId.get(`SR_PRODUCTION_PENALTY_${name}`)?.args.UnitClass, `SR_SUPPLY_${name}`);
      // The penalty is unconditional; only the cancel waits for the resource.
      assert.equal(byId.get(`SR_COMBAT_PENALTY_${name}`)?.ownerRequirements.length, 0);
      const cancel = byId.get(`SR_COMBAT_SUPPLIED_${name}`)?.body ?? "";
      assert.match(cancel, new RegExp(`<Argument name="ResourceType">${resource}<`));
      // One preview line, shown exactly while the penalty stands: no copy held, on the units the penalty reaches.
      const line = byId.get(`SR_PREVIEW_PENALTY_${name}`);
      assert.ok(line, `${base}: no preview line for ${name}`);
      checkPreviewLine(base, line, PREVIEW_TEXT.penalty);
      assert.deepEqual(ownerShapes(line), [{ type: "REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE", inverse: true, resource,
        amount: 1 }], `${base}: ${line.id} owner requirement`);
      assert.deepEqual(subjectTags(line), [`SR_SUPPLY_${name}`], `${base}: ${line.id} subject`);
      assert.equal(Number(line.args.Combat), level.combat, `${base}: ${line.id} names the wrong penalty`);
      assert.equal(line.args.Resource, resourceNameTag(resource), `${base}: ${line.id} resource name`);
      previewLines += 1;
    }
    assert.equal(modifiers.filter((m) => m.id.startsWith("SR_PREVIEW_")).length, gatedResources(age).length,
      `${base}: preview lines`);
  } else {
    const thresholds = modifiers.filter((m) => m.id.startsWith("SR_CURVE_"))
      .map((m) => Number((m.body.match(/<Argument name="Amount">(\d+)<\/Argument>\s*<\/Requirement>/) || [])[1]));
    assert.ok(thresholds.length > 0 && thresholds.every((t) => CURVE_THRESHOLDS.includes(t)), `${base} thresholds`);
    // One preview line per curve step, shown from its threshold up to the next, so a unit shows one curve line.
    for (const { resource, tags } of VANILLA_PER_COPY[age]) {
      const name = resource.replace("RESOURCE_", "");
      CURVE_THRESHOLDS.forEach((threshold, step) => {
        const line = byId.get(`SR_PREVIEW_CURVE_${name}_${threshold}`);
        assert.ok(line, `${base}: no preview line for ${name} at ${threshold}`);
        checkPreviewLine(base, line, PREVIEW_TEXT.curve);
        const next = CURVE_THRESHOLDS[step + 1];
        assert.deepEqual(ownerShapes(line), [
          { type: "REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE", inverse: false, resource, amount: threshold },
          ...(next ? [{ type: "REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE", inverse: true, resource, amount: next }] : [])
        ], `${base}: ${line.id} owner requirements`);
        assert.deepEqual(subjectTags(line), tags, `${base}: ${line.id} subject`);
        assert.equal(Number(line.args.Combat), step + 1, `${base}: ${line.id} names the wrong step`);
        assert.equal(Number(line.args.Copies), threshold, `${base}: ${line.id} copies`);
        assert.equal(line.args.Resource, resourceNameTag(resource), `${base}: ${line.id} resource name`);
        previewLines += 1;
      });
    }
    assert.equal(modifiers.filter((m) => m.id.startsWith("SR_PREVIEW_")).length,
      VANILLA_PER_COPY[age].length * CURVE_THRESHOLDS.length, `${base}: preview lines`);
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
    RESOURCE_NITER: ["UNIT_BOMBARD", "UNIT_CARRACK", "UNIT_CETBANG_2", "UNIT_CETBANG_3", "UNIT_CORSAIR_2",
      "UNIT_CORSAIR_3", "UNIT_GALLEON", "UNIT_HWACHA_3", "UNIT_KALAM_2", "UNIT_KALAM_3", "UNIT_VIKINGR_2",
      "UNIT_VIKINGR_3"]
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
  const tagged = supplyRows(age).filter(([, tag]) => tag.startsWith("SR_SUPPLY_"));
  const known = new Set(dumps[age].units.map((/** @type {{ UnitType: string }} */ u) => u.UnitType));
  assert.ok(tagged.length, `${age}: no SR_SUPPLY_ rows read from the supply file`);
  for (const [unit] of tagged) assert.ok(known.has(unit), `${age}: ${unit} is not a unit of this age`);
}

// The only gated units nobody trains that an upgrade leads to are the Samurai tiers 2 and 3 (DESIGN.md 7e, 7f).
// This pins that finding to the dumps.
assert.deepEqual(AGES.flatMap((age) => upgradeOnlyGatedUnits(dumps[age])),
  dumps.AGE_EXPLORATION.upgrades.length ? ["UNIT_SAMURAI_2", "UNIT_SAMURAI_3"] : []);
// The units the game tiers up by kills are among them, and gated, so their page line is the one that matters.
for (const unit of KILL_TIER_UNITS) {
  assert.ok(upgradeOnlyGatedUnits(dumps.AGE_EXPLORATION).includes(unit), `${unit}: a kill tier the gate map holds`);
}
// The hard gate: the column only in the gate files, exactly the gate map, with the engine's parameters.
const GATE_FILE = /^sr-(antiquity|exploration|modern)-gate-(training|upgrade)\.xml$/;
let gateUnits = 0;
for (const f of fs.readdirSync(DATA)) {
  const xml = read(f);
  const match = f.match(GATE_FILE);
  if (!match) {
    assert.ok(!/StrategicResource\s*=|StrategicResource="/.test(xml), `${f} sets Units.StrategicResource outside a gate file`);
    assert.ok(!/GlobalParameters/.test(xml), `${f} writes global parameters outside a gate file`);
    continue;
  }
  const age = AGES.find((a) => AGE_FILE[a] === match[1]);
  const gateName = /** @type {keyof typeof GATES_OPTION} */ (match[2]);
  const gates = buildGateMap(dumps[age]);
  const updates = [...xml.matchAll(/<Update><Where UnitType="([A-Z0-9_]+)"\/><Set StrategicResource="([A-Z_]+)"\/><\/Update>/g)]
    .map((m) => [m[1], m[2]]);
  assert.deepEqual(updates, [...gates], `${f}: the column rows differ from the gate map`);
  const params = [...xml.matchAll(/<Replace Name="([A-Z_]+)" Value="(\d+)"\/>/g)].map((m) => [m[1], Number(m[2])]);
  assert.deepEqual(params, gateParameters(GATES_OPTION[gateName].upgrading), `${f}: parameters`);
  assert.equal(params.find(([n]) => n.endsWith("UNIT_HEALING"))?.[1], 0, `${f}: healing must stay free`);
  assert.equal(params.find(([n]) => n.endsWith("UNIT_UPGRADING"))?.[1], gateName === "upgrade" ? 1 : 0,
      `${f}: upgrading`);
  const lines = [...xml.matchAll(/<Row SectionID="UNITS" PageID="([A-Z0-9_]+)" ChapterID="([A-Z_]+)" Paragraph="([A-Z0-9_]+)" SortIndex="10"\/>/g)];
  assert.deepEqual(lines.map((m) => m[1]), [...gates.keys()], `${f}: one page line per gated unit`);
  for (const [, unit, chapter, tag] of lines) {
    assert.equal(chapter, PEDIA.unitGateChapter, `${f} ${unit}: chapter`);
    assert.equal(tag, pediaGateTag(gates.get(unit) ?? "", gateLineFor(unit, gateName)), `${f} ${unit}: line`);
  }
  // The Samurai tiers come by kills, which the game grants without asking for Iron (watch run 2, block 1, X1), so
  // their pages say "trained or bought" under both values, never "upgraded into".
  if (match[1] === "exploration" && gates.size) {
    for (const unit of KILL_TIER_UNITS) {
      const line = lines.find((m) => m[1] === unit);
      assert.equal(line?.[3], "LOC_SR_PEDIA_UNIT_IRON_GATE_TRAINING", `${f} ${unit}: the kill tier-up line`);
    }
  }
  const tables = [...xml.matchAll(/^ {4}<([A-Za-z]+)>$/gm)].map((m) => m[1]);
  assert.deepEqual(tables, ["Units", "GlobalParameters", "CivilopediaPageChapterParagraphs"], `${f}: tables`);
  assert.ok(!/Modifier|Requirement|TraitType|CanTrain/.test(xml), `${f}: the gate is the column and its parameters only`);
  gateUnits += updates.length;
}
// The copies, pinned: the four civilizations whose unique stands in for a line target without a line of its own.
const copyList = (/** @type {string} */ age) => lineCopies(dumps[age]).map((c) => `${c.unit}>${c.upgradeTo}`);
assert.deepEqual(Object.fromEntries(AGES.map((age) => [age, copyList(age)])), {
  AGE_ANTIQUITY: ["UNIT_WARRIOR_SR_PERSIA>UNIT_IMMORTAL", "UNIT_WARRIOR_SR_ROME>UNIT_LEGION"],
  AGE_EXPLORATION: [],
  AGE_MODERN: ["UNIT_FRIGATE_SR_GREAT_BRITAIN>UNIT_REVENGE", "UNIT_FRIGATE_SR_MEIJI>UNIT_MIKASA"]
}, "the copies");
{
  const all = AGES.flatMap((age) => lineCopies(dumps[age]));
  const icons = read("sr-line-icons.xml");
  const visuals = read("sr-line-visuals.xml");
  for (const c of all) {
    assert.ok(icons.includes(`<Row><ID>${c.unit}</ID><Path>${ICON_PATHS[c.base]}</Path></Row>`), `${c.unit}: icon`);
    assert.ok(visuals.includes(`<Row><ID>${remapId(c)}</ID><DisplayName>${remapLabelTag(c)}</DisplayName>` +
      `<Kind>UNIT</Kind><From>${c.unit}</From><To>${c.base}</To></Row>`), `${c.unit}: remap`);
  }
  assert.equal((visuals.match(/<Row>/g) ?? []).length, all.length, "one remap per copy");
}
// The line locks, pinned: every gated unit a free unit upgrades into, and every gated unique that replaces one.
// Not the Samurai tiers (tier 2 and 3 are reached only by upgrade).
const lockList = (/** @type {string} */ age) => lineLocks(dumps[age]).map((l) => `${l.unit}:${l.kind}`);
assert.deepEqual(Object.fromEntries(AGES.map((age) => [age, lockList(age)])), {
  AGE_ANTIQUITY: ["UNIT_GAISATAI_2:unique", "UNIT_HOPLITE_2:unique", "UNIT_IMMORTAL:unique", "UNIT_LEGION:unique",
    "UNIT_MEDJAY_2:unique", "UNIT_SPEARMAN:base"],
  AGE_EXPLORATION: ["UNIT_BOMBARD:base", "UNIT_CARRACK:base", "UNIT_CETBANG_2:unique", "UNIT_CORSAIR_2:granted",
    "UNIT_GOLD_BANGLES_2:unique", "UNIT_HWACHA_3:unique", "UNIT_KALAM_2:unique", "UNIT_KISPOKO_NENA_TO_2:unique",
    "UNIT_LEIOMANO_2:unique", "UNIT_MAN_AT_ARMS:base", "UNIT_TERCIO_2:unique", "UNIT_VIKINGR_2:unique",
    "UNIT_XUNLEICHONG_2:unique"],
  AGE_MODERN: ["UNIT_COSSACK_2:unique", "UNIT_DREADNOUGHT:base", "UNIT_GHILMAN_2:unique", "UNIT_HUSSAR_2:unique",
    "UNIT_LANDSHIP:base", "UNIT_MIKASA:unique", "UNIT_REVENGE:unique", "UNIT_TURTLE_SHIP_2:unique"]
}, "the line locks");
for (const age of AGES) {
  const f = `sr-${AGE_FILE[age]}-gate-lines.sql`;
  const sql = read(f);
  const locks = lineLocks(dumps[age]);
  for (const lock of locks) {
    assert.equal(lock.resource, buildGateMap(dumps[age]).get(lock.unit), `${f} ${lock.unit}: resource`);
    assert.ok(sql.includes(`-- ${lock.unit}: ${lock.kind}, needs ${lock.resource}`), `${f}: ${lock.unit} missing`);
  }
  const statements = sql.split(";\n").map((x) => x.replace(/^(--[^\n]*\n|\s)+/, "")).filter(Boolean);
  for (const st of statements) {
    if (st === "INSERT INTO Modifiers SELECT * FROM sr_mods") continue; // the reward twins, from a guarded temp table
    if (/^INSERT (OR IGNORE )?INTO (Modifiers|GameModifiers|RequirementSets) /.test(st)) {
      assert.ok(/ FROM Units WHERE UnitType = '/.test(st), `${f}: unguarded statement: ${st.slice(0, 120)}`);
    }
  }
  assert.ok(!/DELETE FROM UnitUpgrades|UPDATE UnitUpgrades/.test(sql), `${f} removes or changes an upgrade row`);
  const copies = lineCopies(dumps[age]);
  const copyBlocks = [...sql.matchAll(/^-- (UNIT_[A-Z_]+): this civilization's (UNIT_[A-Z_]+), standing in for it and upgrading straight into (UNIT_[A-Z_]+)\./gm)]
    .map((m) => [m[1], m[2], m[3]]);
  assert.deepEqual(copyBlocks, copies.map((c) => [c.unit, c.base, c.upgradeTo]), `${f}: the copies`);
  assert.equal((sql.match(/^CREATE TEMP TABLE /gm) ?? []).length, (sql.match(/^DROP TABLE /gm) ?? []).length,
    `${f}: every temp table dropped`);
  assert.equal((sql.match(/INSERT INTO UnitUpgrades /g) ?? []).length, copies.length, `${f}: one upgrade row per copy`);
  for (const c of copies) {
    assert.ok(sql.includes(`CREATE TEMP TABLE sr_copy AS SELECT * FROM Units WHERE UnitType = '${c.base}'\n    ` +
      `AND EXISTS (SELECT 1 FROM Units WHERE UnitType = '${c.upgradeTo}' AND TraitType = '${LOCKED_TRAIT}')`),
    `${f} ${c.unit}: the copy is guarded by its unique being locked`);
    assert.ok(ICON_PATHS[c.base], `${c.unit}: no icon path for ${c.base}`);
    assert.ok(sql.includes(`-- Story rewards that make ${c.base} cheaper get a twin for ${c.unit}.`),
      `${f}: ${c.unit} twins`);
    if (copies.length) assert.ok(sql.indexOf("UPDATE Units SET TraitType") < sql.indexOf(`-- ${c.unit}:`),
      `${f}: ${c.unit} made after the traits change`);
  }
  assert.ok(!/StrategicResource/.test(sql), `${f} sets the column`);
  assert.ok(!/COLLECTION_ALL_PLAYERS|COLLECTION_INDEPENDENT/.test(sql), `${f}: a grant beyond the major players`);
  const updates = [...sql.matchAll(/^UPDATE Units SET TraitType = '([A-Z_]+)' WHERE UnitType IN \(([^)]*)\)/gm)]
    .map((m) => [m[1], m[2].split(", ").map((u) => u.replace(/'/g, ""))]);
  assert.deepEqual(updates, [
    [MINOR_CIV_TRAIT, locks.filter((l) => l.kind === "base").map((l) => l.unit)],
    [LOCKED_TRAIT, locks.filter((l) => l.kind === "unique").map((l) => l.unit)]
  ].filter(([, units]) => units.length), `${f}: the trait changes`);
  const traitsAt = sql.indexOf("UPDATE Units SET TraitType");
  assert.ok(sql.lastIndexOf("'SR_LINE_GRANT_TYPE'") < traitsAt && sql.lastIndexOf("SR_LINE_IS_") < traitsAt,
    `${f}: the traits change after every grant and requirement is in`);
}
assert.equal(gateUnits, 2 * Object.values(EXPECTED).flatMap((r) => Object.values(r)).flat().length, "gate rows");
// Strings only inside the mod's own modifiers (checked above); no file adds one to a modifier of the game's.
assert.ok(!fs.readdirSync(DATA).some((f) => /ModifierStrings/.test(read(f))), "data writes ModifierStrings rows");
// A tag row for a unit the player's game lacks (a DLC they don't own, a unit an update removed) fails the TypeTags
// foreign key, and the game won't start. Every tag insert must go through Types.
for (const f of fs.readdirSync(DATA)) {
  assert.ok(!/<TypeTags>/.test(read(f)), `${f}: TypeTags rows in XML can't skip a missing unit; use the guarded SQL`);
  for (const m of read(f).matchAll(/INSERT[^;]*INTO TypeTags[^;]*;/g)) {
    // The copies' tags come through a temp table filled only when the copied unit exists, after the copy's Types row.
    if (m[0] === "INSERT INTO TypeTags SELECT * FROM sr_rows;" ||
      m[0] === "INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT UnitType, 'SR_LINE_PLAIN' FROM sr_copy;") continue;
    assert.match(m[0], /SELECT Type, '[A-Z_]+' FROM Types WHERE Type IN \(/, `${f}: an unguarded TypeTags insert`);
  }
}

// Every data file is loaded by exactly one action group, and nothing else is; the line files by both gate values',
// the remaps by the shell and the game, as the game's own.
const modinfo = fs.readFileSync("strategic-resources-that-matter.modinfo", "utf8").replace(/<!--[\s\S]*?-->/g, "");
const listed = [...modinfo.matchAll(/<Item>(data\/[^<]+)<\/Item>/g)].map((m) => m[1]);
for (const item of new Set(listed)) {
  const twice = item.endsWith("-gate-lines.sql") || item.endsWith("sr-line-visuals.xml");
  assert.equal(listed.filter((x) => x === item).length, twice ? 2 : 1,
    `${item}: listed the wrong number of times in the modinfo`);
}
assert.deepEqual([...new Set(listed)].sort(), fs.readdirSync(DATA).map((f) => `data/${f}`).sort(),
  "modinfo and data/ differ");

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
  if (liveUnits.size === 0) {
    // The game writes this copy at the main menu too, before any age is loaded; there is nothing to check in it.
    console.warn("data: SKIPPED the live database check (the copy holds no game); the dumps were checked instead");
  } else if (liveAge) {
    // The compiled database holds one age, so only that age's resources can be expected in it.
    assert.ok(liveResources.has("RESOURCE_CRABS"), "the re-check resource is not in the live DB");
    for (const resource of gatedResources(liveAge)) {
      assert.ok(liveResources.has(resource), `${resource} not in live DB`);
      // The preview lines name the resource by the game's own name tag.
      assert.deepEqual(query(`SELECT Name FROM Resources WHERE ResourceType = '${resource}'`),
        [resourceNameTag(resource)]);
    }
    console.log(`data: live database holds ${liveAge}; all ${buildGateMap(dumps[liveAge]).size} gated units present`);
  } else {
    console.warn("data: the live database holds none of the dumped ages in full (another mod set?); dumps checked");
  }
}

// The paragraph table keeps one row per section, page and chapter; a second insert rolls back the whole file and the
// game never loads. Rows may share a key only across files of one option (the levels of an age, or the gate values
// of an age), which never load together.
const family = (/** @type {string} */ file) => file
  .replace(/^sr-(antiquity|exploration|modern)-(light|standard|harsh)-game\.xml$/, "$1 level")
  .replace(/^sr-(antiquity|exploration|modern)-gate-(training|upgrade)\.xml$/, "$1 gate");
/** @type {Map<string, string[]>} */
const paragraphKeys = new Map();
for (const file of fs.readdirSync("data").filter((name) => name.endsWith(".xml"))) {
  const xml = fs.readFileSync(`data/${file}`, "utf8");
  for (const m of xml.matchAll(/<Row SectionID="([A-Z_]+)" PageID="([A-Z0-9_]+)" ChapterID="([A-Z0-9_]+)" Paragraph=/g)) {
    const key = `${m[1]} ${m[2]} ${m[3]}`;
    paragraphKeys.set(key, [...(paragraphKeys.get(key) ?? []), file]);
  }
}
for (const [key, files] of paragraphKeys) {
  assert.equal(new Set(files).size, files.length, `${key}: twice in one file`);
  assert.equal(new Set(files.map(family)).size, 1, `${key}: in files that load together: ${files.join(", ")}`);
}

console.log(`data harness passed (${modifiersChecked} modifiers in ${groups.length} groups, ` +
  `${previewLines} preview lines, ${gateUnits} gate rows, ` +
  `${Object.values(EXPECTED).flatMap((r) => Object.values(r)).flat().length} gated units)`);
