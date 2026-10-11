# Compatibility with other mods

Last reviewed 2026-10-11 against Strategic Resources 1.0.0 on Civilization VII 1.5.0.

This file records what the mod touches, which kinds of mod touch the same things, and what a player would see when
both are enabled. Most of it comes from reading code: the 1,251 community mods in the reference corpus, the mods
installed on the development machine, and Tower's own mods. Each finding carries a status line. "Read from code" means
it has not been tried in a game; treat it as a prediction with its reasoning laid out, and the cheapest test that would
settle it is named beside it.

Other authors' mods are described by what they do, not by name. The same mechanism usually appears in several mods,
and a player needs to recognise the kind of mod, not one title.

## What the mod touches

Everything a conflict could come through. If another mod touches none of these, it cannot conflict.

| Surface | What the mod does with it |
| --- | --- |
| Database, frontend (shell scope) | Adds two `Parameters` (`StrategicResourcesUnsupplied`, `StrategicResourcesLateCurve`) in the `GameOptions` group and their `DomainValues`. Changes no base row. |
| Database, gameplay (game scope, LoadOrder 200 to 202) | Adds `Tags` rows (`SR_SUPPLY_`, `SR_RANGED_`, `SR_BOMBARD_`, `SR_CURVE_RANGED_`, `SR_CURVE_BOMBARD_<NAME>`), `TypeTags` rows putting them on base-game and DLC units, `Modifiers` (`SR_` ids) and `GameModifiers` rows. Changes no base row; deletes nothing. |
| Units' combat strength | `EFFECT_ADJUST_UNIT_BASE_COMBAT_STRENGTH` on major players' gated units, per strength type (melee, ranged, bombard), only on units that have that strength. |
| Cities' unit production | `EFFECT_CITY_ADJUST_UNIT_PRODUCTION` with the mod's own tag as `UnitClass`. |
| Players' off-map resources | Gains and drops one `RESOURCE_CRABS` per major player at every turn start (`gainOffMapResource`, `removeOffMapResource`). |
| Unit panel | `Controls.decorate("unit-actions")`: wraps the panel instance's `setupUnitInfo` and adds one element under `.unit-actions__stats_container`. |
| `localStorage` | The Tower Settings Keeper (shared with other Tower mods; one copy runs). The mod stores nothing itself. |
| Globals | None. |

## Summary

| Kind of mod | Result | Status |
| --- | --- | --- |
| Replaces or deletes the game's per-copy combat bonus rows | The penalty and the panel line work as before; the curve past six copies still adds its +1 steps on the base game's classes | Read from code |
| Retags units (new classes, merged lines) | Units keep the mod's tags; a new unit from another mod is never gated | Read from code |
| Adds new units | Not gated unless a later version lists them | Read from code |
| Changes unit production costs or production modifiers | The cut adds to theirs; both apply | Read from code |
| Changes the unit panel by decorating it | Both lines show | Read from code (one such mod examined) |
| Patches the unit panel's prototype | Both run: the wrapper looks the method up at call time | Read from code |
| Replaces the plot tooltip or the unit flag tooltip (Readable Tooltips and others) | No interaction: this mod registers no tooltip | Tested with Readable Tooltips |
| Calls `gainOffMapResource` or reads off-map resources | Sees one Crabs entry during the turn-start call, gone at once | Read from code |
| Rebalances strategic resources' placement or yields | Works; the penalty reads only whether a copy is held | Read from code |
| Changes trade routes (range, capacity, duration, what a route carries) | An imported copy is an ordinary entry in the player's resource list and supplies units like a mined one; such a mod changes which routes exist, not how the penalty reads them | Watched (`p11-import-*`: imports count) |
| AI mods that check `Units.StrategicResource` | Unaffected: the mod sets no `StrategicResource` | Read from code |
| Tower's Demographics, Canals, Emigration, Readable Tooltips and the others | No interaction found; Readable Tooltips and the usual development set were on in every test game | Tested (the 22-mod set) |

## Findings

### 1. Mods that rewrite the game's per-copy combat bonus

Status: read from code, not run. Cheapest test: enable such a mod, start a game, and read the combat preview of a
Spearman with 0, 1 and 8 Iron.

Several mods change `MOD_IRON_INFANTRY_COMBAT_STRENGTH` and its siblings: one deletes them from `GameModifiers` and
gives production per copy instead; others widen the tag list (for example Oil to naval and heavy units) or change the
amount. The penalty and its cancel do not read those rows; they check only "holds at least one copy", so they work the
same. The curve past six copies adds +1 at each threshold on the classes the base game's bonus covers (cavalry and
infantry in Antiquity, and so on). If a mod has removed the base bonus, the curve still adds its steps, so "past six"
then means "past six copies" on top of whatever that mod gives. Players who want only the other mod's curve can turn
Strategic Resources Past Six off at setup.

### 2. Mods that add or retag units

Status: read from code. The gate map is a list of unit types built from the base game and DLC tables on 1.5.0
(`devtools/gate-map/`). A unit added by another mod carries none of the mod's tags, so it is never penalised and the
panel shows nothing for it. A mod that removes a base unit leaves its `TypeTags` row pointing at nothing; the
`TypeTags` foreign key to `Types` would then refuse that row, and a refused row rolls back the whole file, so that
age's units would lose their tags and no unit would be penalised. The symptom is a `Database.log` error on
`sr-<age>-supply.xml`.

### 3. Mods that change the unit panel

Status: read from code; one mod of each kind examined. One kind decorates `unit-actions` and wraps `setupUnitInfo` on
the instance, as this mod does: both wrappers run, in load order, and each draws its own part. Another kind patches the
panel class's prototype after its first instance exists: this mod's wrapper calls the prototype's method at call time,
so the patched method runs. A mod that replaces `unit-actions.js` wholesale would keep `setupUnitInfo` (the panel needs
it) and the line would still show; if it renames the stats container, the line has nowhere to go and is not drawn.

### 4. Mods that change trade routes

Status: watched 2026-10-11 (`p11-import-1`, `p11-import-2`, `p11-import-ai` in `verification-runs.md`), without such
a mod enabled.

A resource imported over a trade route is an ordinary entry in the importer's resource list (`isOffMap` false, the
exporter's plot as its value) and the engine counts it for the mod's requirement the turn the route lands, for the
human and for the AI; the panel line follows. So a mod that widens or narrows trade (range, route capacity, what a
settlement exports) changes which copies a player can reach, and the penalty reads whatever the list holds. A route
ended by war takes its copies with it at once; an import whose source tile loses the resource is gone from the list at
once and the penalty follows one turn later. A mod that ends routes some other way has not been watched.

### 5. Multiplayer

Not a mod conflict, but the same surface: in any multiplayer game (internet, LAN, hotseat) the turn-start re-check is
off and says so once in `UI.log` (tested in hotseat). The penalty and the curve still load, so a lost resource keeps its
bonus until that player gains a resource.
