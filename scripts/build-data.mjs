// Writes the mod's data files from the gate map (scripts/gate-map.mjs) and the dumps of the game's own tables
// (devtools/gate-map/<age>.json):
//   node scripts/build-data.mjs           write data/
//   node scripts/build-data.mjs --check   exit 1 when a file in data/ differs from what would be written
//
// What it writes, and why it is shaped this way (DESIGN.md sections 7b to 7d):
//   - sr-tags.xml: one unit tag per resource, SR_SUPPLY_<NAME>.
//   - sr-<age>-supply.xml: that tag on every gated unit of the age (TypeTags), so one modifier per resource covers
//     its units, for melee strength (REQUIREMENT_UNIT_TAG_MATCHES) and for production (the UnitClass argument). Two
//     more tags per resource, SR_RANGED_<NAME> and SR_BOMBARD_<NAME>, mark the gated units that have a ranged or a
//     bombard strength above 0, and SR_CURVE_RANGED_<NAME> and SR_CURVE_BOMBARD_<NAME> do the same for the units the
//     curve covers. A strength row reaches only units that have that strength.
//   - sr-<age>-<level>-modifiers.xml and -game.xml: the unsupplied penalty for one setup level. Each penalty is
//     unconditional and cancelled by an equal bonus while the owner holds at least one copy. Both are attached per
//     major player (COLLECTION_MAJOR_PLAYERS, EFFECT_ATTACH_MODIFIERS) and the resource requirement sits on the
//     attached child only: on the attach parent it crashes the game.
//   - sr-<age>-curve-modifiers.xml and -game.xml: the late curve, +1 combat strength at each count threshold past
//     six, on the units vanilla's per-copy bonus covers: melee by vanilla's own tags, ranged and bombard by the tags
//     above.
//   - In both: one combat preview line per penalty and per curve step. The combat preview lists combat-time
//     modifiers only, never a base strength change, so each line is its own EFFECT_ADJUST_UNIT_STRENGTH_MODIFIER with
//     Amount 0 and a Preview string, behind the same requirements as the change it names (DESIGN.md 7e). The preview
//     text gets the modifier's arguments as its parameters, sorted by argument name: Amount (always 0), then
//     Combat, Copies and Resource.
//   - sr-<age>-gate-<value>.xml: the hard gate for one setup value (Gated Units: Training, or Training and upgrade).
//     Units.StrategicResource on every gated unit of the age, which the engine checks against the owner's live copy
//     count for training and purchase, and the six STRATEGIC_RESOURCE_MINIMUM global parameters the check reads,
//     which vanilla 1.5.0 does not define (without them the column blocks for good): one copy to train or buy,
//     none to heal, and for upgrading none under Training and one under Training and upgrade. Nothing else: no
//     grant, no trait, no requirement. Independents and city-states are exempt by the game's own rule
//     (CivilizationLevels.IgnoresUnitStrategicResourceRequirements). Plus one line on each gated unit's Civilopedia
//     page, after the level line. DESIGN.md 7f.
//   - sr-notification.xml and sr-notification-icons.xml: the notification ui/sr-supply-lost.js raises when the local
//     player loses the last copy of a resource its units need. It ends with the turn, never blocks it, and carries
//     the game's own "trade resources lost" icon and sound. The script passes the composed text as Message and
//     Summary (the rows' tags are the fallback), since a notification raised from script takes no text arguments.
//   - sr-civilopedia.xml: the Civilopedia page in Game Concepts (its chapters' text by key convention,
//     LOC_PEDIA_CONCEPTS_PAGE_SR_STRATEGIC_RESOURCES_CHAPTER_<chapter>_TITLE and _PARA_<n>), and one chapter on the
//     unit page layout. A chapter without text is not drawn, so that chapter shows only on the pages the per-level
//     -game.xml files give a paragraph: each gated unit's, "Needs Iron: without it, -3 Combat Strength ...". A
//     paragraph row replaces a chapter's whole text on its page, so the mod adds its own chapter rather than a row in
//     one of the game's.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AGES, AGE_FILE, STRENGTHS, VANILLA_PER_COPY, buildGateMap, gatedResources, strengthUnits
} from "./gate-map.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Setup levels of the unsupplied penalty: combat strength and production rate without the resource. */
export const LEVELS = {
  light: { value: "SR_UNSUPPLIED_LIGHT", combat: -2, productionPercent: -20 },
  standard: { value: "SR_UNSUPPLIED_STANDARD", combat: -3, productionPercent: -33 },
  harsh: { value: "SR_UNSUPPLIED_HARSH", combat: -5, productionPercent: -50 }
};

