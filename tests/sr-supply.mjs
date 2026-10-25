import assert from "node:assert/strict";
import {
  buildAlternativeIndex,
  buildGateIndex,
  buildPenaltyIndex,
  buildSupplyIndex,
  computeSupplyStatus,
  computeSupplyStatuses,
  countCopies,
  countSupply,
  describeProductionCost,
  describeSupplyLoss,
  resourceForSupplyTag,
  SUPPLIED_UNITS_SHOWN,
  unitsSuppliedBy,
  eitherNameKey,
  withAlternatives,
  GATE_PRODUCTION_PARAMETER, GATE_PURCHASE_PARAMETER,
  GATE_UPGRADING_PARAMETER,
  lockedBy,
  lockedResources
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
  /** @type {*} */ (null),
  // A unit that draws on two resources (Modern Supply Chains): both, in the rows' order, each once.
  { Type: "UNIT_TANK", Tag: "SR_SUPPLY_OIL" },
  { Type: "UNIT_TANK", Tag: "SR_SUPPLY_COAL" },
  { Type: "UNIT_TANK", Tag: "SR_SUPPLY_OIL" }
]);
assert.deepEqual([...supply], [["UNIT_SPEARMAN", ["RESOURCE_IRON"]], ["UNIT_CHARIOT", ["RESOURCE_HORSES"]],
  ["UNIT_TANK", ["RESOURCE_OIL", "RESOURCE_COAL"]]]);

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
const twoPenalties = new Map([...penalties, ["RESOURCE_OIL", { combat: -3, productionPercent: -33 }],
  ["RESOURCE_COAL", { combat: -3, productionPercent: -33 }]]);

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
// Two resources: one status per resource the owner holds none of; the first is what the callout names.
const tankCopies = (/** @type {Record<string, number>} */ held) => (/** @type {string} */ r) => held[r] ?? 0;
assert.deepEqual(computeSupplyStatuses({ unitType: "UNIT_TANK", supply, penalties: twoPenalties, copiesOf: tankCopies({}) }),
  [{ resourceType: "RESOURCE_OIL", combat: -3, productionPercent: -33 },
    { resourceType: "RESOURCE_COAL", combat: -3, productionPercent: -33 }]);
assert.deepEqual(computeSupplyStatuses({ unitType: "UNIT_TANK", supply, penalties: twoPenalties,
  copiesOf: tankCopies({ RESOURCE_OIL: 1 }) }), [{ resourceType: "RESOURCE_COAL", combat: -3, productionPercent: -33 }]);
assert.deepEqual(computeSupplyStatuses({ unitType: "UNIT_TANK", supply, penalties: twoPenalties,
  copiesOf: tankCopies({ RESOURCE_OIL: 1, RESOURCE_COAL: 2 }) }), []);
assert.deepEqual(computeSupplyStatus({ unitType: "UNIT_TANK", supply, penalties: twoPenalties, copiesOf: tankCopies({}) }),
  { resourceType: "RESOURCE_OIL", combat: -3, productionPercent: -33 });

// The resource line: the units a resource supplies, sorted by name, the first three and a count of the rest.
assert.equal(SUPPLIED_UNITS_SHOWN, 3);
const ironUnits = new Map([
  ["UNIT_SPEARMAN", ["RESOURCE_IRON"]], ["UNIT_PHALANX", ["RESOURCE_IRON"]], ["UNIT_LEGION", ["RESOURCE_IRON"]],
  ["UNIT_HOPLITE", ["RESOURCE_IRON"]], ["UNIT_CHARIOT", ["RESOURCE_HORSES"]], ["UNIT_TANK", ["RESOURCE_OIL", "RESOURCE_COAL"]]
]);
const unitNames = new Map([
  ["UNIT_SPEARMAN", "Spearman"], ["UNIT_PHALANX", "Phalanx"], ["UNIT_LEGION", "Legion"], ["UNIT_HOPLITE", "Hoplite"],
  ["UNIT_CHARIOT", "Chariot"]
]);
assert.deepEqual(unitsSuppliedBy("RESOURCE_IRON", ironUnits, unitNames), {
  names: ["Hoplite", "Legion", "Phalanx"], more: 1
});
assert.deepEqual(unitsSuppliedBy("RESOURCE_HORSES", ironUnits, unitNames), { names: ["Chariot"], more: 0 });
assert.deepEqual(unitsSuppliedBy("RESOURCE_COAL", ironUnits, new Map([["UNIT_TANK", "Tank"]])), { names: ["Tank"], more: 0 },
  "a unit's second resource lists it too");
