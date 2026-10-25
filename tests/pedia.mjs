import assert from "node:assert/strict";
import fs from "node:fs";
import {
  GATES_OPTION, gateLineFor, LEVELS, PEDIA, pediaGateTag, pediaUnitTag, resourceNameTag
} from "../scripts/build-data.mjs";
import { AGES, AGE_FILE, buildGateMap, gatedResources, suppliers } from "../scripts/gate-map.mjs";

// Civilopedia gate. The game finds a chapter's text by key convention and draws nothing, with no error, for a
// chapter without text, a gap in its paragraphs (PARA_1 and PARA_3 drops PARA_3) or a mistyped key
// (base-standard ui/civilopedia/model-civilopedia.js, getChapterBody and findChapterTextKey). So this walks the page
// the same way: the title, each chapter's title (CONTENT has none, as in the game's own pages) and its paragraphs
// from PARA_1 with no gap, the search terms and the unit chapter's header. Every gated unit has exactly one line on
// its page per setup level, naming its own resource (and, in an age where others stand in for it, each of those).
// A name the text nests ({LOC_RESOURCE_IRON_NAME}) is the same in every language and is either the mod's own tag or
// one of the game's that every game loads (resource, age); a unit name is written out, because the game loads unit
// names only with that unit's age.
// It does not show that the game draws the page; opening the Civilopedia in a game does that
// (docs/verification-runs.md, phase 12).

const FILE = "StrategicResourcesThatMatterText.xml";
/** @param {string} folder @returns {Map<string, string>} */
const texts = (folder) => new Map([...fs.readFileSync(`text/${folder}/${FILE}`, "utf8")
  .matchAll(/<(?:Row|Replace)\s+Tag="(LOC_[A-Z0-9_]+)"[^>]*>\s*<Text>([\s\S]*?)<\/Text>/g)].map((m) => [m[1], m[2]]));
const english = texts("en_us");

const data = fs.readFileSync("data/sr-civilopedia.xml", "utf8");
const { section, page, layout, chapters, searchTerms, unitChapter, unitHeader } = PEDIA;
const { unitGateChapter, unitGateHeader } = PEDIA;
const prefix = `LOC_PEDIA_${section}_PAGE_${page}`;

// The page row and its layout, as written.
assert.match(data, new RegExp(`<Row PageLayoutID="${layout}" UseSidebar="false"/>`), "layout row");
assert.match(data, new RegExp(`<Row SectionID="${section}" PageID="${page}" PageGroupID="[A-Z]+" ` +
  `PageLayoutID="${layout}" Name="${prefix}_TITLE"`), "page row");
const written = [...data.matchAll(new RegExp(`<Row PageLayoutID="${layout}" ChapterID="([A-Z_]+)"`, "g"))]
  .map((m) => m[1]);
assert.deepEqual(written, chapters, "chapter rows");
assert.ok(english.has(`${prefix}_TITLE`), "page title text");

let paragraphs = 0;
for (const chapter of chapters) {
  const key = `${prefix}_CHAPTER_${chapter}`;
  if (chapter === "CONTENT") assert.ok(!english.has(`${key}_TITLE`), "CONTENT draws without a title");
  else assert.ok(english.has(`${key}_TITLE`), `${chapter} has no title`);
  assert.ok(english.has(`${key}_PARA_1`), `${chapter} has no text: the game would draw nothing`);
  let n = 1;
  while (english.has(`${key}_PARA_${n + 1}`)) n += 1;
  paragraphs += n;
  const beyond = [...english.keys()].filter((k) => k.startsWith(`${key}_PARA_`) && Number(k.split("_PARA_")[1]) > n);
  assert.deepEqual(beyond, [], `${chapter}: paragraphs after a gap are never drawn`);
}
for (const term of searchTerms) {
  assert.ok(english.has(term), `search term ${term} has no text`);
  assert.match(data, new RegExp(`PageID="${page}" Term="${term}"`), `search term ${term} row`);
}
assert.match(data, new RegExp(`<Row PageLayoutID="Unit" ChapterID="${unitChapter}" Header="${unitHeader}"`));
assert.ok(english.has(unitHeader), "unit chapter header text");
assert.match(data, new RegExp(`<Row PageLayoutID="Unit" ChapterID="${unitGateChapter}" Header="${unitGateHeader}"`));
assert.ok(english.has(unitGateHeader), "gate chapter header text");

