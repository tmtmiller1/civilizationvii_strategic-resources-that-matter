// sr-ai-sample.js - one reading per major player for `lab drive --sample` (AI soak, DESIGN.md 7k): cities,
// population, yields, the mod's resources held (an import marked *), military units, units that draw on a resource
// and how many of them are short of it, the summed melee strength, and the strategic resource tiles inside the
// player's borders (what it could hold). Pitch counts for Hardwood, as the mod reads it.
(() => {
  const S = ["HORSES", "IRON", "IVORY", "NITER", "HARDWOOD", "PITCH", "OIL", "COAL", "RUBBER"];
  const T = (f, d) => { try { const v = f(); return v ?? d; } catch (e) { return d; } };
  const supply = {};
  for (const t of GameInfo.TypeTags) {
    const m = /^SR_SUPPLY_(.*)$/.exec(t.Tag);
    if (m) (supply[t.Type] = supply[t.Type] || []).push(m[1]);
  }
  const resIdx = {};
  for (const r of S) { const row = GameInfo.Resources.lookup("RESOURCE_" + r); if (row) resIdx[row.$index] = r; }
  const tiles = {};
  const w = GameplayMap.getGridWidth(), h = GameplayMap.getGridHeight();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const r = resIdx[GameplayMap.getResourceType(x, y)];
    if (!r) continue;
    const o = GameplayMap.getOwner(x, y);
    const k = o >= 0 ? o : "free";
    (tiles[k] = tiles[k] || {})[r] = (tiles[k][r] || 0) + 1;
  }
  const out = { t: Game.turn, age: T(() => GameInfo.Ages.lookup(Game.age).AgeType, "?"), free: tiles.free || {}, p: [] };
  for (const pl of Players.getAlive()) {
    if (!pl.isMajor) continue;
    const pid = pl.id;
    const cities = T(() => pl.Cities.getCities(), []) || [];
    let pop = 0; for (const c of cities) pop += T(() => c.population, 0);
    const held = {};
    for (const e of T(() => pl.Resources.getResources(), []) || []) {
      if (e.isOffMap) continue;
      const rt = T(() => GameInfo.Resources.lookup(e.uniqueResource.resource).ResourceType.replace("RESOURCE_", ""), "?");
      if (!S.includes(rt)) continue;
      const loc = T(() => e.uniqueResource.location, null) || T(() => e.location, null);
      const owner = loc ? T(() => GameplayMap.getOwner(loc.x, loc.y), -1) : -1;
      const k = owner >= 0 && owner !== pid ? rt + "*" : rt;
      held[k] = (held[k] || 0) + 1;
    }
    const has = (r) => Object.keys(held).some((k) => k.replace("*", "") === r || (r === "HARDWOOD" && k.replace("*", "") === "PITCH"));
    let mil = 0, drawn = 0, short = 0, melee = 0;
    const kinds = {};
    for (const u of T(() => pl.Units.getUnits(), []) || []) {
      const c = u.Combat;
      const s = c ? T(() => c.getMeleeStrength(false), 0) : 0;
      if (!c || !(s > 0)) continue;
      const info = GameInfo.Units.lookup(u.type);
      if (!info || info.CoreClass === "CORE_CLASS_SUPPORT") continue;
      mil++; melee += s;
      const name = info.UnitType.replace("UNIT_", "");
      kinds[name] = (kinds[name] || 0) + 1;
      const needs = supply[info.UnitType];
      if (needs) { drawn++; if (needs.some((r) => !has(r))) short++; }
    }
    const y = (k) => Math.round(T(() => pl.Stats.getNetYield(YieldTypes[k]), 0));
    out.p.push({ pid, civ: T(() => GameInfo.Civilizations.lookup(pl.civilizationType).CivilizationType.replace("CIVILIZATION_", ""), "?"),
      human: pl.isHuman, cities: cities.length, pop, sci: y("YIELD_SCIENCE"), cul: y("YIELD_CULTURE"), gold: y("YIELD_GOLD"),
      prod: y("YIELD_PRODUCTION"), held, inBorders: tiles[pid] || {}, mil, drawn, short, melee, kinds });
  }
  return JSON.stringify(out);
})()