assert.equal(unitsSuppliedBy("RESOURCE_WINE", ironUnits, unitNames), null, "a resource that supplies nothing");
const ownUnits = new Map([["UNIT_SPEARMAN", "Spearman"], ["UNIT_LEGION", "Legion"]]);
assert.deepEqual(unitsSuppliedBy("RESOURCE_IRON", ironUnits, ownUnits), { names: ["Legion", "Spearman"], more: 0 },
  "a unit without a name (another civilization's unique unit) is left out");
const sameName = new Map([["UNIT_SPEARMAN", "Spear"], ["UNIT_PHALANX", "Spear"]]);
assert.deepEqual(unitsSuppliedBy("RESOURCE_IRON", ironUnits, sameName), { names: ["Spear"], more: 0 });
assert.equal(unitsSuppliedBy("RESOURCE_IRON", ironUnits, new Map()), null);

// The production item line agrees with the unit panel's status.
const query = (copies) => ({ supply, penalties, copiesOf: () => copies });
assert.deepEqual(describeProductionCost("UNIT_SPEARMAN", query(0)), [{
  key: "LOC_SR_PRODUCTION_NEEDS_NONE", args: ["RESOURCE_IRON", -3]
}]);
assert.deepEqual(describeProductionCost("UNIT_SPEARMAN", query(2)), [{
  key: "LOC_SR_PRODUCTION_NEEDS_HELD", args: ["RESOURCE_IRON", 2]
}], "held: the requirement shows before it bites");
assert.deepEqual(describeProductionCost("UNIT_WARRIOR", query(0)), [], "an ungated unit says nothing");
assert.deepEqual(describeProductionCost("UNIT_SPEARMAN", { supply, penalties: new Map(), copiesOf: () => 0 }), [],
  "the Off setting says nothing");
assert.deepEqual(describeProductionCost("UNIT_SPEARMAN", {
  supply, penalties: new Map([["RESOURCE_IRON", { combat: 0, productionPercent: 0 }]]), copiesOf: () => 1
}), []);
for (const copies of [0, 1, 5]) {
  const [line] = describeProductionCost("UNIT_SPEARMAN", query(copies));
  const unsupplied = computeSupplyStatus({ unitType: "UNIT_SPEARMAN", ...query(copies) }) !== null;
  assert.equal(line?.key === "LOC_SR_PRODUCTION_NEEDS_NONE", unsupplied, `panel and list agree at ${copies}`);
}
// Two resources: one line per resource, each in its own state.
assert.deepEqual(describeProductionCost("UNIT_TANK", { supply, penalties: twoPenalties, copiesOf: tankCopies({ RESOURCE_COAL: 2 }) }),
  [{ key: "LOC_SR_PRODUCTION_NEEDS_NONE", args: ["RESOURCE_OIL", -3] },
    { key: "LOC_SR_PRODUCTION_NEEDS_HELD", args: ["RESOURCE_COAL", 2] }]);

