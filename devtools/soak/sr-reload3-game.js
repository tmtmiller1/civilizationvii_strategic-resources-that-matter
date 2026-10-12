// sr-reload3-game.js - crash-soak game script (tools/crash-soak/run-soak.sh): the two checks sr-reload2-game.js did not
// reach on the reload save. A loss re-checked one roll later for one AI, with the AI gaining Niter by its own expansion
// (Niter put by WorldBuilder on the AI's existing mine never counted for it in sr-reload2). Then the late curve's
// ranged and bombard rows on the Field Cannon at 7, 8 and 10 Niter copies, each copy gained by the capital's expansion
// onto a Niter tile and waited for, read from the unit and from the combat preview (a ranged shot at an enemy unit,
// a bombardment of an enemy city).
//   MOD=strategic_resources_that_matter SAVE=SR-LAB-RELOAD.Civ7Save zsh run-soak.sh sr-reload3-game.js sr-reload3 2400
const NAME = "sr-reload3";
const NITER_AT = { x: 60, y: 24 };
function unitType(u) { return safe(() => String(GameInfo.Units.lookup(u.type).UnitType), "?"); }
function unitsOf(pid) { return (safe(() => Players.get(pid).Units.getUnits(), []) || []).filter((u) => u && u.Combat); }
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
function bareLand(l) {
  return !safe(() => GameplayMap.isWater(l.x, l.y), true) && !safe(() => GameplayMap.isMountain(l.x, l.y), true)
    && safe(() => GameplayMap.getResourceType(l.x, l.y), 0) === -1;
}
function niterPlotsOf(pid) {
  const out = []; const idx = safe(() => GameInfo.Resources.lookup("RESOURCE_NITER").$index, -2);
  for (const c of citiesOf(pid)) for (const i of safe(() => c.getPurchasedPlots(), []) || []) {
    const l = locOf(i); if (safe(() => GameplayMap.getResourceType(l.x, l.y), -1) === idx) out.push(l);
  }
  return out;
}

// --- the AI loss ------------------------------------------------------------------------------------------------
async function aiLoss() {
  const ais = majors().filter((p) => p !== 0 && capitalOf(p));
  const pid = ais.find((p) => niter(p) === 0) ?? ais[0];
  if (pid == null) { emit("AI none with a city"); return; }
  const cap = capitalOf(pid);
  place("UNIT_FIELD_CANNON", pid, cap.location); await sleep(2500);
  emit(`AI ${pid} placed a Field Cannon at ${cap.location.x},${cap.location.y}: niter=${niter(pid)} fc=${strengthOf(pid, "UNIT_FIELD_CANNON")}`);
  if (niter(pid) === 0) {
    const r = safe(() => Game.CityCommands.canStart(cap.id, CityCommandTypes.EXPAND, {}, true), null);
    let plots = ((r && r.Plots) || []).map(locOf).filter(bareLand).slice(0, 3);
    let how = "expand plots";
    if (!plots.length) {
      how = "unowned ring 2-3";
      plots = [...ringAt(cap.location, 2), ...ringAt(cap.location, 3)].filter((l) => safe(() => GameplayMap.getOwner(l.x, l.y), 0) === -1 && bareLand(l)).slice(0, 3);
    }
    for (const l of plots) setResource("RESOURCE_NITER", l);
    await sleep(1000);
    emit(`AI ${pid} Niter put on ${plots.length} plot(s) it can take (${how}): ${plots.map((l) => l.x + "," + l.y).join(" ")}`);
    for (let k = 0; k < 8 && niter(pid) === 0; k++) {
      const rolled = await roll();
      emit(`AI ${pid} rolled (${rolled}) turn=${Game.turn}: niter=${niter(pid)} fc=${strengthOf(pid, "UNIT_FIELD_CANNON")}`);
    }
    if (niter(pid) === 0) { emit(`AI ${pid} never took the Niter; its loss is not watched`); for (const l of plots) setResource(null, l); return; }
    if (strengthOf(pid, "UNIT_FIELD_CANNON") !== "35/45/35") {
      const rolled = await roll();
      emit(`AI ${pid} rolled once more (${rolled}) turn=${Game.turn}: niter=${niter(pid)} fc=${strengthOf(pid, "UNIT_FIELD_CANNON")}`);
    }
    check(`AI ${pid} Field Cannon supplied once it held Niter`, strengthOf(pid, "UNIT_FIELD_CANNON") === "35/45/35", strengthOf(pid, "UNIT_FIELD_CANNON"));
    for (const l of plots) if (!niterPlotsOf(pid).some((p) => p.x === l.x && p.y === l.y)) setResource(null, l);
  }
  const plots = niterPlotsOf(pid);
  for (const l of plots) setResource(null, l);
  await sleep(1500);
  emit(`AI ${pid} Niter cleared on ${plots.length} plot(s): niter=${niter(pid)} fc=${strengthOf(pid, "UNIT_FIELD_CANNON")}`);
  const rolled = await roll();
  emit(`AI ${pid} rolled (${rolled}) turn=${Game.turn}: niter=${niter(pid)} fc=${strengthOf(pid, "UNIT_FIELD_CANNON")}`);
  check(`AI ${pid} Field Cannon penalised one roll after the loss`, niter(pid) === 0 && strengthOf(pid, "UNIT_FIELD_CANNON") === "32/42/32", `niter=${niter(pid)} ${strengthOf(pid, "UNIT_FIELD_CANNON")}`);
}

