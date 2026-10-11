// Writes the mod's data files from the gate map (scripts/gate-map.mjs) and the dumps of the game's own tables
// (devtools/gate-map/<age>.json):
//   node scripts/build-data.mjs           write data/
//   node scripts/build-data.mjs --check   exit 1 when a file in data/ differs from what would be written
//
// What it writes, and why it is shaped this way (DESIGN.md sections 7b to 7d):
//   - sr-tags.xml: one unit tag per resource, SR_SUPPLY_<NAME>.
//   - sr-<age>-supply.xml: that tag on every gated unit of the age (TypeTags), so one modifier per resource covers
//     its units, for combat (REQUIREMENT_UNIT_TAG_MATCHES) and for production (the UnitClass argument).
//   - sr-<age>-<level>-modifiers.xml and -game.xml: the unsupplied penalty for one setup level. Each penalty is
//     unconditional and cancelled by an equal bonus while the owner holds at least one copy. Both are attached per
//     major player (COLLECTION_MAJOR_PLAYERS, EFFECT_ATTACH_MODIFIERS) and the resource requirement sits on the
//     attached child only: on the attach parent it crashes the game.
//   - sr-<age>-curve-modifiers.xml and -game.xml: the late curve, +1 combat strength at each count threshold past
//     six, on the units vanilla's per-copy bonus covers.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AGES, AGE_FILE, VANILLA_PER_COPY, buildGateMap, gatedResources } from "./gate-map.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Setup levels of the unsupplied penalty: combat strength and production rate without the resource. */
export const LEVELS = {
  light: { value: "SR_UNSUPPLIED_LIGHT", combat: -2, productionPercent: -20 },
  standard: { value: "SR_UNSUPPLIED_STANDARD", combat: -3, productionPercent: -33 },
  harsh: { value: "SR_UNSUPPLIED_HARSH", combat: -5, productionPercent: -50 }
};

/** Copies at which the late curve adds +1 combat strength: one point per two copies past six. */
export const CURVE_THRESHOLDS = [8, 10, 12, 14, 16, 18, 20];

const HEADER = '<?xml version="1.0" encoding="utf-8"?>';
const GENERATED = "<!-- Written by scripts/build-data.mjs; edit the script, not this file. -->";

/** @param {string} resource RESOURCE_IRON -> IRON */
export const shortName = (resource) => resource.replace(/^RESOURCE_/, "");
/** @param {string} resource */
export const supplyTag = (resource) => `SR_SUPPLY_${shortName(resource)}`;

