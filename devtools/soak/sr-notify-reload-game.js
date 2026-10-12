// sr-notify-reload-game.js - crash-soak game script (tools/crash-soak/run-soak.sh): the lost-supply notification
// across a save load. The shell loads SAVE; this script reads the local player's notifications of the mod's type
// right after the load and after one roll with nothing lost (both must be empty: a load takes its first look and
// reports nothing), then gives the player one Niter (an owned bare tile, a rural citizen, an expand request, the
// lab recipe), rolls, clears every Niter tile the player draws on (the save already holds one), rolls, and reads the
// notification the loss raised.
//   MOD=strategic_resources_that_matter SAVE=SR-LAB-RELOAD.Civ7Save zsh run-soak.sh sr-notify-reload-game.js p14-notify-reload 1500
const NAME = "sr-notify-reload";
const TYPE = "NOTIFICATION_SR_SUPPLY_LOST";
function mine() {
  const local = GameContext.localPlayerID;
  return (safe(() => Game.Notifications.getIdsOfTypeForPlayer(local, Game.getHash(TYPE)), []) || []).map((id) => ({
    turn: safe(() => Game.Notifications.find(id).AddedOnTurn, "?"), summary: safe(() => Game.Notifications.getSummary(id), "?")
  }));
}
function copies(type) {
  return (safe(() => Players.get(GameContext.localPlayerID).Resources.getResources(), []) || [])
    .filter((r) => !r.isOffMap && safe(() => String(GameInfo.Resources.lookup(r.uniqueResource.resource).ResourceType), "") === type).length;
}
function niterPlots() {
  return (safe(() => Players.get(GameContext.localPlayerID).Resources.getResources(), []) || [])
    .filter((r) => !r.isOffMap && safe(() => String(GameInfo.Resources.lookup(r.uniqueResource.resource).ResourceType), "") === "RESOURCE_NITER")
    .map((r) => locOf(r.value));
}
function setResource(type, l) {
  return safe(() => { const r = type ? GameInfo.Resources.lookup(type).$index : -1; WorldBuilder.startBlock(); WorldBuilder.MapPlots.setResource(r, l, 1); WorldBuilder.endBlock(); return true; });
}
function bareOwnedNear(city) {
  const out = [];
  for (const i of safe(() => city.getPurchasedPlots(), []) || []) {
    const l = locOf(i);
    if (safe(() => GameplayMap.isWater(l.x, l.y), true) || safe(() => GameplayMap.isMountain(l.x, l.y), true)) continue;
    if (safe(() => GameplayMap.getResourceType(l.x, l.y), 0) !== -1 || safe(() => Districts.getAtLocation(l), null)) continue;
    if (safe(() => GameplayMap.getPlotDistance(l.x, l.y, city.location.x, city.location.y), 9) <= 3) out.push(l);
  }
  return out;
}
function state(label) {
  emit(`${label} turn=${Game.turn} niter=${copies("RESOURCE_NITER")} notifications=${J(mine())}`);
}

async function run() {
  await sleep(5000);
  state("R1 after load");
  check("no notification right after the load", mine().length === 0, J(mine()));
  const quiet = await roll();
  state(`R2 one roll, nothing lost (${quiet})`);
  check("no notification after a roll with nothing lost", mine().length === 0, J(mine()));
  const city = safe(() => Players.get(GameContext.localPlayerID).Cities.getCapital(), null);
  const tile = city ? bareOwnedNear(city)[0] : null;
  if (!tile) { finishNow("no owned bare tile near the capital"); return; }
  setResource("RESOURCE_NITER", tile);
  safe(() => city.addRuralPopulation(1));
  await sleep(3000);
  safe(() => Game.CityCommands.sendRequest(city.id, CityCommandTypes.EXPAND, { X: tile.x, Y: tile.y }));
  await sleep(4000);
  state(`R3 Niter put on ${tile.x},${tile.y} and expanded onto`);
  if (copies("RESOURCE_NITER") === 0) { setResource(null, tile); finishNow("the Niter did not count"); return; }
  const held = await roll();
  state(`R4 rolled with Niter held (${held})`);
  const cleared = niterPlots();
  for (const l of cleared) setResource(null, l);
  await sleep(2000);
  emit(`Niter cleared on ${cleared.map((l) => l.x + "," + l.y).join(" ")}: niter=${copies("RESOURCE_NITER")}`);
  const lost = await roll();
  state(`R5 Niter cleared, rolled (${lost})`);
  check("one notification for the loss after the load", mine().length === 1 && /Niter/.test(mine()[0].summary), J(mine()));
  const next = await roll();
  state(`R6 one more roll (${next})`);
  check("the notification ended with its turn and was not raised again", mine().length === 0, J(mine()));
  finishNow("done");
}
