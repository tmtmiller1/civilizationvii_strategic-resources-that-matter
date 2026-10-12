// sr-idle-game.js - crash-soak game script (tools/crash-soak/run-soak.sh) for the Strategic Resources after-reload
// test: the shell loads SAVE from the main menu; this script reads the mod's state back once (the same read the
// sr-reload run made before it died), then idles with no input for IDLE_S seconds, reads once more and finishes.
// IDLE_S comes from OPTS_JSON (seconds, default 480). The three arms differ only in SAVE and what is in Mods/:
//   MOD=strategic_resources_that_matter SAVE=SR-LAB-RELOAD.Civ7Save OPTS_JSON=480 zsh run-soak.sh sr-idle-game.js sr-rl-a1 900
//   MOD=none SAVE=SR-LAB-RELOAD.Civ7Save OPTS_JSON=480 zsh run-soak.sh sr-idle-game.js sr-rl-b1 900   # data-only copy in Mods/
//   MOD=none SAVE=SR-LAB-RELOAD-VANILLA.Civ7Save OPTS_JSON=480 zsh run-soak.sh sr-idle-game.js sr-rl-c1 900
// Never run it with the label "sr-reload": run-soak.sh clears runs/<label>, and that folder keeps the saves.
const NAME = "sr-idle";
const IDLE_S = Number("__OPTS__") || 480;
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
  emit(`${label} production=${J(safe(() => production(), "?"))} setup=${J([safe(() => g.getValue("StrategicResourcesThatMatterUnsupplied")), safe(() => g.getValue("StrategicResourcesThatMatterLateCurve"))])} rows=${J(srRows())}`);
  emit(`${label} panel Tank: ${await panelLine("UNIT_TANK")} | panel Field Cannon: ${await panelLine("UNIT_FIELD_CANNON")}`);
}

async function run() {
  await sleep(5000);
  await report("R1 after load");
  emit(`R2 idle ${IDLE_S} s, no input`);
  await sleep(IDLE_S * 1000);
  await report("R2 after idle");
  check(`idle ${IDLE_S} s survived`, true, "");
  finishNow("done");
}
