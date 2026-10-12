import assert from "node:assert/strict";
import {
  buildPenaltyIndex,
  buildSupplyIndex,
  computeSupplyStatus,
  countCopies,
  describeProductionCost,
  describeSupplyLoss,
  resourceForSupplyTag,
  SUPPLIED_UNITS_SHOWN,
  unitsSuppliedBy
} from "/tower-strategic-resources-that-matter/ui/sr-supply.js";

// The pure half of the unit panel line: which resource a unit draws on and what it costs to lack it.

assert.equal(resourceForSupplyTag("SR_SUPPLY_IRON"), "RESOURCE_IRON");
assert.equal(resourceForSupplyTag("SR_SUPPLY_"), null);
assert.equal(resourceForSupplyTag("UNIT_CLASS_INFANTRY"), null);
assert.equal(resourceForSupplyTag(/** @type {*} */ (undefined)), null);

const supply = buildSupplyIndex([
  { Type: "UNIT_SPEARMAN", Tag: "UNIT_CLASS_INFANTRY" },
  { Type: "UNIT_SPEARMAN", Tag: "SR_SUPPLY_IRON" },
  { Type: "UNIT_CHARIOT", Tag: "SR_SUPPLY_HORSES" },
  { Tag: "SR_SUPPLY_OIL" },
  /** @type {*} */ (null)
]);
assert.deepEqual([...supply], [["UNIT_SPEARMAN", "RESOURCE_IRON"], ["UNIT_CHARIOT", "RESOURCE_HORSES"]]);

const penalties = buildPenaltyIndex([
  { ModifierId: "SR_COMBAT_PENALTY_IRON", Name: "Amount", Value: "-3" },
  { ModifierId: "SR_COMBAT_PENALTY_IRON", Name: "Type", Value: "ALL" },
  { ModifierId: "SR_PRODUCTION_PENALTY_IRON", Name: "Percent", Value: "-33" },
  { ModifierId: "SR_PRODUCTION_PENALTY_IRON", Name: "UnitClass", Value: "SR_SUPPLY_IRON" },
  { ModifierId: "SR_COMBAT_SUPPLIED_IRON", Name: "Amount", Value: "3" },
  { ModifierId: "SR_PRODUCTION_PENALTY_HORSES", Name: "Percent", Value: "-20" },
  { ModifierId: "SR_COMBAT_PENALTY_OIL", Name: "Percent", Value: "-5" },
  { ModifierId: "MOD_SOMETHING_ELSE", Name: "Amount", Value: "7" }
]);
assert.deepEqual(penalties.get("RESOURCE_IRON"), { combat: -3, productionPercent: -33 });
assert.deepEqual(penalties.get("RESOURCE_HORSES"), { combat: 0, productionPercent: -20 });
assert.equal(penalties.has("RESOURCE_OIL"), false, "a combat penalty is read from Amount only");
assert.equal(penalties.size, 2);

const holdings = [
  { resourceType: "RESOURCE_IRON", isOffMap: false },
  { resourceType: "RESOURCE_IRON", isOffMap: true },
  { resourceType: "RESOURCE_HORSES" },
  // an import over a trade route: the same shape as an owned copy, on the map (`p11-import-1`)
  { resourceType: "RESOURCE_NITER", isOffMap: false },
  { resourceType: null },
  /** @type {*} */ (null)
];
assert.equal(countCopies(holdings, "RESOURCE_IRON"), 1, "off-map copies count for nothing");
assert.equal(countCopies(holdings, "RESOURCE_HORSES"), 1);
assert.equal(countCopies(holdings, "RESOURCE_NITER"), 1, "an imported copy counts like an owned one");
assert.equal(countCopies(holdings, "RESOURCE_OIL"), 0);

const status = (unitType, copies) =>
  computeSupplyStatus({ unitType, supply, penalties, copiesOf: () => copies });
assert.deepEqual(status("UNIT_SPEARMAN", 0), { resourceType: "RESOURCE_IRON", combat: -3, productionPercent: -33 });
assert.equal(status("UNIT_SPEARMAN", 1), null, "one copy is enough");
assert.equal(status("UNIT_WARRIOR", 0), null, "an ungated unit is never unsupplied");
assert.deepEqual(status("UNIT_CHARIOT", 0), { resourceType: "RESOURCE_HORSES", combat: 0, productionPercent: -20 });
const off = computeSupplyStatus({ unitType: "UNIT_SPEARMAN", supply, penalties: new Map(), copiesOf: () => 0 });
assert.equal(off, null, "no penalty loaded (the Off setting) means no line");
const zero = computeSupplyStatus({
  unitType: "UNIT_SPEARMAN", supply, penalties: new Map([["RESOURCE_IRON", { combat: 0, productionPercent: 0 }]]),
  copiesOf: () => 0
});
assert.equal(zero, null);

