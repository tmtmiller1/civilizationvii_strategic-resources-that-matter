import assert from "node:assert/strict";
import {
  buildReplacementTable, buildReplacesIndex, buildTagIndex, keptAfterScan, parseFielded, parseKept, roleOf,
  serializeFielded, unitKey, unitsToSwap, unlockedBy, unlockOwner
} from "/tower-strategic-resources-that-matter/ui/sr-minor-gate-core.js";

// The minor gate's logic, driven with plain tables in place of the engine.

const land = (UnitType, extra = {}) => ({ UnitType, Domain: "DOMAIN_LAND", CoreClass: "CORE_CLASS_MILITARY", ...extra });
const sea = (UnitType, extra = {}) => ({ UnitType, Domain: "DOMAIN_SEA", CoreClass: "CORE_CLASS_MILITARY", ...extra });
const units = [
  land("UNIT_WARRIOR"), land("UNIT_SPEARMAN"), land("UNIT_LEGION", { TraitType: "TRAIT_ROME" }),
  land("UNIT_SLINGER"), land("UNIT_ARCHER"), land("UNIT_CHARIOT"), land("UNIT_HORSEMAN"), land("UNIT_BALLISTA"),
  land("UNIT_CATAPULT"), land("UNIT_HIDDEN", { CanTrain: false }), land("UNIT_COMPANY", { Tier: 3 }),
  land("UNIT_BIG_GUN", { Tier: 2 }), land("UNIT_MORTAR", { Tier: 2 }), land("UNIT_SCOUT", { CoreClass: "CORE_CLASS_RECON" }),
  sea("UNIT_GALLEY"), sea("UNIT_IRONCLAD"), sea("UNIT_CARRACK")
];
const tag = (Type, ...tags) => tags.map((t) => ({ Type, Tag: `UNIT_CLASS_${t}` }));
const tags = buildTagIndex([
  ...tag("UNIT_WARRIOR", "COMBAT", "MELEE"), ...tag("UNIT_SPEARMAN", "COMBAT", "MELEE"),
  ...tag("UNIT_LEGION", "COMBAT", "MELEE"), ...tag("UNIT_SLINGER", "COMBAT", "RANGED"),
  ...tag("UNIT_ARCHER", "COMBAT", "RANGED"), ...tag("UNIT_CHARIOT", "COMBAT", "CAVALRY", "MOUNTED"),
  ...tag("UNIT_HORSEMAN", "COMBAT", "CAVALRY"), ...tag("UNIT_BALLISTA", "COMBAT", "SIEGE"),
  ...tag("UNIT_CATAPULT", "COMBAT", "SIEGE"), ...tag("UNIT_HIDDEN", "COMBAT", "MELEE"),
  ...tag("UNIT_COMPANY", "COMBAT", "MELEE"), ...tag("UNIT_BIG_GUN", "COMBAT", "SIEGE"),
  ...tag("UNIT_MORTAR", "COMBAT", "SIEGE"), ...tag("UNIT_SCOUT", "RECON"), ...tag("UNIT_GALLEY", "COMBAT", "MELEE", "NAVAL"),
  ...tag("UNIT_IRONCLAD", "COMBAT", "MELEE", "NAVAL"), ...tag("UNIT_CARRACK", "COMBAT", "RANGED", "NAVAL"),
  { Type: "UNIT_SPEARMAN", Tag: "SR_SUPPLY_IRON" }, { bad: true }
]);
const strength = new Map([["UNIT_WARRIOR", 20], ["UNIT_SPEARMAN", 25], ["UNIT_LEGION", 35], ["UNIT_SLINGER", 15],
  ["UNIT_ARCHER", 25], ["UNIT_CHARIOT", 30], ["UNIT_HORSEMAN", 35], ["UNIT_BALLISTA", 30], ["UNIT_CATAPULT", 25],
  ["UNIT_HIDDEN", 99], ["UNIT_COMPANY", 60], ["UNIT_BIG_GUN", 50], ["UNIT_MORTAR", 40], ["UNIT_GALLEY", 25], ["UNIT_IRONCLAD", 45], ["UNIT_CARRACK", 40]]);

// Roles: the first role tag on the ladder, by domain; no combat tag, no role.
assert.equal(roleOf(units.find((u) => u.UnitType === "UNIT_CHARIOT"), tags), "DOMAIN_LAND|UNIT_CLASS_CAVALRY");
assert.equal(roleOf(units.find((u) => u.UnitType === "UNIT_CARRACK"), tags), "DOMAIN_SEA|UNIT_CLASS_RANGED");
assert.equal(roleOf(units.find((u) => u.UnitType === "UNIT_SCOUT"), tags), null);
assert.equal(roleOf(undefined, tags), null);

// Replacements: the strongest free unit of the same role. A civilization's own unit, one the game won't let anyone
// train, and every unit the gate holds back are never picked. With no free unit of the role, the domain's strongest
// free melee unit; at sea with none, nothing.
const needs = new Map([["UNIT_SPEARMAN", ["RESOURCE_IRON"]], ["UNIT_CHARIOT", ["RESOURCE_HORSES"]],
  ["UNIT_HORSEMAN", ["RESOURCE_HORSES"]], ["UNIT_BALLISTA", ["RESOURCE_IRON"]], ["UNIT_IRONCLAD", ["RESOURCE_COAL"]],
  ["UNIT_CARRACK", ["RESOURCE_HARDWOOD"]], ["UNIT_GALLEY", ["RESOURCE_PITCH"]], ["UNIT_GONE", ["RESOURCE_OIL"]],
  ["UNIT_MORTAR", ["RESOURCE_NITER"]]]);
