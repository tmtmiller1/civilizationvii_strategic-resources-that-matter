// sr-reload2-game.js - crash-soak game script (tools/crash-soak/run-soak.sh) for the checks that follow a reload of
// Strategic Resources: the unit-panel line across unit switches (read with its hidden state, after a longer redraw
// wait than the 2 s of sr-reload-game.js), a loss after the load re-checked one roll later for the human and for one
// AI, then the late curve's ranged and bombard rows on the Field Cannon at 7, 8 and 10 Niter copies, read from the
// unit and from the combat preview (a ranged shot at an enemy unit, a bombardment of an enemy city).
// The save: SR-LAB-RELOAD (Modern, turn 2, Standard, curve on; Tank without Oil, Field Cannon with Niter at 60,24).
//   MOD=strategic_resources SAVE=SR-LAB-RELOAD.Civ7Save zsh run-soak.sh sr-reload2-game.js sr-reload2 1800
const NAME = "sr-reload2";
const NITER_AT = { x: 60, y: 24 };
const PANEL_WAIT_MS = 5000;
function unitType(u) { return safe(() => String(GameInfo.Units.lookup(u.type).UnitType), "?"); }
function unitsOf(pid) { return (safe(() => Players.get(pid).Units.getUnits(), []) || []).filter((u) => u && u.Combat); }
function strengths(pid) {
  return unitsOf(pid).map((u) => {
    const c = u.Combat; return `${unitType(u).replace("UNIT_", "")}:${c.getMeleeStrength(false)}/${c.rangedStrength}/${c.bombardStrength}`;
  }).join(" ");
}
function strengthOf(pid, type) {
  const u = unitsOf(pid).find((x) => unitType(x) === type); const c = u && u.Combat;
  return c ? `${c.getMeleeStrength(false)}/${c.rangedStrength}/${c.bombardStrength}` : "?";
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
function setResource(type, l) {
  return safe(() => { const r = type ? GameInfo.Resources.lookup(type).$index : -1; WorldBuilder.startBlock(); WorldBuilder.MapPlots.setResource(r, l, 1); WorldBuilder.endBlock(); return true; });
}
function capitalOf(pid) { return safe(() => Players.get(pid).Cities.getCapital(), null) || safe(() => Players.get(pid).Cities.getCities()[0], null); }
function place(type, owner, l) {
  return safe(() => Game.PlayerOperations.sendRequest(0, "CREATE_ELEMENT", { Kind: "UNIT", Type: type, Location: l, Owner: owner }));
}

// --- the panel line, with its visibility -----------------------------------------------------------------------
async function panelRead(type) {
  const u = unitsOf(0).find((x) => unitType(x) === type);
  if (!u) return `${type}: (no unit)`;
  safe(() => UI.Player.selectUnit(u.id)); await sleep(PANEL_WAIT_MS);
  const shown = safe(() => document.querySelector(".unit-actions__unit-name").textContent, "?");
  const lines = Array.from(safe(() => document.querySelectorAll(".sr-unsupplied-line"), []) || []).map((el) => {
    const hidden = el.classList.contains("hidden"); const h = Math.round(safe(() => el.getBoundingClientRect().height, -1));
    return `${hidden ? "hidden" : "shown"} ${h}px "${el.textContent}"`;
  });
  return `${type.replace("UNIT_", "")} -> panel "${shown}": ${lines.length ? lines.join(" | ") : "(no line element)"}`;
}

// --- the AI loss ------------------------------------------------------------------------------------------------
/** An AI major's owned land plot with a completed improvement and no resource; a Mine first. */
function improvedPlotOf(pid) {
  let any = null;
  for (const c of citiesOf(pid)) {
    for (const i of safe(() => c.getPurchasedPlots(), []) || []) {
      const l = locOf(i);
      if (safe(() => GameplayMap.isWater(l.x, l.y), true) || safe(() => GameplayMap.getResourceType(l.x, l.y), 0) !== -1) continue;
      const imp = occupants(l).find((o) => o.complete && safe(() => String(GameInfo.Constructibles.lookup(o.type).ConstructibleClass), "") === "IMPROVEMENT");
      if (!imp) continue;
      if (imp.type === "IMPROVEMENT_MINE") return { l, imp: imp.type };
      any = any || { l, imp: imp.type };
    }
  }
  return any;
}
function niterPlotsOf(pid) {
  const out = []; const idx = safe(() => GameInfo.Resources.lookup("RESOURCE_NITER").$index, -2);
  for (const c of citiesOf(pid)) for (const i of safe(() => c.getPurchasedPlots(), []) || []) {
    const l = locOf(i); if (safe(() => GameplayMap.getResourceType(l.x, l.y), -1) === idx) out.push(l);
  }
  return out;
}
async function aiLoss() {
  const ais = majors().filter((p) => p !== 0 && citiesOf(p).length > 0);
  const pid = ais.find((p) => niter(p) === 0 && improvedPlotOf(p)) ?? ais.find((p) => niter(p) > 0) ?? ais[0];
  if (pid == null) { emit("AI none with a city"); return; }
  const cap = capitalOf(pid);
  place("UNIT_FIELD_CANNON", pid, cap.location); await sleep(2500);
  emit(`AI ${pid} placed a Field Cannon at ${cap.location.x},${cap.location.y}: niter=${niter(pid)} fc=${strengthOf(pid, "UNIT_FIELD_CANNON")} res=${J(resources(pid))}`);
  if (niter(pid) === 0) {
    const spot = improvedPlotOf(pid);
    if (!spot) { emit(`AI ${pid} has no improved plot to seed`); return; }
    setResource("RESOURCE_NITER", spot.l); await sleep(1500);
    emit(`AI ${pid} Niter put on its ${spot.imp} at ${spot.l.x},${spot.l.y}: niter=${niter(pid)} fc=${strengthOf(pid, "UNIT_FIELD_CANNON")}`);
    const how = await roll();
    emit(`AI ${pid} rolled (${how}) turn=${Game.turn}: niter=${niter(pid)} fc=${strengthOf(pid, "UNIT_FIELD_CANNON")}`);
    check(`AI ${pid} Field Cannon supplied after the gain`, strengthOf(pid, "UNIT_FIELD_CANNON") === "35/45/35", strengthOf(pid, "UNIT_FIELD_CANNON"));
  }
  const plots = niterPlotsOf(pid);
  for (const l of plots) setResource(null, l);
  await sleep(1500);
  emit(`AI ${pid} Niter cleared on ${plots.length} plot(s): niter=${niter(pid)} fc=${strengthOf(pid, "UNIT_FIELD_CANNON")}`);
  const how = await roll();
  emit(`AI ${pid} rolled (${how}) turn=${Game.turn}: niter=${niter(pid)} fc=${strengthOf(pid, "UNIT_FIELD_CANNON")}`);
  check(`AI ${pid} Field Cannon penalised one roll after the loss`, strengthOf(pid, "UNIT_FIELD_CANNON") === "32/42/32", strengthOf(pid, "UNIT_FIELD_CANNON"));
}

// --- the curve: copies, unit readings and the combat preview ---------------------------------------------------
function expandPlot() {
  const c = capitalOf(0); if (!c) return null;
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
  safe(() => Game.CityCommands.sendRequest(capitalOf(0).id, CityCommandTypes.EXPAND, { X: l.x, Y: l.y })); await sleep(2500);
  return `${l.x},${l.y}`;
}
async function gainTo(n) {
  for (let k = 0; k < 14 && niter(0) < n; k++) { const at = await gainNiter(); if (at === "no plot") { emit("C no plot to expand onto"); break; } }
  return niter(0);
}
const WAR = { ai: null, fc: null, unitAt: null, cityAt: null };
function previewAt(unitId, l) {
  return new Promise((resolve) => {
    let done = false;
    const h = (r) => { if (done) return; done = true; safe(() => engine.off("SimulateCombatResult", h)); resolve(r); };
    safe(() => engine.on("SimulateCombatResult", h));
    const token = safe(() => Game.Combat.simulateAttackAsync(unitId, { Location: l, X: l.x, Y: l.y, CombatType: CombatTypes.COMBAT_RANGED }), "ERR");
    if (String(token).startsWith("ERR")) { done = true; resolve({ error: String(token) }); return; }
    setTimeout(() => { if (!done) { done = true; safe(() => engine.off("SimulateCombatResult", h)); resolve(null); } }, 6000);
  });
}
function previewText(r) {
  if (!r) return "(no result)";
  if (r.error) return r.error;
  const a = r.Attacker; if (!a) return `(no attacker; keys ${J(Object.keys(r))})`;
  const typeName = safe(() => { for (const k of Object.keys(CombatStrengthTypes)) if (CombatStrengthTypes[k] === a.CombatStrengthType) return k; return String(a.CombatStrengthType); }, "?");
  return `${typeName} ${a.CombatStrength} mod=${J(a.PreviewTextModifier)} res=${J(a.PreviewTextResources)}`;
}
/** War on the nearest AI with a capital, my second Field Cannon two tiles from that capital, an enemy unit two tiles from it. */
async function setupWar() {
  const ai = majors().filter((p) => p !== 0 && capitalOf(p)).map((p) => ({ p, cap: capitalOf(p).location }))[0];
  if (!ai) { emit("W no AI capital"); return false; }
  WAR.ai = ai.p; WAR.cityAt = { x: ai.cap.x, y: ai.cap.y };
  const args = { Player1: 0, Player2: ai.p, Type: DiplomacyActionTypes.DIPLOMACY_ACTION_DECLARE_WAR };
  const can = safe(() => Game.PlayerOperations.canStart(0, PlayerOperationTypes.DECLARE_WAR, args, false), null);
  safe(() => Game.PlayerOperations.sendRequest(0, PlayerOperationTypes.DECLARE_WAR, args)); await sleep(3000);
  const atWar = safe(() => Players.get(0).Diplomacy.isAtWarWith(ai.p), "?");
  emit(`W war on ${ai.p} (met=${safe(() => Players.get(0).Diplomacy.hasMet(ai.p), "?")} canStart=${J(can && can.Success)}): atWar=${atWar}`);
  const spots = ringAt(WAR.cityAt, 2).filter((l) => !safe(() => GameplayMap.isWater(l.x, l.y), true) && !safe(() => GameplayMap.isMountain(l.x, l.y), true));
  if (!spots.length) { emit("W no land two tiles from the capital"); return false; }
  const before = new Set(unitsOf(0).map((u) => `${u.id.owner}:${u.id.id}`));
  place("UNIT_FIELD_CANNON", 0, spots[0]); await sleep(2500);
  const fc = unitsOf(0).find((u) => unitType(u) === "UNIT_FIELD_CANNON" && !before.has(`${u.id.owner}:${u.id.id}`));
  if (!fc) { emit("W the second Field Cannon did not land"); return false; }
  WAR.fc = fc.id;
  const target = ringAt(spots[0], 2).find((l) => (l.x !== WAR.cityAt.x || l.y !== WAR.cityAt.y) && !safe(() => GameplayMap.isWater(l.x, l.y), true)
    && !safe(() => GameplayMap.isMountain(l.x, l.y), true) && !(safe(() => MapUnits.getUnits(l.x, l.y), []) || []).length);
  if (target) { place("UNIT_LINE_INFANTRY", ai.p, target); await sleep(2500); WAR.unitAt = target; }
  emit(`W my Field Cannon at ${spots[0].x},${spots[0].y}; enemy unit at ${target ? target.x + "," + target.y : "none"}; enemy city at ${WAR.cityAt.x},${WAR.cityAt.y}`);
  return atWar === true;
}
async function readCurve(label) {
  const unit = strengthOf(0, "UNIT_FIELD_CANNON");
  let ranged = "(skipped)", bombard = "(skipped)";
  if (WAR.fc) {
    if (WAR.unitAt) ranged = previewText(await previewAt(WAR.fc, WAR.unitAt));
    bombard = previewText(await previewAt(WAR.fc, WAR.cityAt));
  }
  emit(`C ${label} copies=${niter(0)} fieldCannon=${unit} | preview vs unit: ${ranged} | preview vs city: ${bombard}`);
  return unit;
}

async function run() {
  await sleep(5000);
  const g = Configuration.getGame();
  emit(`R1 after load turn=${Game.turn} age=${ageName()} res=${J(resources(0))} | ${strengths(0)}`);
  emit(`R1 setup=${J([safe(() => g.getValue("StrategicResourcesUnsupplied")), safe(() => g.getValue("StrategicResourcesLateCurve"))])} srModifiers=${safe(() => GameInfo.Modifiers.filter((m) => String(m.ModifierId).startsWith("SR_")).length, "?")}`);
  // Step 1b: the panel line across unit switches, each read after PANEL_WAIT_MS.
  emit(`P1 ${await panelRead("UNIT_TANK")}`);
  emit(`P2 ${await panelRead("UNIT_FIELD_CANNON")}`);
  emit(`P3 ${await panelRead("UNIT_TANK")}`);
  emit(`P4 ${await panelRead("UNIT_IRONCLAD")}`);
  safe(() => UI.Player.deselectAllUnits());
  // Step 1a, human: lose Niter after the load; the Field Cannon is penalised one roll later.
  setResource(null, NITER_AT); await sleep(1500);
  emit(`H Niter cleared at ${NITER_AT.x},${NITER_AT.y}: niter=${niter(0)} fc=${strengthOf(0, "UNIT_FIELD_CANNON")}`);
  const how = await roll();
  emit(`H rolled (${how}) turn=${Game.turn}: niter=${niter(0)} fc=${strengthOf(0, "UNIT_FIELD_CANNON")} | ${strengths(0)}`);
  check("H Field Cannon penalised one roll after the loss (after the load)", strengthOf(0, "UNIT_FIELD_CANNON") === "32/42/32", strengthOf(0, "UNIT_FIELD_CANNON"));
  emit(`P5 ${await panelRead("UNIT_FIELD_CANNON")}`); safe(() => UI.Player.deselectAllUnits());
  // Step 1a, one AI.
  await aiLoss();
  // Step 3: the curve's three rows at 7, 8 and 10 copies.
  await setupWar();
  await gainTo(7); const at7 = await readCurve("7");
  await gainTo(8); const at8 = await readCurve("8");
  await gainTo(10); const at10 = await readCurve("10");
  check("C Field Cannon 35/45/35 at 7 copies", at7 === "35/45/35", at7);
  check("C Field Cannon 36/46/36 at 8 copies", at8 === "36/46/36", at8);
  check("C Field Cannon 37/47/37 at 10 copies", at10 === "37/47/37", at10);
  const how2 = await roll();
  emit(`C after a roll (${how2}) turn=${Game.turn} copies=${niter(0)} fieldCannon=${strengthOf(0, "UNIT_FIELD_CANNON")}`);
  finishNow("done");
}
