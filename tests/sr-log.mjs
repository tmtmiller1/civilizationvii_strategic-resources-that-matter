import assert from "node:assert/strict";
import fs from "node:fs";
import { captureConsole } from "./_engine-stubs.mjs";

// The logger: every line tagged, nothing through console.log (it never reaches UI.log), and the DBG switch in the
// exact form release.sh rewrites.

const log = captureConsole();
let logged = 0;
const originalLog = console.log;
console.log = () => {
  logged += 1;
};
try {
  const { log: srLog } = await import("/tower-strategic-resources-that-matter/ui/sr-log.js");
  srLog.debug("d", 1);
  srLog.info("i");
  srLog.warn("w");
  srLog.error("e");
  assert.deepEqual(log.lines, [
    ["warn", "[StrategicResourcesThatMatter] d 1"],
    ["warn", "[StrategicResourcesThatMatter] i"],
    ["warn", "[StrategicResourcesThatMatter] w"],
    ["error", "[StrategicResourcesThatMatter] e"]
  ]);
  assert.equal(logged, 0);
} finally {
  console.log = originalLog;
  log.restore();
}

const source = fs.readFileSync("ui/sr-log.js", "utf8");
assert.match(source, /^const DBG = true;$/m, "release.sh rewrites exactly `const DBG = true;`");
for (const file of fs.readdirSync("ui").filter((f) => f.startsWith("sr-"))) {
  assert.ok(!/console\.log\(/.test(fs.readFileSync(`ui/${file}`, "utf8")), `${file} calls console.log`);
}
console.log("sr-log tests passed");
