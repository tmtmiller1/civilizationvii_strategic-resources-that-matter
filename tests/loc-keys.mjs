import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resourceNameTag } from "../scripts/build-data.mjs";
import { AGES, gatedResources } from "../scripts/gate-map.mjs";
import { listFiles, rel, ROOT, stripComments } from "./_fs-helpers.mjs";

// LOC-key gate: every LOC_ tag the scripts, the data files and the modinfo name is defined in en_us, or is a
// base-game tag listed below. A tag that is neither shows as the raw "LOC_..." string in game. tests/i18n.mjs then
// carries every en_us tag into the other languages.

/**
 * Base-game tags the mod uses without defining: the module name, the gated resources' names (preview lines), and
 * the tutorial callout's two buttons, the game's own.
 */
const BASE_GAME_KEYS = new Set(["LOC_MODULE_BASE_STANDARD_NAME", "LOC_TUTORIAL_CALLOUT_CLOSE",
  "LOC_TUTORIAL_CIVILOPEDIA_TELL_ME_MORE",
  ...AGES.flatMap(gatedResources).map(resourceNameTag)]);

const defined = new Set(
  [...fs.readFileSync(path.join(ROOT, "text/en_us/StrategicResourcesText.xml"), "utf8")
    .matchAll(/Tag="(LOC_[A-Z0-9_]+)"/g)].map((m) => m[1])
);
assert.ok(defined.size > 0, "en_us defines no tags (parse failure?)");

const stripXml = (/** @type {string} */ s) => s.replace(/<!--[\s\S]*?-->/g, "");
const stripSql = (/** @type {string} */ s) => s.replace(/--[^\n]*/g, "");
const sources = [
  ...listFiles(path.join(ROOT, "ui"), /\.js$/).map((f) => [f, stripComments(fs.readFileSync(f, "utf8"))]),
  ...listFiles(path.join(ROOT, "data"), /\.(xml|sql)$/).map((f) => [f, stripSql(stripXml(fs.readFileSync(f, "utf8")))]),
  [path.join(ROOT, "strategic-resources.modinfo"),
    stripXml(fs.readFileSync(path.join(ROOT, "strategic-resources.modinfo"), "utf8"))]
];

const missing = [];
let references = 0;
for (const [file, text] of sources) {
  for (const m of text.matchAll(/(?<![A-Za-z0-9_])LOC_[A-Z0-9_]*[A-Z0-9]/g)) {
    references += 1;
    if (!defined.has(m[0]) && !BASE_GAME_KEYS.has(m[0])) missing.push(`${m[0]} <- ${rel(file)}`);
  }
}
assert.equal(missing.length, 0, `LOC tag(s) not defined in en_us:\n  ${missing.join("\n  ")}`);
console.log(`loc-keys harness passed (${references} references in ${sources.length} files, ${defined.size} tags)`);
