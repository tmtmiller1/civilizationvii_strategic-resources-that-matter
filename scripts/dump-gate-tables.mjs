// Saves the tables the gate map is built from, as the running game compiled them, for one age:
//   node scripts/dump-gate-tables.mjs <antiquity|exploration|modern> [path/to/gameplay-copy.sqlite]
// The game writes Debug/gameplay-copy.sqlite when a game starts, holding only the age being played. Run this
// while a game of that age is loaded; the output goes to devtools/gate-map/<age>.json and is what
// scripts/build-data.mjs and tests/data.mjs read.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const age = process.argv[2];
const AGES = { antiquity: "AGE_ANTIQUITY", exploration: "AGE_EXPLORATION", modern: "AGE_MODERN" };
if (!AGES[age]) {
  console.error("usage: node scripts/dump-gate-tables.mjs <antiquity|exploration|modern> [gameplay-copy.sqlite]");
  process.exit(2);
}
const db = process.argv[3] ??
  path.join(os.homedir(), "Library/Application Support/Civilization VII/Debug/gameplay-copy.sqlite");

/** @param {string} query */
const rows = (query) => {
  const out = execFileSync("sqlite3", ["-readonly", "-json", db, query], { encoding: "utf8", maxBuffer: 1 << 26 });
  return out.trim() ? JSON.parse(out) : [];
};

const units = rows(`SELECT u.UnitType, u.CoreClass, u.Domain, u.Tier, u.TraitType, u.CanTrain, u.StrategicResource,
  s.Combat, s.RangedCombat, s.Bombard FROM Units u LEFT JOIN Unit_Stats s USING (UnitType)
  WHERE u.CoreClass = 'CORE_CLASS_MILITARY' ORDER BY u.UnitType`);
const unitTypes = new Set(units.map((u) => u.UnitType));
// The mod's own SR_SUPPLY_ tags are left out: the dump is the game's tables as the gate map reads them.
const tags = rows("SELECT Type, Tag FROM TypeTags WHERE Tag NOT LIKE 'SR\\_%' ESCAPE '\\' ORDER BY Type, Tag")
  .filter((r) => unitTypes.has(r.Type));
const replaces = rows("SELECT CivUniqueUnitType, ReplacesUnitType FROM UnitReplaces ORDER BY CivUniqueUnitType");
const upgrades = rows("SELECT Unit, UpgradeUnit FROM UnitUpgrades ORDER BY Unit");
const resources = rows("SELECT ResourceType, ResourceClassType FROM Resources ORDER BY ResourceType");

const out = { age: AGES[age], source: path.basename(db), dumpedAt: new Date().toISOString().slice(0, 10),
  units, tags, replaces, upgrades, resources };
const file = path.join(root, "devtools/gate-map", `${age}.json`);
fs.writeFileSync(file, JSON.stringify(out, null, 1) + "\n");
console.log(`wrote ${path.relative(root, file)}: ${units.length} military units, ${tags.length} tags`);