/** @param {string} age */
export function readDump(age) {
  const file = path.join(root, "devtools/gate-map", `${AGE_FILE[age]}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** @param {string} resource @param {number} amount */
function hasResource(resource, amount) {
  return [
    '            <Requirement type="REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE">',
    `                <Argument name="ResourceType">${resource}</Argument>`,
    `                <Argument name="Amount">${amount}</Argument>`,
    "            </Requirement>"
  ];
}

/** @param {string} id @param {string} child */
function attach(id, child) {
  return [
    `    <Modifier id="${id}" collection="COLLECTION_MAJOR_PLAYERS" effect="EFFECT_ATTACH_MODIFIERS">`,
    `        <Argument name="ModifierId">${child}</Argument>`,
    "    </Modifier>"
  ];
}

/**
 * @param {{ id: string, tag: string, amount: number, owner?: string[] }} spec
 */
function combatChild({ id, tag, amount, owner }) {
  return [
    `    <Modifier id="${id}" collection="COLLECTION_PLAYER_UNITS" effect="EFFECT_ADJUST_UNIT_BASE_COMBAT_STRENGTH">`,
    ...(owner ? ["        <OwnerRequirements>", ...owner, "        </OwnerRequirements>"] : []),
    "        <SubjectRequirements>",
    '            <Requirement type="REQUIREMENT_UNIT_TAG_MATCHES">',
    `                <Argument name="Tag">${tag}</Argument>`,
    "            </Requirement>",
    "        </SubjectRequirements>",
    `        <Argument name="Amount">${amount}</Argument>`,
    '        <Argument name="Type">ALL</Argument>',
    "    </Modifier>"
  ];
}

/**
 * @param {{ id: string, tag: string, percent: number, owner?: string[] }} spec
 */
function productionChild({ id, tag, percent, owner }) {
  return [
    `    <Modifier id="${id}" collection="COLLECTION_PLAYER_CITIES" effect="EFFECT_CITY_ADJUST_UNIT_PRODUCTION">`,
    ...(owner ? ["        <OwnerRequirements>", ...owner, "        </OwnerRequirements>"] : []),
    `        <Argument name="UnitClass">${tag}</Argument>`,
    `        <Argument name="Percent">${percent}</Argument>`,
    "    </Modifier>"
  ];
}

/** @param {string} comment @param {string[]} body */
const gameEffects = (comment, body) =>
  [HEADER, GENERATED, `<!-- ${comment} -->`, '<GameEffects xmlns="GameEffects">', ...body, "</GameEffects>", ""].join("\n");

/** @param {string[]} ids */
const gameModifiers = (ids) =>
  [HEADER, GENERATED, "<Database>", "    <GameModifiers>", ...ids.map((id) => `        <Row ModifierId="${id}"/>`),
    "    </GameModifiers>", "</Database>", ""].join("\n");

/**
 * The penalty modifiers for one resource at one level, and the attach ids to register.
 * @param {string} resource
 * @param {{ combat: number, productionPercent: number }} level
 */
export function penaltyFor(resource, level) {
  const name = shortName(resource);
  const tag = supplyTag(resource);
  const owner = hasResource(resource, 1);
  const body = [
    ...attach(`SR_ATTACH_COMBAT_PENALTY_${name}`, `SR_COMBAT_PENALTY_${name}`),
    ...combatChild({ id: `SR_COMBAT_PENALTY_${name}`, tag, amount: level.combat }),
    ...attach(`SR_ATTACH_COMBAT_SUPPLIED_${name}`, `SR_COMBAT_SUPPLIED_${name}`),
    ...combatChild({ id: `SR_COMBAT_SUPPLIED_${name}`, tag, amount: -level.combat, owner }),
    ...attach(`SR_ATTACH_PRODUCTION_PENALTY_${name}`, `SR_PRODUCTION_PENALTY_${name}`),
    ...productionChild({ id: `SR_PRODUCTION_PENALTY_${name}`, tag, percent: level.productionPercent }),
    ...attach(`SR_ATTACH_PRODUCTION_SUPPLIED_${name}`, `SR_PRODUCTION_SUPPLIED_${name}`),
    ...productionChild({ id: `SR_PRODUCTION_SUPPLIED_${name}`, tag, percent: -level.productionPercent, owner })
  ];
  const ids = ["COMBAT_PENALTY", "COMBAT_SUPPLIED", "PRODUCTION_PENALTY", "PRODUCTION_SUPPLIED"]
    .map((kind) => `SR_ATTACH_${kind}_${name}`);
  return { body, ids };
}

/**
 * The curve modifiers for one resource of one age.
 * @param {{ resource: string, tags: string[] }} perCopy
 */
export function curveFor({ resource, tags }) {
  const name = shortName(resource);
  const body = [];
  const ids = [];
  for (const threshold of CURVE_THRESHOLDS) {
    const id = `SR_CURVE_${name}_${threshold}`;
    body.push(
      ...attach(`SR_ATTACH_CURVE_${name}_${threshold}`, id),
      `    <Modifier id="${id}" collection="COLLECTION_PLAYER_UNITS" effect="EFFECT_ADJUST_UNIT_BASE_COMBAT_STRENGTH">`,
      "        <OwnerRequirements>",
      ...hasResource(resource, threshold),
      "        </OwnerRequirements>",
      '        <SubjectRequirements type="REQUIREMENTSET_TEST_ANY">',
      ...tags.flatMap((tag) => [
        '            <Requirement type="REQUIREMENT_UNIT_TAG_MATCHES">',
        `                <Argument name="Tag">${tag}</Argument>`,
        "            </Requirement>"
      ]),
      "        </SubjectRequirements>",
      '        <Argument name="Amount">1</Argument>',
      '        <Argument name="Type">ALL</Argument>',
      "    </Modifier>"
    );
    ids.push(`SR_ATTACH_CURVE_${name}_${threshold}`);
  }
  return { body, ids };
}

/** @returns {Map<string, string>} file name in data/ -> contents */
export function buildFiles() {
  /** @type {Map<string, string>} */
  const files = new Map();
  const allResources = [...new Set(AGES.flatMap(gatedResources))];
  files.set("sr-tags.xml", [HEADER, GENERATED, "<!-- One unit tag per resource a unit can draw on. -->", "<Database>",
    "    <Tags>", ...allResources.map((r) => `        <Row Tag="${supplyTag(r)}" Category="UNIT_CLASS"/>`),
    "    </Tags>", "</Database>", ""].join("\n"));
  for (const age of AGES) {
    const file = AGE_FILE[age];
    const gates = buildGateMap(readDump(age));
    files.set(`sr-${file}-supply.xml`, [HEADER, GENERATED,
      `<!-- ${age}: the units that draw on a resource (DESIGN.md section 4). -->`, "<Database>", "    <TypeTags>",
      ...[...gates].map(([unit, resource]) => `        <Row Type="${unit}" Tag="${supplyTag(resource)}"/>`),
      "    </TypeTags>", "</Database>", ""].join("\n"));
    for (const [levelName, level] of Object.entries(LEVELS)) {
      const parts = gatedResources(age).map((r) => penaltyFor(r, level));
      files.set(`sr-${file}-${levelName}-modifiers.xml`, gameEffects(
        `${age}, unsupplied penalty ${levelName}: ${level.combat} combat strength and ${level.productionPercent}% ` +
          "production without the resource, cancelled while the owner holds a copy.",
        parts.flatMap((p) => p.body)));
      files.set(`sr-${file}-${levelName}-game.xml`, gameModifiers(parts.flatMap((p) => p.ids)));
    }
    const curves = VANILLA_PER_COPY[age].map(curveFor);
    files.set(`sr-${file}-curve-modifiers.xml`, gameEffects(
      `${age}, late curve: +1 combat strength at ${CURVE_THRESHOLDS.join(", ")} copies, on the units ` +
        "vanilla's per-copy bonus covers (it stops at six copies).",
      curves.flatMap((c) => c.body)));
    files.set(`sr-${file}-curve-game.xml`, gameModifiers(curves.flatMap((c) => c.ids)));
  }
  return files;
}

function main() {
  const check = process.argv.includes("--check");
  const dataDir = path.join(root, "data");
  const files = buildFiles();
  const stale = [];
  for (const [name, text] of files) {
    const target = path.join(dataDir, name);
    const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
    if (current === text) continue;
    stale.push(name);
    if (!check) fs.writeFileSync(target, text);
  }
  const strays = fs.readdirSync(dataDir).filter((n) => n.startsWith("sr-") && n.endsWith(".xml") && !files.has(n));
  if (check) {
    if (stale.length || strays.length) {
      console.log(`data:check FAILED\n  stale: ${stale.join(", ") || "none"}\n  not generated: ${strays.join(", ") || "none"}`);
      process.exit(1);
    }
    console.log(`data:check ok (${files.size} files)`);
  } else {
    console.log(`wrote ${stale.length} of ${files.size} files${strays.length ? `; not generated: ${strays.join(", ")}` : ""}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
