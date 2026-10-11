// Resolves the mod's own "/tower-strategic-resources/..." imports to this checkout, the way the game serves them
// under the mod id.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const loaderDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(loaderDir, "..");
const MODULE_PREFIX = "/tower-strategic-resources/";

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith(MODULE_PREFIX)) {
    const mapped = path.join(projectRoot, specifier.slice(MODULE_PREFIX.length));
    return { url: pathToFileURL(mapped).href, shortCircuit: true };
  }
  return defaultResolve(specifier, context, defaultResolve);
}
