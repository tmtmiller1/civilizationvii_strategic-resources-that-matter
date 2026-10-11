// sr-age-game.js - crash-soak game script (tools/crash-soak/run-soak.sh) for Strategic Resources across both age
// transitions. With the short-age probe (Antiquity and Exploration end after 10 points) the game reaches Modern in about
// 20 turns. The transition reloads the database and every game-scope script, so this file runs once per age and picks
// its half from the age:
//   Antiquity:   found the capital, place gated units, report, then turns until the age ends (transition passed
//                hands-free as in engine-closed.md)
//   Exploration: the rows loaded, the units carried over, fresh gated units, a gain and a loss re-checked, then turns
//   Modern:      the same, then finish
//   MOD=strategic_resources PROBES=strategic_resources/devtools/sr-short-age-probe START_AGE=AGE_ANTIQUITY SEED=4242 \
//     zsh run-soak.sh <this file> sr-age 3000
const NAME = "sr-age";
const PLAN = {
  AGE_ANTIQUITY: { place: ["UNIT_SPEARMAN", "UNIT_CHARIOT", "UNIT_SLINGER"] },
  AGE_EXPLORATION: { place: ["UNIT_MAN_AT_ARMS", "UNIT_CATAPULT", "UNIT_CROSSBOWMAN"], cycle: "RESOURCE_NITER" },
  AGE_MODERN: { place: ["UNIT_TANK", "UNIT_FIELD_CANNON", "UNIT_LINE_INFANTRY"], cycle: "RESOURCE_OIL" },
};
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
function rows() {
  const mods = safe(() => GameInfo.Modifiers.filter((m) => String(m.ModifierId).startsWith("SR_")).map((m) => String(m.ModifierId)), []) || [];
  const tags = {};
  for (const t of safe(() => GameInfo.TypeTags.filter((r) => String(r.Tag).startsWith("SR_SUPPLY_")), []) || []) {
    const k = String(t.Tag).replace("SR_SUPPLY_", ""); (tags[k] = tags[k] || []).push(String(t.Type).replace("UNIT_", ""));
  }
  const penalties = mods.filter((m) => m.startsWith("SR_COMBAT_PENALTY_")).map((m) => m.replace("SR_COMBAT_PENALTY_", ""));
  return { modifiers: mods.length, penalties, supplyTags: Object.fromEntries(Object.entries(tags).map(([k, v]) => [k, v.length])),
    spearmanTagged: Object.values(tags).some((v) => v.includes("SPEARMAN")), manAtArmsTagged: Object.values(tags).some((v) => v.includes("MAN_AT_ARMS")) };
}
function capital() { return safe(() => Players.get(0).Cities.getCapital(), null) || safe(() => Players.get(0).Cities.getCities()[0], null); }
function place(type) {
  const c = capital(); if (!c) return "no city";
  return safe(() => Game.PlayerOperations.sendRequest(0, "CREATE_ELEMENT", { Kind: "UNIT", Type: type, Location: c.location, Owner: 0 }));
}
function setResource(type, l) {
  return safe(() => { const r = type ? GameInfo.Resources.lookup(type).$index : -1; WorldBuilder.startBlock(); WorldBuilder.MapPlots.setResource(r, l, 1); WorldBuilder.endBlock(); return true; });
}
function expandPlot() {
  const c = capital(); if (!c) return null;
  if (!safe(() => c.Growth.isReadyToPlacePopulation, false)) safe(() => c.addRuralPopulation(1));
  const r = safe(() => Game.CityCommands.canStart(c.id, CityCommandTypes.EXPAND, {}, true), null);
  for (const i of (r && r.Plots) || []) {
    const l = locOf(i);
    if (!safe(() => GameplayMap.isWater(l.x, l.y), true) && safe(() => GameplayMap.getResourceType(l.x, l.y), 0) === -1) return l;
  }
  return null;
}
async function gain(type) {
  const l = expandPlot(); if (!l) return null;
  setResource(type, l); await sleep(800);
  safe(() => Game.CityCommands.sendRequest(capital().id, CityCommandTypes.EXPAND, { X: l.x, Y: l.y })); await sleep(2500);
  return l;
}
let CTX = null;
function transitionPending() {
  const ids = safe(() => Game.Notifications.getIdsForPlayer(0), []) || [];
  return ids.find((n) => String(safe(() => Game.Notifications.getTypeName(n), "")) === "NOTIFICATION_AGE_TRANSITION");
}
async function passTransition(id) {
  emit(`X age transition notification at turn ${Game.turn} (${ageName()}); passing it`);
  safe(() => Game.Notifications.activate(id)); await sleep(6000);
  const op = safe(() => PlayerOperationTypes.ADVANCED_START_MARK_COMPLETED, null);
  const can = safe(() => Game.PlayerOperations.canStart(0, op, {}, false), null);
  if (can && can.Success) safe(() => Game.PlayerOperations.sendRequest(0, op, {}));
  emit(`X mark completed canStart=${J(can && can.Success)}`);
  await sleep(3000);
  if (!CTX) { try { CTX = (await import("/core/ui/context-manager/context-manager.js")).ContextManager; } catch (e) { emit(`X ContextManager import ${e}`); } }
  safe(() => CTX && CTX.pop("screen-dedication-selection"));
  await sleep(2000);
  safe(() => GameContext.sendTurnComplete());
}
async function untilAgeEnds(age) {
  for (let t = 0; t < 30; t++) {
    const id = transitionPending();
    if (id != null) { await passTransition(id); await sleep(30000); if (ageName() !== age) return; continue; }
    const how = await roll();
    emit(`T ${age} turn=${Game.turn} (${how}) progress=${safe(() => Game.AgeProgressManager.getCurrentAgeProgressionPoints(), "?")}/${safe(() => Game.AgeProgressManager.getMaxAgeProgressionPoints(), "?")}`);
    if (how === "stuck" && transitionPending() == null) emit(`T stuck at turn ${Game.turn} with no transition notification: ${blocker(0)}`);
  }
  finishNow(`the age did not end within 30 turns (turn ${Game.turn}, ${ageName()})`);
}
async function run() {
  const age = ageName();
  const plan = PLAN[age];
  if (age === "AGE_ANTIQUITY") emit(`A capital=${await foundCapital(0)}`);
  await sleep(4000);
  emit(`${age} S1 rows=${J(rows())}`);
  emit(`${age} S1 carried turn=${Game.turn} res=${J(resources(0))} | ${strengths(0)}`);
  for (const t of plan.place) place(t);
  await sleep(2500);
  emit(`${age} S2 placed | ${strengths(0)}`);
  if (plan.cycle) {
    const l = await gain(plan.cycle);
    emit(`${age} S3 gained ${plan.cycle} at ${l ? l.x + "," + l.y : "none"} res=${J(resources(0))} | ${strengths(0)}`);
    if (l) {
      setResource(null, l); await sleep(1500);
      emit(`${age} S4 cleared res=${J(resources(0))} | ${strengths(0)}`);
      const how = await roll();
      emit(`${age} S5 rolled (${how}) turn=${Game.turn} res=${J(resources(0))} | ${strengths(0)}`);
    }
  }
  if (age === "AGE_MODERN") { finishNow("reached Modern"); return; }
  await untilAgeEnds(age);
}
