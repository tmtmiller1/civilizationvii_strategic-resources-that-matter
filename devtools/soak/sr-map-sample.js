// sr-map-sample.js - every resource on the map by type, owned tiles included, for `lab drive 1 --sample` (verification-runs.md Phase 20).
(() => {
  const counts = {};
  const w = GameplayMap.getGridWidth(), h = GameplayMap.getGridHeight();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const r = GameplayMap.getResourceType(x, y);
    if (r < 0) continue;
    const t = GameInfo.Resources.lookup(r)?.ResourceType?.replace("RESOURCE_", "") ?? String(r);
    counts[t] = (counts[t] || 0) + 1;
  }
  const civs = [];
  for (const pl of Players.getAlive()) if (pl.isMajor) civs.push(GameInfo.Civilizations.lookup(pl.civilizationType)?.CivilizationType?.replace("CIVILIZATION_", ""));
  return JSON.stringify({ t: Game.turn, map: true, types: Object.keys(counts).length, counts, civs });
})()
