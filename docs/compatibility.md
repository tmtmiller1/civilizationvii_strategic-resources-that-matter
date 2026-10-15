# Compatibility with other mods

Last reviewed 2026-10-12 against Strategic Resources That Matter 1.0.0 on Civilization VII 1.5.0 (the Gated Units
option, the production pill and the panel cell added that day; the earlier findings below stand).

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
| Database, frontend (shell scope) | Adds three `Parameters` (`StrategicResourcesThatMatterUnsupplied`, `StrategicResourcesThatMatterLateCurve`, `StrategicResourcesThatMatterGate`) in the `GameOptions` group and their `DomainValues`. Changes no base row. |
| Database, gameplay (game scope, LoadOrder 200 to 202) | Adds `Tags` rows (`SR_SUPPLY_`, `SR_RANGED_`, `SR_BOMBARD_`, `SR_CURVE_RANGED_`, `SR_CURVE_BOMBARD_<NAME>`), `TypeTags` rows putting them on base-game and DLC units, `Modifiers` (`SR_` ids) and `GameModifiers` rows. Changes no base row; deletes nothing. |
| Database, gameplay, with Gated Units on (one group per age and value, LoadOrder 202) | Sets `Units.StrategicResource` on every unit of the gate map for that age (an `Update` of a base column that vanilla leaves empty) and writes the six `STRATEGIC_RESOURCE_MINIMUM_FOR_*` `GlobalParameters` rows (`Replace`: production and purchase 1, upgrading 0 or 1, healing 0), which vanilla 1.5.0 does not define. Adds `CivilopediaPageChapterParagraphs` rows in its own `SR_LOCK` chapter. With the option Off, none of this loads. |
| Units' combat strength | `EFFECT_ADJUST_UNIT_BASE_COMBAT_STRENGTH` on major players' gated units, per strength type (melee, ranged, bombard), only on units that have that strength. |
| Cities' unit production | `EFFECT_CITY_ADJUST_UNIT_PRODUCTION` with the mod's own tag as `UnitClass`. |
| Combat preview | One `EFFECT_ADJUST_UNIT_STRENGTH_MODIFIER` of 0 per penalty and per curve step on `COLLECTION_PLAYER_COMBAT` (`SR_PREVIEW_` ids), each with a `Preview` string, so the preview lists the line. They change no strength. |
| Civilopedia (game scope) | Adds a page in Game Concepts (`CivilopediaPages` `SR_STRATEGIC_RESOURCES`, group `COMBAT`, its own layout `SR_CONCEPT` and chapters, two `CivilopediaPageSearchTerms`), one chapter `SR_SUPPLY` on the base `Unit` layout, and `CivilopediaPageChapterParagraphs` rows for that chapter on gated units' pages. Changes no base row. |
| Players' off-map resources | Gains and drops one `RESOURCE_CRABS` per major player at every turn start (`gainOffMapResource`, `removeOffMapResource`). |
| Unit panel | `Controls.decorate("unit-actions")`: wraps the panel instance's `setupUnitInfo` and adds one divider and one cell to the stats row (`.unit-actions__unit-stats-container`, inside `.unit-actions__stats_container`), shaped like the panel's own cells, with the sentence as the cell's `data-tooltip-content`. |
| City unit queries | With Gated Units on, wraps `Game.CityOperations.canStartQuery` and `Game.CityCommands.canStartQuery` (own properties of those objects) for the local player's unit queries only: an entry the engine answers with a bare refusal for a unit the gate locks is rewritten into the shape the chooser keeps (`InsufficientFunds`, one empty reason), so the unit stays listed, greyed. Other players' queries and other query kinds pass through untouched; activating the item still asks the engine, which refuses. |
| Production list items | `ComponentRegistry` entry `ProductionModInfo` (the game's empty slot for mods on each production item): registered again at the priority already there, rendering the previous factory first, then one element of its own, a status pill in the game's pill shape. |
| Production item tooltips | `ComponentRegistry` entry `ProductionTooltip` (the game's hover tooltip on each production item): registered again at the priority already there; for a unit the mod has a line for, the `description` prop handed to the previous factory gains the mod's sentence on a new line, in the game's `[STYLE:text-negative]` while the unit is short. Every other tooltip passes through untouched. Not yet watched in a game: tooltips could not be opened from script (phase 15). |
| Text drawn by `Stylize` | `ComponentRegistry` entry `Stylize`: registered again at the priority already there, passing every prop through; only when `text` is a strategic resource's `Tooltip` key is the text composed with one line added. |
| Notifications | Adds one notification type, `NOTIFICATION_SR_SUPPLY_LOST` (`Types`, `Notifications`, `NotificationSounds` rows, game scope), and an `IconDefinitions` row for it pointing at the game's `ntf_trade_res_lost` image (`UpdateIcons`). Raises it for the local player with `Game.Notifications.send` at a turn start after a loss. Registers no handler: the train's default handler draws it. |
| Tutorial manager | Adds two items, `tower_sr_unsupplied_first` and `tower_sr_locked_first` (the lock, raised on `UnitSelectionChanged` and `CitySelectionChanged`), to the game's `TutorialManager` (`add`, then `process("tower strategic resources items")`) at level 2, raised on `UnitSelectionChanged`. Adds no item bank of the game's and changes none of its items. |
| `localStorage` | The Tower Settings Keeper (shared with other Tower mods; one copy runs). The mod stores two keys itself, `tower-strategic-resources-that-matter.unsuppliedCalloutSeen` and `...lockedCalloutSeen`, once each callout has shown. |
| Globals | None. |

## Summary

| Kind of mod | Result | Status |
| --- | --- | --- |
| Replaces or deletes the game's per-copy combat bonus rows | The penalty and the panel line work as before; the curve past six copies still adds its +1 steps on the base game's classes | Read from code |
| Retags units (new classes, merged lines) | Units keep the mod's tags; a new unit from another mod is never gated | Read from code |
| Adds new units | Not gated unless a later version lists them; a new unit that replaces a gated one (`UnitReplaces`) is not gated either, and a new upgrade target of a gated unit is reached without the resource under Training and upgrade | Read from code |
| Changes unit production costs or production modifiers | The cut adds to theirs; both apply | Read from code |
| Changes the unit panel by decorating it | Both lines show | Read from code (one such mod examined) |
| Patches the unit panel's prototype | Both run: the wrapper looks the method up at call time | Read from code |
| Replaces or wraps the plot tooltip (Readable Tooltips, QD Improved Plot Tooltip, Building Location Advisor) | The resource line shows: each still draws the game's resource row with `Stylize` | Tested with each (see finding 7) |
| Replaces the commerce screen's tabs or tooltips (Better Commerce Screen UI) | The resource line shows in its tooltips: it draws a resource's description with `Stylize` | Tested |
| Replaces or restyles the production chooser (City Hall, Better City UI) | The production line shows where the mod renders `ProductionModInfo`; City Hall: short form beside the name, name intact | Tested with City Hall; Better City UI read from code |
| Registers its own `Stylize` or `ProductionModInfo` | Composes when the other mod calls what was registered before it; a later mod that replaces the entry outright is wrapped again, with Mod Commons on or off, and the line shows once either way; past eight such replacements in one game the line stays off until the next game | Tested with a stand-in registered from script, Mod Commons on and off (finding 7); Better Nested Tooltips read from code |
| Mod Commons | Both lines show once, with Mod Commons on and off; under it the mod learns of a later registration through Mod Commons' `onRegister` | Tested |
| Calls `gainOffMapResource` or reads off-map resources | Sees one Crabs entry during the turn-start call, gone at once | Read from code |
| Rebalances strategic resources' placement or yields | Works; the penalty reads only whether a copy is held | Read from code |
| Changes trade routes (range, capacity, duration, what a route carries) | An imported copy is an ordinary entry in the player's resource list and supplies units like a mined one; such a mod changes which routes exist, not how the penalty reads them | Watched (`p11-import-*`: imports count) |
| Sets `Units.StrategicResource` or the `STRATEGIC_RESOURCE_MINIMUM_FOR_*` parameters (a gameplay overhaul installed on the development machine does both, on 34 units across the ages, with minimums of 2 to 6 copies) | The engine applies the later mod's minimums and every column either mod set; its units are locked by its rule. The mod's lock texts, list rewrite and lock callout step back to the 1.0 lines whenever the minimums are not the one copy the option writes or the columns do not cover the whole gate map, so no text promises a one-copy unlock that does not hold. With Gated Units Off, that mod gates alone, as it does without this mod | Tested (finding 9) |
| AI mods that check `Units.StrategicResource` | See the column with Gated Units on, empty with it Off | Read from code |
| Changes the combat preview panel | The mod's lines are ordinary `PreviewTextModifier` entries; a panel that prints that list prints them | Read from code |
| Adds Civilopedia pages, or chapters to unit pages | Both show; the mod's page and chapter have their own ids, and its paragraph rows touch only its own chapter | Read from code |
| Replaces the notification train's panel or model (Nasuellia Popups, Nasuellia Diplomacy Screens), or adds handlers for its own types (Mav's UI Overhaul) | The lost-supply notification shows and dismisses as before: it is an ordinary `Game.Notifications` entry drawn by the default handler | Tested with the three on (phase 14) and off (the game's own train, `p14-review-plain-train`) |
| Raises its own notifications | Each type is separate; the engine keeps one live notification per type, so another mod's notifications do not hold this one back. A mod that raised this mod's own type would hold back its next one for that turn | Read from code, with the engine fact watched |
| Turns tutorials off, replaces the tutorial manager, or clears tutorial state | The callout follows the player's setting through the game's manager; a mod that replaces the manager's file without `add` and `process` drops the callout and nothing else | Read from code |
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
panel shows nothing for it. The tags go in through `Types` (`sr-<age>-supply.sql`), so a unit that isn't in the
player's game is skipped: one from a DLC they don't own, one a game update removed, or one another mod deleted. The
units that are there get their tags as usual.

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
once and the penalty follows one turn later. A route does not end on its own (one ran 28 turns, past the game's
unused 20-turn duration parameter), so an import stays until a war or a change at the source tile; a plunder by an
enemy unit could not be produced from script and has not been watched.

### 5. Mods that change the combat preview or the Civilopedia

Status: read from code (the corpus searched 2026-10-12); the mod's own lines and pages watched 2026-10-12 with the
usual mod set on (`verification-runs.md`, phase 12).

The preview lines are combat-time modifiers of 0 with a `Preview` string, so they arrive in the engine's
`PreviewTextModifier` list like any tradition's or ability's line. A mod that restyles or replaces
`panel-unit-combat-preview` and still prints that list shows them; one that prints only the strength numbers drops
them, and the numbers are unchanged either way.

In the Civilopedia the mod adds its own page, layout and chapter and changes no base row. The unit chapter is drawn
only on pages that have a paragraph row for it, and the mod writes rows for its own chapter only: a paragraph row in a
chapter replaces that chapter's text on the page, so a mod that wrote rows into `SR_SUPPLY` would replace the mod's
line, and the mod never writes rows into another chapter.

The reference corpus (1260 mods, `other_peoples_mods/`), searched 2026-10-12 through the table and file facts in
`other_peoples_mods_analysis/_corpus-facts.json` and then the named mods' own files: 15 mods write
`CivilopediaPageLayoutChapters` (eleven of them Tower's own, local or on the Workshop), and one puts a chapter on the
`Unit` layout, Better Civpedia (3740231437), whose `QUOTE` chapter (SortIndex 15, text from a content query) sits before
this mod's (25) with its own id, so both draw. Three write `CivilopediaPageChapterParagraphs`, none for a unit page. One
replaces `panel-unit-combat-preview.js`, Nasuellia Unit Flags (3741204633), and it still prints every
`PreviewTextModifier` entry; Handheld UI Fixes (3750261141) decorates the panel to move and toggle it, and leaves the
list alone. None of these is installed on the development machine.

### 6. Multiplayer

Not a mod conflict, but the same surface: in any multiplayer game (internet, LAN, hotseat) the turn-start re-check is
off and says so once in `UI.log` (tested in hotseat). The penalty and the curve still load, so a lost resource keeps its
bonus until that player gains a resource. The lost-supply notification rides on the re-check and is off with it (tested
in hotseat), and the game's tutorial manager drops the callout in any multiplayer game (read from code).

### 7. Mods that change the production list or the resource tooltips

Status: watched 2026-10-12 (`verification-runs.md`, phase 13) with the mods named; the others read from code.

The production line lives in `ProductionModInfo`, the empty `ComponentRegistry` slot the game's production item
renders for mods. A mod that replaces the item and keeps rendering the slot shows the line where it puts the slot.
City Hall (beezany) keeps it, inline after the unit's stats; the mod then uses its short form ("Needs Niter") and the
unit's name keeps its full width (watched in English and German). Najane's Better City UI renders the slot in its own
production item (read from code). A chooser that drops the slot drops the line, and nothing else changes.

The resource line is added in the `Stylize` component when the text it draws is a strategic resource's `Tooltip` key.
Every plot tooltip on the development machine draws the resource row through it: the game's own, QD Improved Plot
Tooltip (which renders the game's `PlotTooltipContent`), Building Location Advisor, and Readable Tooltips (which only
moves the tooltip). Better Commerce Screen UI draws its own resource tooltip with `Stylize` too. All watched.

Two mods registering the same entry: the registry keeps one factory, and the later of equal priority wins. This mod
registers at the priority already there and calls the previous factory, so a later mod that also calls what was there
keeps both. If a later mod replaces the entry outright, this mod wraps again around it. Each re-wrap counts against
a cap of eight per game, which only two mods that keep re-wrapping each other would reach; past it the line stays off
until the next game. Wrapping again around a mod that does call what it replaced puts one copy of this mod's factory
inside another, and the production line is drawn by the outer copy only. Scapeh's Better Nested Tooltips registers
`Stylize` at priority 100 and, inside tooltips, draws the original `text` itself: if it loads after this mod the
re-wrap puts this mod's text back in front of it; if Mod Commons is also on, Mod Commons decides the order (read from
code, not tested: it is not installed on the development machine). Najane's Better City UI is not installed either.

Under Mod Commons the registry is shimmed: `factory()` returns Mod Commons' own renderer, never the registered
function, and never changes. The mod's first build re-wrapped on every read there and drew the production line eight
times; it then registered once, and a later outright replacement took the line off for the rest of the game, since
nothing it watched changed. It now also listens to Mod Commons' `onRegister` and wraps again around a later winner.

Watched 2026-10-12 (`p13-review-mod-commons`, `p13-review-rewrap`), from a reloaded UI each time, with a
`ProductionModInfo` registered from an eval at the slot's priority: with Mod Commons on and with it off, one line per
gated item; after a registration that replaces the slot outright, one line and the newcomer's output; after one that
calls the previous factory, the same. The resource line: one per description in both.

### 8. Mods that change the notification train or the tutorials

Status: tested with the three on the development machine, on and off; the rest read from code. The lost-supply
notification is a `Game.Notifications` entry of the mod's own type. The train draws every type it has no handler for
with the game's default handler (look at the location, dismiss on right-click), so a mod that rewrites the train's panel
or model keeps showing it as long as it keeps that path. Nasuellia Popups replaces `panel-notification-train.js` and
adds its own entries beside the game's; Nasuellia Diplomacy Screens replaces `model-notification-train.js`; Mav's UI
Overhaul registers handlers for a few base types. All three were on in the phase 14 games, and the notification showed,
read its text as its tooltip and dismissed by right-click. With the three off, the game's own train showed it the same
way, in Russian, on two turns running (`p14-review-plain-train`). A train that draws only types it knows would leave it
out; the penalty is unchanged either way.

The callout is an item in the game's tutorial manager. It shows only when the player has tutorials or advisor warnings
on, at most once per profile. A mod that turns tutorials off or replaces the manager with one that ignores added items
leaves the callout out and changes nothing else. One that clears the manager's saved state does not bring it back: the
mod keeps its own "seen" flag.

### 9. Mods that gate units on strategic resources themselves

Status: tested 2026-10-12 with the one such mod installed on the development machine (`verification-runs.md`, phase
15: `p15-probe-column`, `p15-ui-off-overhaul`); the rest read from code.

The engine has one rule for `Units.StrategicResource`: a unit that carries the column is built, bought, upgraded into
or healed only while its owner holds at least the number of copies the matching `STRATEGIC_RESOURCE_MINIMUM_FOR_*`
parameter names, and without that parameter the column blocks for good. A `GlobalParameters` row is one value for
the whole game, so when two mods write it the later load order wins; the columns add up. Homo Ludens (a locally
installed gameplay overhaul, load order 9999 and 10050, after this mod's 202) sets the column on 34 units of its own
choosing (its Carrack needs Hardwood, its Landship Coal) and writes the parameters with higher minimums (Modern: 3 to
train, 6 to buy, 1 to upgrade and to heal). With both on, the engine locks by its numbers and both mods' columns.

This mod reads the loaded data before it explains anything: the lock texts in the production list, the panel line's
tail, the resource line's "Needed to train", the notification's tail and the lock callout show only when the
production and purchase minimums read one copy and every unit of the gate map carries its column. Otherwise they step
back to the 1.0 lines, the list rewrite is off (a unit the other mod locks is absent from the list, as it is under that
mod alone), and that mod's own list annotation explains its rule. Watched with the option Off and Homo Ludens on
(game 3): the Tank and Landship refused by its minimums, the list showing the 1.0 "Braucht Salpeter" lines, the panel
and resource lines in their 1.0 form. With the option on and such a mod on, the engine gates by that mod's minimums
and this mod's option has no effect of its own beyond its columns; the Civilopedia chapter still describes a one-copy
lock. Players who want this mod's gate should turn the other mod off, or the other way round.