/** Setup values of the hard gate, and the engine's upgrading minimum each one writes. */
export const GATES_OPTION = {
  training: { value: "SR_GATE_TRAINING", upgrading: 0 },
  upgrade: { value: "SR_GATE_UPGRADE", upgrading: 1 }
};

/**
 * The engine's knobs for Units.StrategicResource, as the gate writes them. The purchase and healing minimums are
 * read against the same live count; a unit in the field is never gated, so healing stays free.
 * @param {number} upgrading copies needed to upgrade into a gated unit
 * @returns {[string, number][]}
 */
export const gateParameters = (upgrading) => [
  ["STRATEGIC_RESOURCE_MINIMUM_FOR_PRODUCTION_ANYWHERE", 1],
  ["STRATEGIC_RESOURCE_MINIMUM_FOR_PRODUCTION_WITH_DISTRICT", 1],
  ["STRATEGIC_RESOURCE_MINIMUM_FOR_PURCHASE_ANYWHERE", 1],
  ["STRATEGIC_RESOURCE_MINIMUM_FOR_PURCHASE_WITH_DISTRICT", 1],
  ["STRATEGIC_RESOURCE_MINIMUM_FOR_UNIT_UPGRADING", upgrading],
  ["STRATEGIC_RESOURCE_MINIMUM_FOR_UNIT_HEALING", 0]
];

/** Copies at which the late curve adds +1 combat strength: one point per two copies past six. */
export const CURVE_THRESHOLDS = [8, 10, 12, 14, 16, 18, 20];

const HEADER = '<?xml version="1.0" encoding="utf-8"?>';
const GENERATED = "<!-- Written by scripts/build-data.mjs; edit the script, not this file. -->";

/** @param {string} resource RESOURCE_IRON -> IRON */
export const shortName = (resource) => resource.replace(/^RESOURCE_/, "");
/** @param {string} resource */
export const supplyTag = (resource) => `SR_SUPPLY_${shortName(resource)}`;
/** The tag a penalty row of one strength type matches. @param {string} type @param {string} resource */
export const penaltyTag = (type, resource) =>
  type === "MELEE" ? supplyTag(resource) : `SR_${type}_${shortName(resource)}`;
/** The tag a ranged or bombard curve row matches. @param {string} type @param {string} resource */
export const curveTag = (type, resource) => `SR_CURVE_${type}_${shortName(resource)}`;
/** Modifier id stem for a strength type: COMBAT for melee (the unit panel reads SR_COMBAT_PENALTY_), else the type. */
const stem = (/** @type {string} */ type) => (type === "MELEE" ? "COMBAT" : type);

