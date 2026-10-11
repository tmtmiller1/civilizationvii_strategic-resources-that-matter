import assert from "node:assert/strict";
import {
  buildPenaltyIndex,
  buildSupplyIndex,
  computeSupplyStatus,
  countCopies,
  resourceForSupplyTag
} from "/tower-strategic-resources/ui/sr-supply.js";

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
  { resourceType: null },
  /** @type {*} */ (null)
];
assert.equal(countCopies(holdings, "RESOURCE_IRON"), 1, "off-map copies count for nothing");
assert.equal(countCopies(holdings, "RESOURCE_HORSES"), 1);
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

console.log("sr-supply tests passed");