// One line per gated unit and setup level, naming that unit's resource.
let unitRows = 0;
for (const age of AGES) {
  const gates = buildGateMap(JSON.parse(fs.readFileSync(`devtools/gate-map/${AGE_FILE[age]}.json`, "utf8")));
  for (const levelName of Object.keys(LEVELS)) {
    const xml = fs.readFileSync(`data/sr-${AGE_FILE[age]}-${levelName}-game.xml`, "utf8");
    const rows = [...xml.matchAll(/<Row SectionID="UNITS" PageID="([A-Z0-9_]+)" ChapterID="([A-Z_]+)" Paragraph="([A-Z0-9_]+)"/g)];
    assert.deepEqual(rows.map((r) => r[1]), [...gates.keys()], `${age} ${levelName}: one line per gated unit`);
    for (const [, unit, chapter, tag] of rows) {
      assert.equal(chapter, unitChapter, `${unit}: chapter`);
      assert.equal(tag, pediaUnitTag(gates.get(unit) ?? "", levelName, age), `${age} ${levelName} ${unit}: line`);
      assert.ok(english.has(tag), `${tag} has no text`);
      for (const resource of suppliers(age, gates.get(unit) ?? "")) {
        assert.ok(english.get(tag)?.includes(`{${resourceNameTag(resource)}}`), `${tag} leaves out ${resource}`);
      }
      assert.ok(english.get(tag)?.includes(String(LEVELS[/** @type {keyof typeof LEVELS} */ (levelName)].combat)),
        `${tag} names another penalty`);
      unitRows += 1;
    }
  }
}

// The gate's line: one per gated unit and gate value, after the level line, naming that unit's resource.
let gateRows = 0;
for (const age of AGES) {
  const gates = buildGateMap(JSON.parse(fs.readFileSync(`devtools/gate-map/${AGE_FILE[age]}.json`, "utf8")));
  for (const gateName of Object.keys(GATES_OPTION)) {
    const xml = fs.readFileSync(`data/sr-${AGE_FILE[age]}-gate-${gateName}.xml`, "utf8");
    const rows = [...xml.matchAll(/<Row SectionID="UNITS" PageID="([A-Z0-9_]+)" ChapterID="([A-Z_]+)" Paragraph="([A-Z0-9_]+)"/g)];
    assert.deepEqual(rows.map((r) => r[1]), [...gates.keys()], `${age} gate ${gateName}: one line per gated unit`);
    for (const [, unit, chapter, tag] of rows) {
      assert.equal(chapter, unitGateChapter, `${unit}: chapter`);
      assert.equal(tag, pediaGateTag(gates.get(unit) ?? "", gateLineFor(unit, gateName), age),
        `${age} gate ${gateName} ${unit}: line`);
      assert.ok(english.has(tag), `${tag} has no text`);
      for (const resource of suppliers(age, gates.get(unit) ?? "")) {
        assert.ok(english.get(tag)?.includes(`{${resourceNameTag(resource)}}`), `${tag} leaves out ${resource}`);
      }
      gateRows += 1;
    }
  }
}

// Nested names: the same in every language, and loaded in every game.
const NESTABLE = new Set([...AGES.flatMap((age) => gatedResources(age).flatMap((r) => suppliers(age, r)))
  .map(resourceNameTag),
  "LOC_AGE_ANTIQUITY_NAME", "LOC_AGE_EXPLORATION_NAME", "LOC_AGE_MODERN_NAME"]);
const nested = (/** @type {string} */ s) => [...s.matchAll(/\{(LOC_[A-Z0-9_]+)\}/g)].map((m) => m[1]).sort();
for (const [tag, text] of english) {
  for (const ref of nested(text)) {
    assert.ok(english.has(ref) || NESTABLE.has(ref), `${tag} nests ${ref}, which not every game loads`);
  }
}
for (const folder of fs.readdirSync("text").filter((d) => d !== "en_us" && fs.existsSync(`text/${d}/${FILE}`))) {
  for (const [tag, text] of texts(folder)) {
    assert.deepEqual(nested(text), nested(english.get(tag) ?? ""), `${folder} ${tag}: nested names differ`);
  }
}

console.log(`pedia harness passed (${chapters.length} chapters, ${paragraphs} paragraphs, ${unitRows} unit lines,
    ${gateRows} gate lines)`);
