// Chains a wrapper onto a component the game registers in its ui-next ComponentRegistry, keeping whatever was there
// before. The registry swaps the factory behind one shared wrapper, and every place that renders the component looks
// it up at render time, so a registration here reaches the game's own screens and other mods' copies of them alike.
//
// The registration is at the priority already there, not higher: the registry lets an equal priority replace the
// current factory, so a mod that registers the same component later still takes effect. The factory is a signal;
// when such a mod replaces ours, the wrapper is applied again around theirs, up to MAX_WRAPS times so two mods that
// both re-wrap cannot pass it back and forth for ever. Under a host that shims the registry and layers registrations
// itself (Mod Commons), the slot reads the same after every registration, so a later winner is seen through the
// host's onRegister instead, and the wrapper is applied again around it the same way. A wrapper that can end up
// nested inside a copy of itself (around a mod that calls the factory it replaced) must draw its addition once.

import { log } from "/tower-strategic-resources/ui/sr-log.js";

export const WRAPPED = "__strategicResourcesWrapped";
const MAX_WRAPS = 8;
const WAIT_MS = 500;
const WAIT_TRIES = 120;

/**
 * @typedef {object} Registry
 * @property {(name: string) => any} get
 * @property {(options: { name: string, createInstance: Function, overridePriority?: number }) => any} register
 */

/**
 * Registers `wrap(current)` under `name` unless the current factory is already ours.
 * @param {Registry} registry
 * @param {string} name
 * @param {(previous: Function) => Function} wrap
 * @returns {boolean} whether a wrapper was registered
 */
export function wrapOnce(registry, name, wrap) {
  const registered = registry.get(name);
  if (!registered || typeof registered.factory !== "function") return false;
  const current = registered.factory();
  if (typeof current !== "function" || current[WRAPPED]) return false;
  const wrapped = wrap(current);
  /** @type {*} */ (wrapped)[WRAPPED] = true;
  registry.register({ name, createInstance: wrapped, overridePriority: registered.overridePriority ?? 0 });
  return true;
}

/**
 * @typedef {(surface: string, target: string, entry: { payload?: any, won?: boolean | null }) => void} OnRecord
 * @typedef {object} Host Mod Commons' window.ModCommons: every registration it records, as it records it
 * @property {(fn: OnRecord) => unknown} onRegister
 */

/** @returns {Host | null} */
function findHost() {
  const host = /** @type {*} */ (globalThis).ModCommons;
  return host && typeof host.onRegister === "function" ? host : null;
}

/**
 * Under the host the slot never changes, so the registry's signal says nothing; a later winner that is not ours
 * is wrapped from the host's record of it, once the host has finished recording it.
 * @param {Host | null} host @param {string} name @param {() => void} rewrap
 */
function watchHost(host, name, rewrap) {
  host?.onRegister((surface, target, entry) => {
    if (surface !== "registry" || target !== name || entry?.won === false) return;
    if (typeof entry?.payload !== "function" || entry.payload[WRAPPED]) return;
    Promise.resolve().then(rewrap);
  });
}

/**
 * Waits for `name` to be registered, wraps it, and wraps again whenever another registration replaces ours.
 * @param {Registry} registry
 * @param {{ createRoot: Function, createEffect: Function }} solid
 * @param {string} name
 * @param {(previous: Function) => Function} wrap
 * @param {{ waitMs?: number, waitTries?: number, host?: Host | null }} [options]
 * @returns {Promise<boolean>} false when the component never appeared
 */
export async function keepWrapped(registry, solid, name, wrap,
  { waitMs = WAIT_MS, waitTries = WAIT_TRIES, host = findHost() } = {}) {
  let registered = null;
  for (let i = 0; i < waitTries && !registered; i += 1) {
    const found = registry.get(name);
    if (found && typeof found.factory === "function") registered = found;
    else await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  if (!registered) {
    log.warn(`${name} was never registered; its line will not show`);
    return false;
  }
  let wraps = 0;
  // What the slot gave back after our last registration. A host that shims the registry (Mod Commons) hands back
  // its own renderer from then on, never our wrapper, so "is it ours" is judged by this, not by the mark alone.
  /** @type {unknown} */
  let settled;
  const rewrap = () => {
    if (wraps >= MAX_WRAPS) return;
    wraps += 1;
    try {
      if (wrapOnce(registry, name, wrap)) settled = registered.factory();
      else wraps -= 1;
    } catch (e) {
      log.warn(`could not wrap ${name}:`, e);
    }
  };
  solid.createRoot(() => {
    solid.createEffect(() => {
      if (registered.factory() !== settled) rewrap();
    });
  });
  watchHost(host, name, rewrap);
  return true;
}