// describeSupplyLoss: the lost-supply notification names the unit type the player has most of and counts the rest
{
  const lossSupply = new Map([["UNIT_FIELD_CANNON", ["RESOURCE_NITER"]], ["UNIT_MORTAR", ["RESOURCE_NITER"]],
    ["UNIT_TANK", ["RESOURCE_OIL"]]]);
  const lossPenalties = new Map([["RESOURCE_NITER", { combat: -3, productionPercent: -33 }],
    ["RESOURCE_OIL", { combat: 0, productionPercent: 0 }]]);
  const indexes = { supply: lossSupply, penalties: lossPenalties };
  assert.deepEqual(
    describeSupplyLoss("RESOURCE_NITER", ["UNIT_MORTAR", "UNIT_FIELD_CANNON", "UNIT_FIELD_CANNON", "UNIT_TANK",
      "UNIT_INFANTRY", "UNIT_FIELD_CANNON", "UNIT_MORTAR"], indexes),
    { key: "LOC_SR_NOTIFY_LOST_MANY", resourceType: "RESOURCE_NITER", unitType: "UNIT_FIELD_CANNON", others: 4,
      combat: -3, locked: false });
  assert.deepEqual(describeSupplyLoss("RESOURCE_NITER", ["UNIT_MORTAR", "UNIT_FIELD_CANNON"], indexes)?.unitType,
    "UNIT_MORTAR", "a tie goes to the first seen");
  assert.deepEqual(describeSupplyLoss("RESOURCE_NITER", ["UNIT_TANK", "UNIT_MORTAR"], indexes),
    { key: "LOC_SR_NOTIFY_LOST_ONE", resourceType: "RESOURCE_NITER", unitType: "UNIT_MORTAR", others: 0, combat: -3,
      locked: false });
  assert.deepEqual(describeSupplyLoss("RESOURCE_NITER", [], indexes),
    { key: "LOC_SR_NOTIFY_LOST_NONE", resourceType: "RESOURCE_NITER", unitType: null, others: 0, combat: -3,
      locked: false });
  assert.equal(describeSupplyLoss("RESOURCE_OIL", ["UNIT_TANK"], indexes), null, "the Off setting says nothing");
  assert.equal(describeSupplyLoss("RESOURCE_COAL", ["UNIT_TANK"], indexes), null, "no penalty modifier loaded");

  // Under the hard gate the sentence gains its tail, and a loss with the penalty off still locks the units.
  const gate = buildGateIndex(
    [{ UnitType: "UNIT_FIELD_CANNON", StrategicResource: "RESOURCE_NITER" },
      { UnitType: "UNIT_MORTAR", StrategicResource: "RESOURCE_NITER" },
      { UnitType: "UNIT_TANK", StrategicResource: "RESOURCE_OIL" }],
    [{ Name: GATE_PRODUCTION_PARAMETER, Value: "1" }, { Name: GATE_PURCHASE_PARAMETER, Value: "1" },
      { Name: GATE_UPGRADING_PARAMETER, Value: "0" }], lossSupply);
  assert.deepEqual(gate.on, true);
  assert.deepEqual(describeSupplyLoss("RESOURCE_NITER", ["UNIT_MORTAR"], { ...indexes, gate }),
    { key: "LOC_SR_NOTIFY_LOST_ONE", resourceType: "RESOURCE_NITER", unitType: "UNIT_MORTAR", others: 0, combat: -3,
      locked: true });
  assert.deepEqual(describeSupplyLoss("RESOURCE_OIL", ["UNIT_TANK"], { ...indexes, gate }),
    { key: "LOC_SR_NOTIFY_LOCKED", resourceType: "RESOURCE_OIL", unitType: null, others: 0, combat: 0, locked: true },
    "penalty off, gate on: the loss still locks");
  assert.equal(describeSupplyLoss("RESOURCE_COAL", ["UNIT_TANK"], { ...indexes, gate }), null,
    "a resource nothing of the gate names");
}