// The resource line: the units a resource supplies, sorted by name, the first three and a count of the rest.
assert.equal(SUPPLIED_UNITS_SHOWN, 3);
const ironUnits = new Map([
  ["UNIT_SPEARMAN", "RESOURCE_IRON"], ["UNIT_PHALANX", "RESOURCE_IRON"], ["UNIT_LEGION", "RESOURCE_IRON"],
  ["UNIT_HOPLITE", "RESOURCE_IRON"], ["UNIT_CHARIOT", "RESOURCE_HORSES"]
]);
const unitNames = new Map([
  ["UNIT_SPEARMAN", "Spearman"], ["UNIT_PHALANX", "Phalanx"], ["UNIT_LEGION", "Legion"], ["UNIT_HOPLITE", "Hoplite"],
  ["UNIT_CHARIOT", "Chariot"]
]);
assert.deepEqual(unitsSuppliedBy("RESOURCE_IRON", ironUnits, unitNames), {
  names: ["Hoplite", "Legion", "Phalanx"], more: 1
});
assert.deepEqual(unitsSuppliedBy("RESOURCE_HORSES", ironUnits, unitNames), { names: ["Chariot"], more: 0 });
assert.equal(unitsSuppliedBy("RESOURCE_WINE", ironUnits, unitNames), null, "a resource that supplies nothing");
const ownUnits = new Map([["UNIT_SPEARMAN", "Spearman"], ["UNIT_LEGION", "Legion"]]);
assert.deepEqual(unitsSuppliedBy("RESOURCE_IRON", ironUnits, ownUnits), { names: ["Legion", "Spearman"], more: 0 },
  "a unit without a name (another civilization's unique unit) is left out");
const sameName = new Map([["UNIT_SPEARMAN", "Spear"], ["UNIT_PHALANX", "Spear"]]);
assert.deepEqual(unitsSuppliedBy("RESOURCE_IRON", ironUnits, sameName), { names: ["Spear"], more: 0 });
assert.equal(unitsSuppliedBy("RESOURCE_IRON", ironUnits, new Map()), null);

// The production item line agrees with the unit panel's status.
const query = (copies) => ({ supply, penalties, copiesOf: () => copies });
assert.deepEqual(describeProductionCost("UNIT_SPEARMAN", query(0)), {
  key: "LOC_SR_PRODUCTION_NEEDS_NONE", args: ["RESOURCE_IRON", -3]
});
assert.deepEqual(describeProductionCost("UNIT_SPEARMAN", query(2)), {
  key: "LOC_SR_PRODUCTION_NEEDS_HELD", args: ["RESOURCE_IRON", 2]
}, "held: the requirement shows before it bites");
assert.equal(describeProductionCost("UNIT_WARRIOR", query(0)), null, "an ungated unit says nothing");
assert.equal(describeProductionCost("UNIT_SPEARMAN", { supply, penalties: new Map(), copiesOf: () => 0 }), null,
  "the Off setting says nothing");
assert.equal(describeProductionCost("UNIT_SPEARMAN", {
  supply, penalties: new Map([["RESOURCE_IRON", { combat: 0, productionPercent: 0 }]]), copiesOf: () => 1
}), null);
for (const copies of [0, 1, 5]) {
  const line = describeProductionCost("UNIT_SPEARMAN", query(copies));
  const unsupplied = computeSupplyStatus({ unitType: "UNIT_SPEARMAN", ...query(copies) }) !== null;
  assert.equal(line?.key === "LOC_SR_PRODUCTION_NEEDS_NONE", unsupplied, `panel and list agree at ${copies}`);
}

// describeSupplyLoss: the lost-supply notification names the unit type the player has most of and counts the rest
{
  const lossSupply = new Map([["UNIT_FIELD_CANNON", "RESOURCE_NITER"], ["UNIT_MORTAR", "RESOURCE_NITER"],
    ["UNIT_TANK", "RESOURCE_OIL"]]);
  const lossPenalties = new Map([["RESOURCE_NITER", { combat: -3, productionPercent: -33 }],
    ["RESOURCE_OIL", { combat: 0, productionPercent: 0 }]]);
  const indexes = { supply: lossSupply, penalties: lossPenalties };
  assert.deepEqual(
    describeSupplyLoss("RESOURCE_NITER", ["UNIT_MORTAR", "UNIT_FIELD_CANNON", "UNIT_FIELD_CANNON", "UNIT_TANK",
      "UNIT_INFANTRY", "UNIT_FIELD_CANNON", "UNIT_MORTAR"], indexes),
    { key: "LOC_SR_NOTIFY_LOST_MANY", resourceType: "RESOURCE_NITER", unitType: "UNIT_FIELD_CANNON", others: 4,
      combat: -3 });
  assert.deepEqual(describeSupplyLoss("RESOURCE_NITER", ["UNIT_MORTAR", "UNIT_FIELD_CANNON"], indexes)?.unitType,
    "UNIT_MORTAR", "a tie goes to the first seen");
  assert.deepEqual(describeSupplyLoss("RESOURCE_NITER", ["UNIT_TANK", "UNIT_MORTAR"], indexes),
    { key: "LOC_SR_NOTIFY_LOST_ONE", resourceType: "RESOURCE_NITER", unitType: "UNIT_MORTAR", others: 0, combat: -3 });
  assert.deepEqual(describeSupplyLoss("RESOURCE_NITER", [], indexes),
    { key: "LOC_SR_NOTIFY_LOST_NONE", resourceType: "RESOURCE_NITER", unitType: null, others: 0, combat: -3 });
  assert.equal(describeSupplyLoss("RESOURCE_OIL", ["UNIT_TANK"], indexes), null, "the Off setting says nothing");
  assert.equal(describeSupplyLoss("RESOURCE_COAL", ["UNIT_TANK"], indexes), null, "no penalty modifier loaded");
}

console.log("sr-supply tests passed");
