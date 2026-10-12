// sr-ai-game.js - crash-soak game script (tools/crash-soak/run-soak.sh) for the AI with the combat preview lines
// loaded: a Modern game from Play Now, N turns ended as a player would (OPTS_JSON, default 60), the wall time of each
// turn, and every 10 turns each AI's military units that draw on a resource and its copies of the four. Run once with
// the mod and once without on the same seed, and compare:
//   MOD=strategic_resources_that_matter START_AGE=AGE_MODERN SEED=4242 OPTS_JSON=60 zsh run-soak.sh sr-ai-game.js sr-ai-on 3000
//   MOD=none START_AGE=AGE_MODERN SEED=4242 OPTS_JSON=60 zsh run-soak.sh sr-ai-game.js sr-ai-off 3000
const NAME = "sr-ai";
const TURNS = Number("__OPTS__") || 60;
const GATED = { NITER: ["FIELD_CANNON", "FIELD_GUN", "AT_GUN", "MORTAR", "HEAVY_ARTILLERY", "ASSAULT_GUN"],
  OIL: ["LANDSHIP", "TANK", "DREADNOUGHT", "BATTLESHIP"], COAL: ["IRONCLAD", "CRUISER", "DESTROYER"],
  RUBBER: ["BIPLANE", "FIGHTER", "TRENCH_FIGHTER", "DIVE_BOMBER", "BOMBER", "HEAVY_BOMBER"] };
function unitType(u) { return safe(() => String(GameInfo.Units.lookup(u.type).UnitType).replace("UNIT_", ""), "?"); }
function report(pid) {
  const units = {};
  for (const u of safe(() => Players.get(pid).Units.getUnits(), []) || []) {
    const t = unitType(u);
    for (const [res, list] of Object.entries(GATED)) if (list.some((g) => t === g || t.startsWith(g + "_"))) units[res] = (units[res] || 0) + 1;
  }
  const copies = {};
  for (const r of safe(() => Players.get(pid).Resources.getResources(), []) || []) {
    const t = safe(() => String(GameInfo.Resources.lookup(r.uniqueResource.resource).ResourceType).replace("RESOURCE_", ""), "?");
    if (GATED[t] && !r.isOffMap) copies[t] = (copies[t] || 0) + 1;
  }
  const all = (safe(() => Players.get(pid).Units.getUnits(), []) || []).filter((u) => u.Combat).length;
  return `${pid}:military=${all} gated=${J(units)} copies=${J(copies)}`;
}
async function run() {
  // Modern's Play Now opens with the advanced start; left open it holds the turn at about 32 with or without the mod
  // (sr-ai-on and sr-ai-off, 2026-10-12), so it is marked completed first, as sr-age-game.js does after a transition.
  const op = safe(() => PlayerOperationTypes.ADVANCED_START_MARK_COMPLETED, null);
  const can = safe(() => Game.PlayerOperations.canStart(0, op, {}, false), null);
  if (can && can.Success) safe(() => Game.PlayerOperations.sendRequest(0, op, {}));
  await sleep(3000);
  emit(`R advanced start marked completed: canStart=${J(can && can.Success)} blocker=${blocker(0)}`);
  emit(`R mod rows SR_=${safe(() => GameInfo.Modifiers.filter((m) => String(m.ModifierId).startsWith("SR_")).length, "?")} preview=${safe(() => GameInfo.Modifiers.filter((m) => String(m.ModifierId).startsWith("SR_PREVIEW_")).length, "?")}`);
  const times = [];
  for (let k = 1; k <= TURNS; k++) {
    const t0 = Game.turn; const start = Date.now();
    const how = await roll();
    times.push(Date.now() - start - 2500);
    emit(`TURN ${k}/${TURNS} ${how} ${t0}->${Game.turn} ${times.at(-1)}ms`);
    if (how === "stuck") { finishNow(`stuck at turn ${Game.turn}`); return; }
    if (k % 10 === 0) emit(`R turn ${Game.turn} ${[1, 2, 3, 4, 5].map(report).join(" | ")}`);
  }
  const sorted = [...times].sort((a, b) => a - b);
  emit(`R time mean=${Math.round(times.reduce((a, b) => a + b, 0) / times.length)}ms median=${sorted[Math.floor(sorted.length / 2)]}ms min=${sorted[0]} max=${sorted.at(-1)}`);
  finishNow(`${TURNS} turns`);
}