// The hard gate: read from the loaded data, per unit.
{
  const units = [{ UnitType: "UNIT_SPEARMAN", StrategicResource: "RESOURCE_IRON" },
    { UnitType: "UNIT_CHARIOT", StrategicResource: "RESOURCE_HORSES" },
        { UnitType: "UNIT_WARRIOR", StrategicResource: null },
    { UnitType: "UNIT_KNIGHT", StrategicResource: "RESOURCE_HORSES" }];
  const production = { Name: GATE_PRODUCTION_PARAMETER, Value: "1" };
  const purchase = { Name: GATE_PURCHASE_PARAMETER, Value: "1" };
  const on = buildGateIndex(units, [production, purchase, { Name: GATE_UPGRADING_PARAMETER, Value: "1" }], supply);
  assert.deepEqual([on.on, on.upgrade], [true, true]);
  assert.deepEqual([...on.columns], [["UNIT_SPEARMAN", "RESOURCE_IRON"], ["UNIT_CHARIOT", "RESOURCE_HORSES"],
    ["UNIT_KNIGHT", "RESOURCE_HORSES"]], "every column, also one another mod set");
  const training = buildGateIndex(units, [production, purchase, { Name: GATE_UPGRADING_PARAMETER, Value: "0" }],
    supply);
  assert.deepEqual([training.on, training.upgrade], [true, false]);
  assert.deepEqual([training.on, buildGateIndex(units, [production, purchase], supply).upgrade], [true, false],
      "no upgrading row");
  const theirs = buildGateIndex(units, [{ Name: GATE_PRODUCTION_PARAMETER, Value: "3" }, purchase], supply);
  assert.deepEqual([theirs.on, theirs.columns.size], [false, 0],
    "another mod's threshold: its rule and its texts, the mod's lock texts step back");
  assert.deepEqual([buildGateIndex(units, [production], supply).on], [false], "no purchase minimum");
  const off = buildGateIndex(units, [], supply);
  assert.deepEqual([off.on, off.upgrade, off.columns.size], [false, false, 0],
    "no production minimum: the column blocks nothing the engine reads, so no unit is locked");
  const partial = buildGateIndex([{ UnitType: "UNIT_SPEARMAN", StrategicResource: null }, ...units.slice(1)],
      [production, purchase], supply);
  assert.deepEqual([partial.on, partial.columns.size], [false, 0],
    "a column on some units only (another mod's) is not the option, and reads as no lock of the mod's");
  assert.deepEqual([buildGateIndex(units, [production, purchase], new Map()).on], [false], "no gated units at all");
  assert.equal(lockedBy("UNIT_SPEARMAN", on, () => 0), "RESOURCE_IRON");
  assert.equal(lockedBy("UNIT_SPEARMAN", on, () => 1), null, "a copy unlocks");
  assert.equal(lockedBy("UNIT_WARRIOR", on, () => 0), null, "no column");
  assert.equal(lockedBy("UNIT_KNIGHT", partial, () => 0), null, "another mod's column: not the mod's lock");
  assert.deepEqual(describeProductionCost("UNIT_SPEARMAN", { ...query(0), gate: on }),
    [{ key: "LOC_SR_PRODUCTION_LOCKED", args: ["RESOURCE_IRON"] }], "locked: the lock, not the penalty");
  assert.deepEqual(describeProductionCost("UNIT_SPEARMAN", { ...query(2), gate: on }),
    [{ key: "LOC_SR_PRODUCTION_NEEDS_HELD", args: ["RESOURCE_IRON", 2] }], "unlocked: as 1.0");
  const penaltyOff = { supply, penalties: new Map(), copiesOf: () => 0, gate: on };
  assert.deepEqual(describeProductionCost("UNIT_SPEARMAN", penaltyOff),
    [{ key: "LOC_SR_PRODUCTION_LOCKED", args: ["RESOURCE_IRON"] }], "penalty off, gate on");
  assert.deepEqual(describeProductionCost("UNIT_SPEARMAN", { ...query(0), gate: off }),
    [{ key: "LOC_SR_PRODUCTION_NEEDS_NONE", args: ["RESOURCE_IRON", -3] }], "gate off: as 1.0");

  // Two resources under the gate (Modern Supply Chains): the column's resource and the second one both lock, in
  // the gate's order; the needs list carries both, the column only the first.
  const chainUnits = [...units, { UnitType: "UNIT_TANK", StrategicResource: "RESOURCE_OIL" }];
  const chains = buildGateIndex(chainUnits, [production, purchase, { Name: GATE_UPGRADING_PARAMETER, Value: "1" }],
    supply);
  assert.deepEqual(chains.needs.get("UNIT_TANK"), ["RESOURCE_OIL", "RESOURCE_COAL"]);
  assert.deepEqual(chains.needs.get("UNIT_SPEARMAN"), ["RESOURCE_IRON"]);
  assert.deepEqual(lockedResources("UNIT_TANK", chains, tankCopies({})), ["RESOURCE_OIL", "RESOURCE_COAL"]);
  assert.deepEqual(lockedResources("UNIT_TANK", chains, tankCopies({ RESOURCE_OIL: 1 })), ["RESOURCE_COAL"]);
  assert.equal(lockedBy("UNIT_TANK", chains, tankCopies({ RESOURCE_OIL: 1 })), "RESOURCE_COAL");
  assert.equal(lockedBy("UNIT_TANK", chains, tankCopies({ RESOURCE_OIL: 1, RESOURCE_COAL: 1 })), null);
  assert.deepEqual(describeProductionCost("UNIT_TANK", { supply, penalties: twoPenalties, gate: chains,
    copiesOf: tankCopies({ RESOURCE_OIL: 3 }) }),
    [{ key: "LOC_SR_PRODUCTION_LOCKED", args: ["RESOURCE_COAL"] }, { key: "LOC_SR_PRODUCTION_NEEDS_HELD", args: ["RESOURCE_OIL", 3] }],
    "the locked resource first, then the held one");
  // A column naming a resource the unit's tags don't is another mod's rule, not the option's.
  const otherColumn = buildGateIndex([{ UnitType: "UNIT_TANK", StrategicResource: "RESOURCE_NITER" }, ...units],
    [production, purchase], supply);
  assert.equal(otherColumn.on, false);
}

