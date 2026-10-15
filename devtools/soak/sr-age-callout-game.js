// sr-age-callout-game.js - crash-soak game script (tools/crash-soak/run-soak.sh) for the first-time callout and the
// lost-supply notification across the Exploration to Modern transition. With the short-age probe an Exploration start
// reaches Modern in about 10 turns. The transition reloads every game-scope script, so this file runs once per age:
//   Exploration: tutorial level 2 (advisor warnings), an unsupplied Bombard selected: the callout shows and writes the
//                profile flag; closed with the game's own "cancel" input; then turns until the age ends
//   Modern:      the manager's item unseen again (its state is wiped at the transition) while the flag holds; an
//                unsupplied Field Cannon selected shows no callout; Niter gained, a roll, lost, a roll: one
//                notification; one more roll: none; the tutorial level put back to 0
// The run changes LocalStorage.sqlite and UserOptions.txt; back both up first and put them back after.
//   MOD=strategic_resources_that_matter PROBES=strategic_resources_that_matter/devtools/sr-short-age-probe START_AGE=AGE_EXPLORATION SEED=4242 \
//     zsh run-soak.sh <this file> sr-age-callout 2400
const NAME = "sr-age-callout";
const CALLOUT_ID = "tower_sr_unsupplied_first";
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
let TM = null;
let CB = null;
async function modules() {
  if (!TM) TM = (await import("/base-standard/ui/tutorial/tutorial-manager.js")).default;
  if (!CB) CB = await import("/tower-strategic-resources-that-matter/ui/sr-callout.js");
}
function setLevel(n) { safe(() => { Configuration.getUser().setTutorialLevel(n); engine.trigger("update-tutorial-level"); }); }
function unitOf(type) {
  return (safe(() => Players.get(0).Units.getUnitIds(), []) || []).find((i) => unitType(Units.get(i)) === type) ?? null;
}
function calloutShown() { return !!document.querySelector("tutorial-callout"); }
async function closePopups() {
  try {
    const PS = (await import("/base-standard/ui/popup-sequencer/popup-sequencer.js")).default;
    for (let k = 0; k < 4 && document.querySelector("advisor-council-popup"); k++) { PS.closePopup("advisor-council-popup"); await sleep(1500); }
  } catch (e) { emit(`X popup ${e}`); }
}
async function pressCancel() {
  const { InputEngineEvent } = await import("/core/ui/input/input-support.js");
  window.dispatchEvent(new InputEngineEvent("cancel", InputActionStatuses.FINISH, 0, 0, false, false));
}
function srNotifications() {
  return (safe(() => Game.Notifications.getIdsForPlayer(0), []) || [])
    .filter((id) => String(safe(() => Game.Notifications.getTypeName(Game.Notifications.find(id).Type), "")) === "NOTIFICATION_SR_SUPPLY_LOST").length;
}
async function selectAndLook(type, label) {
  safe(() => UI.Player.deselectAllUnits()); await sleep(800);
  safe(() => UI.Player.selectUnit(unitOf(type))); await sleep(3000);
  await closePopups(); await sleep(2500);
  const shown = calloutShown();
  emit(`${label} selected ${type}: callout=${shown} completed=${safe(() => TM.isItemCompleted(CALLOUT_ID))} flag=${safe(() => CB.hasSeen())} level=${safe(() => Configuration.getUser().tutorialLevel)}`);
  return shown;
}
async function exploration() {
  setLevel(2);
  place("UNIT_BOMBARD"); await sleep(2500);
  emit(`E start niter=${countOf(0, "RESOURCE_NITER")} completed=${safe(() => TM.isItemCompleted(CALLOUT_ID))} flag=${safe(() => CB.hasSeen())}`);
  const shown = await selectAndLook("UNIT_BOMBARD", "E");
  check("exploration: the callout shows for an unsupplied unit", shown);
  check("exploration: showing it writes the profile flag", safe(() => CB.hasSeen()) === true);
  if (shown) { await pressCancel(); await sleep(2000); }
  check("exploration: CLOSE through the game's cancel input", !calloutShown() && safe(() => TM.isItemCompleted(CALLOUT_ID)) === true);
  await untilAgeEnds("AGE_EXPLORATION");
}
async function modern() {
  emit(`M start turn=${Game.turn} level=${safe(() => Configuration.getUser().tutorialLevel)} completed=${safe(() => TM.isItemCompleted(CALLOUT_ID))} flag=${safe(() => CB.hasSeen())}`);
  check("modern: the item is unseen again after the transition", safe(() => TM.isItemCompleted(CALLOUT_ID)) === false);
  check("modern: the profile flag holds", safe(() => CB.hasSeen()) === true);
  if (safe(() => Configuration.getUser().tutorialLevel) !== 2) setLevel(2);
  place("UNIT_FIELD_CANNON"); await sleep(2500);
  const shown = await selectAndLook("UNIT_FIELD_CANNON", "M");
  check("modern: no callout for an unsupplied unit", !shown && countOf(0, "RESOURCE_NITER") === 0);
  if (shown) { await pressCancel(); await sleep(1500); }
  const l = await gain("RESOURCE_NITER");
  emit(`M gained Niter at ${l ? l.x + "," + l.y : "none"} niter=${countOf(0, "RESOURCE_NITER")}`);
  if (!l) { finishNow("no tile to gain Niter on"); return; }
  let how = await roll();
  emit(`M rolled (${how}) turn=${Game.turn} niter=${countOf(0, "RESOURCE_NITER")} sr=${srNotifications()}`);
  setResource(null, l); await sleep(1500);
  how = await roll(); await sleep(4000);
  const raised = srNotifications();
  emit(`M lost and rolled (${how}) turn=${Game.turn} niter=${countOf(0, "RESOURCE_NITER")} sr=${raised}`);
  check("modern: a loss in the new age raises one notification", raised === 1);
  how = await roll(); await sleep(4000);
  emit(`M quiet roll (${how}) turn=${Game.turn} sr=${srNotifications()}`);
  check("modern: not raised again the next turn", srNotifications() === 0);
  setLevel(0);
  emit(`M level put back to ${safe(() => Configuration.getUser().tutorialLevel)}`);
  finishNow("reached Modern");
}
async function run() {
  await modules();
  const age = ageName();
  await sleep(4000);
  emit(`${age} rows=${J(rows())}`);
  if (age === "AGE_EXPLORATION") await exploration();
  else if (age === "AGE_MODERN") await modern();
  else finishNow(`started in ${age}`);
}
