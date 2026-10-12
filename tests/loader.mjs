// Resolves the mod's own "/tower-strategic-resources-that-matter/..." imports to this checkout, the way the game
// serves them under the mod id, and the game modules the scripts import to the stand-ins in tests/stubs/.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const loaderDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(loaderDir, "..");
const MODULE_PREFIX = "/tower-strategic-resources-that-matter/";
const GAME_STUBS = new Map([["/base-standard/ui/tutorial/tutorial-manager.js", "tests/stubs/tutorial-manager.mjs"]]);

export async function resolve(specifier, context, defaultResolve) {
  const stub = GAME_STUBS.get(specifier);
  if (stub) return { url: pathToFileURL(path.join(projectRoot, stub)).href, shortCircuit: true };
  if (specifier.startsWith(MODULE_PREFIX)) {
    // A query string (a test loading a fresh instance of a module) is kept on the URL, not the path.
    const [file, query] = specifier.slice(MODULE_PREFIX.length).split("?");
    const url = pathToFileURL(path.join(projectRoot, file)).href;
    return { url: query ? `${url}?${query}` : url, shortCircuit: true };
  }
  return defaultResolve(specifier, context, defaultResolve);
}