// Stand-ins (Pitch for Hardwood in Exploration): read from the either tags, counted for the pair, named as the pair,
// and a unit of the pair carries no column yet stays under the gate.
{
  const tags = [{ Type: "UNIT_CARRACK", Tag: "SR_SUPPLY_HARDWOOD" },
    { Type: "UNIT_CARRACK", Tag: "SR_EITHER_HARDWOOD_OR_PITCH" }, { Type: "UNIT_GALLEON", Tag: "SR_SUPPLY_HARDWOOD" },
    { Type: "UNIT_GALLEON", Tag: "SR_EITHER_HARDWOOD_OR_PITCH" },
    { Type: "UNIT_BOMBARD", Tag: "SR_SUPPLY_NITER" }, { Type: "UNIT_X", Tag: "SR_EITHER_" },
    { Type: "UNIT_Y", Tag: "SR_EITHER_OIL" }];
  const alternatives = buildAlternativeIndex(tags);
  assert.deepEqual([...alternatives], [["RESOURCE_HARDWOOD", ["RESOURCE_PITCH"]]], "one pair, malformed tags skipped");
  assert.equal(eitherNameKey("RESOURCE_HARDWOOD", ["RESOURCE_PITCH"]), "LOC_SR_EITHER_HARDWOOD_OR_PITCH_NAME");
  const holdings = [{ resourceType: "RESOURCE_PITCH" }, { resourceType: "RESOURCE_PITCH" },
    { resourceType: "RESOURCE_HARDWOOD", isOffMap: true }, { resourceType: "RESOURCE_NITER" }];
  assert.equal(countSupply(holdings, "RESOURCE_HARDWOOD", alternatives), 2,
    "Pitch counts for Hardwood, off-map doesn't");
  assert.equal(countSupply(holdings, "RESOURCE_PITCH", alternatives), 2, "Pitch on its own");
  assert.equal(countSupply(holdings, "RESOURCE_NITER", alternatives), 1);
  const supply = buildSupplyIndex(tags);
  assert.deepEqual(withAlternatives(supply, alternatives).get("UNIT_CARRACK"), ["RESOURCE_HARDWOOD", "RESOURCE_PITCH"]);
  assert.equal(withAlternatives(supply, new Map()), supply, "no stand-ins: the same index");
  assert.equal(unitsSuppliedBy("RESOURCE_PITCH", withAlternatives(supply, alternatives),
    new Map([["UNIT_CARRACK", "Carrack"], ["UNIT_GALLEON", "Galleon"]]))?.names.join(), "Carrack,Galleon",
    "Pitch's line lists the Hardwood ships");

  const params = [{ Name: GATE_PRODUCTION_PARAMETER, Value: "1" }, { Name: GATE_PURCHASE_PARAMETER, Value: "1" }];
  const units = [{ UnitType: "UNIT_CARRACK", StrategicResource: null },
    { UnitType: "UNIT_GALLEON", StrategicResource: null }, { UnitType: "UNIT_BOMBARD", StrategicResource: "RESOURCE_NITER" }];
  const gate = buildGateIndex(units, params, supply, alternatives);
  assert.equal(gate.on, true, "the ships carry no column and the gate is still the mod's");
  assert.deepEqual([...gate.columns.keys()], ["UNIT_BOMBARD"]);
  assert.deepEqual(gate.needs.get("UNIT_CARRACK"), ["RESOURCE_HARDWOOD"], "the ships are under the gate");
  const copies = (/** @type {typeof holdings} */ h) => (/** @type {string} */ r) => countSupply(h, r, alternatives);
  assert.equal(lockedBy("UNIT_CARRACK", gate, copies([])), "RESOURCE_HARDWOOD", "neither: locked");
  assert.equal(lockedBy("UNIT_CARRACK", gate, copies([{ resourceType: "RESOURCE_PITCH" }])), null, "Pitch unlocks");
  assert.equal(lockedBy("UNIT_CARRACK", gate, copies([{ resourceType: "RESOURCE_HARDWOOD" }])), null, "Hardwood too");
  assert.equal(buildGateIndex(units, params, supply).on, false, "without the stand-ins read, a missing column is " +
    "another mod's rule");
  assert.equal(buildGateIndex(units.slice(0, 2), params, supply, alternatives).on, false,
    "no column unit at all: nothing shows the option is the mod's");
  const off = buildGateIndex(units, [], supply, alternatives);
  assert.deepEqual([off.on, off.needs.size], [false, 0], "gate off: no needs for the ships either");
  assert.deepEqual(computeSupplyStatuses({ unitType: "UNIT_CARRACK", supply,
    penalties: new Map([["RESOURCE_HARDWOOD", { combat: -3, productionPercent: -33 }]]),
    copiesOf: copies([{ resourceType: "RESOURCE_PITCH" }]) }), [], "Pitch held: supplied");
}

console.log("sr-supply tests passed");