/** @param {string} age */
export function readDump(age) {
  const file = path.join(root, "devtools/gate-map", `${AGE_FILE[age]}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** @param {string} resource @param {number} amount @param {boolean} [inverse] */
function hasResource(resource, amount, inverse = false) {
  return [
    `            <Requirement type="REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE"${inverse ? ' inverse="true"' : ""}>`,
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

/** @param {string[]} tags any of these */
function tagRequirements(tags) {
  return [
    tags.length > 1 ? '        <SubjectRequirements type="REQUIREMENTSET_TEST_ANY">' : "        <SubjectRequirements>",
    ...tags.flatMap((tag) => [
      '            <Requirement type="REQUIREMENT_UNIT_TAG_MATCHES">',
      `                <Argument name="Tag">${tag}</Argument>`,
      "            </Requirement>"
    ]),
    "        </SubjectRequirements>"
  ];
}

/**
 * One strength type's change on the units carrying any of `tags`.
 * @param {{ id: string, tags: string[], type: string, amount: number, owner?: string[] }} spec
 */
function combatChild({ id, tags, type, amount, owner }) {
  return [
    `    <Modifier id="${id}" collection="COLLECTION_PLAYER_UNITS" effect="EFFECT_ADJUST_UNIT_BASE_COMBAT_STRENGTH">`,
    ...(owner ? ["        <OwnerRequirements>", ...owner, "        </OwnerRequirements>"] : []),
    ...tagRequirements(tags),
    `        <Argument name="Amount">${amount}</Argument>`,
    `        <Argument name="Type">${type}</Argument>`,
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

/** The game's own name tag of a resource: RESOURCE_IRON -> LOC_RESOURCE_IRON_NAME. @param {string} resource */
export const resourceNameTag = (resource) => `LOC_${resource}_NAME`;

/** Preview text of the unsupplied line ("-3 Unsupplied: no Niter") and of a curve step ("+1 Niter: 8 or more"). */
export const PREVIEW_TEXT = { penalty: "LOC_SR_PREVIEW_UNSUPPLIED", curve: "LOC_SR_PREVIEW_CURVE" };

/**
 * A combat preview line: a strength modifier of 0 whose Preview string names the change made elsewhere. The
 * arguments after Amount are there for the text only.
 * @param {{ id: string, tags: string[], owner: string[], text: string, args: Record<string, string | number> }} spec
 */
function previewChild({ id, tags, owner, text, args }) {
  return [
    `    <Modifier id="${id}" collection="COLLECTION_PLAYER_COMBAT" effect="EFFECT_ADJUST_UNIT_STRENGTH_MODIFIER">`,
    "        <OwnerRequirements>", ...owner, "        </OwnerRequirements>",
    ...tagRequirements(tags),
    '        <Argument name="Amount">0</Argument>',
    ...Object.entries(args).map(([name, value]) => `        <Argument name="${name}">${value}</Argument>`),
    `        <String context="Preview">${text}</String>`,
    "    </Modifier>"
  ];
}

/** @param {string} comment @param {string[]} body */
const gameEffects = (comment, body) =>
  [HEADER, GENERATED, `<!-- ${comment} -->`, '<GameEffects xmlns="GameEffects">', ...body, "</GameEffects>", ""]
    .join("\n");

/** @param {string[]} ids @param {string[]} [more] further tables, already indented */
const gameModifiers = (ids, more = []) =>
  [HEADER, GENERATED, "<Database>", "    <GameModifiers>", ...ids.map((id) => `        <Row ModifierId="${id}"/>`),
    "    </GameModifiers>", ...more, "</Database>", ""].join("\n");

/**
 * The Civilopedia page, its chapters in order, and the two chapters the mod adds to unit pages: the penalty line
 * and the gate line. The paragraph table keeps one row per page and chapter, so each line has its own chapter.
 */
export const PEDIA = {
  section: "CONCEPTS", page: "SR_STRATEGIC_RESOURCES", group: "COMBAT", layout: "SR_CONCEPT",
  chapters: ["CONTENT", "UNSUPPLIED", "COPY", "LOSS", "PAST_SIX", "GATES", "LOCK"],
  searchTerms: ["LOC_SR_PEDIA_TERM_UNSUPPLIED", "LOC_SR_PEDIA_TERM_STRATEGIC"],
  unitChapter: "SR_SUPPLY", unitHeader: "LOC_SR_PEDIA_UNIT_CHAPTER",
  unitGateChapter: "SR_LOCK", unitGateHeader: "LOC_SR_SETUP_GATE_NAME"
};
/** The line on a gated unit's page. @param {string} resource @param {string} levelName */
export const pediaUnitTag = (resource, levelName) =>
  `LOC_SR_PEDIA_UNIT_${shortName(resource)}_${levelName.toUpperCase()}`;

/**
 * The gate line on a gated unit's page, per resource and gate value.
 * @param {string} resource
 * @param {string} gateName
 */
export const pediaGateTag = (resource, gateName) =>
  `LOC_SR_PEDIA_UNIT_${shortName(resource)}_GATE_${gateName.toUpperCase()}`;

/**
 * The hard gate for one age and setup value: the column on every gated unit, the parameters, and the page line.
 * @param {string} age @param {Map<string, string>} gates @param {string} gateName
 */
function gateFile(age, gates, gateName) {
  const { upgrading } = GATES_OPTION[/** @type {keyof typeof GATES_OPTION} */ (gateName)];
  return [HEADER, GENERATED,
    `<!-- ${age}, Gated Units ${gateName}: a gated unit cannot be trained or bought without a copy of its resource` +
      `${upgrading ? ", nor upgraded to" : ""}; the engine reads the owner's live count. -->`,
    "<Database>",
    "    <Units>",
    ...[...gates].map(([unit, resource]) =>
      `        <Update><Where UnitType="${unit}"/><Set StrategicResource="${resource}"/></Update>`),
    "    </Units>",
    "    <GlobalParameters>",
    ...gateParameters(upgrading).map(([name, value]) => `        <Replace Name="${name}" Value="${value}"/>`),
    "    </GlobalParameters>",
    "    <CivilopediaPageChapterParagraphs>",
    ...[...gates].map(([unit, resource]) => `        <Row SectionID="UNITS" PageID="${unit}" ` +
      `ChapterID="${PEDIA.unitGateChapter}" Paragraph="${pediaGateTag(resource, gateName)}" SortIndex="10"/>`),
    "    </CivilopediaPageChapterParagraphs>",
    "</Database>", ""].join("\n");
}