// --- the curve: copies, unit readings and the combat preview ---------------------------------------------------
function expandPlotOnce(c) {
  const r = safe(() => Game.CityCommands.canStart(c.id, CityCommandTypes.EXPAND, {}, true), null);
  for (const i of (r && r.Plots) || []) { const l = locOf(i); if (bareLand(l)) return l; }
  return null;
}
/** One expansion of the capital onto a fresh Niter tile, waited for until the copy counts. */
async function gainNiter() {
  const c = capitalOf(0); let l = null;
  for (let k = 0; k < 8 && !l; k++) {
    if (!safe(() => c.Growth.isReadyToPlacePopulation, false)) safe(() => c.addRuralPopulation(1));
    await sleep(1000);
    l = expandPlotOnce(c);
  }
  if (!l) return "no plot";
  const before = niter(0);
  setResource("RESOURCE_NITER", l); await sleep(800);
  safe(() => Game.CityCommands.sendRequest(c.id, CityCommandTypes.EXPAND, { X: l.x, Y: l.y }));
  for (let k = 0; k < 15 && niter(0) === before; k++) await sleep(1000);
  return `${l.x},${l.y}${niter(0) === before ? " (not counted)" : ""}`;
}
async function gainTo(n) {
  for (let k = 0; k < 16 && niter(0) < n; k++) {
    const at = await gainNiter();
    emit(`C gain ${at}: copies=${niter(0)} fieldCannon=${strengthOf(0, "UNIT_FIELD_CANNON")}`);
    if (at === "no plot") break;
  }
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
  return `${typeName} ${a.CombatStrength} mod=${J(a.PreviewTextModifier)}`;
}
/** War on the first AI with a capital, my second Field Cannon two tiles from that capital, an enemy unit two tiles from it. */
async function setupWar() {
  const ai = majors().filter((p) => p !== 0 && capitalOf(p)).map((p) => ({ p, cap: capitalOf(p).location }))[0];
  if (!ai) { emit("W no AI capital"); return false; }
  WAR.ai = ai.p; WAR.cityAt = { x: ai.cap.x, y: ai.cap.y };
  const args = { Player1: 0, Player2: ai.p, Type: DiplomacyActionTypes.DIPLOMACY_ACTION_DECLARE_WAR };
  safe(() => Game.PlayerOperations.sendRequest(0, PlayerOperationTypes.DECLARE_WAR, args)); await sleep(3000);
  const atWar = safe(() => Players.get(0).Diplomacy.isAtWarWith(ai.p), "?");
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
  emit(`W war on ${ai.p}: atWar=${atWar}; my Field Cannon at ${spots[0].x},${spots[0].y}; enemy unit at ${target ? target.x + "," + target.y : "none"}; enemy city at ${WAR.cityAt.x},${WAR.cityAt.y}`);
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
  emit(`R1 after load turn=${Game.turn} age=${ageName()} niter=${niter(0)} fc=${strengthOf(0, "UNIT_FIELD_CANNON")} srModifiers=${safe(() => GameInfo.Modifiers.filter((m) => String(m.ModifierId).startsWith("SR_")).length, "?")}`);
  await aiLoss();
  await setupWar();
  // The save's one Niter copy stays; the capital expands onto fresh Niter tiles for the rest.
  for (const [n, want] of [[7, "35/45/35"], [8, "36/46/36"], [10, "37/47/37"]]) {
    await gainTo(n); const got = await readCurve(String(n));
    check(`C Field Cannon ${want} at ${n} copies`, niter(0) === n && got === want, `copies=${niter(0)} ${got}`);
  }
  const how = await roll();
  emit(`C after a roll (${how}) turn=${Game.turn} copies=${niter(0)} fieldCannon=${strengthOf(0, "UNIT_FIELD_CANNON")}`);
  setResource(null, NITER_AT);
  finishNow("done");
}
