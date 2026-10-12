// sr-gate-age-game.js - crash-soak game script (tools/crash-soak/run-soak.sh) for the hard gate across both age
// transitions. With the short-age probe (Antiquity and Exploration end after 10 points) the game reaches Modern in
// about 20 turns. The transition reloads the database and every game-scope script, so this file runs once per age
// and reads, in each: the gate's data (the option value, the six parameters, the column count), the lock on the
// age's gated unit (build refused without the resource, allowed with one, refused again the same turn it is
// cleared), the panel line of the unit carried over, then turns until the age ends.
//   MOD=strategic_resources_that_matter PROBES=strategic_resources_that_matter/devtools/sr-short-age-probe \
//     START_AGE=AGE_ANTIQUITY SEED=4242 CONFIG="StrategicResourcesThatMatterGate=SR_GATE_TRAINING" \
//     zsh run-soak.sh sr-gate-age-game.js sr-gate-age 3000
const NAME = "sr-gate-age";
// Per age: a gated unit no technology holds back, the resource it needs, and a unit to carry into the next age.
const PLAN = {
  AGE_ANTIQUITY: { unit: "UNIT_CHARIOT", resource: "RESOURCE_HORSES", carry: "UNIT_SPEARMAN", tech: "NODE_TECH_AQ_WHEEL" },
  AGE_EXPLORATION: { unit: "UNIT_COURSER", resource: "RESOURCE_HORSES", carry: "UNIT_MAN_AT_ARMS" },
  AGE_MODERN: { unit: "UNIT_FIELD_CANNON", resource: "RESOURCE_NITER", carry: "UNIT_TANK" },
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
// The population added by addRuralPopulation takes a moment to show in the expansion list (sr-age1 read an empty
// list right after the call), so the list is read again after a short wait, a few times.
async function expandPlot() {
  const c = capital(); if (!c) return null;
  for (let k = 0; k < 6; k++) {
    if (!safe(() => c.Growth.isReadyToPlacePopulation, false)) safe(() => c.addRuralPopulation(1));
    await sleep(1000);
    const r = safe(() => Game.CityCommands.canStart(c.id, CityCommandTypes.EXPAND, {}, true), null);
    for (const i of (r && r.Plots) || []) {
      const l = locOf(i);
      if (!safe(() => GameplayMap.isWater(l.x, l.y), true) && !safe(() => GameplayMap.isMountain(l.x, l.y), true)
        && safe(() => GameplayMap.getResourceType(l.x, l.y), 0) === -1) return l;
    }
  }
  return null;
}
function countOf(pid, type) {
  return (safe(() => Players.get(pid).Resources.getResources(), []) || [])
    .filter((r) => !r.isOffMap && safe(() => String(GameInfo.Resources.lookup(r.uniqueResource.resource).ResourceType), "") === type).length;
}
async function gain(type) {
  const l = await expandPlot(); if (!l) return null;
  const before = countOf(0, type);
  setResource(type, l); await sleep(800);
  safe(() => Game.CityCommands.sendRequest(capital().id, CityCommandTypes.EXPAND, { X: l.x, Y: l.y }));
  for (let k = 0; k < 12 && countOf(0, type) === before; k++) await sleep(500);
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
const hash = (t) => GameInfo.Units.lookup(t).$hash;
function canBuild(type) {
  const c = capital(); if (!c) return "no city";
  const r = Game.CityOperations.canStart(c.id, CityOperationTypes.BUILD, { UnitType: hash(type) }, false);
  return `${type.slice(5)} build=${r.Success ? 1 : 0}${(r.FailureReasons || []).length ? " " + J(r.FailureReasons) : ""}`;
}
function gateState() {
  const params = [...GameInfo.GlobalParameters].filter((p) => String(p.Name).startsWith("STRATEGIC_RESOURCE_MINIMUM"))
    .map((p) => `${String(p.Name).slice(31)}=${p.Value}`);
  const columns = [...GameInfo.Units].filter((u) => u.StrategicResource).length;
  const locked = (safe(() => Game.CityOperations.canStartQuery(capital().id, CityOperationTypes.BUILD, CityQueryType.Unit), []) || [])
    .filter((e) => e?.result?.InsufficientFunds && Array.isArray(e.result.FailureReasons) && e.result.FailureReasons.length === 1)
    .map((e) => String(GameInfo.Units.lookup(e.index)?.UnitType ?? e.index).slice(5));
  return `gate=${J(safe(() => Configuration.getGame().getValue("StrategicResourcesThatMatterGate"), "?"))} params=${J(params)} columns=${columns} listed-locked=${J(locked)}`;
}
async function unlock(node) {
  const pre = {}; for (const r of GameInfo.ProgressionTreePrereqs) (pre[r.Node] = pre[r.Node] || []).push(r.PrereqNode);
  const order = []; const seen = new Set();
  const visit = (n) => { if (seen.has(n)) return; seen.add(n); for (const p of pre[n] || []) visit(p); order.push(n); };
  visit(node);
  for (const n of order) {
    const h = GameInfo.ProgressionTreeNodes.lookup(n).$hash;
    if (Game.ProgressionTrees.getNodeState(0, h) >= 4) continue;
    const kind = safe(() => PlayerOperationTypes.SET_TECH_TREE_NODE, null) ?? "SET_TECH_TREE_NODE";
    safe(() => Game.PlayerOperations.sendRequest(0, kind, { ProgressionTreeNodeType: h }));
    await sleep(800);
    for (let k = 0; k < 6 && Game.ProgressionTrees.getNodeState(0, h) < 4; k++) {
      safe(() => Players.grantYield(0, YieldTypes.YIELD_SCIENCE, 400)); await sleep(800);
    }
  }
  return order.map((n) => `${n.slice(13)}:${Game.ProgressionTrees.getNodeState(0, GameInfo.ProgressionTreeNodes.lookup(n).$hash)}`).join(" ");
}
async function panelLine(type) {
  const u = (safe(() => Players.get(0).Units.getUnits(), []) || []).find((x) => GameInfo.Units.lookup(x.type)?.UnitType === type);
  if (!u) return "no unit";
  safe(() => UI.Player.selectUnit(u.id)); await sleep(3000);
  const lines = [...document.querySelectorAll(".sr-unsupplied-line")].filter((e) => !e.classList.contains("hidden")).map((e) => e.textContent.trim());
  safe(() => UI.Player.deselectAllUnits());
  return J(lines);
}
async function run() {
  const age = ageName();
  const plan = PLAN[age];
  if (age === "AGE_ANTIQUITY") emit(`A capital=${await foundCapital(0)}`);
  await sleep(4000);
  emit(`${age} S1 ${gateState()}`);
  emit(`${age} S1 carried turn=${Game.turn} res=${J(resources(0))} | ${strengths(0)}`);
  if (age !== "AGE_ANTIQUITY") emit(`${age} S1 carried panel: ${await panelLine(PLAN[age === "AGE_EXPLORATION" ? "AGE_ANTIQUITY" : "AGE_EXPLORATION"].carry)}`);
  if (plan.tech) emit(`${age} S1 unlocked ${await unlock(plan.tech)}`);
  emit(`${age} S2 no ${plan.resource.slice(9)} (${countOf(0, plan.resource)}): ${canBuild(plan.unit)}`);
  check(`${age}: the gated unit is refused without the resource`, !Game.CityOperations.canStart(capital().id, CityOperationTypes.BUILD, { UnitType: hash(plan.unit) }, false).Success);
  const l = await gain(plan.resource);
  emit(`${age} S3 gained ${plan.resource.slice(9)} at ${l ? l.x + "," + l.y : "none"} (${countOf(0, plan.resource)}): ${canBuild(plan.unit)}`);
  if (l) {
    check(`${age}: one unlocks it`, Game.CityOperations.canStart(capital().id, CityOperationTypes.BUILD, { UnitType: hash(plan.unit) }, false).Success);
    setResource(null, l); await sleep(1500);
    emit(`${age} S4 cleared (${countOf(0, plan.resource)}): ${canBuild(plan.unit)}`);
    check(`${age}: the clear relocks it the same turn`, !Game.CityOperations.canStart(capital().id, CityOperationTypes.BUILD, { UnitType: hash(plan.unit) }, false).Success);
  }
  place(plan.carry); await sleep(2000);
  emit(`${age} S5 placed ${plan.carry.slice(5)} to carry | ${strengths(0)}`);
  if (age === "AGE_MODERN") { finishNow("reached Modern"); return; }
  await untilAgeEnds(age);
}