/** The lost-supply notification: one type, its sound, and its icon (an UpdateIcons file of its own). */
export const NOTIFICATION = {
  type: "NOTIFICATION_SR_SUPPLY_LOST", message: "LOC_SR_NOTIFY_LOST_TITLE", summary: "LOC_SR_NOTIFY_LOST_FALLBACK",
  icon: "blp:ntf_trade_res_lost", audio: "notif-Trade_Resources_Lost"
};

function notificationFile() {
  const { type, message, summary, audio } = NOTIFICATION;
  return [HEADER, GENERATED,
    "<!-- The lost-supply notification: low severity, ends with the turn, never blocks it. -->",
    "<Database>",
    "    <Types>", `        <Row Type="${type}" Kind="KIND_NOTIFICATION"/>`, "    </Types>",
    "    <Notifications>",
    `        <Row NotificationType="${type}" SeverityType="LOW" ExpiresEndOfTurn="True" AutoNotify="False" ` +
      `Message="${message}" Summary="${summary}" Priority="2"/>`,
    "    </Notifications>",
    "    <NotificationSounds>", `        <Row NotificationType="${type}" Context="Add" Audio="${audio}"/>`,
    "    </NotificationSounds>",
    "</Database>", ""].join("\n");
}

function notificationIconsFile() {
  const { type, icon } = NOTIFICATION;
  return [HEADER, GENERATED,
    "<!-- The lost-supply notification's icon: the game's own for traded resources lost. -->",
    "<Database>", "    <IconDefinitions>",
    "        <Row>", `            <ID>${type}</ID>`, `            <Path>${icon}</Path>`, "        </Row>",
    "    </IconDefinitions>", "</Database>", ""].join("\n");
}

function pediaFile() {
  const { section, page, group, layout, chapters, searchTerms, unitChapter, unitHeader } = PEDIA;
  const { unitGateChapter, unitGateHeader } = PEDIA;
  return [HEADER, GENERATED,
    "<!-- The Civilopedia page in Game Concepts, and the chapter that gated units' pages show. -->",
    "<Database>",
    "    <CivilopediaPageLayouts>", `        <Row PageLayoutID="${layout}" UseSidebar="false"/>`,
    "    </CivilopediaPageLayouts>",
    "    <CivilopediaPageLayoutChapters>",
    ...chapters.map((c, i) => `        <Row PageLayoutID="${layout}" ChapterID="${c}" SortIndex="${(i + 1) * 10}"/>`),
    `        <Row PageLayoutID="Unit" ChapterID="${unitChapter}" Header="${unitHeader}" SortIndex="25"/>`,
    `        <Row PageLayoutID="Unit" ChapterID="${unitGateChapter}" Header="${unitGateHeader}" SortIndex="26"/>`,
    "    </CivilopediaPageLayoutChapters>",
    "    <CivilopediaPages>",
    `        <Row SectionID="${section}" PageID="${page}" PageGroupID="${group}" PageLayoutID="${layout}" ` +
      `Name="LOC_PEDIA_${section}_PAGE_${page}_TITLE" SortIndex="296"/>`,
    "    </CivilopediaPages>",
    "    <CivilopediaPageSearchTerms>",
    ...searchTerms.map((t) => `        <Row SectionID="${section}" PageID="${page}" Term="${t}"/>`),
    "    </CivilopediaPageSearchTerms>",
    "</Database>", ""].join("\n");
}

