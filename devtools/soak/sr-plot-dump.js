// Every resource tile: [x, y, type, owner, improvement] as one JSON line.
(() => {
  const out = [];
  const w = GameplayMap.getGridWidth(), h = GameplayMap.getGridHeight();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const r = GameplayMap.getResourceType(x, y);
    if (r < 0) continue;
    const t = GameInfo.Resources.lookup(r)?.ResourceType?.replace("RESOURCE_", "") ?? String(r);
    let imp = -1; try { imp = GameplayMap.getImprovementType?.(x, y) ?? -1; } catch (e) {}
    out.push([x, y, t, GameplayMap.getOwner(x, y), imp]);
  }
  return JSON.stringify({ t: Game.turn, age: GameInfo.Ages.lookup(Game.age).AgeType, plots: out });
})()
