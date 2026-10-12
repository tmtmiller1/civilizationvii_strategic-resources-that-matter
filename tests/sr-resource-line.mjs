import assert from "node:assert/strict";
import { captureConsole, snapshotGlobals, table } from "./_engine-stubs.mjs";

// The resource line: a strategic resource's description gains "Supplies units: ..." listing the local player's
// gated units, wherever Stylize draws that description. Anything else passes through untouched.

const restoreGlobals = snapshotGlobals(["GameInfo", "GameContext", "Players", "Locale"]);
const log = captureConsole();

const NAMES = {
  LOC_UNIT_FIELD_CANNON_NAME: "Field Cannon", LOC_UNIT_FIELD_GUN_NAME: "Field Gun", LOC_UNIT_MORTAR_NAME: "Mortar",
  LOC_UNIT_HOWITZER_NAME: "Howitzer", LOC_UNIT_AT_GUN_NAME: "AT Gun", LOC_UNIT_HWACHA_NAME: "Hwacha",
  LOC_UNIT_TANK_NAME: "Tank", LOC_UNIT_PANZER_NAME: "Panzer", LOC_UNIT_HIDDEN_NAME: "Never Trained",
};
let composeCalls = 0;
globalThis.Locale = {
  compose(key, ...args) {
    composeCalls += 1;
    if (key in NAMES) return NAMES[key];
    if (key === "LOC_SR_LIST_PAIR") return `${args[0]}, ${args[1]}`;
    return args.length ? `${key}|${args.join("|")}` : `<${key}>`;
  }
};
globalThis.GameContext = { localPlayerID: 0 };
globalThis.GameInfo = {
  Resources: table([
    { ResourceType: "RESOURCE_NITER", Name: "LOC_RESOURCE_NITER_NAME", Tooltip: "LOC_MOD_RESOURCE_NITER_TOOLTIP" },
    { ResourceType: "RESOURCE_OIL", Name: "LOC_RESOURCE_OIL_NAME", Tooltip: "LOC_MOD_RESOURCE_OIL_TOOLTIP" },
    { ResourceType: "RESOURCE_WINE", Name: "LOC_RESOURCE_WINE_NAME", Tooltip: "LOC_ANT_RESOURCE_WINE_TOOLTIP" },
    { ResourceType: "RESOURCE_COAL", Name: "LOC_RESOURCE_COAL_NAME" }
  ], "ResourceType"),
  TypeTags: [
    ["UNIT_FIELD_CANNON", "NITER"], ["UNIT_FIELD_GUN", "NITER"], ["UNIT_MORTAR", "NITER"], ["UNIT_HOWITZER", "NITER"],
    ["UNIT_AT_GUN", "NITER"], ["UNIT_HWACHA", "NITER"], ["UNIT_HIDDEN", "NITER"], ["UNIT_TANK", "OIL"],
    ["UNIT_PANZER", "OIL"], ["UNIT_COAL_SHIP", "COAL"]
  ].map(([Type, name]) => ({ Type, Tag: `SR_SUPPLY_${name}` })),
  ModifierArguments: [],
  Units: table([
    { UnitType: "UNIT_FIELD_CANNON", Name: "LOC_UNIT_FIELD_CANNON_NAME" },
    { UnitType: "UNIT_FIELD_GUN", Name: "LOC_UNIT_FIELD_GUN_NAME" },
    { UnitType: "UNIT_MORTAR", Name: "LOC_UNIT_MORTAR_NAME" },
    { UnitType: "UNIT_HOWITZER", Name: "LOC_UNIT_HOWITZER_NAME" },
    { UnitType: "UNIT_AT_GUN", Name: "LOC_UNIT_AT_GUN_NAME" },
    { UnitType: "UNIT_HWACHA", Name: "LOC_UNIT_HWACHA_NAME", TraitType: "TRAIT_JOSEON" },
    { UnitType: "UNIT_HIDDEN", Name: "LOC_UNIT_HIDDEN_NAME", CanTrain: false, TraitType: "TRAIT_PRUSSIA" },
    { UnitType: "UNIT_TANK", Name: "LOC_UNIT_TANK_NAME" },
    { UnitType: "UNIT_PANZER", Name: "LOC_UNIT_PANZER_NAME", TraitType: "TRAIT_PRUSSIA" }
  ], "UnitType"),
  UnitReplaces: [{ CivUniqueUnitType: "UNIT_PANZER", ReplacesUnitType: "UNIT_TANK" },
    { CivUniqueUnitType: "UNIT_HIDDEN", ReplacesUnitType: "UNIT_MORTAR" }],
  Civilizations: table([{ CivilizationType: "CIVILIZATION_PRUSSIA" }, { CivilizationType: "CIVILIZATION_MEXICO" }],
    "CivilizationType"),
  Leaders: table([{ LeaderType: "LEADER_A" }], "LeaderType"),
  CivilizationTraits: [{ CivilizationType: "CIVILIZATION_PRUSSIA", TraitType: "TRAIT_PRUSSIA" }],
  LeaderTraits: [{ LeaderType: "LEADER_A", TraitType: "TRAIT_LEADER_A" }]
};
const civ = (type) => globalThis.GameInfo.Civilizations.lookup(type).$hash;
const leader = globalThis.GameInfo.Leaders.lookup("LEADER_A").$hash;
const players = {
  0: { isMajor: true, civilizationType: civ("CIVILIZATION_PRUSSIA"), leaderType: leader },
  1: { isMajor: true, civilizationType: civ("CIVILIZATION_MEXICO"), leaderType: leader },
  9: { isMajor: false }
};
globalThis.Players = { get: (id) => players[id] ?? null };

