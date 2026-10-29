// sr-ai-analyze.mjs - the AI players' totals per reading turn, one row per game (verification-runs.md Phase 19):
//   node devtools/soak/sr-ai-analyze.mjs devtools/soak/readings-2026-10-28/*.jsonl
//   TURNS=31,61,91 node devtools/soak/sr-ai-analyze.mjs ...   only those turns
// Reads the lines sr-ai-sample.js writes (a drive.log or a .jsonl of them). The local seat is left out.
import fs from "node:fs";

const rows = [];
for (const f of process.argv.slice(2)) {
  const arm = f.replace(/^.*\//, "").replace(/\.(out|jsonl|drive\.log)$/, "");
  const seen = new Set();
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    const i = line.indexOf('{"t":');
    if (i < 0) continue;
    let r;
    try { r = JSON.parse(line.slice(i)); } catch { continue; }
    if (seen.has(r.t)) continue;
    seen.add(r.t);
    const ais = r.p.filter((p) => !p.human);
    const sum = (k) => ais.reduce((a, p) => a + (p[k] || 0), 0);
    const kinds = (p) => new Set(Object.keys(p.held).map((k) => k.replace("*", "")));
    const withRes = (res) => ais.filter((p) => kinds(p).has(res)).length;
    const imported = (p) => Object.keys(p.held).filter((k) => k.endsWith("*")).reduce((b, k) => b + p.held[k], 0);
    rows.push({
      arm, t: r.t, ais: ais.length, cities: sum("cities"), pop: sum("pop"), sci: sum("sci"), cul: sum("cul"),
      prod: sum("prod"), mil: sum("mil"), melee: sum("melee"), drawn: sum("drawn"), short: sum("short"),
      iron: withRes("IRON"), horses: withRes("HORSES"), ivory: withRes("IVORY"), niter: withRes("NITER"),
      hardwood: `${withRes("HARDWOOD")}/${withRes("PITCH")}`, types: ais.reduce((a, p) => a + kinds(p).size, 0),
      imports: ais.reduce((a, p) => a + imported(p), 0),
      free: Object.entries(r.free).map(([k, v]) => `${k}${v}`).join(" ")
    });
  }
}
const cols = ["arm", "t", "ais", "cities", "pop", "sci", "cul", "prod", "mil", "melee", "drawn", "short", "iron",
  "horses", "ivory", "niter", "hardwood", "types", "imports", "free"];
const want = new Set((process.env.TURNS || "").split(",").filter(Boolean).map(Number));
console.log(cols.join("\t"));
for (const r of rows) if (!want.size || want.has(r.t)) console.log(cols.map((c) => r[c]).join("\t"));