const table = buildReplacementTable({ units, tags, strength, needs });
assert.equal(table.get("UNIT_SPEARMAN"), "UNIT_WARRIOR",
  "melee: the Warrior, not the Legion, the hidden unit or the tier 3 Company");
assert.equal(table.get("UNIT_BALLISTA"), "UNIT_CATAPULT", "siege keeps siege, at its own tier (not the tier 2 gun)");
assert.equal(table.get("UNIT_MORTAR"), "UNIT_BIG_GUN", "a tier 2 unit may take the tier 2 gun");
assert.equal(table.get("UNIT_CHARIOT"), "UNIT_WARRIOR", "no free cavalry: the best free melee unit");
assert.equal(table.get("UNIT_HORSEMAN"), "UNIT_WARRIOR");
assert.equal(table.get("UNIT_IRONCLAD"), null, "every ship held back: nothing, never a land unit at sea");
assert.equal(table.get("UNIT_CARRACK"), null);
assert.equal(table.get("UNIT_GONE"), null, "a unit missing from the table: nothing");

// Unlock owner: the suzerain, else the human player.
assert.equal(unlockOwner(3, 0), 3);
assert.equal(unlockOwner(-1, 0), 0);
assert.equal(unlockOwner(Number.NaN, 0), 0);

// A unique unit counts for the unit it replaces.
const replaces = buildReplacesIndex([{ CivUniqueUnitType: "UNIT_HOPLITE", ReplacesUnitType: "UNIT_SPEARMAN" }, {}]);
assert.deepEqual([...unlockedBy(["UNIT_HOPLITE", "UNIT_WARRIOR"], replaces)].sort(),
  ["UNIT_HOPLITE", "UNIT_SPEARMAN", "UNIT_WARRIOR"]);

// Which minor units are swapped: held-back types whose unlock owner hasn't fielded one.
const fielded = new Map([[0, new Set(["UNIT_CHARIOT"])], [2, new Set(["UNIT_HOPLITE"])]]);
const swaps = unitsToSwap({
  units: [
    { owner: 10, id: 1, type: "UNIT_SPEARMAN", location: { x: 1, y: 1 } }, // independent: the human hasn't
    { owner: 10, id: 2, type: "UNIT_CHARIOT", location: { x: 1, y: 2 } }, // the human has a Chariot
    { owner: 11, id: 3, type: "UNIT_SPEARMAN", location: { x: 2, y: 2 } }, // city-state of player 2 (a Hoplite)
    { owner: 12, id: 4, type: "UNIT_CHARIOT", location: { x: 3, y: 3 } }, // city-state of player 3 (nothing)
    { owner: 12, id: 5, type: "UNIT_WARRIOR", location: { x: 3, y: 4 } } // never held back
  ],
  suzerainOf: (owner) => ({ 11: 2, 12: 3 })[owner] ?? -1,
  human: 0,
  unlocked: (player) => unlockedBy(fielded.get(player) ?? new Set(), replaces),
  needs,
  replacement: table
});
assert.deepEqual(swaps.map((s) => [s.unit.id, s.replacement, s.unlockOwner]),
  [[1, "UNIT_WARRIOR", 0], [4, "UNIT_WARRIOR", 3]]);

// A unit the gate let stay keeps staying. The human has a Spearman, so an independent's Spearman stays; the village
// then becomes a city-state of player 3, who has never fielded one. Its Spearman stays, and a new one waits.
const village = { owner: 10, id: 7, type: "UNIT_SPEARMAN", location: { x: 5, y: 5 } };
const humanHas = new Map([[0, new Set(["UNIT_SPEARMAN"])]]);
const asVillage = {
  suzerainOf: () => -1, human: 0, needs, replacement: table,
  unlocked: (/** @type {number} */ player) => unlockedBy(humanHas.get(player) ?? new Set(), replaces)
};
const first = unitsToSwap({ ...asVillage, units: [village] });
assert.deepEqual(first, [], "the human has fielded a Spearman: the village keeps its own");
let kept = keptAfterScan({ units: [village], needs, swapped: first });
assert.deepEqual([...kept], [unitKey(village)]);
const fresh = { owner: 10, id: 8, type: "UNIT_SPEARMAN", location: { x: 5, y: 6 } };
const asCityState = { ...asVillage, suzerainOf: () => 3 };
const later = unitsToSwap({ ...asCityState, units: [village, fresh], kept });
assert.deepEqual(later.map((s) => s.unit.id), [8], "under the new suzerain the old Spearman stays, the new one waits");
kept = keptAfterScan({ units: [village, fresh], needs, swapped: later });
assert.deepEqual([...kept], [unitKey(village)], "the swapped unit isn't kept");
assert.equal(keptAfterScan({ units: [], needs, swapped: [] }).size, 0, "a unit that died drops out");
assert.equal(unitsToSwap({ ...asCityState, units: [{ ...village, type: "UNIT_CHARIOT" }], kept }).length, 1,
  "a reused id on another type isn't the kept unit");
assert.deepEqual([...parseKept(`${[...kept].join(",")},junk,1:2:UNIT_OK`)], [unitKey(village), "1:2:UNIT_OK"]);
assert.equal(parseKept(null).size, 0);

// The stored list round-trips, and junk reads as empty.
assert.deepEqual([...parseFielded(serializeFielded(new Set(["UNIT_B", "UNIT_A"])))], ["UNIT_A", "UNIT_B"]);
assert.equal(parseFielded(undefined).size, 0);
assert.equal(parseFielded("not a unit,UNIT_OK").size, 1);

console.log("sr-minor-gate harness passed");
