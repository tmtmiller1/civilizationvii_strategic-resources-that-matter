// node plot-compare.mjs <pre.json> <post.json> : what an age change did to each resource tile.
import fs from "node:fs";
const read = (f) => {
  const text = fs.readFileSync(f, "utf8");
  return JSON.parse(text.slice(text.indexOf("{")));
};
const pre = read(process.argv[2]), post = read(process.argv[3]);
const key = (p) => `${p[0]},${p[1]}`;
const before = new Map(pre.plots.map((p) => [key(p), p]));
const after = new Map(post.plots.map((p) => [key(p), p]));
const stats = new Map();
const s = (t) => {
  if (!stats.has(t)) stats.set(t, { pre: 0, post: 0, kept: 0, removed: 0, changedTo: {}, changedFrom: {}, fresh: 0, ownedFresh: 0 });
  return stats.get(t);
};
for (const [k, p] of before) {
  const t = p[2];
  s(t).pre++;
  const q = after.get(k);
  if (!q) s(t).removed++;
  else if (q[2] === t) s(t).kept++;
  else { s(t).changedTo[q[2]] = (s(t).changedTo[q[2]] || 0) + 1; s(q[2]).changedFrom[t] = (s(q[2]).changedFrom[t] || 0) + 1; }
}
for (const [k, q] of after) {
  s(q[2]).post++;
  if (!before.has(k)) { s(q[2]).fresh++; if (q[3] >= 0) s(q[2]).ownedFresh++; }
}
console.log(`${pre.age} turn ${pre.t} (${pre.plots.length} tiles) -> ${post.age} turn ${post.t} (${post.plots.length} tiles)`);
console.log("type            pre  post  kept  removed  changed-to            changed-from          new(owned)");
const fmt = (o) => Object.entries(o).map(([k, v]) => `${k}${v}`).join(",") || "-";
for (const [t, v] of [...stats].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`${t.padEnd(14)} ${String(v.pre).padStart(4)} ${String(v.post).padStart(5)} ${String(v.kept).padStart(5)} ${String(v.removed).padStart(8)}  ${fmt(v.changedTo).padEnd(21)} ${fmt(v.changedFrom).padEnd(21)} ${v.fresh}(${v.ownedFresh})`);
}