try {
  const { describeResourceSupply, resourceTooltipIndex, unitNamesFor, withSupplyLine, wrapStylize } =
    await import("/tower-strategic-resources-that-matter/ui/sr-resource-line.js");
  const { resetIndexes } = await import("/tower-strategic-resources-that-matter/ui/sr-player-supply.js");

  // Only resources some unit draws on, and only those with a description.
  assert.deepEqual([...resourceTooltipIndex()], [
    ["LOC_MOD_RESOURCE_NITER_TOOLTIP", "RESOURCE_NITER"], ["LOC_MOD_RESOURCE_OIL_TOOLTIP", "RESOURCE_OIL"]
  ]);
  assert.equal(resourceTooltipIndex(), resourceTooltipIndex(), "built once");

  // The player's own units: no one else's unique unit, nothing the player's unique unit replaces, nothing untrainable.
  const supply = new Map(globalThis.GameInfo.TypeTags.map((r) => [r.Type, `RESOURCE_${r.Tag.slice(10)}`]));
  const prussia = unitNamesFor(players[0], supply);
  assert.equal(prussia.get("UNIT_PANZER"), "Panzer");
  assert.equal(prussia.has("UNIT_TANK"), false, "replaced by the player's own unique unit");
  assert.equal(prussia.has("UNIT_HWACHA"), false, "another civilization's unique unit");
  assert.equal(prussia.has("UNIT_HIDDEN"), false, "a unit that cannot be trained");
  assert.equal(prussia.has("UNIT_MORTAR"), false, "replaced by the player's own unique unit, trainable or not");
  assert.equal(prussia.has("UNIT_COAL_SHIP"), false, "a unit type the game does not know");
  const mexico = unitNamesFor(players[1], supply);
  assert.equal(mexico.get("UNIT_TANK"), "Tank");
  assert.equal(mexico.has("UNIT_PANZER"), false);
  assert.equal(mexico.has("UNIT_MORTAR"), true, "another civilization's unique unit replaces nothing here");

  // The line, sorted by name, three names and the count of the rest.
  assert.equal(describeResourceSupply("RESOURCE_NITER"),
    "LOC_SR_RESOURCE_SUPPLIES_MORE|AT Gun, Field Cannon, Field Gun|1");
  assert.equal(describeResourceSupply("RESOURCE_OIL"), "LOC_SR_RESOURCE_SUPPLIES|Panzer");
  assert.equal(describeResourceSupply("RESOURCE_WINE"), null, "a resource that supplies nothing");
  const calls = composeCalls;
  describeResourceSupply("RESOURCE_NITER");
  describeResourceSupply("RESOURCE_WINE");
  assert.equal(composeCalls, calls, "kept once worked out");
  globalThis.GameContext.localPlayerID = 1;
  assert.equal(describeResourceSupply("RESOURCE_OIL"), "LOC_SR_RESOURCE_SUPPLIES|Tank", "per local player (hotseat)");
  globalThis.GameContext.localPlayerID = 9;
  assert.equal(describeResourceSupply("RESOURCE_NITER"), null, "no line for a player the penalty skips");
  globalThis.GameContext.localPlayerID = 0;


  // Under the hard gate the line says the units cannot be trained without the resource.
  globalThis.GameInfo.GlobalParameters = [{ Name: "STRATEGIC_RESOURCE_MINIMUM_FOR_PRODUCTION_ANYWHERE", Value: "1" }];
  for (const row of globalThis.GameInfo.Units) row.StrategicResource = supply.get(row.UnitType) ?? null;
  resetIndexes();
  globalThis.GameContext.localPlayerID = 1;
  assert.equal(describeResourceSupply("RESOURCE_NITER"),
      "LOC_SR_RESOURCE_NEEDED_MORE|AT Gun, Field Cannon, Field Gun|2");
  globalThis.GameContext.localPlayerID = 0;
  globalThis.GameInfo.GlobalParameters = [];
  for (const row of globalThis.GameInfo.Units) delete row.StrategicResource;
  resetIndexes();

  // withSupplyLine
  assert.equal(withSupplyLine("LOC_MOD_RESOURCE_NITER_TOOLTIP", undefined),
    "<LOC_MOD_RESOURCE_NITER_TOOLTIP>[N]LOC_SR_RESOURCE_SUPPLIES_MORE|AT Gun, Field Cannon, Field Gun|1");
  assert.equal(withSupplyLine("LOC_MOD_RESOURCE_OIL_TOOLTIP", ["x"]),
    "LOC_MOD_RESOURCE_OIL_TOOLTIP|x[N]LOC_SR_RESOURCE_SUPPLIES|Panzer", "the text's own arguments are kept");
  assert.equal(withSupplyLine("LOC_ANT_RESOURCE_WINE_TOOLTIP", undefined), "LOC_ANT_RESOURCE_WINE_TOOLTIP");
  assert.equal(withSupplyLine("LOC_SOMETHING_ELSE", undefined), "LOC_SOMETHING_ELSE");
  assert.equal(withSupplyLine("Plain words", undefined), "Plain words");
  assert.equal(withSupplyLine(undefined, undefined), undefined);
  assert.equal(withSupplyLine(42, undefined), 42);
  globalThis.GameContext.localPlayerID = 2;
  const savedPlayers = globalThis.Players;
  globalThis.Players = { get: () => { throw new Error("engine gone"); } };
  assert.equal(withSupplyLine("LOC_MOD_RESOURCE_NITER_TOOLTIP", undefined), "LOC_MOD_RESOURCE_NITER_TOOLTIP",
    "a failure leaves the text as it was");
  assert.equal(withSupplyLine("LOC_MOD_RESOURCE_OIL_TOOLTIP", undefined), "LOC_MOD_RESOURCE_OIL_TOOLTIP");
  globalThis.Players = savedPlayers;
  globalThis.GameContext.localPlayerID = 0;
  assert.equal(log.lines.filter(([, text]) => text.includes("could not add the resource line")).length, 1,
    "logged once, not on every draw");

  // wrapStylize: the earlier Stylize gets the props with the text replaced and everything else as it was.
  const mergeProps = (...sources) => {
    const merged = {};
    for (const source of sources) Object.defineProperties(merged, Object.getOwnPropertyDescriptors(source));
    return merged;
  };
  /** @type {*} */
  let seen = null;
  const stylize = wrapStylize(mergeProps)((props) => {
    seen = props;
    return "drawn";
  });
  const props = { text: "LOC_MOD_RESOURCE_OIL_TOOLTIP", class: "font-body" };
  assert.equal(stylize(props), "drawn");
  assert.equal(seen.class, "font-body");
  assert.equal(seen.text, "<LOC_MOD_RESOURCE_OIL_TOOLTIP>[N]LOC_SR_RESOURCE_SUPPLIES|Panzer");
  props.text = "LOC_OTHER";
  assert.equal(seen.text, "LOC_OTHER", "the text is read when Stylize reads it, so a change follows");
} finally {
  log.restore();
  restoreGlobals();
}

console.log("sr-resource-line tests passed");
