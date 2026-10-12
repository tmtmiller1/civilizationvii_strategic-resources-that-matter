import assert from "node:assert/strict";
import fs from "node:fs";
import { listJs, stripComments } from "./_fs-helpers.mjs";

// modinfo gate.
//   - Every script under ui/ is listed in the game group's <ImportFiles> (the keeper only in <UIScripts>), so the
//     manifest stays a full inventory of what ships, and every same-mod import of a listed module is listed too.
//   - The Tower Settings Keeper is the first <UIScripts> item in both the shell and the game group.
//   - Every script and data item the modinfo names exists on disk.
//   - No runtime import cycles among ui/ modules (static imports only; a cycle is harmless until a new script
//     changes the evaluation order, then the whole panel dies).

const MOD_ID = "tower-strategic-resources-that-matter";
const PREFIX = `/${MOD_ID}/`;
const KEEPER = "ui/settings-keeper.js";
const modinfo = fs.readFileSync("strategic-resources-that-matter.modinfo", "utf8").replace(/<!--[\s\S]*?-->/g, "");

/** @param {string} id */
function group(id) {
  const body = (modinfo.match(new RegExp(`<ActionGroup id="${id}"[\\s\\S]*?</ActionGroup>`)) || [""])[0];
  assert.ok(body, `modinfo has no ActionGroup id="${id}"`);
  return body;
}

/** @param {string} body @param {string} tag */
function itemsIn(body, tag) {
  const section = body.match(new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`));
  return section ? [...section[0].matchAll(/<Item(?:\s+locale="[^"]+")?>([^<]+)<\/Item>/g)].map((m) => m[1]) : [];
}

const game = group("strategic-resources-that-matter-game");
const shell = group("strategic-resources-that-matter-shell");

for (const [name, body] of [["shell", shell], ["game", game]]) {
  assert.equal(itemsIn(body, "UIScripts")[0], KEEPER, `${name} group: the keeper must be the first UIScripts item`);
}

const scripts = listJs("ui").filter((f) => f !== KEEPER);
const imported = new Set(itemsIn(game, "ImportFiles"));
const unlisted = scripts.filter((f) => !imported.has(f));
assert.equal(unlisted.length, 0, `ui script(s) missing from the game group's ImportFiles: ${unlisted.join(", ")}`);

/** @type {Map<string, string[]>} file -> same-mod files it imports statically */
const graph = new Map();
for (const f of listJs("ui")) {
  const code = stripComments(fs.readFileSync(f, "utf8"));
  const deps = [...code.matchAll(/\b(?:import|export)\b[^;'"]*?\bfrom\s*"([^"]+)"|\bimport\s*"([^"]+)"/g)]
    .map((m) => m[1] ?? m[2])
    .filter((s) => s.startsWith(PREFIX))
    .map((s) => s.slice(PREFIX.length));
  graph.set(f, deps);
  for (const dep of deps) assert.ok(imported.has(dep), `${f} imports ${dep}, which ImportFiles does not list`);
}

const named = [...modinfo.matchAll(/<Item(?:\s+locale="[^"]+")?>([^<]+)<\/Item>/g)].map((m) => m[1]);
const ghosts = named.filter((p) => !fs.existsSync(p));
assert.equal(ghosts.length, 0, `modinfo names missing file(s): ${ghosts.join(", ")}`);

// Tarjan's strongly connected components; any component with more than one member is a cycle.
const cycles = [];
{
  let counter = 0;
  const index = new Map();
  const low = new Map();
  const onStack = new Set();
  const stack = [];
  const visit = (/** @type {string} */ v) => {
    index.set(v, counter);
    low.set(v, counter);
    counter += 1;
    stack.push(v);
    onStack.add(v);
    for (const w of graph.get(v) ?? []) {
      if (!index.has(w)) {
        visit(w);
        low.set(v, Math.min(low.get(v), low.get(w)));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v), index.get(w)));
      }
    }
    if (low.get(v) === index.get(v)) {
      const component = [];
      let w;
      do {
        w = stack.pop();
        onStack.delete(w);
        component.push(w);
      } while (w !== v);
      if (component.length > 1) cycles.push(component);
    }
  };
  for (const v of graph.keys()) if (!index.has(v)) visit(v);
}
assert.equal(cycles.length, 0, `import cycle(s): ${cycles.map((c) => c.join(" <-> ")).join("; ")}`);

console.log(`modinfo harness passed (${scripts.length} scripts listed, ${named.length} items present, 0 cycles)`);
