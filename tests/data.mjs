import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildFiles, CURVE_THRESHOLDS, eitherTag, ELEPHANT_MODIFIER, GATES_OPTION, gateLineFor, gateParameters, ICON_PATHS,
  LEVELS, lineHasAny, PEDIA, pediaGateTag, PREVIEW_TEXT, remapId, remapLabelTag, resourceNameTag, supplyNameTag
} from "../scripts/build-data.mjs";
import {
  AGES, AGE_FILE, ALTERNATIVES, CHAINS, ELEPHANT_TAG, ELEPHANTS, STRENGTHS, VANILLA_PER_COPY, KILL_TIER_UNITS,
  LOCKED_TRAIT, MINOR_CIV_TRAIT, buildChainMap, buildGateMap, chainLocks, columnMap, gatedResources, lineCopies,
  lineLocks, suppliers, upgradeOnlyGatedUnits
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
//   - A resource with stand-ins (gate-map.mjs ALTERNATIVES, pinned below: Pitch for Hardwood in Exploration) has its
//     penalty cancelled by a copy of any of them, its preview line shown only with none of them, and its units
//     tagged SR_EITHER_<NAME>_OR_<OTHER> for the UI. Its units carry no column; the line file locks each one behind
//     an any-of set of the resources.
//   - The hard gate's files (sr-<age>-gate-<value>.xml) set Units.StrategicResource on exactly the gated units of
//     the age that have no stand-ins, write exactly the six STRATEGIC_RESOURCE_MINIMUM parameters (upgrading 0
//     under Training, 1 under Training and upgrade, healing 0), carry one page line per gated unit, and touch no
//     other table; no other file sets the column (DESIGN.md 7f). Nothing of the gate reaches independents: the engine's own exemption
//     covers them, and the files carry no grant and no trait.
//   - The line files (sr-<age>-gate-lines.sql) make exactly lineLocks' units grant-only, each statement guarded by
//     its unit so a missing DLC skips it, every grant on the major players, the traits changed last, and no unit
//     upgrade row deleted (an upgrade into a gated unit works once the player holds the resource). The copies
//     (lineCopies) come last, each from a temp table that is dropped, each adding exactly one upgrade row, with an
//     icon in sr-line-icons.xml and a remap with a labelled checkbox in sr-line-visuals.xml.
//   - The chains file (sr-<age>-chains.sql, Modern Supply Chains) tags every gated unit of the age with its second
//     resource (gate-map.mjs CHAINS, pinned below), each resource one the age's penalty files already carry, and
//     locks every gated unit behind both resources with the same grant-only shape as the lines, every grant OR
//     IGNORE and guarded by the unit's column, so the file loads under its one setup value and does nothing until
//     a locked level has set the column (DESIGN.md 7h).
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
/** The tags a subject set turns away (inverse tag requirements). @param {ModifierInfo} m */
const excludedTags = (m) => [...(m.body.match(/<SubjectRequirements[^>]*>([\s\S]*?)<\/SubjectRequirements>/) || ["", ""])[1]
  .matchAll(/<Requirement type="REQUIREMENT_UNIT_TAG_MATCHES" inverse="true">\s*<Argument name="Tag">([^<]+)<\/Argument>/g)]
  .map((t) => t[1]);

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
      // A copy of the resource or of any stand-in cancels it: an any-of owner set naming each.
      for (const prefix of ["SR_COMBAT", "SR_RANGED", "SR_BOMBARD", "SR_PRODUCTION"]) {
        const body = byId.get(`${prefix}_SUPPLIED_${name}`)?.body;
        if (!body) continue;
        const named = [...body.matchAll(/<Argument name="ResourceType">([A-Z_]+)</g)].map((r) => r[1]);
        assert.deepEqual(named, suppliers(age, resource), `${base} ${prefix}_SUPPLIED_${name}: resources`);
        assert.equal(/<OwnerRequirements type="REQUIREMENTSET_TEST_ANY">/.test(body), named.length > 1,
          `${base} ${prefix}_SUPPLIED_${name}: any-of only with stand-ins`);
      }
      // One preview line, shown exactly while the penalty stands: no copy held, on the units the penalty reaches.
      const line = byId.get(`SR_PREVIEW_PENALTY_${name}`);
      assert.ok(line, `${base}: no preview line for ${name}`);
      checkPreviewLine(base, line, PREVIEW_TEXT.penalty);
      assert.deepEqual(ownerShapes(line), suppliers(age, resource).map((r) => ({
        type: "REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE", inverse: true, resource: r, amount: 1
      })), `${base}: ${line.id} owner requirement`);
      assert.deepEqual(subjectTags(line), [`SR_SUPPLY_${name}`], `${base}: ${line.id} subject`);
      assert.equal(Number(line.args.Combat), level.combat, `${base}: ${line.id} names the wrong penalty`);
      assert.equal(line.args.Resource, supplyNameTag(age, resource), `${base}: ${line.id} resource name`);
      previewLines += 1;
    }
    assert.equal(modifiers.filter((m) => m.id.startsWith("SR_PREVIEW_")).length, gatedResources(age).length,
      `${base}: preview lines`);
  } else {
    const thresholds = modifiers.filter((m) => m.id.startsWith("SR_CURVE_"))
      .map((m) => Number((m.body.match(/<Argument name="Amount">(\d+)<\/Argument>\s*<\/Requirement>/) || [])[1]));
    assert.ok(thresholds.length > 0 && thresholds.every((t) => CURVE_THRESHOLDS.includes(t)), `${base} thresholds`);
    // One preview line per curve step, shown from its threshold up to the next, so a unit shows one curve line.
    for (const { resource, tags, exclude = [] } of VANILLA_PER_COPY[age]) {
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
        assert.deepEqual(subjectTags(line), [...tags, ...exclude], `${base}: ${line.id} subject`);
        assert.deepEqual(excludedTags(line), exclude, `${base}: ${line.id} exclusions`);
        // The strength step itself turns the same units away (the war elephants out of the Horses steps).
        assert.deepEqual(excludedTags(/** @type {*} */ (byId.get(`SR_CURVE_${name}_${threshold}`))), exclude,
          `${base}: SR_CURVE_${name}_${threshold} exclusions`);
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
    RESOURCE_HORSES: ["UNIT_CHARIOT", "UNIT_HORSEMAN", "UNIT_MAGARRU", "UNIT_MAGARRU_2", "UNIT_NUMIDIAN_CAVALRY",
      "UNIT_NUMIDIAN_CAVALRY_2"],
    RESOURCE_IVORY: ["UNIT_DANTINAS_TATHA", "UNIT_DANTINAS_TATHA_2", "UNIT_PURABHETTARAH", "UNIT_PURABHETTARAH_2"],
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
    RESOURCE_NITER: ["UNIT_BOMBARD", "UNIT_HWACHA_3"],
    RESOURCE_HARDWOOD: ["UNIT_CARRACK", "UNIT_CETBANG_2", "UNIT_CETBANG_3", "UNIT_CORSAIR_2", "UNIT_CORSAIR_3",
      "UNIT_GALLEON", "UNIT_KALAM_2", "UNIT_KALAM_3", "UNIT_VIKINGR_2", "UNIT_VIKINGR_3"]
  },
  AGE_MODERN: {
    RESOURCE_NITER: ["UNIT_CHANG_BEUN", "UNIT_CHANG_BEUN_2", "UNIT_FIELD_CANNON", "UNIT_FIELD_GUN"],
    RESOURCE_HORSES: ["UNIT_COSSACK", "UNIT_CUIRASSIER", "UNIT_GHILMAN", "UNIT_HUSSAR"],
    RESOURCE_OIL: ["UNIT_ASSAULT_GUN", "UNIT_AT_GUN", "UNIT_BATTLESHIP", "UNIT_CHANG_BEUN_3", "UNIT_COSSACK_2",
      "UNIT_COSSACK_3", "UNIT_DREADNOUGHT", "UNIT_GHILMAN_2", "UNIT_GHILMAN_3", "UNIT_HEAVY_ARTILLERY", "UNIT_HUSSAR_2",
      "UNIT_HUSSAR_3", "UNIT_KATYUSHA", "UNIT_KATYUSHA_2", "UNIT_LANDSHIP", "UNIT_MIKASA", "UNIT_MIKASA_2", "UNIT_MORTAR",
      "UNIT_REVENGE", "UNIT_REVENGE_2", "UNIT_SUBMARINE", "UNIT_TANK", "UNIT_TURTLE_SHIP_2", "UNIT_TURTLE_SHIP_3"],
    RESOURCE_HARDWOOD: ["UNIT_FRIGATE", "UNIT_TURTLE_SHIP"],
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
  // The either tags: on exactly the units of a resource with stand-ins, and defined.
  const either = supplyRows(age).filter(([, tag]) => tag.startsWith("SR_EITHER_"));
  assert.deepEqual(either, [...buildGateMap(dumps[age])].filter(([, r]) => ALTERNATIVES[age]?.[r])
    .map(([unit, r]) => [unit, eitherTag(age, r)]), `${age}: the either tags`);
  for (const [, tag] of either) {
    assert.ok(read("sr-tags.xml").includes(`<Row Tag="${tag}" Category="UNIT_CLASS"/>`), `${tag} is defined`);
  }
}
// The stand-ins, pinned: Pitch for Hardwood in Exploration only (Modern keeps its rules, Supply Chains included).
assert.deepEqual(ALTERNATIVES, { AGE_EXPLORATION: { RESOURCE_HARDWOOD: ["RESOURCE_PITCH"] }, AGE_MODERN: { RESOURCE_HARDWOOD: ["RESOURCE_PITCH"] } }, "the stand-ins");
// A tag listed twice fails sr-tags.xml at load (UNIQUE constraint on Tags.Tag), which rolls the mod back: two ages
// with the same stand-in share one SR_EITHER_ tag.
{
  const tagRows = [...read("sr-tags.xml").matchAll(/<Row Tag="([A-Z0-9_]+)"/g)].map((m) => m[1]);
  assert.deepEqual(tagRows.filter((t, i) => tagRows.indexOf(t) !== i), [], "sr-tags.xml lists a tag twice");
}

// 4b. The war elephants (1.3): their own +1 per Ivory, the game's effect on their tag, registered; the supply file
// gives them the tag and takes them out of the game's +1 per Horses through that modifier's own all-of set.
{
  const modifiers = parseModifiers(read("sr-antiquity-elephants-modifiers.xml"));
  assert.equal(modifiers.length, 1);
  const [m] = modifiers;
  assert.equal(m.id, ELEPHANT_MODIFIER);
  assert.equal(m.effect, "EFFECT_UNIT_ADJUST_COMBAT_STRENGTH_PER_RESOURCE", "the game's own per-copy effect, capped at six");
  assert.equal(m.collection, "COLLECTION_ALL_UNITS", "as the game's Horses bonus");
  assert.deepEqual([m.args.Amount, m.args.ResourceType], ["1", "RESOURCE_IVORY"]);
  assert.deepEqual(subjectTags(m), [ELEPHANT_TAG]);
  assert.deepEqual(gameModifierRows(read("sr-antiquity-elephants-game.xml")), [ELEPHANT_MODIFIER]);
  const supply = read("sr-antiquity-supply.sql");
  assert.deepEqual(supplyRows("AGE_ANTIQUITY").filter(([, t]) => t === ELEPHANT_TAG).map(([u]) => u), ELEPHANTS);
  assert.ok(supply.includes("SELECT SubjectRequirementSetId, 'SR_NOT_ELEPHANT' FROM Modifiers WHERE ModifierId = " +
    "'MOD_HORSES_CAVALRY_COMBAT_STRENGTH'"), "the Horses bonus stops at the elephants");
  assert.ok(supply.includes("RequirementSetType = 'REQUIREMENTSET_TEST_ALL'"), "only into an all-of set");
  assert.ok(read("sr-tags.xml").includes(`<Row Tag="${ELEPHANT_TAG}" Category="UNIT_CLASS"/>`), "the tag is defined");
  for (const u of ELEPHANTS) assert.equal(buildGateMap(dumps.AGE_ANTIQUITY).get(u), "RESOURCE_IVORY", `${u} on Ivory`);
  assert.ok(!read("sr-exploration-supply.sql").includes(ELEPHANT_TAG), "Antiquity only");
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
    // sr-carry-over.sql only clears it, on the units the age change carries armies into (checked below).
    const cleared = f === "sr-carry-over.sql" ? xml.replace(/SET StrategicResource = NULL/g, "") : xml;
    assert.ok(!/StrategicResource\s*=|StrategicResource="/.test(cleared),
      `${f} sets Units.StrategicResource outside a gate file`);
    assert.ok(!/<GlobalParameters>|(INSERT|REPLACE|UPDATE)\s+(OR\s+[A-Z]+\s+)?(INTO\s+)?GlobalParameters/i.test(xml),
      `${f} writes global parameters outside a gate file`);
    continue;
  }
  const age = AGES.find((a) => AGE_FILE[a] === match[1]);
  const gateName = /** @type {keyof typeof GATES_OPTION} */ (match[2]);
  const gates = buildGateMap(dumps[age]);
  const updates = [...xml.matchAll(/<Update><Where UnitType="([A-Z0-9_]+)"\/><Set StrategicResource="([A-Z_]+)"\/><\/Update>/g)]
    .map((m) => [m[1], m[2]]);
  assert.deepEqual(updates, [...columnMap(dumps[age])], `${f}: the column rows differ from the gate map`);
  assert.ok(updates.every(([, r]) => !ALTERNATIVES[age]?.[r]), `${f}: a column on a unit with stand-ins`);
  const params = [...xml.matchAll(/<Replace Name="([A-Z_]+)" Value="(\d+)"\/>/g)].map((m) => [m[1], Number(m[2])]);
  assert.deepEqual(params, gateParameters(GATES_OPTION[gateName].upgrading), `${f}: parameters`);
  assert.equal(params.find(([n]) => n.endsWith("UNIT_HEALING"))?.[1], 0, `${f}: healing must stay free`);
  assert.equal(params.find(([n]) => n.endsWith("UNIT_UPGRADING"))?.[1], gateName === "upgrade" ? 1 : 0,
      `${f}: upgrading`);
  const lines = [...xml.matchAll(/<Row SectionID="UNITS" PageID="([A-Z0-9_]+)" ChapterID="([A-Z_]+)" Paragraph="([A-Z0-9_]+)" SortIndex="10"\/>/g)];
  assert.deepEqual(lines.map((m) => m[1]), [...gates.keys()], `${f}: one page line per gated unit`);
  for (const [, unit, chapter, tag] of lines) {
    assert.equal(chapter, PEDIA.unitGateChapter, `${f} ${unit}: chapter`);
    assert.equal(tag, pediaGateTag(gates.get(unit) ?? "", gateLineFor(unit, gateName), age), `${f} ${unit}: line`);
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
// The line locks, pinned: every gated unit a free unit, or a unit on another resource, upgrades into, and every
// gated unique that replaces one (the AT Gun from the Field Gun on Niter, the Dreadnought from the Ship of the Line
// on Hardwood, 1.3), and every unit with stand-ins, which carries no column (the Hardwood ships of Exploration).
// Not the Samurai tiers (tier 2 and 3 are reached only by upgrade).
const lockList = (/** @type {string} */ age) => lineLocks(dumps[age]).map((l) => `${l.unit}:${l.kind}`);
assert.deepEqual(Object.fromEntries(AGES.map((age) => [age, lockList(age)])), {
  AGE_ANTIQUITY: ["UNIT_GAISATAI_2:unique", "UNIT_HOPLITE_2:unique", "UNIT_IMMORTAL:unique", "UNIT_LEGION:unique",
    "UNIT_MEDJAY_2:unique", "UNIT_SPEARMAN:base"],
  AGE_EXPLORATION: ["UNIT_BOMBARD:base", "UNIT_CARRACK:base", "UNIT_CETBANG_2:unique", "UNIT_CETBANG_3:unique",
    "UNIT_CORSAIR_2:granted", "UNIT_CORSAIR_3:granted", "UNIT_GALLEON:base", "UNIT_GOLD_BANGLES_2:unique",
    "UNIT_HWACHA_3:unique", "UNIT_KALAM_2:unique", "UNIT_KALAM_3:unique", "UNIT_KISPOKO_NENA_TO_2:unique",
    "UNIT_LEIOMANO_2:unique", "UNIT_MAN_AT_ARMS:base", "UNIT_TERCIO_2:unique", "UNIT_VIKINGR_2:unique",
    "UNIT_VIKINGR_3:unique", "UNIT_XUNLEICHONG_2:unique"],
  AGE_MODERN: ["UNIT_AT_GUN:base", "UNIT_CHANG_BEUN_3:unique", "UNIT_COSSACK_2:unique", "UNIT_DREADNOUGHT:base",
    "UNIT_FRIGATE:base", "UNIT_GHILMAN_2:unique", "UNIT_HUSSAR_2:unique", "UNIT_LANDSHIP:base", "UNIT_MIKASA:unique",
    "UNIT_REVENGE:unique", "UNIT_TURTLE_SHIP:unique", "UNIT_TURTLE_SHIP_2:unique"]
}, "the line locks");
for (const age of AGES) {
  const f = `sr-${AGE_FILE[age]}-gate-lines.sql`;
  const sql = read(f);
  const locks = lineLocks(dumps[age]);
  for (const lock of locks) {
    assert.equal(lock.resource, buildGateMap(dumps[age]).get(lock.unit), `${f} ${lock.unit}: resource`);
    const needs = suppliers(age, lock.resource).join(" or ");
    assert.ok(sql.includes(`-- ${lock.unit}: ${lock.kind}, needs ${needs}`), `${f}: ${lock.unit} missing`);
    if (!ALTERNATIVES[age]?.[lock.resource]) continue;
    // Behind the any-of set: the grant's own set, or the game's grants for a unit it grants already.
    const any = lineHasAny(age, lock.resource);
    const block = sql.slice(sql.indexOf(`-- ${lock.unit}:`), sql.indexOf("\n\n", sql.indexOf(`-- ${lock.unit}:`)));
    assert.ok(block.includes(`'${any.id}'`), `${f} ${lock.unit}: behind ${any.id}`);
    assert.ok(!block.includes(`'SR_LINE_HAS_${lock.resource.replace("RESOURCE_", "")}'`),
      `${f} ${lock.unit}: behind the resource alone`);
    assert.ok(lock.predecessors.every((p) => buildGateMap(dumps[age]).get(p) !== lock.resource),
      `${f} ${lock.unit}: a predecessor on the same resource would be granted without it`);
  }
  for (const resource of Object.keys(ALTERNATIVES[age] ?? {})) {
    const any = lineHasAny(age, resource);
    assert.ok(sql.includes(`VALUES ('${any.set}', 'REQUIREMENTSET_TEST_ANY')`), `${f}: ${any.set}`);
    assert.ok(sql.includes(`VALUES ${suppliers(age, resource).map((r) =>
      `('${any.set}', 'SR_LINE_HAS_${r.replace("RESOURCE_", "")}')`).join(", ")}`), `${f}: ${any.set} members`);
    assert.ok(sql.includes(`VALUES ('${any.id}', 'REQUIREMENT_REQUIREMENTSET_IS_MET', 0)`), `${f}: ${any.id}`);
    assert.ok(sql.includes(`VALUES ('${any.id}', 'RequirementSetId', '${any.set}')`), `${f}: ${any.id} argument`);
  }
  const statements = sql.split(";\n").map((x) => x.replace(/^(--[^\n]*\n|\s)+/, "")).filter(Boolean);
  for (const st of statements) {
    if (st === "INSERT INTO Modifiers SELECT * FROM sr_mods") continue; // the reward twins, from a guarded temp table
    if (/^INSERT (OR IGNORE )?INTO (Modifiers|GameModifiers|RequirementSets) /.test(st)) {
      assert.ok(/ FROM Units WHERE UnitType = '|\n {4}JOIN Units u ON u\.UnitType = a\.Value\n/.test(st) ||
        /^INSERT OR IGNORE INTO RequirementSets \(RequirementSetId, RequirementSetType\)\n {4}VALUES \('SR_LINE_/.test(st),
        `${f}: unguarded statement: ${st.slice(0, 120)}`);
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
  assert.ok(!/SET\s+StrategicResource|StrategicResource\s*=/.test(sql), `${f} sets the column`);
  assert.ok(!/COLLECTION_ALL_PLAYERS|COLLECTION_INDEPENDENT/.test(sql), `${f}: a grant beyond the major players`);
  const updates = [...sql.matchAll(/^UPDATE Units SET TraitType = '([A-Z_]+)' WHERE UnitType IN \(([^)]*)\)/gm)]
    .map((m) => [m[1], m[2].split(", ").map((u) => u.replace(/'/g, ""))]);
  assert.deepEqual(updates, [
    [MINOR_CIV_TRAIT, locks.filter((l) => l.kind === "base").map((l) => l.unit)],
    [LOCKED_TRAIT, locks.filter((l) => l.kind === "unique").map((l) => l.unit)]
  ].filter(([, units]) => units.length), `${f}: the trait changes`);
  // The units an age change carries armies into keep their own trait (data/sr-carry-over.sql, verification Phase 25).
  for (const m of sql.matchAll(/^UPDATE Units SET TraitType[^;]*;/gm)) {
    assert.match(m[0], /AND UnitType NOT IN \(SELECT UnitType FROM Unit_ShadowReplacements WHERE CoreClass = 'CORE_CLASS_MILITARY'\n/,
      `${f}: a trait change that reaches a carried unit`);
  }
  const traitsAt = sql.indexOf("UPDATE Units SET TraitType");
  assert.ok(sql.lastIndexOf("'SR_LINE_GRANT_TYPE'") < traitsAt && sql.lastIndexOf("SR_LINE_IS_") < traitsAt,
    `${f}: the traits change after every grant and requirement is in`);
}
assert.equal(gateUnits, 2 * AGES.map((age) => columnMap(dumps[age]).size).reduce((a, b) => a + b, 0), "gate rows");
// Strings only inside the mod's own modifiers (checked above); no file adds one to a modifier of the game's.
assert.ok(!fs.readdirSync(DATA).some((f) => /ModifierStrings/.test(read(f))), "data writes ModifierStrings rows");
// A tag row for a unit the player's game lacks (a DLC they don't own, a unit an update removed) fails the TypeTags
// foreign key, and the game won't start. Every tag insert must go through Types.
for (const f of fs.readdirSync(DATA)) {
  assert.ok(!/<TypeTags>/.test(read(f)), `${f}: TypeTags rows in XML can't skip a missing unit; use the guarded SQL`);
  for (const m of read(f).matchAll(/INSERT[^;]*INTO TypeTags[^;]*;/g)) {
    // The copies' tags come through a temp table filled only when the copied unit exists, after the copy's Types row.
    if (m[0] === "INSERT OR IGNORE INTO TypeTags SELECT * FROM sr_rows;" ||
      m[0] === "INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT UnitType, 'SR_LINE_PLAIN' FROM sr_copy;") continue;
    assert.match(m[0], /SELECT Type, '[A-Z_]+' FROM Types WHERE Type IN \(/, `${f}: an unguarded TypeTags insert`);
  }
}

// Every data file is loaded by the groups that need it, and nothing else is: the harsh penalty by its own level
// and the two locked levels, each gate file by its locked level and the matching value of a save from before 1.2,
// the line files by all four of those, the remaps by the shell and the game, as the game's own, the rest once.
const modinfo = fs.readFileSync("strategic-resources-that-matter.modinfo", "utf8").replace(/<!--[\s\S]*?-->/g, "");
const listed = [...modinfo.matchAll(/<Item>(data\/[^<]+)<\/Item>/g)].map((m) => m[1]);
const timesListed = (/** @type {string} */ item) =>
  item.endsWith("-gate-lines.sql") ? 4
    : /-(harsh-modifiers|harsh-game|gate-training|gate-upgrade)\.xml$/.test(item) ? (item.includes("harsh") ? 3 : 2)
      : item.endsWith("sr-line-visuals.xml") ? 2 : 1;
for (const item of new Set(listed)) {
  assert.equal(listed.filter((x) => x === item).length, timesListed(item),
    `${item}: listed the wrong number of times in the modinfo`);
}
assert.deepEqual([...new Set(listed)].sort(), fs.readdirSync(DATA).map((f) => `data/${f}`).sort(),
  "modinfo and data/ differ");
// The locked levels load the harsh penalty with the gate; a save from before 1.2 keeps the Gated Units value.
for (const age of AGES) {
  const a = AGE_FILE[age];
  for (const [id, files] of [[`${a}-locked`, [`sr-${a}-harsh-modifiers.xml`, `sr-${a}-harsh-game.xml`,
    `sr-${a}-gate-training.xml`, `sr-${a}-gate-lines.sql`]],
  [`${a}-locked-upgrade`, [`sr-${a}-harsh-modifiers.xml`, `sr-${a}-harsh-game.xml`, `sr-${a}-gate-upgrade.xml`,
    `sr-${a}-gate-lines.sql`]],
  [`${a}-gate-training`, [`sr-${a}-gate-training.xml`, `sr-${a}-gate-lines.sql`]],
  [`${a}-gate-upgrade`, [`sr-${a}-gate-upgrade.xml`, `sr-${a}-gate-lines.sql`]]]) {
    const body = (modinfo.match(new RegExp(`<ActionGroup id="strategic-resources-that-matter-${id}"[\\s\\S]*?</ActionGroup>`))
      || [""])[0];
    assert.ok(body, `modinfo: no group ${id}`);
    assert.deepEqual([...body.matchAll(/<Item>data\/([^<]+)<\/Item>/g)].map((m) => m[1]), files, `${id}: files`);
  }
  const value = (/** @type {string} */ id) => (modinfo.match(new RegExp(`<Criteria id="${id}">[\\s\\S]*?<Value>([A-Z_]+)</Value>`))
    || [])[1];
  assert.equal(value(`${a}-locked`), "SR_UNSUPPLIED_LOCKED");
  assert.equal(value(`${a}-locked-upgrade`), "SR_UNSUPPLIED_LOCKED_UPGRADE");
  assert.equal(value(`${a}-gate-training`), "SR_GATE_TRAINING");
  assert.equal(value(`${a}-gate-upgrade`), "SR_GATE_UPGRADE");
}
assert.match(modinfo, /<Criteria id="modern-chains">[\s\S]*?<Value>SR_CHAINS_ON<\/Value>/, "the chains criteria");
assert.match(modinfo, /criteria="modern-chains">\s*<Properties><LoadOrder>203<\/LoadOrder>/,
  "the chains file loads after the gate files and the lines");

// 5b. Modern Supply Chains: the second resource per unit, pinned, and the file's shape.
const EXPECTED_CHAINS = {
  RESOURCE_COAL: ["UNIT_ASSAULT_GUN", "UNIT_AT_GUN", "UNIT_BATTLESHIP", "UNIT_CHANG_BEUN", "UNIT_CHANG_BEUN_2",
    "UNIT_CHANG_BEUN_3", "UNIT_COSSACK_2", "UNIT_COSSACK_3", "UNIT_DREADNOUGHT", "UNIT_FIELD_CANNON", "UNIT_FIELD_GUN",
    "UNIT_GHILMAN_2", "UNIT_GHILMAN_3", "UNIT_HEAVY_ARTILLERY", "UNIT_HUSSAR_2", "UNIT_HUSSAR_3", "UNIT_KATYUSHA",
    "UNIT_KATYUSHA_2", "UNIT_LANDSHIP", "UNIT_MIKASA", "UNIT_MIKASA_2", "UNIT_MORTAR", "UNIT_REVENGE", "UNIT_REVENGE_2",
    "UNIT_TANK", "UNIT_TURTLE_SHIP_2", "UNIT_TURTLE_SHIP_3"],
  RESOURCE_NITER: ["UNIT_BARBARY_CORSAIR", "UNIT_BARBARY_CORSAIR_2", "UNIT_BARBARY_CORSAIR_3", "UNIT_COSSACK",
    "UNIT_CRUISER", "UNIT_CUIRASSIER", "UNIT_DESTROYER", "UNIT_FRIGATE", "UNIT_GHILMAN", "UNIT_HUSSAR", "UNIT_IRONCLAD",
    "UNIT_TURTLE_SHIP"],
  RESOURCE_OIL: ["UNIT_BIPLANE", "UNIT_BOMBER", "UNIT_DIVEBOMBER", "UNIT_FIGHTER", "UNIT_HEAVY_BOMBER", "UNIT_STUKA",
    "UNIT_STUKA_2", "UNIT_TRENCH_FIGHTER", "UNIT_ZERO", "UNIT_ZERO_2"],
  RESOURCE_RUBBER: ["UNIT_SUBMARINE"]
};
assert.deepEqual(Object.keys(CHAINS), ["AGE_MODERN"], "chain rules are the Modern age's");
{
  const chains = buildChainMap(dumps.AGE_MODERN);
  /** @type {Record<string, string[]>} */
  const byResource = {};
  for (const [unit, resource] of chains) (byResource[resource] ??= []).push(unit);
  assert.deepEqual(byResource, EXPECTED_CHAINS, "the chain map differs from DESIGN.md 7h");
  const gates = buildGateMap(dumps.AGE_MODERN);
  assert.deepEqual([...chains.keys()], [...gates.keys()], "every gated Modern unit has a second resource");
  for (const [unit, resource] of chains) {
    assert.notEqual(resource, gates.get(unit), `${unit}: the chain names its own resource`);
    assert.ok(gatedResources("AGE_MODERN").includes(resource), `${unit}: ${resource} has no Modern penalty modifiers`);
  }
  assert.deepEqual(buildChainMap(dumps.AGE_ANTIQUITY).size, 0);
  const locks = chainLocks(dumps.AGE_MODERN);
  const copies = lineCopies(dumps.AGE_MODERN);
  assert.deepEqual(locks.map((l) => l.unit), [...chains.keys(), ...copies.map((c) => c.unit)],
    "the chain locks cover every chained unit, then the copies of a chained free unit");
  for (const l of locks) {
    const base = copies.find((c) => c.unit === l.unit)?.base ?? l.unit;
    assert.deepEqual(l.resources, [gates.get(base), chains.get(base)], `${l.unit}: resources`);
  }
  for (const c of copies) assert.equal(locks.find((l) => l.unit === c.unit)?.kind, "unique", `${c.unit}: its own trait`);
  assert.ok(locks.every((l) => l.kind !== "granted"), "no Modern chained unit is one the game grants");
  const f = "sr-modern-chains.sql";
  const sql = read(f);
  // A unit with stand-ins (the Ship of the Line, the Turtle Ship) carries no column: its second resource must still
  // join its lock, behind the table-wide guard (a unit-column guard would never let it in).
  for (const unit of ["UNIT_FRIGATE", "UNIT_TURTLE_SHIP"]) {
    assert.ok(sql.includes(`SELECT 'SR_LINE_REQS_${unit}', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = '${unit}' ` +
      "AND EXISTS (SELECT 1 FROM Units g WHERE g.StrategicResource IS NOT NULL)"), `${f}: ${unit} waits for Niter too`);
  }
  for (const resource of Object.keys(EXPECTED_CHAINS)) {
    const name = resource.replace("RESOURCE_", "");
    assert.ok(sql.includes(`SELECT Type, 'SR_SUPPLY_${name}' FROM Types WHERE Type IN (`), `${f}: ${name} tags`);
    assert.ok(sql.includes(`a.ModifierId = 'SR_COMBAT_PENALTY_${name}' AND a.Name = 'Amount'`), `${f}: ${name} page line`);
    assert.ok(sql.includes(`THEN 'LOC_SR_PEDIA_UNIT_${name}_GATE_UPGRADE' ELSE 'LOC_SR_PEDIA_UNIT_${name}_GATE_TRAINING'`),
      `${f}: ${name} gate line`);
  }
  // A resource with stand-ins reads "A or B" (the Ship of the Line: Hardwood or Pitch, then Niter).
  const named = (/** @type {string} */ r) => [r, ...(ALTERNATIVES.AGE_MODERN?.[r] ?? [])].join(" or ");
  for (const lock of locks) {
    assert.ok(sql.includes(`-- ${lock.unit}: ${lock.kind}, needs ${lock.resources.map(named).join(", ")}`),
      `${f}: ${lock.unit}`);
  }
  const statements = sql.split(";\n").map((x) => x.replace(/^(--[^\n]*\n|\s)+/, "")).filter(Boolean);
  for (const st of statements) {
    // The copies' rows come from temp tables filled only while no stand-in exists, so a second load adds nothing.
    if (/^INSERT /.test(st) && !/ FROM sr_(copy|rows|mods|args|rewards)\b/.test(st)) {
      assert.match(st, /^INSERT OR IGNORE /, `${f}: a plain insert: ${st.slice(0, 100)}`);
    }
    if (/^INSERT OR IGNORE INTO (Modifiers|GameModifiers|RequirementSets) /.test(st) && !/^INSERT OR IGNORE INTO Modifiers SELECT \* FROM sr_mods/.test(st)) {
      // A unit with stand-ins never carries the column: its rows wait for any unit to carry one (the locked level).
      assert.ok(/ FROM Units WHERE UnitType = '[A-Z0-9_]+' AND StrategicResource IS NOT NULL/.test(st) ||
        / FROM Units WHERE UnitType = '[A-Z0-9_]+' AND EXISTS \(SELECT 1 FROM Units g WHERE g\.StrategicResource IS NOT NULL\)/.test(st) ||
        /^INSERT OR IGNORE INTO RequirementSets \(RequirementSetId, RequirementSetType\)\n {4}VALUES \('SR_LINE_/.test(st),
      `${f}: a grant not behind the column: ${st.slice(0, 120)}`);
    }
    if (/^UPDATE Units SET TraitType/.test(st)) {
      assert.match(st, /AND StrategicResource IS NOT NULL\n {4}AND UnitType NOT IN \(SELECT UnitType FROM Unit_ShadowReplacements/,
        `${f}: traits`);
    }
    if (/^UPDATE CivilopediaPageQueries/.test(st)) assert.match(st, /StrategicResource IS NOT NULL\)$/, `${f}: pedia query`);
  }
  assert.ok(!/DELETE FROM UnitUpgrades|UPDATE UnitUpgrades/.test(sql), `${f} removes or changes an upgrade row`);
  assert.ok(!/SET\s+StrategicResource|StrategicResource\s*=/.test(sql), `${f} sets the column`);
  assert.ok(!/COLLECTION_ALL_PLAYERS|COLLECTION_INDEPENDENT/.test(sql), `${f}: a grant beyond the major players`);
  assert.ok(!sql.includes("SR_LINE_NEVER"), `${f}: the civic block belongs to the plain line file`);
  const copyBlocks = [...sql.matchAll(/^-- (UNIT_[A-Z_]+): this civilization's (UNIT_[A-Z_]+), standing in for it and upgrading straight into (UNIT_[A-Z_]+)\./gm)]
    .map((m) => [m[1], m[2], m[3]]);
  // The plain line file makes the copies; a second copy block here would fail the Types key once the copy is locked.
  assert.deepEqual(copyBlocks, [], `${f}: no copy blocks`);
  assert.ok(!/CREATE TEMP TABLE/.test(sql), `${f}: no temp tables`);
}

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

// A civic's grant of a gated unit with no condition (Kinsei, Samurai 2) gets one, the resource, and the build lock
// the same civic puts on the unit the gated unit replaces (the Man-at-Arms) is switched off. Untouched: a grant with
// its own set (the Corsair's), a grant of an ungated unit, a lock from another civic, a lock on an unrelated unit, and
// the mod's own grants. The block runs twice without failing. (scripts/build-data.mjs civicGrants; sr-113-on, sr-113-off)
{
  const sql = read("sr-exploration-gate-lines.sql");
  const block = sql.slice(sql.indexOf("-- A civic's grant of a gated unit with no condition"),
    sql.indexOf("-- The traits last"));
  assert.ok(block.length > 100, "the civic-grants block is in the lines file");
  const out = execFileSync("sqlite3", [":memory:"], {
    encoding: "utf8",
    input: `PRAGMA foreign_keys = ON;
      CREATE TABLE Units (UnitType TEXT PRIMARY KEY, StrategicResource TEXT);
      CREATE TABLE UnitReplaces (CivUniqueUnitType TEXT PRIMARY KEY, ReplacesUnitType TEXT NOT NULL);
      CREATE TABLE ProgressionTreeNodeUnlocks (ProgressionTreeNodeType TEXT NOT NULL, TargetType TEXT NOT NULL,
        TargetKind TEXT NOT NULL, PRIMARY KEY (ProgressionTreeNodeType, TargetType));
      CREATE TABLE DynamicModifiers (ModifierType TEXT PRIMARY KEY, CollectionType TEXT, EffectType TEXT);
      CREATE TABLE RequirementSets (RequirementSetId TEXT PRIMARY KEY, RequirementSetType TEXT NOT NULL);
      CREATE TABLE Requirements (RequirementId TEXT PRIMARY KEY, RequirementType TEXT NOT NULL, Inverse BOOLEAN);
      CREATE TABLE RequirementArguments (RequirementId TEXT NOT NULL REFERENCES Requirements(RequirementId),
        Name TEXT NOT NULL, Value TEXT, PRIMARY KEY (RequirementId, Name));
      CREATE TABLE RequirementSetRequirements (
        RequirementSetId TEXT NOT NULL REFERENCES RequirementSets(RequirementSetId),
        RequirementId TEXT NOT NULL REFERENCES Requirements(RequirementId),
        PRIMARY KEY (RequirementSetId, RequirementId));
      CREATE TABLE Modifiers (ModifierId TEXT PRIMARY KEY, ModifierType TEXT NOT NULL,
        SubjectRequirementSetId TEXT REFERENCES RequirementSets(RequirementSetId));
      CREATE TABLE ModifierArguments (ModifierId TEXT NOT NULL, Name TEXT NOT NULL, Value TEXT,
        PRIMARY KEY (ModifierId, Name));
      INSERT INTO Units VALUES ('UNIT_SAMURAI_2', 'RESOURCE_IRON'), ('UNIT_MAN_AT_ARMS', 'RESOURCE_IRON'),
        ('UNIT_CORSAIR_2', 'RESOURCE_NITER'), ('UNIT_FREE', NULL), ('UNIT_OTHER', NULL);
      INSERT INTO UnitReplaces VALUES ('UNIT_SAMURAI_2', 'UNIT_MAN_AT_ARMS');
      INSERT INTO DynamicModifiers VALUES ('GRANT', 'COLLECTION_OWNER', 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD'),
        ('LOCK', 'COLLECTION_OWNER', 'EFFECT_PLAYER_DISABLE_BUILD_UNIT');
      INSERT INTO RequirementSets VALUES ('CORSAIR_SET', 'REQUIREMENTSET_TEST_ALL');
      INSERT INTO Modifiers VALUES ('KINSEI', 'GRANT', NULL), ('NO_MAN', 'LOCK', NULL), ('NO_OTHER', 'LOCK', NULL),
        ('ELSEWHERE_NO_MAN', 'LOCK', NULL), ('CORSAIR', 'GRANT', 'CORSAIR_SET'), ('FREE', 'GRANT', NULL),
        ('SR_LINE_GRANT_X', 'GRANT', NULL), ('UNATTACHED', 'GRANT', NULL);
      INSERT INTO ModifierArguments VALUES ('KINSEI', 'UnitType', 'UNIT_SAMURAI_2'),
        ('NO_MAN', 'UnitType', 'UNIT_MAN_AT_ARMS'), ('NO_OTHER', 'UnitType', 'UNIT_OTHER'),
        ('ELSEWHERE_NO_MAN', 'UnitType', 'UNIT_MAN_AT_ARMS'), ('CORSAIR', 'UnitType', 'UNIT_CORSAIR_2'),
        ('FREE', 'UnitType', 'UNIT_FREE'), ('SR_LINE_GRANT_X', 'UnitType', 'UNIT_SAMURAI_2'),
        ('UNATTACHED', 'UnitType', 'UNIT_SAMURAI_2');
      INSERT INTO ProgressionTreeNodeUnlocks VALUES ('NODE_KINSEI', 'KINSEI', 'KIND_MODIFIER'),
        ('NODE_KINSEI', 'NO_MAN', 'KIND_MODIFIER'), ('NODE_KINSEI', 'NO_OTHER', 'KIND_MODIFIER'),
        ('NODE_ELSEWHERE', 'ELSEWHERE_NO_MAN', 'KIND_MODIFIER'), ('NODE_CORSAIR', 'CORSAIR', 'KIND_MODIFIER'),
        ('NODE_FREE', 'FREE', 'KIND_MODIFIER'), ('NODE_X', 'SR_LINE_GRANT_X', 'KIND_MODIFIER');
      ${block}
      ${block}
      SELECT 'M|' || ModifierId || ':' || ifnull(SubjectRequirementSetId, '-') FROM Modifiers ORDER BY ModifierId;
      SELECT 'R|' || RequirementSetId || ':' || RequirementId FROM RequirementSetRequirements ORDER BY 1;
      SELECT 'A|' || RequirementId || ':' || Name || '=' || Value FROM RequirementArguments ORDER BY 1;
      SELECT 'F|' || "table" FROM pragma_foreign_key_check;`
  }).trim().split("\n");
  assert.deepEqual(out, ["M|CORSAIR:CORSAIR_SET", "M|ELSEWHERE_NO_MAN:-", "M|FREE:-", "M|KINSEI:SR_LINE_NEEDS_IRON",
    "M|NO_MAN:SR_LINE_NEVER_SET", "M|NO_OTHER:-", "M|SR_LINE_GRANT_X:-", "M|UNATTACHED:-",
    "R|SR_LINE_NEEDS_IRON:SR_LINE_HAS_IRON", "R|SR_LINE_NEVER_SET:SR_LINE_NEVER",
    "A|SR_LINE_HAS_IRON:Amount=1", "A|SR_LINE_HAS_IRON:ResourceType=RESOURCE_IRON",
    "A|SR_LINE_NEVER:TraitType=TRAIT_SR_LOCKED"], "a civic's unconditional grant of a gated unit");
}

// "Free Tier-Up by Kills" set to Off: sr-kill-tiers-off.sql, run against a small database shaped like the game's, in
// each setup it can meet. It must take out only the kill rows of tiers that need a resource, only while upgrades are
// gated, swap only those pages' gate line, open the ordinary upgrade (each tier unlocked with the unit it replaces, for
// its own civilization, and the ALT_UPGRADE tag off the line), and do nothing (and not fail) without the Sengoku DLC.
{
  const killSql = read("sr-kill-tiers-off.sql");
  const schema = `CREATE TABLE Traits (TraitType TEXT PRIMARY KEY);
    CREATE TABLE Units (UnitType TEXT PRIMARY KEY, StrategicResource TEXT, TraitType TEXT);
    CREATE TABLE UnitUpgradeKills (UnitType TEXT PRIMARY KEY REFERENCES Units(UnitType), KillCount INTEGER NOT NULL);
    CREATE TABLE GlobalParameters (Name TEXT PRIMARY KEY, Value TEXT NOT NULL);
    CREATE TABLE CivilopediaPageChapterParagraphs (ChapterID TEXT, PageID TEXT, SectionID TEXT, Paragraph TEXT,
      SortIndex INTEGER, PRIMARY KEY (ChapterID, PageID, SectionID));
    CREATE TABLE UnitReplaces (CivUniqueUnitType TEXT PRIMARY KEY, ReplacesUnitType TEXT NOT NULL);
    CREATE TABLE UnitUpgrades (Unit TEXT PRIMARY KEY, UpgradeUnit TEXT NOT NULL);
    CREATE TABLE TypeTags (Type TEXT NOT NULL, Tag TEXT NOT NULL, PRIMARY KEY (Type, Tag));
    CREATE TABLE ProgressionTreeNodes (ProgressionTreeNodeType TEXT PRIMARY KEY);
    CREATE TABLE ProgressionTreeNodeUnlocks (ProgressionTreeNodeType TEXT NOT NULL
        REFERENCES ProgressionTreeNodes(ProgressionTreeNodeType), TargetType TEXT NOT NULL,
      AIIgnoreUnlockValue BOOLEAN NOT NULL DEFAULT 0, RequiredTraitType TEXT REFERENCES Traits(TraitType),
      TargetKind TEXT NOT NULL, UnlockDepth INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (ProgressionTreeNodeType, TargetType));
    INSERT INTO ProgressionTreeNodes VALUES ('NODE_TECH_EX_HERALDRY'), ('NODE_TECH_EX_METAL_CASTING');
    INSERT INTO Units VALUES ('UNIT_MAN_AT_ARMS', 'RESOURCE_IRON', NULL), ('UNIT_PIKEMAN', 'RESOURCE_IRON', NULL),
      ('UNIT_OTHER_2', NULL, NULL);
    INSERT INTO ProgressionTreeNodeUnlocks (ProgressionTreeNodeType, TargetType, TargetKind) VALUES
      ('NODE_TECH_EX_HERALDRY', 'UNIT_MAN_AT_ARMS', 'KIND_UNIT'),
      ('NODE_TECH_EX_METAL_CASTING', 'UNIT_PIKEMAN', 'KIND_UNIT');
    INSERT INTO TypeTags VALUES ('UNIT_OTHER_2', 'UNIT_CLASS_ALT_UPGRADE');
    INSERT INTO UnitUpgradeKills VALUES ('UNIT_OTHER_2', 5);
    INSERT INTO CivilopediaPageChapterParagraphs VALUES
      ('SR_LOCK', 'UNIT_MAN_AT_ARMS', 'UNITS', 'LOC_SR_PEDIA_UNIT_IRON_GATE_TRAINING', 10);`;
  const sengoku = `INSERT INTO Traits VALUES ('TRAIT_SENGOKU');
    INSERT INTO Units VALUES ('UNIT_SAMURAI', NULL, 'TRAIT_SENGOKU'),
      ('UNIT_SAMURAI_2', 'RESOURCE_IRON', 'TRAIT_SENGOKU'), ('UNIT_SAMURAI_3', 'RESOURCE_IRON', 'TRAIT_SENGOKU');
    INSERT INTO UnitReplaces VALUES ('UNIT_SAMURAI_2', 'UNIT_MAN_AT_ARMS'), ('UNIT_SAMURAI_3', 'UNIT_PIKEMAN');
    INSERT INTO UnitUpgrades VALUES ('UNIT_SAMURAI', 'UNIT_SAMURAI_2'), ('UNIT_SAMURAI_2', 'UNIT_SAMURAI_3');
    INSERT INTO TypeTags VALUES ('UNIT_SAMURAI', 'UNIT_CLASS_ALT_UPGRADE'),
      ('UNIT_SAMURAI_2', 'UNIT_CLASS_ALT_UPGRADE'), ('UNIT_SAMURAI_3', 'UNIT_CLASS_ALT_UPGRADE');
    INSERT INTO UnitUpgradeKills VALUES ('UNIT_SAMURAI_2', 3), ('UNIT_SAMURAI_3', 3);
    INSERT INTO CivilopediaPageChapterParagraphs VALUES
      ('SR_LOCK', 'UNIT_SAMURAI_2', 'UNITS', 'LOC_SR_PEDIA_UNIT_IRON_GATE_TRAINING', 10),
      ('SR_LOCK', 'UNIT_SAMURAI_3', 'UNITS', 'LOC_SR_PEDIA_UNIT_IRON_GATE_TRAINING', 10);`;
  const upgrading = (/** @type {number} */ n) =>
    `INSERT INTO GlobalParameters VALUES ('STRATEGIC_RESOURCE_MINIMUM_FOR_UNIT_UPGRADING', '${n}');`;
  /** @typedef {{ kills: string[], pages: string[], unlocks: string[], tags: string[], fk: string[] }} KillRun */
  /** @param {string} setup @returns {KillRun} */
  const run = (setup) => {
    const out = execFileSync("sqlite3", [":memory:"], {
      encoding: "utf8",
      input: `PRAGMA foreign_keys = ON; ${schema} ${setup}\n${killSql}\n` +
        "SELECT 'K|' || UnitType || ':' || KillCount FROM UnitUpgradeKills ORDER BY UnitType;\n" +
        "SELECT 'P|' || PageID || ':' || Paragraph FROM CivilopediaPageChapterParagraphs ORDER BY PageID;\n" +
        "SELECT 'U|' || ProgressionTreeNodeType || ':' || TargetType || ':' || ifnull(RequiredTraitType, '-') " +
        "FROM ProgressionTreeNodeUnlocks WHERE TargetType LIKE 'UNIT_SAMURAI%' ORDER BY TargetType;\n" +
        "SELECT 'T|' || Type FROM TypeTags WHERE Tag = 'UNIT_CLASS_ALT_UPGRADE' ORDER BY Type;\n" +
        "SELECT 'F|' || \"table\" FROM pragma_foreign_key_check;\n"
    }).trim().split("\n").filter(Boolean);
    const pick = (/** @type {string} */ k) => out.filter((l) => l.startsWith(`${k}|`)).map((l) => l.slice(2));
    return { kills: pick("K"), pages: pick("P"), unlocks: pick("U"), tags: pick("T"), fk: pick("F") };
  };
  const untouchedPages = ["UNIT_MAN_AT_ARMS:LOC_SR_PEDIA_UNIT_IRON_GATE_TRAINING"];
  const allTags = ["UNIT_OTHER_2", "UNIT_SAMURAI", "UNIT_SAMURAI_2", "UNIT_SAMURAI_3"];
  // Training and upgrade, Sengoku present: the Samurai's kill rows go, their pages say "upgraded into", the tiers
  // unlock with Heraldry and Metal Casting for the Sengoku only, and the line loses the tag that blocks the upgrade.
  assert.deepEqual(run(sengoku + upgrading(1)), {
    kills: ["UNIT_OTHER_2:5"],
    pages: [...untouchedPages, "UNIT_SAMURAI_2:LOC_SR_PEDIA_UNIT_IRON_GATE_UPGRADE",
      "UNIT_SAMURAI_3:LOC_SR_PEDIA_UNIT_IRON_GATE_UPGRADE"],
    unlocks: ["NODE_TECH_EX_HERALDRY:UNIT_SAMURAI_2:TRAIT_SENGOKU",
      "NODE_TECH_EX_METAL_CASTING:UNIT_SAMURAI_3:TRAIT_SENGOKU"],
    tags: ["UNIT_OTHER_2"],
    fk: []
  }, "kill tiers off, Training and upgrade");
  // Run twice (a second copy of the file, or another mod adding the same unlock): no failure, the same rows.
  assert.deepEqual(run(sengoku + upgrading(1) + killSql), run(sengoku + upgrading(1)), "kill tiers off, run twice");
  // Training only (upgrades free) or no gate at all: nothing changes, the Samurai still tier up by kills.
  const unchanged = {
    kills: ["UNIT_OTHER_2:5", "UNIT_SAMURAI_2:3", "UNIT_SAMURAI_3:3"],
    pages: [...untouchedPages, "UNIT_SAMURAI_2:LOC_SR_PEDIA_UNIT_IRON_GATE_TRAINING",
      "UNIT_SAMURAI_3:LOC_SR_PEDIA_UNIT_IRON_GATE_TRAINING"],
    unlocks: [],
    tags: allTags,
    fk: []
  };
  assert.deepEqual(run(sengoku + upgrading(0)), unchanged, "kill tiers off, Training");
  assert.deepEqual(run(sengoku), unchanged, "kill tiers off, Gated Units off");
  // No Sengoku DLC: the file runs without error and touches nothing.
  assert.deepEqual(run(upgrading(1)),
    { kills: ["UNIT_OTHER_2:5"], pages: untouchedPages, unlocks: [], tags: ["UNIT_OTHER_2"], fk: [] },
    "kill tiers off without the Sengoku DLC");
}
// The option's default is On, and only its Off value loads the file, after the gate files.
{
  const setup = read("sr-setup.sql");
  assert.match(setup, /'StrategicResourcesThatMatterKillTiers', 'LOC_SR_SETUP_KILL_TIERS_NAME', [\s\S]*?'SR_KILL_TIERS_ON', 'Game', 'StrategicResourcesThatMatterKillTiers'/,
    "Free Tier-Up by Kills defaults to On");
  const criteria = (modinfo.match(/<Criteria id="kill-tiers-off">[\s\S]*?<\/Criteria>/) ?? [""])[0];
  assert.match(criteria, /<ConfigurationId>StrategicResourcesThatMatterKillTiers<\/ConfigurationId>\s*<Value>SR_KILL_TIERS_OFF<\/Value>/,
    "the off file loads only for Off");
  const killGroup = (modinfo.match(/<ActionGroup id="strategic-resources-that-matter-kill-tiers-off"[\s\S]*?<\/ActionGroup>/) ?? [""])[0];
  assert.match(killGroup, /criteria="kill-tiers-off"/, "kill tiers group criteria");
  assert.match(killGroup, /<LoadOrder>203<\/LoadOrder>/, "kill tiers group loads after the gate files (202)");
  assert.match(killGroup, /<Item>data\/sr-kill-tiers-off\.sql<\/Item>/, "kill tiers group file");
}

// The units an age change carries armies into stay free (the owner, 2026-10-29; verification Phase 25). The file loads
// always, after the gate files and Modern Supply Chains, and reads the carry-over table: the Ship of the Line, the
// Turtle Ship that replaces it and the Cuirassier lose this mod's column and lock lines and keep their supply tags;
// the Dreadnought, which isn't carried into, keeps its lock; another mod's column on a carried unit stays.
{
  const group = (modinfo.match(/<ActionGroup id="strategic-resources-that-matter-carry-over"[\s\S]*?<\/ActionGroup>/) ?? [""])[0];
  assert.match(group, /scope="game" criteria="always"[\s\S]*<LoadOrder>204<\/LoadOrder>[\s\S]*<Item>data\/sr-carry-over\.sql<\/Item>/,
    "carry-over group: always, after the gate files (202) and chains (203)");
  const out = execFileSync("sqlite3", [":memory:"], {
    encoding: "utf8",
    input: `CREATE TABLE Types (Type TEXT PRIMARY KEY, Kind TEXT);
      CREATE TABLE Tags (Tag TEXT PRIMARY KEY, Category TEXT);
      CREATE TABLE TypeTags (Type TEXT, Tag TEXT, PRIMARY KEY (Type, Tag));
      CREATE TABLE Units (UnitType TEXT PRIMARY KEY, TraitType TEXT, StrategicResource TEXT);
      CREATE TABLE Unit_ShadowReplacements (Tag TEXT, UnitType TEXT, CoreClass TEXT, Domain TEXT);
      CREATE TABLE UnitReplaces (CivUniqueUnitType TEXT, ReplacesUnitType TEXT);
      CREATE TABLE CivilopediaPageChapterParagraphs (SectionID TEXT, PageID TEXT, ChapterID TEXT, Paragraph TEXT);
      INSERT INTO Types VALUES ('UNIT_FRIGATE', 'KIND_UNIT'), ('UNIT_TURTLE_SHIP', 'KIND_UNIT'), ('UNIT_CUIRASSIER', 'KIND_UNIT'),
        ('UNIT_DREADNOUGHT', 'KIND_UNIT'), ('UNIT_MORTAR', 'KIND_UNIT'), ('UNIT_SCOUT', 'KIND_UNIT');
      INSERT INTO Units VALUES ('UNIT_FRIGATE', NULL, NULL), ('UNIT_TURTLE_SHIP', 'TRAIT_JOSEON', NULL),
        ('UNIT_CUIRASSIER', NULL, 'RESOURCE_HORSES'), ('UNIT_DREADNOUGHT', 'TRAIT_LEADER_MINOR_CIV', 'RESOURCE_OIL'),
        ('UNIT_MORTAR', NULL, 'RESOURCE_COAL'), ('UNIT_SCOUT', NULL, NULL);
      INSERT INTO Unit_ShadowReplacements VALUES ('UNIT_CLASS_NAVAL', 'UNIT_FRIGATE', 'CORE_CLASS_MILITARY', 'DOMAIN_SEA'),
        ('UNIT_CLASS_CAVALRY', 'UNIT_CUIRASSIER', 'CORE_CLASS_MILITARY', 'DOMAIN_LAND'),
        ('UNIT_CLASS_SIEGE', 'UNIT_MORTAR', 'CORE_CLASS_MILITARY', 'DOMAIN_LAND'),
        ('UNIT_CLASS_RECON', 'UNIT_SCOUT', 'CORE_CLASS_RECON', 'DOMAIN_LAND'), ('UNIT_CLASS_X', 'UNIT_GONE', 'CORE_CLASS_MILITARY', 'DOMAIN_LAND');
      INSERT INTO UnitReplaces VALUES ('UNIT_TURTLE_SHIP', 'UNIT_FRIGATE');
      INSERT INTO TypeTags VALUES ('UNIT_FRIGATE', 'SR_SUPPLY_HARDWOOD'), ('UNIT_CUIRASSIER', 'SR_SUPPLY_HORSES'),
        ('UNIT_DREADNOUGHT', 'SR_SUPPLY_OIL'), ('UNIT_MORTAR', 'SR_SUPPLY_OIL');
      INSERT INTO CivilopediaPageChapterParagraphs VALUES ('UNITS', 'UNIT_FRIGATE', 'SR_LOCK', 'x'), ('UNITS', 'UNIT_FRIGATE', 'OTHER', 'y'),
        ('UNITS', 'UNIT_DREADNOUGHT', 'SR_LOCK', 'z');
      ${read("sr-carry-over.sql")}
      SELECT 'tag:' || group_concat(Type) FROM (SELECT Type FROM TypeTags WHERE Tag = 'SR_CARRIED_FREE' ORDER BY Type);
      SELECT 'unit:' || UnitType || ':' || ifnull(TraitType, '-') || ':' || ifnull(StrategicResource, '-') FROM Units ORDER BY UnitType;
      SELECT 'page:' || PageID || ':' || ChapterID FROM CivilopediaPageChapterParagraphs ORDER BY PageID, ChapterID;
      SELECT 'supply:' || count(*) FROM TypeTags WHERE Tag LIKE 'SR_SUPPLY_%';`
  }).trim().split("\n");
  assert.deepEqual(out, [
    "tag:UNIT_CUIRASSIER,UNIT_FRIGATE,UNIT_MORTAR,UNIT_TURTLE_SHIP",
    "unit:UNIT_CUIRASSIER:-:-", "unit:UNIT_DREADNOUGHT:TRAIT_LEADER_MINOR_CIV:RESOURCE_OIL", "unit:UNIT_FRIGATE:-:-",
    "unit:UNIT_MORTAR:-:RESOURCE_COAL", "unit:UNIT_SCOUT:-:-", "unit:UNIT_TURTLE_SHIP:TRAIT_JOSEON:-",
    "page:UNIT_DREADNOUGHT:SR_LOCK", "page:UNIT_FRIGATE:OTHER", "supply:4"
  ], "carried units free, the rest as they were; a Coal column on an Oil unit is another mod's and stays");
}

// Strategic Resources on the Map: the default leaves the map alone, More and Plenty each load their own file, and each
// file multiplies the map weights another mod may already have changed, raises the per-landmass minimum, and leaves
// every other resource and a missing resource alone.
{
  const setup = read("sr-setup.sql");
  assert.match(setup, /'StrategicResourcesThatMatterAbundance', 'LOC_SR_SETUP_ABUNDANCE_NAME', [\s\S]*?'SR_ABUNDANCE_STANDARD', 'Game', 'StrategicResourcesThatMatterAbundance'/,
    "Strategic Resources on the Map defaults to the game's own map");
  for (const [value, file] of [["SR_ABUNDANCE_MORE", "more"], ["SR_ABUNDANCE_PLENTY", "plenty"]]) {
    const criteria = (modinfo.match(new RegExp(`<Criteria id="abundance-${file}">[\\s\\S]*?</Criteria>`)) ?? [""])[0];
    assert.match(criteria, new RegExp(`<ConfigurationId>StrategicResourcesThatMatterAbundance</ConfigurationId>\\s*<Value>${value}</Value>`),
      `${file} loads only for its value`);
    const group = (modinfo.match(new RegExp(`<ActionGroup id="strategic-resources-that-matter-abundance-${file}"[\\s\\S]*?</ActionGroup>`)) ?? [""])[0];
    assert.match(group, new RegExp(`criteria="abundance-${file}"[\\s\\S]*<Item>data/sr-abundance-${file}\\.sql</Item>`), `${file} group`);
  }
  /** @param {string} file @param {string} tags the age's supply tags, as TypeTags rows */
  const map = (file, tags) => execFileSync("sqlite3", [":memory:"], {
    encoding: "utf8",
    input: `CREATE TABLE Resources (ResourceType TEXT PRIMARY KEY, Weight REAL, MinimumPerLandmass INTEGER, Staple BOOLEAN);
      CREATE TABLE Resource_ValidBiomes (ResourceType TEXT, BiomeType TEXT, Weight REAL);
      CREATE TABLE TypeTags (Type TEXT, Tag TEXT);
      CREATE TABLE Resource_Distribution (AgeType TEXT, MaxResourceTypes INTEGER);
      INSERT INTO Resource_Distribution VALUES ('AGE_X', 25);
      INSERT INTO Resources VALUES ('RESOURCE_IRON', 1.0, 1, 1), ('RESOURCE_HORSES', 0.5, 4, 1), ('RESOURCE_SILK', 1.0, 1, 0),
        ('RESOURCE_HARDWOOD', 1.0, 1, 0), ('RESOURCE_PITCH', 1.0, 1, 0);
      INSERT INTO Resource_ValidBiomes VALUES ('RESOURCE_IRON', 'BIOME_PLAINS', 1.0), ('RESOURCE_HORSES', 'BIOME_PLAINS', NULL),
        ('RESOURCE_SILK', 'BIOME_TROPICAL', 1.0), ('RESOURCE_HARDWOOD', 'BIOME_TUNDRA', 1.0);
      ALTER TABLE Resource_ValidBiomes ADD COLUMN TerrainType TEXT DEFAULT 'TERRAIN_FLAT';
      INSERT INTO Resource_ValidBiomes VALUES ('RESOURCE_HARDWOOD', 'BIOME_TROPICAL', 1.0, 'TERRAIN_HILL');
      ${tags}
      ${read(file)}
      SELECT ResourceType || ':' || Weight || ':' || MinimumPerLandmass || ':' || Staple FROM Resources ORDER BY ResourceType;
      SELECT ResourceType || '@' || BiomeType || ':' || Weight FROM Resource_ValidBiomes ORDER BY ResourceType, BiomeType;
      SELECT 'types:' || MaxResourceTypes FROM Resource_Distribution;`
  }).trim().split("\n");
  // An Antiquity-like age: units draw on Horses and Iron. Horses keeps another mod's 0.5 weight in proportion and its
  // minimum of 4 as a floor, and an empty class weight counts as 1. Hardwood and Pitch, which no unit of the age draws
  // on, stay as the game has them, and so does Silk.
  const antiquity = `INSERT INTO TypeTags VALUES ('UNIT_HORSEMAN', 'SR_SUPPLY_HORSES'), ('UNIT_SPEARMAN', 'SR_SUPPLY_IRON'),
    ('UNIT_LEGION', 'SR_SUPPLY_IRON'), ('UNIT_LEGION', 'SR_RANGED_IRON');`;
  // Nothing here draws on Hardwood: it becomes a staple at half weight and off the hills (they're Iron's), with one
  // more map slot for it; Iron and Horses are staples already and take none.
  assert.deepEqual(map("sr-abundance-more.sql", antiquity), ["RESOURCE_HARDWOOD:0.5:1:1", "RESOURCE_HORSES:1.0:4:1",
    "RESOURCE_IRON:2.0:2:1", "RESOURCE_PITCH:1.0:1:0", "RESOURCE_SILK:1.0:1:0", "RESOURCE_HARDWOOD@BIOME_TUNDRA:0.5",
    "RESOURCE_HORSES@BIOME_PLAINS:2.0", "RESOURCE_IRON@BIOME_PLAINS:2.0", "RESOURCE_SILK@BIOME_TROPICAL:1.0",
    "types:26"], "More");
  assert.deepEqual(map("sr-abundance-plenty.sql", antiquity), ["RESOURCE_HARDWOOD:0.5:1:1", "RESOURCE_HORSES:1.5:4:1",
    "RESOURCE_IRON:3.0:3:1", "RESOURCE_PITCH:1.0:1:0", "RESOURCE_SILK:1.0:1:0", "RESOURCE_HARDWOOD@BIOME_TUNDRA:0.5",
    "RESOURCE_HORSES@BIOME_PLAINS:3.0", "RESOURCE_IRON@BIOME_PLAINS:3.0", "RESOURCE_SILK@BIOME_TROPICAL:1.0",
    "types:26"], "Plenty");
  // An Exploration-like age: the warships draw on Hardwood, with Pitch standing in, so both change, with a slot each.
  const exploration = `INSERT INTO TypeTags VALUES ('UNIT_CARRACK', 'SR_SUPPLY_HARDWOOD'),
    ('UNIT_CARRACK', 'SR_EITHER_HARDWOOD_OR_PITCH');`;
  assert.deepEqual(map("sr-abundance-more.sql", exploration).slice(0, 5), ["RESOURCE_HARDWOOD:2.0:2:1",
    "RESOURCE_HORSES:0.5:4:1", "RESOURCE_IRON:1.0:1:1", "RESOURCE_PITCH:2.0:2:1", "RESOURCE_SILK:1.0:1:0"], "More, Pitch");
  const explorationMap = map("sr-abundance-more.sql", exploration);
  assert.equal(explorationMap.at(-1), "types:27", "two new staples, two more slots");
  assert.ok(explorationMap.includes("RESOURCE_HARDWOOD@BIOME_TROPICAL:2.0") &&
    explorationMap.includes("RESOURCE_HARDWOOD@BIOME_TUNDRA:2.0"), "drawn on: Hardwood keeps its hills, at twice");
  // No unit tagged (the tags never loaded): only Hardwood's staple, with its slot.
  const untagged = map("sr-abundance-more.sql", "");
  assert.deepEqual(untagged.slice(0, 5), ["RESOURCE_HARDWOOD:0.5:1:1", "RESOURCE_HORSES:0.5:4:1",
    "RESOURCE_IRON:1.0:1:1", "RESOURCE_PITCH:1.0:1:0", "RESOURCE_SILK:1.0:1:0"], "More, no tags");
  assert.equal(untagged.at(-1), "types:26");
  for (const file of ["more", "plenty"]) {
    const group = (modinfo.match(new RegExp(`<ActionGroup id="strategic-resources-that-matter-abundance-${file}"[\\s\\S]*?</ActionGroup>`)) ?? [""])[0];
    assert.match(group, /<LoadOrder>210<\/LoadOrder>/, `${file} loads after the supply tags (201) and chains (203)`);
  }
}

// The AI's settle rows (sr-ai.sql): one per resource present in the game, on the list every major civ inherits, and a
// second run (two copies of the mod) adds nothing.
{
  const ai = (/** @type {string} */ extra) => execFileSync("sqlite3", [":memory:"], {
    encoding: "utf8",
    input: `PRAGMA foreign_keys = ON;
      CREATE TABLE AiListTypes (ListType TEXT PRIMARY KEY);
      CREATE TABLE AiLists (LeaderType TEXT, ListType TEXT NOT NULL REFERENCES AiListTypes(ListType), System TEXT NOT NULL,
        PRIMARY KEY (LeaderType, ListType));
      CREATE TABLE AiFavoredItems (Favored BOOLEAN NOT NULL DEFAULT 1, Item TEXT NOT NULL, ListType TEXT REFERENCES AiListTypes(ListType),
        StringVal TEXT, Value INTEGER NOT NULL DEFAULT 0, TooltipString TEXT, PRIMARY KEY (Favored, Item, ListType, StringVal, Value));
      CREATE TABLE Resources (ResourceType TEXT PRIMARY KEY);
      INSERT INTO AiListTypes VALUES ('Default Settlement Plot Evaluations');
      INSERT INTO Resources VALUES ('RESOURCE_IRON'), ('RESOURCE_NITER'), ('RESOURCE_SILK');
      ${read("sr-ai.sql")} ${extra}
      SELECT 'S|' || StringVal || ':' || Value FROM AiFavoredItems WHERE Item = 'Specific Resource' ORDER BY StringVal;
      SELECT 'L|' || LeaderType || ':' || System FROM AiLists;
      SELECT 'B|' || Item || ':' || Value FROM AiFavoredItems WHERE ListType = 'Strategic Resources Pseudoyield Biases' ORDER BY Item;
      SELECT 'F|' || "table" FROM pragma_foreign_key_check;`
  }).trim().split("\n");
  const once = ai("");
  assert.deepEqual(once, ["S|RESOURCE_IRON:20", "S|RESOURCE_NITER:20", "L|TRAIT_LEADER_MAJOR_CIV:PseudoYieldBiases",
    "B|PSEUDOYIELD_ADJACENT_UNCLAIMED_RESOURCE:200", "B|PSEUDOYIELD_RESOURCE_IMPORT:100"], "AI rows");
  assert.deepEqual(ai(read("sr-ai.sql")), once, "AI rows, run twice");
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