/** One paragraph row per gated unit of an age, for one setup level. @param {Map<string, string>} gates */
const pediaUnitRows = (gates, /** @type {string} */ levelName) => [
  "    <CivilopediaPageChapterParagraphs>",
  ...[...gates].map(([unit, resource]) => `        <Row SectionID="UNITS" PageID="${unit}" ` +
    `ChapterID="${PEDIA.unitChapter}" Paragraph="${pediaUnitTag(resource, levelName)}" SortIndex="10"/>`),
  "    </CivilopediaPageChapterParagraphs>"];

/**
 * The penalty modifiers for one resource at one level, and the attach ids to register. A strength row is written
 * only when some gated unit has that strength.
 * @param {string} resource
 * @param {{ combat: number, productionPercent: number }} level
 * @param {Record<string, string[]>} units gated units per strength type
 */
export function penaltyFor(resource, level, units) {
  const name = shortName(resource);
  const owner = hasResource(resource, 1);
  const body = [];
  const ids = [];
  const add = (/** @type {string} */ kind, /** @type {string[]} */ child) => {
    body.push(...attach(`SR_ATTACH_${kind}_${name}`, `SR_${kind}_${name}`), ...child);
    ids.push(`SR_ATTACH_${kind}_${name}`);
  };
  for (const { type } of STRENGTHS) {
    if (!units[type].length) continue;
    const tags = [penaltyTag(type, resource)];
    add(`${stem(type)}_PENALTY`,
      combatChild({ id: `SR_${stem(type)}_PENALTY_${name}`, tags, type, amount: level.combat }));
    add(`${stem(type)}_SUPPLIED`,
      combatChild({ id: `SR_${stem(type)}_SUPPLIED_${name}`, tags, type, amount: -level.combat, owner }));
  }
  const tag = supplyTag(resource);
  add("PRODUCTION_PENALTY",
    productionChild({ id: `SR_PRODUCTION_PENALTY_${name}`, tag, percent: level.productionPercent }));
  add("PRODUCTION_SUPPLIED",
    productionChild({ id: `SR_PRODUCTION_SUPPLIED_${name}`, tag, percent: -level.productionPercent, owner }));
  add("PREVIEW_PENALTY", previewChild({
    id: `SR_PREVIEW_PENALTY_${name}`, tags: [tag], owner: hasResource(resource, 1, true), text: PREVIEW_TEXT.penalty,
    args: { Combat: level.combat, Resource: resourceNameTag(resource) }
  }));
  return { body, ids };
}

/**
 * The curve modifiers for one resource of one age: per threshold, +1 on each strength type some covered unit has,
 * and one preview line per step, shown from that threshold up to the next (so a unit shows one curve line).
 * @param {{ resource: string, tags: string[] }} perCopy
 * @param {Record<string, string[]>} units covered units per strength type
 */
export function curveFor({ resource, tags }, units) {
  const name = shortName(resource);
  const body = [];
  const ids = [];
  for (const threshold of CURVE_THRESHOLDS) {
    for (const { type } of STRENGTHS) {
      if (!units[type].length) continue;
      const part = type === "MELEE" ? "" : `${type}_`;
      const id = `SR_CURVE_${part}${name}_${threshold}`;
      const match = type === "MELEE" ? tags : [curveTag(type, resource)];
      body.push(...attach(`SR_ATTACH_CURVE_${part}${name}_${threshold}`, id),
        ...combatChild({ id, tags: match, type, amount: 1, owner: hasResource(resource, threshold) }));
      ids.push(`SR_ATTACH_CURVE_${part}${name}_${threshold}`);
    }
    const step = CURVE_THRESHOLDS.indexOf(threshold);
    const next = CURVE_THRESHOLDS[step + 1];
    const id = `SR_PREVIEW_CURVE_${name}_${threshold}`;
    body.push(...attach(`SR_ATTACH_PREVIEW_CURVE_${name}_${threshold}`, id), ...previewChild({
      id, tags, owner: [...hasResource(resource, threshold), ...(next ? hasResource(resource, next, true) : [])],
      text: PREVIEW_TEXT.curve, args: { Combat: step + 1, Copies: threshold, Resource: resourceNameTag(resource) }
    }));
    ids.push(`SR_ATTACH_PREVIEW_CURVE_${name}_${threshold}`);
  }
  return { body, ids };
}

