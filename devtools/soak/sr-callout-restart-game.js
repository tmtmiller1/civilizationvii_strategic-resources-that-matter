// sr-callout-restart-game.js - crash-soak game script (tools/crash-soak/run-soak.sh) for the first-time callout's
// "seen" flag across a restart of the game. Run twice; OPTS_JSON picks the half:
//   OPTS_JSON=1  a new Modern game, tutorial level 2, an unsupplied Field Cannon selected: the callout shows and the
//                profile flag is written; the run's cleanup then quits the game
//   OPTS_JSON=2  a new game in a new launch: the flag is still there, the manager's item is unseen, and the same
//                selection shows no callout; the tutorial level put back to 0
// run-soak.sh does not restore LocalStorage.sqlite or the options files: back them up first and put them back after.
//   MOD=strategic_resources_that_matter START_AGE=AGE_MODERN SEED=4242 OPTS_JSON=1 zsh run-soak.sh <this file> sr-restart-1 900
const NAME = "sr-callout-restart";
const HALF = Number("__OPTS__") || 1;
const CALLOUT_ID = "tower_sr_unsupplied_first";
function unitType(u) { return safe(() => String(GameInfo.Units.lookup(u.type).UnitType), "?"); }
function unitOf(type) { return (safe(() => Players.get(0).Units.getUnitIds(), []) || []).find((i) => unitType(Units.get(i)) === type) ?? null; }
function setLevel(n) { safe(() => { Configuration.getUser().setTutorialLevel(n); engine.trigger("update-tutorial-level"); }); }
async function closePopups() {
  try {
    const PS = (await import("/base-standard/ui/popup-sequencer/popup-sequencer.js")).default;
    for (let k = 0; k < 4 && document.querySelector("advisor-council-popup"); k++) { PS.closePopup("advisor-council-popup"); await sleep(1500); }
  } catch (e) { emit(`X popup ${e}`); }
}
async function run() {
  const TM = (await import("/base-standard/ui/tutorial/tutorial-manager.js")).default;
  const CB = await import("/tower-strategic-resources-that-matter/ui/sr-callout.js");
  const state = () => `completed=${safe(() => TM.isItemCompleted(CALLOUT_ID))} flag=${safe(() => CB.hasSeen())} raw=${J(safe(() => localStorage.getItem(CB.SEEN_KEY)))} level=${safe(() => Configuration.getUser().tutorialLevel)} focus=${safe(() => document.hasFocus())}`;
  await sleep(4000);
  emit(`H${HALF} start turn=${Game.turn} ${state()}`);
  if (HALF === 2) check("restart: the flag is still there in a new launch", safe(() => CB.hasSeen()) === true);
  setLevel(2);
  safe(() => Game.PlayerOperations.sendRequest(0, "CREATE_ELEMENT", { Kind: "UNIT", Type: "UNIT_FIELD_CANNON", Location: { x: 63, y: 23 }, Owner: 0 }));
  await sleep(2500);
  safe(() => UI.Player.deselectAllUnits()); await sleep(800);
  safe(() => UI.Player.selectUnit(unitOf("UNIT_FIELD_CANNON"))); await sleep(3000);
  await closePopups(); await sleep(2500);
  const shown = !!document.querySelector("tutorial-callout");
  emit(`H${HALF} selected the Field Cannon: callout=${shown} ${state()}`);
  if (HALF === 1) {
    check("first launch: the callout shows", shown);
    check("first launch: the flag is written", safe(() => CB.hasSeen()) === true);
  } else {
    check("restart: no callout in the new game", !shown);
    // A positive control for hovering from script: the plot tooltip on the Niter tile at 58,18, the game in front.
    try {
      const PC = (await import("/core/ui/input/plot-cursor.js")).PlotCursor;
      PC.plotCursorCoords = { x: 57, y: 18 }; await sleep(400); PC.plotCursorCoords = { x: 58, y: 18 }; await sleep(2500);
      const tip = document.querySelector(".new-tooltip--root");
      emit(`H2 hover 58,18: tooltip=${J((tip && tip.textContent || "").slice(0, 220))} focus=${safe(() => document.hasFocus())}`);
    } catch (e) { emit(`H2 hover ${e}`); }
    setLevel(0);
    emit(`H2 level put back to ${safe(() => Configuration.getUser().tutorialLevel)}`);
  }
  finishNow(`half ${HALF}`);
}
