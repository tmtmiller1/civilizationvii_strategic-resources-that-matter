import assert from "node:assert/strict";
import fs from "node:fs";

// Locale gate. Every tag in en_us exists in all eleven other languages, under the Language code the game loads
// that folder as, with the same {placeholders} and markup, and no tag is defined twice anywhere. Placeholders are
// compared as a set, markup by count: a language may name a placeholder twice or once, as its grammar needs (a
// plural form repeats the count). A duplicate tag is
// fatal in game: the second insert hits the unique key and the loader rolls back the whole file, so every string in
// that language shows as a raw tag. A tag missing from a language shows raw in that language.

const FILE = "StrategicResourcesThatMatterText.xml";

/** Folder to the Language attribute its rows must carry (the modinfo's locale="..."). */
export const LANGUAGE_OF = {
  de_de: "de_DE", es_es: "es_ES", fr_fr: "fr_FR", it_it: "it_IT", ja_jp: "ja_JP", ko_kr: "ko_KR",
  pl_pl: "pl_PL", pt_br: "pt_BR", ru_ru: "ru_RU", zh_cn: "zh_Hans_CN", zh_hk: "zh_Hant_HK"
};

// Tags whose translation may read the same as the English on purpose ("Standard" in German, French and Italian; the
// short "Niter: 2" of a one-row production item and the list's "A, B", only placeholders and punctuation).
const SAME_AS_ENGLISH_OK = new Set([
  "LOC_SR_SETUP_UNSUPPLIED_STANDARD", "LOC_SR_PRODUCTION_NEEDS_HELD_SHORT", "LOC_SR_LIST_PAIR"
]);

/** @param {string} folder @returns {Map<string, string>} tag -> text, and asserts no duplicates */
function readTexts(folder) {
  const xml = fs.readFileSync(`text/${folder}/${FILE}`, "utf8");
  const texts = new Map();
  for (const m of xml.matchAll(/<(?:Row|Replace)\s+Tag="(LOC_[A-Z0-9_]+)"[^>]*>\s*<Text>([\s\S]*?)<\/Text>/g)) {
    assert.ok(!texts.has(m[1]), `${folder} defines ${m[1]} twice`);
    texts.set(m[1], m[2]);
  }
  return texts;
}

const marks = (/** @type {string} */ s) => {
  const found = [...s.matchAll(/\{[0-9]+_[A-Za-z]+[^}]*\}|\[icon:[A-Z0-9_]+\]|\[N\]|\[B\]|\[\/B\]|\[BLIST\]|\[LI\]|\[\/LIST\]/g)]
    .map((m) => m[0].replace(/\s*:.*\}$/, "}"));
  const placeholders = new Set(found.filter((mark) => mark.startsWith("{")));
  return [...placeholders, ...found.filter((mark) => !mark.startsWith("{"))].sort();
};

// A plural construct is "{1_Count : plural 1?one; other?many;}": each branch "key?text;" and an other? branch. The
// placeholder comparison above reads only the part before the colon, so a broken construct is checked here.
const PLURAL = /\{([0-9]+_[A-Za-z]+)\s*:\s*plural\b([^}]*)\}/g;
const BRANCH = /^(\s*[A-Za-z0-9=]+\?[^;?{}]*;)+\s*$/;
/** @param {string} text @returns {string[]} what is wrong with each plural construct */
export function pluralProblems(text) {
  const problems = [];
  for (const [whole, name, branches] of text.matchAll(PLURAL)) {
    if (!BRANCH.test(branches)) problems.push(`${whole}: each branch "key?text;", ending in ";"`);
    else if (!/(^|;)\s*other\?/.test(branches)) problems.push(`${whole}: no other? branch for ${name}`);
  }
  const opened = (text.match(/\{[0-9]+_[A-Za-z]+\s*:\s*plural\b/g) ?? []).length;
  if (opened !== [...text.matchAll(PLURAL)].length) problems.push("a plural construct is not closed");
  return problems;
}

const english = readTexts("en_us");
for (const [tag, text] of english) assert.deepEqual(pluralProblems(text), [], `en_us ${tag}: plural construct`);
assert.ok(english.size > 0, "en_us defines no tags (parse failure?)");

let checked = 0;
for (const [folder, language] of Object.entries(LANGUAGE_OF)) {
  const xml = fs.readFileSync(`text/${folder}/${FILE}`, "utf8");
  const texts = readTexts(folder);
  const missing = [...english.keys()].filter((tag) => !texts.has(tag));
  assert.equal(missing.length, 0, `${folder} is missing ${missing.length} tag(s): ${missing.slice(0, 4).join(", ")}`);
  const extra = [...texts.keys()].filter((tag) => !english.has(tag));
  assert.equal(extra.length, 0, `${folder} has tag(s) English does not: ${extra.slice(0, 4).join(", ")}`);
  const languages = new Set([...xml.matchAll(/Language="([^"]+)"/g)].map((m) => m[1]));
  assert.deepEqual([...languages], [language], `${folder}: rows tagged ${[...languages].join(", ")}`);
  assert.ok(!/<EnglishText>/.test(xml), `${folder} uses EnglishText; translations use LocalizedText with Replace`);
  for (const [tag, text] of texts) {
    assert.deepEqual(marks(text), marks(english.get(tag) ?? ""), `${folder} ${tag}: placeholders or markup differ`);
    assert.deepEqual(pluralProblems(text), [], `${folder} ${tag}: plural construct`);
    if (!SAME_AS_ENGLISH_OK.has(tag)) {
      assert.notEqual(text, english.get(tag), `${folder} ${tag} is still the English text`);
    }
    checked += 1;
  }
}

const languages = Object.keys(LANGUAGE_OF).length;
console.log(`i18n harness passed (${english.size} tags x ${languages} languages, ${checked} rows)`);