/** @returns {Map<string, string>} file name in data/ -> contents */
export function buildFiles() {
  /** @type {Map<string, string>} */
  const files = new Map();
  const allResources = [...new Set(AGES.flatMap(gatedResources))];
  const allTags = allResources.flatMap((r) => [supplyTag(r), penaltyTag("RANGED", r), penaltyTag("BOMBARD", r),
    curveTag("RANGED", r), curveTag("BOMBARD", r)]);
  files.set("sr-civilopedia.xml", pediaFile());
  files.set("sr-notification.xml", notificationFile());
  files.set("sr-notification-icons.xml", notificationIconsFile());
  files.set("sr-tags.xml", [HEADER, GENERATED,
    "<!-- Unit tags: which resource a unit draws on, and which of its strengths the penalty and the curve change. -->",
    "<Database>", "    <Tags>", ...allTags.map((t) => `        <Row Tag="${t}" Category="UNIT_CLASS"/>`),
    "    </Tags>", "</Database>", ""].join("\n"));
  for (const age of AGES) {
    const file = AGE_FILE[age];
    const dump = readDump(age);
    const gates = buildGateMap(dump);
    const strengths = strengthUnits(dump);
    const rows = [...gates].map(([unit, resource]) => [unit, supplyTag(resource)]);
    for (const [resource, units] of strengths.penalty) {
      for (const type of ["RANGED", "BOMBARD"]) rows.push(...units[type].map((u) => [u, penaltyTag(type, resource)]));
    }
    for (const [resource, units] of strengths.curve) {
      for (const type of ["RANGED", "BOMBARD"]) rows.push(...units[type].map((u) => [u, curveTag(type, resource)]));
    }
    files.set(`sr-${file}-supply.xml`, [HEADER, GENERATED,
      `<!-- ${age}: the units that draw on a resource (DESIGN.md section 4), and their strength types. -->`,
      "<Database>", "    <TypeTags>", ...rows.map(([unit, tag]) => `        <Row Type="${unit}" Tag="${tag}"/>`),
      "    </TypeTags>", "</Database>", ""].join("\n"));
    for (const [levelName, level] of Object.entries(LEVELS)) {
      const parts = gatedResources(age).map((r) => penaltyFor(r, level, strengths.penalty.get(r) ?? {}));
      files.set(`sr-${file}-${levelName}-modifiers.xml`, gameEffects(
        `${age}, unsupplied penalty ${levelName}: ${level.combat} combat strength and ${level.productionPercent}% ` +
          "production without the resource, cancelled while the owner holds a copy; each strength only on units " +
          "that have it.",
        parts.flatMap((p) => p.body)));
      files.set(`sr-${file}-${levelName}-game.xml`,
        gameModifiers(parts.flatMap((p) => p.ids), pediaUnitRows(gates, levelName)));
    }
    for (const gateName of Object.keys(GATES_OPTION)) {
      files.set(`sr-${file}-gate-${gateName}.xml`, gateFile(age, gates, gateName));
    }
    const curves = VANILLA_PER_COPY[age].map((c) => curveFor(c, strengths.curve.get(c.resource) ?? {}));
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
      console.log(`data:check FAILED\n  stale: ${stale.join(", ") || "none"}\n` +
        `  not generated: ${strays.join(", ") || "none"}`);
      process.exit(1);
    }
    console.log(`data:check ok (${files.size} files)`);
  } else {
    const note = strays.length ? `; not generated: ${strays.join(", ")}` : "";
    console.log(`wrote ${stale.length} of ${files.size} files${note}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
