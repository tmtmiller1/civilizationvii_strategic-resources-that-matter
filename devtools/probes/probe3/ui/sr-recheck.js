// Probe: at every TurnBegin for every major player, and whenever a major player's count of a gated resource drops, gain and drop a dummy off-map resource so the
// engine re-checks that player's resource requirements at the next turn roll. Logs [SRP-RECHECK] to UI.log.
const GATED = ["RESOURCE_IRON", "RESOURCE_OIL"];
const DUMMY = "RESOURCE_HORSES";
const last = new Map();

function counts(player) {
  const c = {};
  for (const t of GATED) c[t] = 0;
  for (const r of player.Resources.getResources()) {
    if (r.isOffMap) continue;
    const t = GameInfo.Resources.lookup(r.uniqueResource.resource)?.ResourceType;
    if (t in c) c[t]++;
  }
  return c;
}

function scan(why) {
  if (why !== "PlayerResourceChanged") console.error(`[SRP-RECHECK] scan ${why} turn ${Game.turn}`);
  for (const player of Players.getAlive()) {
    if (!player.isMajor || !player.Resources) continue;
    const now = counts(player);
    const before = last.get(player.id);
    last.set(player.id, now);
    const always = why === "TurnBegin";
    if (!always && (!before || !GATED.some((t) => now[t] < before[t]))) continue;
    const value = player.Resources.gainOffMapResource(GameInfo.Resources.lookup(DUMMY).$hash);
    player.Resources.removeOffMapResource(value);
    console.error(`[SRP-RECHECK] ${why} turn ${Game.turn}: player ${player.id} ${JSON.stringify(before)} -> ${JSON.stringify(now)}, forced`);
  }
}

engine.on("PlayerResourceChanged", () => scan("PlayerResourceChanged"));
engine.on("TurnBegin", () => scan("TurnBegin"));
engine.on("LocalPlayerTurnBegin", () => scan("LocalPlayerTurnBegin"));
engine.on("PlayerTurnActivated", (e) => { if (e?.player === 0) scan("PlayerTurnActivated"); });
engine.whenReady.then(() => { scan("load"); console.error("[SRP-RECHECK] ready"); });
