import assert from "node:assert/strict";
import { captureConsole } from "./_engine-stubs.mjs";

// Chaining onto a ComponentRegistry entry: one wrapper around what was there, kept around a later registration, and
// a cap on re-wrapping. The registry and Solid are small stand-ins with the same shape as the game's: the factory
// is a signal, and an effect that read it runs again when it changes.

const log = captureConsole();

function fakeSolid() {
  /** @type {(() => void) | null} */
  let running = null;
  /** @type {Set<() => void>} */
  const pending = new Set();
  const flush = () => {
    while (pending.size && !running) {
      const [next] = pending;
      pending.delete(next);
      next();
    }
  };
  return {
    createRoot: (/** @type {() => void} */ fn) => fn(),
    createEffect(/** @type {() => void} */ fn) {
      const run = () => {
        running = run;
        try {
          fn();
        } finally {
          running = null;
        }
        flush();
      };
      run();
    },
    /** @param {Set<() => void>} readers */
    track(readers) {
      if (running) readers.add(running);
    },
    // A change re-runs its readers after the effect that made it, as Solid queues them.
    /** @param {Set<() => void>} readers */
    notify(readers) {
      for (const reader of readers) pending.add(reader);
      flush();
    }
  };
}

function fakeRegistry(solid) {
  const entries = new Map();
  return {
    get: (name) => entries.get(name),
    register({ name, createInstance, overridePriority = 0 }) {
      let entry = entries.get(name);
      if (!entry) {
        const readers = new Set();
        let factory = createInstance;
        entry = {
          overridePriority,
          factory: () => {
            solid.track(readers);
            return factory;
          },
          setFactory: (make) => {
            factory = make();
            solid.notify(readers);
          }
        };
        entries.set(name, entry);
      } else if (entry.overridePriority <= overridePriority) {
        entry.overridePriority = overridePriority;
        entry.setFactory(() => createInstance);
      }
      return entry;
    }
  };
}

try {
  const { keepWrapped, wrapOnce } = await import("/tower-strategic-resources/ui/sr-registry.js");
  const tag = (/** @type {string} */ label) => (/** @type {Function} */ previous) => (/** @type {*} */ props) =>
    `${label}(${previous(props)})`;

  // wrapOnce
  {
    const solid = fakeSolid();
    const registry = fakeRegistry(solid);
    assert.equal(wrapOnce(registry, "Slot", tag("sr")), false, "nothing registered, nothing wrapped");
    registry.register({ name: "Slot", createInstance: () => "game", overridePriority: 0 });
    assert.equal(wrapOnce(registry, "Slot", tag("sr")), true);
    assert.equal(registry.get("Slot").factory()({}), "sr(game)", "the game's factory runs inside");
    assert.equal(wrapOnce(registry, "Slot", tag("sr")), false, "already ours: not wrapped twice");
    registry.register({ name: "High", createInstance: () => "high", overridePriority: 100 });
    assert.equal(wrapOnce(registry, "High", tag("sr")), true);
    assert.equal(registry.get("High").factory()({}), "sr(high)", "registered at the priority already there");
    assert.equal(registry.get("High").overridePriority, 100);
    const odd = { get: () => ({ factory: () => "not a function" }), register: () => assert.fail("no register") };
    assert.equal(wrapOnce(odd, "Odd", tag("sr")), false);
  }

  // keepWrapped: waits for the registration, then keeps the wrapper outermost-but-one around a later mod's.
  {
    const solid = fakeSolid();
    const registry = fakeRegistry(solid);
    setTimeout(() => registry.register({ name: "Slot", createInstance: () => "game" }), 5);
    assert.equal(await keepWrapped(registry, solid, "Slot", tag("sr"), { waitMs: 2, waitTries: 50 }), true);
    assert.equal(registry.get("Slot").factory()({}), "sr(game)");
    // Another mod registers its own factory at the same priority, wrapping what it found.
    const theirs = tag("other")(registry.get("Slot").factory());
    registry.register({ name: "Slot", createInstance: theirs, overridePriority: 0 });
    assert.equal(registry.get("Slot").factory()({}), "sr(other(sr(game)))", "wrapped again around the newcomer");
    // A mod that replaces outright (no chaining) is wrapped too.
    registry.register({ name: "Slot", createInstance: () => "replaced", overridePriority: 0 });
    assert.equal(registry.get("Slot").factory()({}), "sr(replaced)");
  }

  // The cap: against a mod that re-wraps every change, eight wraps at most, the first included.
  {
    const solid = fakeSolid();
    const registry = fakeRegistry(solid);
    registry.register({ name: "Slot", createInstance: () => "game" });
    await keepWrapped(registry, solid, "Slot", tag("sr"), { waitMs: 1, waitTries: 1 });
    let theirs = 0;
    solid.createRoot(() => solid.createEffect(() => {
      const current = registry.get("Slot").factory();
      if (theirs >= 20 || current.isTheirs) return;
      theirs += 1;
      const wrapped = tag("x")(current);
      wrapped.isTheirs = true;
      registry.register({ name: "Slot", createInstance: wrapped, overridePriority: 0 });
    }));
    const depth = (registry.get("Slot").factory()({}).match(/sr\(/g) ?? []).length;
    assert.equal(depth, 8, "eight wraps, then it stops");
  }

  // A host that shims the slot (Mod Commons): factory() returns its own renderer after every registration, which
  // renders the latest winner and gives a wrapper the one before. One wrap, not eight.
  {
    const solid = fakeSolid();
    const readers = new Set();
    const winners = [() => "game"];
    let shimmed = false;
    const capture = (props) => winners.at(-2)?.(props) ?? "none";
    const entry = {
      overridePriority: 0,
      factory: () => {
        solid.track(readers);
        return shimmed ? capture : winners[0];
      },
      setFactory: () => solid.notify(readers)
    };
    const host = {
      get: () => entry,
      register({ createInstance }) {
        winners.push(createInstance);
        shimmed = true;
        entry.setFactory();
        return entry;
      }
    };
    assert.equal(await keepWrapped(host, solid, "Slot", tag("sr"), { waitMs: 1, waitTries: 1 }), true);
    assert.equal(winners.length, 2, "registered once");
    assert.equal(winners.at(-1)({}), "sr(game)");
  }

  // Never registered: false and one log line. A wrap that throws is logged and does not escape.
  {
    const solid = fakeSolid();
    const registry = fakeRegistry(solid);
    assert.equal(await keepWrapped(registry, solid, "Missing", tag("sr"), { waitMs: 1, waitTries: 3 }), false);
    assert.ok(log.lines.some(([, text]) => text.includes("Missing was never registered")));
    registry.register({ name: "Slot", createInstance: () => "game" });
    const boom = () => {
      throw new Error("bad wrap");
    };
    assert.equal(await keepWrapped(registry, solid, "Slot", boom, { waitMs: 1, waitTries: 1 }), true);
    assert.equal(registry.get("Slot").factory()({}), "game", "the game's factory is left in place");
    assert.ok(log.lines.some(([, text]) => text.includes("could not wrap Slot")));
  }
} finally {
  log.restore();
}

console.log("sr-registry tests passed");
