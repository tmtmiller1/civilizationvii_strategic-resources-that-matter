import assert from "node:assert/strict";
import { captureConsole, snapshotGlobals } from "./_engine-stubs.mjs";

// The game-scope entry script: what it does at load, at each turn start, and in a multiplayer game. Each scenario
// imports a fresh copy of the module (a query string makes a new module instance) with its own stand-in engine.

const restoreGlobals = snapshotGlobals(["engine", "Players", "Configuration", "GameInfo", "Game"]);
const log = captureConsole();
let instance = 0;

function makeEngine() {
  const handlers = new Map();
  let ready;
  return {
    handlers,
    whenReady: new Promise((resolve) => {
      ready = resolve;
    }),
    ready: () => ready(),
    on: (name, fn) => handlers.set(name, fn)
  };
}

function makePlayer(id, calls) {
  return {
    id,
    isMajor: true,
    Resources: {
      gainOffMapResource: (hash) => {
        calls.push([id, "gain", hash]);
        return 0;
      },
      removeOffMapResource: (value) => calls.push([id, "remove", value])
    }
  };
}

async function load({ multiplayer = false, crabs = true, players } = {}) {
  const engine = makeEngine();
  globalThis.engine = engine;
  globalThis.Players = { getAlive: () => players };
  globalThis.Configuration = { getGame: () => ({ isAnyMultiplayer: multiplayer }) };
  globalThis.GameInfo = { Resources: { lookup: (t) => (crabs && t === "RESOURCE_CRABS" ? { $hash: 77 } : null) } };
  Object.defineProperty(globalThis, "Game", { configurable: true, writable: true, value: { turn: 5 } });
  instance += 1;
  await import(`/tower-strategic-resources/ui/sr-recheck.js?case=${instance}`);
  engine.ready();
  await new Promise((resolve) => setTimeout(resolve, 0));
  return engine;
}

try {
  // Single player: forces every major once at load, then again at each turn start.
  const calls = [];
  const engine = await load({ players: [makePlayer(0, calls), makePlayer(3, calls), { id: 9, isMajor: false }] });
  assert.deepEqual(calls, [[0, "gain", 77], [0, "remove", 0], [3, "gain", 77], [3, "remove", 0]]);
  assert.ok(engine.handlers.has("TurnBegin"));
  calls.length = 0;
  engine.handlers.get("TurnBegin")();
  assert.equal(calls.length, 4);
  assert.ok(log.lines.some(([, text]) => text.includes("loss re-check on")));

  // A throwing player list is contained: the handler logs and returns.
  globalThis.Players = { getAlive: () => { throw new Error("gone"); } };
  engine.handlers.get("TurnBegin")();
  // A player whose call throws is named in the log; the others still run.
  const mixed = [];
  globalThis.Players = {
    getAlive: () => [{ id: 1, isMajor: true, Resources: { gainOffMapResource: () => { throw new Error("x"); } } },
      makePlayer(2, mixed)]
  };
  engine.handlers.get("TurnBegin")();
  assert.equal(mixed.length, 2);
  assert.ok(log.lines.some(([, text]) => text.includes("failed for players 1")));
  // Game.turn unreadable still logs.
  Object.defineProperty(globalThis, "Game", { configurable: true, get: () => { throw new Error("no game"); } });
  engine.handlers.get("TurnBegin")();
  Object.defineProperty(globalThis, "Game", { configurable: true, writable: true, value: { turn: 6 } });

  // Multiplayer: nothing is called, no handler is registered, one line in the log.
  log.lines.length = 0;
  const mpCalls = [];
  const mp = await load({ multiplayer: true, players: [makePlayer(0, mpCalls)] });
  assert.deepEqual(mpCalls, []);
  assert.equal(mp.handlers.size, 0);
  assert.equal(log.lines.filter(([, text]) => text.includes("multiplayer game")).length, 1);

  // The re-check resource missing from the game: off, and said so.
  log.lines.length = 0;
  const noCrabs = await load({ crabs: false, players: [makePlayer(0, [])] });
  assert.equal(noCrabs.handlers.size, 0);
  assert.ok(log.lines.some(([, text]) => text.includes("RESOURCE_CRABS is not in this game")));

  // A failure inside start() is caught and logged.
  log.lines.length = 0;
  globalThis.engine = makeEngine();
  globalThis.Configuration = { getGame: () => ({ isAnyMultiplayer: false }) };
  globalThis.GameInfo = { Resources: { lookup: () => ({ $hash: 77 }) } };
  globalThis.Players = { getAlive: () => [] };
  const broken = globalThis.engine;
  broken.on = () => { throw new Error("no events"); };
  instance += 1;
  await import(`/tower-strategic-resources/ui/sr-recheck.js?case=${instance}`);
  broken.ready();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.ok(log.lines.some(([level, text]) => level === "error" && text.includes("could not start")));

  // Without an engine the module does nothing on import.
  delete globalThis.engine;
  instance += 1;
  await import(`/tower-strategic-resources/ui/sr-recheck.js?case=${instance}`);
} finally {
  log.restore();
  restoreGlobals();
}

console.log("sr-recheck tests passed");
