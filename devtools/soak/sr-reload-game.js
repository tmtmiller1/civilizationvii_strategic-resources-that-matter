// sr-reload-game.js - crash-soak game script (tools/crash-soak/run-soak.sh) for Strategic Resources: load a save made
// in a Modern lab game (Tank unsupplied, Field Cannon supplied by Niter at 60,24), read everything back, wait out the
// window in which a reload issued from the game page crashed, lose Niter and roll, then the late curve's ranged and
// bombard rows on the Field Cannon from 7 to 10 Niter copies.
//   MOD=strategic_resources_that_matter SAVE=SR-LAB-RELOAD.Civ7Save zsh run-soak.sh <this file> sr-reload 1800
const NAME = "sr-reload";
const NITER_AT = { x: 60, y: 24 };
function unitType(u) { return safe(() => String(GameInfo.Units.lookup(u.type).UnitType), "?"); }
function strengths(pid) {
  return (safe(() => Players.get(pid).Units.getUnits(), []) || []).filter((u) => u.Combat).map((u) => {
    const c = u.Combat; return `${unitType(u).replace("UNIT_", "")}:${c.getMeleeStrength(false)}/${c.rangedStrength}/${c.bombardStrength}`;
  }).join(" ");
}
function resources(pid) {
  const out = {};
  for (const r of safe(() => Players.get(pid).Resources.getResources(), []) || []) {
    const t = safe(() => String(GameInfo.Resources.lookup(r.uniqueResource.resource).ResourceType).replace("RESOURCE_", ""), "?") + (r.isOffMap ? "*" : "");
    out[t] = (out[t] || 0) + 1;
  }
  return out;
}
function niter(pid) { return resources(pid).NITER || 0; }
function production() {
  const c = Players.get(0).Cities.getCities()[0]; const out = { prod: c.Yields.getYield(YieldTypes.YIELD_PRODUCTION) };
  for (const t of ["UNIT_TANK", "UNIT_FIELD_CANNON", "UNIT_LINE_INFANTRY"]) {
    const h = GameInfo.Units.lookup(t).$hash; out[t] = c.Production.getUnitProductionCost(h) + "p/" + safe(() => c.BuildQueue.getTurnsLeft(h), "?") + "t";
  }
  return out;
}
function srRows() {
  const mods = safe(() => GameInfo.Modifiers.filter((m) => String(m.ModifierId).startsWith("SR_")).map((m) => String(m.ModifierId)), []) || [];
  const amount = safe(() => String(GameInfo.ModifierArguments.find((a) => a.ModifierId === "SR_COMBAT_PENALTY_OIL" && a.Name === "Amount").Value), "?");
  return { modifiers: mods.length, curve: mods.filter((m) => m.includes("CURVE")).length, oilPenalty: amount };
}
async function panelLine(type) {
  const u = Players.get(0).Units.getUnits().find((x) => unitType(x) === type);
  if (!u) return "(no unit)";
  safe(() => UI.Player.selectUnit(u.id)); await sleep(2000);
  const el = safe(() => document.querySelector(".sr-unsupplied-line"), null);
  const text = el ? el.textContent : "(none)";
  safe(() => UI.Player.deselectAllUnits());
  return text;
}
async function report(label) {
  const g = Configuration.getGame();
  emit(`${label} turn=${Game.turn} age=${ageName()} res=${J(resources(0))} | ${strengths(0)}`);
  emit(`${label} production=${J(production())} setup=${J([safe(() => g.getValue("StrategicResourcesThatMatterUnsupplied")), safe(() => g.getValue("StrategicResourcesThatMatterLateCurve"))])} rows=${J(srRows())}`);
  emit(`${label} panel Tank: ${await panelLine("UNIT_TANK")} | panel Field Cannon: ${await panelLine("UNIT_FIELD_CANNON")}`);
}
function setResource(type, l) {
  return safe(() => { const r = type ? GameInfo.Resources.lookup(type).$index : -1; WorldBuilder.startBlock(); WorldBuilder.MapPlots.setResource(r, l, 1); WorldBuilder.endBlock(); return true; });
}
/** The first land plot the capital can expand onto that has no resource. */
function expandPlot() {
  const c = Players.get(0).Cities.getCities()[0];
  if (!safe(() => c.Growth.isReadyToPlacePopulation, false)) safe(() => c.addRuralPopulation(1));
  const r = safe(() => Game.CityCommands.canStart(c.id, CityCommandTypes.EXPAND, {}, true), null);
  for (const i of (r && r.Plots) || []) {
    const l = locOf(i);
    if (!safe(() => GameplayMap.isWater(l.x, l.y), true) && safe(() => GameplayMap.getResourceType(l.x, l.y), 0) === -1) return l;
  }
  return null;
}
async function gainNiter() {
  const l = expandPlot(); if (!l) return "no plot";
  setResource("RESOURCE_NITER", l); await sleep(800);
  const c = Players.get(0).Cities.getCities()[0];
  safe(() => Game.CityCommands.sendRequest(c.id, CityCommandTypes.EXPAND, { X: l.x, Y: l.y })); await sleep(2500);
  return `${l.x},${l.y}`;
}
function fieldCannon() { const u = Players.get(0).Units.getUnits().find((x) => unitType(x) === "UNIT_FIELD_CANNON"); const c = u && u.Combat; return c ? `${c.getMeleeStrength(false)}/${c.rangedStrength}/${c.bombardStrength}` : "?"; }

async function run() {
  await sleep(5000);
  await report("R1 after load");
  check("R1 Tank unsupplied (no Oil)", strengths(0).includes("TANK:62/0/0"), strengths(0));
  check("R1 Field Cannon supplied (Niter)", strengths(0).includes("FIELD_CANNON:35/45/35"), strengths(0));
  emit("R2 idle 240 s (the lab reload crashed 205 s after its load)");
  await sleep(240000);
  await report("R2 after idle");
  setResource(null, NITER_AT); await sleep(1500);
  emit(`R3 Niter cleared at ${NITER_AT.x},${NITER_AT.y}: niter=${niter(0)} | ${strengths(0)}`);
  const how = await roll();
  emit(`R3 rolled (${how}) turn=${Game.turn} niter=${niter(0)} | ${strengths(0)}`);
  check("R3 Field Cannon penalised one roll after the loss", strengths(0).includes("FIELD_CANNON:32/42/32"), strengths(0));
  // Late curve: Field Cannon carries SR_CURVE_RANGED_NITER and SR_CURVE_BOMBARD_NITER.
  for (let k = 0; k < 12 && niter(0) < 11; k++) {
    const at = await gainNiter();
    emit(`C copies=${niter(0)} fieldCannon=${fieldCannon()} (plot ${at})`);
  }
  await roll();
  emit(`C after roll turn=${Game.turn} copies=${niter(0)} fieldCannon=${fieldCannon()}`);
  finishNow("done");
}
