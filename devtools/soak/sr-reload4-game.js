// sr-reload4-game.js - crash-soak game script (tools/crash-soak/run-soak.sh): one AI's loss re-checked one roll later
// after a reload of the Strategic Resources save. The AI gains Niter the way the lab run `sr-lab-curve` showed works:
// Niter put by WorldBuilder on the AI's own owned bare tiles (no district), which the AI expands onto in its turn.
// Niter on an AI's existing plain mine never counted (sr-reload2), and the AI's expansion list cannot be queried
// from the local player's context (sr-reload3).
//   MOD=strategic_resources_that_matter SAVE=SR-LAB-RELOAD.Civ7Save zsh run-soak.sh sr-reload4-game.js sr-reload4 1500
const NAME = "sr-reload4";
function unitType(u) { return safe(() => String(GameInfo.Units.lookup(u.type).UnitType), "?"); }
function unitsOf(pid) { return (safe(() => Players.get(pid).Units.getUnits(), []) || []).filter((u) => u && u.Combat); }
function strengthOf(pid, type) {
  const u = unitsOf(pid).find((x) => unitType(x) === type); const c = u && u.Combat;
  return c ? `${c.getMeleeStrength(false)}/${c.rangedStrength}/${c.bombardStrength}` : "?";
}
function niter(pid) {
  return (safe(() => Players.get(pid).Resources.getResources(), []) || [])
    .filter((r) => !r.isOffMap && safe(() => String(GameInfo.Resources.lookup(r.uniqueResource.resource).ResourceType), "") === "RESOURCE_NITER").length;
}
function setResource(type, l) {
  return safe(() => { const r = type ? GameInfo.Resources.lookup(type).$index : -1; WorldBuilder.startBlock(); WorldBuilder.MapPlots.setResource(r, l, 1); WorldBuilder.endBlock(); return true; });
}
function capitalOf(pid) { return safe(() => Players.get(pid).Cities.getCapital(), null) || safe(() => Players.get(pid).Cities.getCities()[0], null); }
function bareLand(l) {
  return !safe(() => GameplayMap.isWater(l.x, l.y), true) && !safe(() => GameplayMap.isMountain(l.x, l.y), true)
    && safe(() => GameplayMap.getResourceType(l.x, l.y), 0) === -1 && !safe(() => Districts.getAtLocation(l), null);
}
function ownedBare(pid) {
  const out = [];
  for (const c of citiesOf(pid)) for (const i of safe(() => c.getPurchasedPlots(), []) || []) { const l = locOf(i); if (bareLand(l)) out.push(l); }
  return out;
}
function niterPlotsOf(pid) {
  const out = []; const idx = safe(() => GameInfo.Resources.lookup("RESOURCE_NITER").$index, -2);
  for (const c of citiesOf(pid)) for (const i of safe(() => c.getPurchasedPlots(), []) || []) {
    const l = locOf(i); if (safe(() => GameplayMap.getResourceType(l.x, l.y), -1) === idx) out.push(l);
  }
  return out;
}
function fc(pid) { return strengthOf(pid, "UNIT_FIELD_CANNON"); }

async function run() {
  await sleep(5000);
  emit(`R1 after load turn=${Game.turn} age=${ageName()} srModifiers=${safe(() => GameInfo.Modifiers.filter((m) => String(m.ModifierId).startsWith("SR_")).length, "?")}`);
  const ais = majors().filter((p) => p !== 0 && capitalOf(p));
  const pid = ais.find((p) => niter(p) === 0 && ownedBare(p).length >= 2) ?? ais.find((p) => niter(p) === 0) ?? ais[0];
  if (pid == null) { finishNow("no AI with a city"); return; }
  const cap = capitalOf(pid);
  safe(() => Game.PlayerOperations.sendRequest(0, "CREATE_ELEMENT", { Kind: "UNIT", Type: "UNIT_FIELD_CANNON", Location: cap.location, Owner: pid }));
  await sleep(2500);
  emit(`AI ${pid} placed a Field Cannon at ${cap.location.x},${cap.location.y}: niter=${niter(pid)} fc=${fc(pid)}`);
  check(`AI ${pid} Field Cannon unsupplied after the load`, niter(pid) === 0 && fc(pid) === "32/42/32", `niter=${niter(pid)} ${fc(pid)}`);
  const seeded = ownedBare(pid).slice(0, 3);
  for (const l of seeded) setResource("RESOURCE_NITER", l);
  safe(() => cap.addRuralPopulation(1));
  await sleep(1000);
  emit(`AI ${pid} Niter put on ${seeded.length} of its owned bare tiles: ${seeded.map((l) => l.x + "," + l.y).join(" ")}`);
  for (let k = 0; k < 8 && niter(pid) === 0; k++) {
    const how = await roll();
    emit(`AI ${pid} rolled (${how}) turn=${Game.turn}: niter=${niter(pid)} fc=${fc(pid)}`);
  }
  if (niter(pid) === 0) { for (const l of seeded) setResource(null, l); finishNow(`AI ${pid} never took the Niter`); return; }
  if (fc(pid) !== "35/45/35") {
    const how = await roll();
    emit(`AI ${pid} rolled once more (${how}) turn=${Game.turn}: niter=${niter(pid)} fc=${fc(pid)}`);
  }
  check(`AI ${pid} Field Cannon supplied once it held Niter`, fc(pid) === "35/45/35", `niter=${niter(pid)} ${fc(pid)}`);
  for (const l of seeded) setResource(null, l);
  for (const l of niterPlotsOf(pid)) setResource(null, l);
  await sleep(1500);
  emit(`AI ${pid} Niter cleared: niter=${niter(pid)} fc=${fc(pid)} (latched until the roll)`);
  const how = await roll();
  emit(`AI ${pid} rolled (${how}) turn=${Game.turn}: niter=${niter(pid)} fc=${fc(pid)}`);
  check(`AI ${pid} Field Cannon penalised one roll after the loss (after the load)`, niter(pid) === 0 && fc(pid) === "32/42/32", `niter=${niter(pid)} ${fc(pid)}`);
  finishNow("done");
}
