// Registers tests/loader.mjs so /tower-strategic-resources-that-matter/... imports resolve to this checkout.
// Use with `node --import ./tests/register-loader.mjs <file>`.
import { register } from "node:module";

register("./loader.mjs", import.meta.url);
