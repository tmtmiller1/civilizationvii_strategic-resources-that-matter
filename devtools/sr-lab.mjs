// Tower Bench with three additions for this mod's lab games, set by environment variables:
//   SR_LAB_SETUP='{"StrategicResourcesThatMatterUnsupplied":"SR_UNSUPPLIED_LIGHT"}'  game setup values for `lab start`
//   SR_LAB_LANGUAGE=de_DE                                                 display language for the test game
//   SR_LAB_MODE=HOTSEAT                                                   a hotseat game with two human seats
// Usage: node devtools/sr-lab.mjs <any tower-bench command>, for example
//   SR_LAB_SETUP='{"StrategicResourcesThatMatterLateCurve":"SR_LATE_CURVE_OFF"}' \
//     node devtools/sr-lab.mjs lab start --seed 4242
// Setup values go through GameSetup.setGameParameterValue, the call the setup screen makes, right after the lab's
// Play Now resets the configuration; each is read back from the game configuration and printed. The language is
// written into AppOptions.txt after the lab has backed it up, so `lab stop` puts the player's own file back.
// Development only; never shipped.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Lab } from "../../../tools/tower-bench/lib/lab.mjs";

const setup = process.env.SR_LAB_SETUP ? JSON.parse(process.env.SR_LAB_SETUP) : null;
const language = process.env.SR_LAB_LANGUAGE ?? null;
const mode = process.env.SR_LAB_MODE ?? null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Play Now does not carry the game mode (it starts single player whatever the configuration says), so a hotseat
// game goes the base game's own way: host a hotseat lobby, take a second human seat, start.
async function startHotseat(lab, seed, age) {
  await lab.cdp.call(({ seed, age }) => {
    Configuration.editGame().reset(GameModeTypes.HOTSEAT);
    if (age) Configuration.editGame().setStartAgeType(age);
    if (seed != null) {
      Configuration.editMap().setMapSeed(seed);
      Configuration.editGame().setGameSeed(seed);
    }
    // A stale lobby size can be refused ("Map size unsupported"); tiny also loads fastest.
    Configuration.editMap().setMapSize("MAPSIZE_TINY");
    GameSetup.setGameParameterValue("MapSize", "MAPSIZE_TINY");
    // Press the first button of any dialog the lobby raises, so the start never waits on a person.
    setInterval(() => {
      for (const box of document.querySelectorAll("screen-dialog-box, .dialog-box, [class*='dialog-box']")) {
        const button = box.querySelector("fxs-button, fxs-hero-button, button");
        button?.dispatchEvent(new CustomEvent("action-activate", { bubbles: true }));
      }
    }, 2000);
    Network.hostMultiplayerGame(ServerType.SERVER_TYPE_HOTSEAT);
    return true;
  }, { seed: seed ?? null, age: age ?? null });
  for (let i = 0; i < 20; i += 1) {
    await sleep(2000);
    const inLobby = await lab.cdp.call(() => Configuration.getGame().isHotseat === true).catch(() => false);
    if (inLobby && i >= 2) break;
  }
  const lobby = await lab.cdp.call(() => {
    const seat = Configuration.editPlayer(1);
    seat.setSlotStatus(SlotStatus.SS_TAKEN);
    seat.setAsMajorCiv();
    if (!Network.isPlayerStartReady(GameContext.localPlayerID)) Network.toggleLocalPlayerStartReady();
    const game = Configuration.getGame();
    return { isHotseat: game.isHotseat, isAnyMultiplayer: game.isAnyMultiplayer, humans: game.humanPlayerCount };
  });
  console.log(`[sr-lab] hotseat lobby: ${JSON.stringify(lobby)}`);
  await sleep(3000);
  await lab.cdp.call(() => {
    Network.startGame();
    return true;
  });
  return lobby;
}

if (mode === "HOTSEAT") {
  Lab.prototype.playNow = function (seed, age) {
    return startHotseat(this, seed, age);
  };
} else if (setup) {
  const playNow = Lab.prototype.playNow;
  Lab.prototype.playNow = async function (seed, age) {
    // Same reset, seeds and age as the lab's own Play Now, then the setup values, then Begin.
    const result = await this.cdp.call(({ seed, age, setup }) => {
      const out = { values: {} };
      Configuration.editGame().reset(GameModeTypes.SINGLEPLAYER);
      if (age) Configuration.editGame().setStartAgeType(age);
      if (seed != null) {
        Configuration.editMap().setMapSeed(seed);
        Configuration.editGame().setGameSeed(seed);
      }
      for (const [key, value] of Object.entries(setup)) {
        try {
          GameSetup.setGameParameterValue(key, value);
        } catch (e) {
          out.values[`${key}:setError`] = String(e);
        }
        out.values[key] = Configuration.getGame().getValue(key);
      }
      engine.call("startGame");
      return out;
    }, { seed: seed ?? null, age: age ?? null, setup });
    console.log(`[sr-lab] before start: ${JSON.stringify(result)}`);
    return result;
  };
  void playNow;
}

if (language) {
  const launch = Lab.prototype.launch;
  Lab.prototype.launch = async function (log) {
    const file = path.join(os.homedir(), "Library/Application Support/Civilization VII/AppOptions.txt");
    const text = fs.readFileSync(file, "utf8").replace(/^;?DisplayLanguage .*$/m, `DisplayLanguage ${language}`);
    fs.writeFileSync(file, text);
    log(`[sr-lab] DisplayLanguage ${language} written to AppOptions.txt`);
    return launch.call(this, log);
  };
}

await import("../../../tools/tower-bench-private/tower-bench-private.mjs");
