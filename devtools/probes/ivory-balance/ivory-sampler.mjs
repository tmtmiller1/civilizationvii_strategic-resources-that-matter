// Balance probe for docs/elephants-on-ivory.md. Samples seeded Antiquity maps in one running lab game (after
// `tower-bench lab start --age AGE_ANTIQUITY`): per map, every Horses and Ivory tile, and for each major player's start
// (its founding unit at turn 1) the nearest of each and the counts within 3, 5 and 8 tiles. Player 0 is Khmer and
// player 1 Maurya. Usage: [MAP='{base-standard}maps/pangaea-voronoi.js'] node ivory-sampler.mjs <out.jsonl> <seed>...
import fs from "node:fs";
import { CdpSession, listTargets, scopeOf } from "../../../../../tools/tower-bench/lib/cdp.mjs";

const PORT = 9444;
const out = process.argv[2];
const seeds = process.argv.slice(3).map(Number);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let cdp = new CdpSession(PORT);

async function scope() {
  const t = await listTargets(PORT, { timeoutMs: 1500 }).catch(() => []);
  return t.some((x) => scopeOf(x) === "game") ? "game" : t.some((x) => scopeOf(x) === "shell") ? "shell" : "other";
}
async function waitFor(what, test, ms, step = 2000) {
  const t0 = Date.now();
  for (;;) {
    try { const v = await test(); if (v) return v; } catch { /* not yet */ }
    if (Date.now() - t0 > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(step);
  }
}
async function reconnect() { cdp.close(); cdp = new CdpSession(PORT); await cdp.ensure(); }

function measure() {
  const W = GameplayMap.getGridWidth(), H = GameplayMap.getGridHeight();
  const want = { RESOURCE_HORSES: [], RESOURCE_IVORY: [] };
  const idx = {};
  for (const k of Object.keys(want)) idx[GameInfo.Resources.lookup(k).$index] = k;
  let land = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!GameplayMap.isWater(x, y)) land++;
    const r = GameplayMap.getResourceType(x, y);
    if (idx[r]) want[idx[r]].push({ x, y, area: GameplayMap.getAreaId ? GameplayMap.getAreaId(x, y) : null });
  }
  const players = [];
  for (const pid of Players.getAliveMajorIds()) {
    const p = Players.get(pid);
    const units = p.Units.getUnits() || [];
    const founder = units.find((u) => /SETTLER|FOUNDER/.test(String(GameInfo.Units.lookup(u.type).UnitType))) || units[0];
    if (!founder) continue;
    const { x, y } = founder.location;
    const area = GameplayMap.getAreaId ? GameplayMap.getAreaId(x, y) : null;
    const row = { pid, civ: String(GameInfo.Civilizations.lookup(p.civilizationType)?.CivilizationType), x, y };
    for (const [k, tiles] of Object.entries(want)) {
      const d = tiles.map((t) => ({ d: GameplayMap.getPlotDistance(x, y, t.x, t.y), same: t.area === area }));
      const short = k === "RESOURCE_HORSES" ? "horses" : "ivory";
      row[`${short}Nearest`] = d.length ? Math.min(...d.map((e) => e.d)) : null;
      const same = d.filter((e) => e.same).map((e) => e.d);
      row[`${short}NearestSameArea`] = same.length ? Math.min(...same) : null;
      for (const r of [3, 5, 8]) row[`${short}${r}`] = d.filter((e) => e.d <= r).length;
    }
    players.push(row);
  }
  return {
    map: String(Configuration.getMap().script ?? Configuration.getMapValue?.("Name")),
    size: String(GameplayMap.getMapSize()),
    W, H, land, horses: want.RESOURCE_HORSES.length, ivory: want.RESOURCE_IVORY.length, players,
  };
}

async function startGame(seed) {
  await waitFor("main menu", async () => (await scope()) === "shell", 240000);
  await reconnect();
  await waitFor("menu scripts", () => cdp.call(() => typeof Configuration.editGame === "function"), 60000);
  await sleep(5000);
  const setup = await cdp.call(({ seed, map }) => {
    Configuration.editGame().reset(GameModeTypes.SINGLEPLAYER);
    Configuration.editGame().setStartAgeType("AGE_ANTIQUITY");
    Configuration.editMap().setMapSeed(seed);
    if (map) Configuration.editMap().setScript(map);
    Configuration.editGame().setGameSeed(seed);
    Configuration.editPlayer(0).setCivilizationTypeName("CIVILIZATION_KHMER");
    Configuration.editPlayer(1).setCivilizationTypeName("CIVILIZATION_MAURYA");
    const o = {
      p0: Configuration.getPlayer(0).civilizationTypeName,
      p1: Configuration.getPlayer(1).civilizationTypeName
    };
    o.map = Configuration.getMap().script;
    engine.call("startGame");
    return o;
  }, { seed, map: process.env.MAP ?? null });
  cdp.close();
  await waitFor("game", async () => (await scope()) === "game", 360000);
  await reconnect();
  await waitFor("Begin Game",
    () => cdp.call(() => { UI.notifyUIReady(); return UI.getGameLoadingState() === 8; }), 240000, 1000);
  await sleep(3000);
  return setup;
}

for (const seed of seeds) {
  const t0 = Date.now();
  try {
    if ((await scope()) === "game") {
      await reconnect();
      await cdp.call(() => { engine.call("exitToMainMenu"); return true; }).catch(() => null);
      await sleep(8000);
    }
    const setup = await startGame(seed);
    await reconnect();
    const m = await cdp.call(measure, {}, { timeoutMs: 60000 });
    fs.appendFileSync(out, JSON.stringify({ seed, setup, ...m }) + "\n");
    const secs = Math.round((Date.now() - t0) / 1000);
    console.log(`seed ${seed}: horses ${m.horses} ivory ${m.ivory} players ${m.players.length} (${secs} s)`);
  } catch (e) {
    fs.appendFileSync(out, JSON.stringify({ seed, error: String(e) }) + "\n");
    console.log(`seed ${seed}: ERROR ${e}`);
  }
}
cdp.close();
