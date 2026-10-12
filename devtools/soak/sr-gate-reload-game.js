// sr-gate-reload-game.js - crash-soak game script (tools/crash-soak/run-soak.sh) for the hard gate across a reload:
// load a save made with Gated Units on, read the gate as the loaded data has it, the lock on the saved game's gated
// units (build and purchase refused, the production list's greyed item), the panel line on a locked unit, then gain
// a copy, read the unlock, clear it and read the relock. Every reading is written to UI.log as "[SOAK] ...".
//   MOD=strategic_resources_that_matter SAVE=SOAK-SR-GATE-G1.Civ7Save zsh run-soak.sh sr-gate-reload-game.js sr-gate-reload 1500
// OPTS_JSON: {"unit":"UNIT_LEGION_2","resource":"RESOURCE_IRON","other":"UNIT_HORSEMAN"} (the defaults below).
const NAME = "sr-gate-reload";
const OPTS = (() => { try { return JSON.parse('__OPTS__') || {}; } catch (_) { return {}; } })();
const UNIT = OPTS.unit || "UNIT_LEGION_2";
const RESOURCE = OPTS.resource || "RESOURCE_IRON";
const OTHER = OPTS.other || "UNIT_HORSEMAN";

const cap = () => safe(() => Players.get(0).Cities.getCapital(), null) || citiesOf(0)[0];
const hash = (t) => GameInfo.Units.lookup(t).$hash;
function copies(type) {
  return (safe(() => Players.get(0).Resources.getResources(), []) || [])
    .filter((r) => GameInfo.Resources.lookup(r.uniqueResource.resource)?.ResourceType === type && !r.isOffMap).length;
}
function can(type) {
  const c = cap();
  const b = Game.CityOperations.canStart(c.id, CityOperationTypes.BUILD, { UnitType: hash(type) }, false);
  const p = Game.CityCommands.canStart(c.id, CityCommandTypes.PURCHASE, { UnitType: hash(type) }, false);
  return `${type.slice(5)} build=${b.Success ? 1 : 0} buy=${p.Success ? 1 : 0}${(b.FailureReasons || []).length ? " " + J(b.FailureReasons) : ""}`;
}
function gateState() {
  const params = [...GameInfo.GlobalParameters].filter((p) => String(p.Name).startsWith("STRATEGIC_RESOURCE_MINIMUM"))
    .map((p) => `${String(p.Name).slice(31)}=${p.Value}`);
  const columns = [...GameInfo.Units].filter((u) => u.StrategicResource).length;
  return `gate=${J(safe(() => Configuration.getGame().getValue("StrategicResourcesThatMatterGate"), "?"))} params=${J(params)} columns=${columns}`;
}
function bareLand(l) {
  return !safe(() => GameplayMap.isWater(l.x, l.y), true) && !safe(() => GameplayMap.isMountain(l.x, l.y), true)
    && safe(() => GameplayMap.getResourceType(l.x, l.y), 0) === -1;
}
function setResource(type, l) {
  return safe(() => { const r = type ? GameInfo.Resources.lookup(type).$index : -1; WorldBuilder.startBlock(); WorldBuilder.MapPlots.setResource(r, l, 1); WorldBuilder.endBlock(); return true; });
}
function expandPlotOnce(c) {
  const r = safe(() => Game.CityCommands.canStart(c.id, CityCommandTypes.EXPAND, {}, true), null);
  for (const i of (r && r.Plots) || []) { const l = locOf(i); if (bareLand(l)) return l; }
  return null;
}
async function gain(type) {
  const c = cap(); let l = null;
  for (let k = 0; k < 8 && !l; k++) {
    if (!safe(() => c.Growth.isReadyToPlacePopulation, false)) safe(() => c.addRuralPopulation(1));
    await sleep(1000);
    l = expandPlotOnce(c);
  }
  if (!l) return null;
  const before = copies(type);
  setResource(type, l); await sleep(800);
  safe(() => Game.CityCommands.sendRequest(c.id, CityCommandTypes.EXPAND, { X: l.x, Y: l.y }));
  for (let k = 0; k < 15 && copies(type) === before; k++) await sleep(1000);
  return copies(type) > before ? l : null;
}
async function listItem(type) {
  safe(() => UI.Player.selectCity(cap().id));
  await sleep(3000);
  const item = [...document.querySelectorAll("production-chooser-item")].find((i) => i.getAttribute("data-type") === type);
  const out = item ? `disabled=${item.getAttribute("data-disabled")} text=${J(item.textContent.replace(/\s+/g, " ").trim().slice(0, 80))}` : "absent";
  safe(() => UI.Player.deselectAllCities?.());
  await sleep(500);
  return out;
}
async function panelLine(type) {
  const u = (safe(() => Players.get(0).Units.getUnits(), []) || []).find((x) => GameInfo.Units.lookup(x.type)?.UnitType === type);
  if (!u) return "no unit";
  safe(() => UI.Player.selectUnit(u.id));
  await sleep(3000);
  const lines = [...document.querySelectorAll("*")].filter((e) => e.children.length === 0 && /Unsupplied|Unversorgt|補給なし|Без снабжения/.test(e.textContent)).map((e) => e.textContent.trim());
  safe(() => UI.Player.deselectAllUnits());
  return J(lines);
}

async function run() {
  await sleep(5000);
  emit(`R0 turn ${Game.turn} ${gateState()}`);
  emit(`R1 after load: copies ${RESOURCE.slice(9)}=${copies(RESOURCE)} ${can(UNIT)} | ${can(OTHER)}`);
  check("after load: the saved game's gated unit is locked", !Game.CityOperations.canStart(cap().id, CityOperationTypes.BUILD, { UnitType: hash(UNIT) }, false).Success);
  emit(`R2 list item: ${await listItem(UNIT)}`);
  emit(`R3 panel: ${await panelLine(UNIT)}`);
  const at = await gain(RESOURCE);
  emit(`R4 gained ${RESOURCE.slice(9)} at ${at ? at.x + "," + at.y : "nowhere"}: copies=${copies(RESOURCE)} ${can(UNIT)} | ${can(OTHER)}`);
  if (at) {
    check("one copy unlocks the unit after a reload", Game.CityOperations.canStart(cap().id, CityOperationTypes.BUILD, { UnitType: hash(UNIT) }, false).Success);
    emit(`R5 list item: ${await listItem(UNIT)}`);
    setResource(null, at); await sleep(2000);
    emit(`R6 cleared: copies=${copies(RESOURCE)} ${can(UNIT)}`);
    check("the clear relocks the unit the same turn", !Game.CityOperations.canStart(cap().id, CityOperationTypes.BUILD, { UnitType: hash(UNIT) }, false).Success);
  }
  const rolled = await roll();
  emit(`R7 rolled (${rolled}) turn=${Game.turn} ${can(UNIT)} | ${can(OTHER)}`);
  finishNow("reload read");
}
