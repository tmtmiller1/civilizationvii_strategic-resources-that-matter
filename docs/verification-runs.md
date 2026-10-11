# How the mod was checked, and the runs behind each step

Every step below was checked on Civilization VII 1.5.0 (macOS) in Tower Bench lab games: seeded Play Now games
started over the debugger, with the owner's saves, settings and mod registry backed up first and restored after.
The other enabled mods (22 of them, the usual set on the development machine) stayed on unless a run says otherwise.
The reader-facing account is the [README](../README.md); the design and the probes that came before the build are in
`mod_ideas_tested/strategic_resources/DESIGN.md`. This file is the evidence.

Each item is marked **watched** (seen in a running game, with the run named) or **not watched** (reasoned from code
or data, or covered only by the Node tests).

## Phase 1: scaffold

| Run | What | Observation | Status |
| --- | --- | --- | --- |
| `p1-load` | Antiquity, seed 4242, the mod holding only the Settings Keeper and its text | `Modding.log` lists `tower-strategic-resources` with `strategic-resources-game` applied; `Database.log` passes validation with no error of the mod's; the page served `fs://game/tower-strategic-resources/ui/settings-keeper.js`; `Locale.compose("LOC_SR_MOD_NAME")` read "Strategic Resources". The keeper copy of another mod ran first, as the embed README says it should | watched |
| `p1-load` | Vanilla's per-copy bonus past six copies, with no data of this mod loaded | Player 0's Warrior attacking a Warrior of player 5 (war declared): the combat preview read "+1 Iron Resource" at 1 copy, +2 at 2, +5 at 5, +6 at 6, +6 at 8 and +6 at 10. `EFFECT_UNIT_ADJUST_COMBAT_STRENGTH_PER_RESOURCE` stops at six copies | watched |
| `p1-load` | The re-check resource leaves nothing behind | `gainOffMapResource(RESOURCE_CRABS)` returned 0 and added one entry to `getResources()` (5 to 6); `removeOffMapResource(0)` took it back to 5. `getOffMapResources()` empty afterwards; the player's notification count unchanged (8 before, 8 after) | watched |

`npm run verify`: tsc, eslint and 5 test files clean.

## Phase 2: gate map

The unit lists per age come from `scripts/gate-map.mjs` (rules) applied to the game's own `Units`, `TypeTags` and
`UnitReplaces`, dumped from the live compiled database of each age's lab game by `scripts/dump-gate-tables.mjs` into
`devtools/gate-map/<age>.json`. `tests/data.mjs` asserts the resulting lists (DESIGN.md section 4) and that every
listed unit exists in that age's dump and, for the age last played, in `Debug/gameplay-copy.sqlite`.

| Run | What | Observation | Status |
| --- | --- | --- | --- |
| `p3-antiquity` | Antiquity dump, mod loaded | 53 military units; 22 gated (10 Horses, 12 Iron); `SR_SUPPLY_HORSES` on 10 units and `SR_SUPPLY_IRON` on 12 in the live `TypeTags` | watched |
| `p3-exploration` | Exploration dump, mod loaded | 81 military units; 45 gated (15 Horses, 14 Iron, 16 Niter); data test against the live database: all 45 present | watched |
| `p3-modern` | Modern dump, mod loaded | 83 military units; 43 gated (11 Niter, 16 Oil, 6 Coal, 10 Rubber); data test against the live database: all 43 present | watched |

## Phase 3: unsupplied penalty

Combat read with `unit.Combat.getMeleeStrength(false)`, `rangedStrength` and `bombardStrength`, and with the combat
preview (`Game.Combat.simulateAttackAsync`, `SimulateCombatResult`); production with `BuildQueue.getTurnsLeft` on
the capital's queue. Resources were placed with `WorldBuilder.MapPlots.setResource` and made real by the city's
own expansion onto the tile (a new mine).

| Run | What | Observation | Status |
| --- | --- | --- | --- |
| `p3-antiquity` (Standard, curve on) | No Iron, no Horses | Spearman 22 (25 - 3), Chariot 27 (30 - 3), Warrior 20 (not gated); combat preview of the Spearman read strength 25 once Iron was held | watched |
| `p3-antiquity` | Production without the resource | City at 5 Production: Spearman (60) 18 turns, Chariot (80) 24 turns, against 12 and 16 at the full rate: a 33% cut through the `UnitClass` argument with the mod's own tag | watched |
| `p3-antiquity` | Iron gained by a new mine | Spearman 22 to 25 at once, no roll; Spearman production back to the full rate at once (9 turns at 7 Production) while the Chariot stayed cut (18 turns) | watched |
| `p3-exploration` (Light, curve off) | No Niter, Iron or Horses | Catapult 23/18/38 (25/20/40 - 2 on melee, ranged and bombard: `Type ALL`), Carrack 33/38/33, Man-at-Arms 38, Courser 38; Swordsman, Cog and Crossbowman unchanged | watched |
| `p3-exploration` | Production | Catapult (110) 4 turns and Courser (170) 6 turns against 3 and 5 at the full rate; Swordsman unchanged | watched |
| `p3-exploration` | Niter gained by a new mine | Catapult 25/20/40 and Carrack 35/40/35 at once; Catapult back to 3 turns | watched |
| `p3-modern` (Harsh, curve on) | No Niter, Oil, Coal or Rubber | Tank 60, Field Cannon 30/40/30, Mortar 35/30/50, Ironclad 40/15/15, Dreadnought 45/50/45, Biplane 50/30/25 (each - 5); Line Infantry 50 and Cuirassier 55 unchanged | watched |
| `p3-modern` | Production | Field Cannon (270) 8 turns without Niter, 4 turns once Niter was held | watched |
| `p3-modern` | Each resource gained by a new mine | Niter: Field Cannon and Mortar restored at once; Oil: Tank 65 and Dreadnought 50 at once; Coal: Ironclad 45/20/20 at once; Rubber: Biplane 55/35/30 at once | watched |
| all three | Melee units under `Type ALL` (the first build) | A melee unit without its resource read ranged and bombard strength below zero (Man-at-Arms 38/-2/-2). Replaced by one row per strength type, on units that have that strength (phase 3b) | watched; superseded |

## Phase 3b: penalty and curve per strength type

The owner's decision after phase 3: no row may move a strength a unit does not have off 0. The penalty, its cancel and
the curve are now one row per strength type (`MELEE`, `RANGED`, `BOMBARD`), each on the units whose base value for it
is above 0 (`Unit_Stats` from the dumps). `tests/data.mjs` fails if any strength row can reach a unit whose base value
for that strength is 0, and no row uses `Type ALL`.

| Run | What | Observation | Status |
| --- | --- | --- | --- |
| Node tests | Generated rows against the dumps | 710 modifiers in 12 groups; every strength row reaches only units with that strength above 0 | watched (tests) |
| none yet | Each age at the earlier setup values: a gated melee unit reads ranged 0 and bombard 0 with and without its resource; a ranged or bombard unit loses and regains its ranged and bombard penalty; loss and re-check as before | Not run: the disk is full (242 MB free; a lab run backs up about 830 MB) and another session's repro runs were using the game | not watched |

## Phase 4: loss re-check

| Run | What | Observation | Status |
| --- | --- | --- | --- |
| `p3-antiquity` | Script running | `UI.log`: "loss re-check on", then "re-check (turn start) turn N: 6 of 6 major players" at every turn start | watched |
| `p3-antiquity` | Human, Iron lost by clearing the tile | Turn 1: Iron cleared, Spearman stayed 25 and its production stayed at the full rate (the engine's latch). Turn 2, one roll later: Spearman 22, production cut again | watched |
| `p3-antiquity` | Human, Iron gained and lost inside one turn | Turn 3: a new mine took the Spearman 22 to 25, the tile was cleared the same turn, Spearman stayed 25. Turn 4: 22 | watched |
| `p3-antiquity` | AI 2, Iron lost by clearing | AI 2 mined seeded Iron during its turn 2 (Spearman 22 to 25). Cleared on turn 3, still 25; turn 4: 22 | watched |
| `p3-antiquity` | AI 5, Iron lost to an enemy pillage | AI 5 mined seeded Iron during its turn 3 (25). Player 0's Warrior pillaged the mine on turn 4 ("Damage the Mine"); Iron gone from AI 5's list at once, Spearman still 25; turn 5: 22 | watched |
| `p3-antiquity` | A player still holding the resource | AI 3 held Iron throughout (1, then 2 copies): its Spearman read 25 at the turn 3, 4 and 5 readings | watched |
| `p3-antiquity` | No entry and no notification left | `getResources()` and `getOffMapResources()` held no off-map entry for any major at turn 4; player 0's notifications at turn 5 held no resource item (tech choice, story choice, player met, unit attacked, command units) | watched |
| `p3-modern` | Human, Oil lost by clearing | Tank 65 and Dreadnought 50 with Oil; cleared, one roll later Tank 60 and Dreadnought 45 | watched |

Also seen: a resource put by WorldBuilder on a tile that already had a mine counted in `getResources()` at once but
did not switch the requirement until the next roll (Spearman 22 with one Iron for 20 seconds; 25 after the roll).
A new mine switched it at once. The re-check covers both.

## Phase 5: late curve

| Run | What | Observation | Status |
| --- | --- | --- | --- |
| `p3-antiquity` | Spearman strength by Iron copies (Standard, curve on) | 7 copies 25; 8: 26; 9: 26; 10: 27; 11: 27; 12: 28; 13: 28; 14: 29; 15: 29; 16: 30; 17: 30; 18: 31; 19: 31; 20: 32; 21: 32; 22: 32. Combat preview at 22 copies: strength 32 and "+6 Iron Resource" | watched |
| `p3-antiquity` | A drop across a threshold | 22 to 19 copies: 32 until the roll, 31 after it. Then every Iron cleared: 31 until the roll, 22 after it (the curve and the cancel both re-checked) | watched |

## Phase 6: upgrade gate

| Run | What | Observation | Status |
| --- | --- | --- | --- |
| dumps of `p3-antiquity`, `p3-exploration`, `p3-modern` | Gated units no one can train (`CanTrain` 0) that an upgrade leads to | Antiquity none; Modern none; Exploration `UNIT_SAMURAI_2` and `UNIT_SAMURAI_3` only. The Samurai replaces the Swordsman line, so for the Sengoku the upgrade is the only way to tier 2 and 3 infantry; a gate there would be a hard training gate for one civilization. Left out of 1.0 (DESIGN.md 7e); `tests/data.mjs` pins the finding and that no data sets `Units.StrategicResource` | not watched in game (decided from the dumped tables) |

## Phase 7: setup options

Values set with `GameSetup.setGameParameterValue` before the start (`devtools/sr-lab.mjs`), or left at the defaults
Play Now writes, and read back from the configuration before the game began.

| Run | Values | Groups applied (`Modding.log`) and live `GameModifiers` | Units | Status |
| --- | --- | --- | --- | --- |
| `p3-antiquity` | Play Now defaults, read back as `SR_UNSUPPLIED_STANDARD` and `SR_LATE_CURVE_ON` | `antiquity`, `antiquity-standard`, `antiquity-curve`; 22 `SR_` rows (8 penalty, 14 curve); penalty amounts -3 and -33 | Spearman 22, Chariot 27 | watched |
| `p3-exploration` | Light, curve Off | `exploration`, `exploration-light`, no curve group; 12 `SR_` rows, amounts -2 and -20 | Catapult 23/18/38, Courser 38 | watched |
| `p3-modern` | Harsh, curve On | `modern`, `modern-harsh`, `modern-curve`; 8 penalty and 28 curve rows, amounts -5 | Tank 60, Biplane 50/30/25 | watched |
| `p7-off` | Off, curve On | `antiquity`, `antiquity-curve` only; 14 `SR_` rows, all curve | Spearman 25 without Iron; no panel line | watched |

## Phase 8: unit panel line

| Run | What | Observation | Status |
| --- | --- | --- | --- |
| `p3-antiquity` (English) | Chariot selected, no Horses | "Unsupplied: no Horses (-3 Combat Strength, slower to train)" under the stats; [screenshot](screenshots/unit-panel-en.png) (the panel sits behind a popup's shade) | watched |
| `p3-modern` (German) | Tank selected, Oil cleared | "Unversorgt: ohne Öl (-5 Kampfstärke, langsamer ausgebildet)"; [screenshot](screenshots/unit-panel-de.png) | watched |
| `p3-exploration` | Placeholder text before the translations | The line read the resource's name in German inside the English row, as expected; replaced by the German row in `p3-modern` | watched |
| `p3-antiquity` | Readable Tooltips enabled alongside | `registry`: `PlotTooltip` winner `ReadableTooltipsPlotTooltip`; this mod registers no tooltip component | watched |
| `p7-off` | Penalty Off | No line on an unsupplied Spearman | watched |

## Phase 9: AI and soak

| Run | What | Observation | Status |
| --- | --- | --- | --- |
| `p9-soak` | 90 turns of Antiquity, seed 4242, mod on (Standard, curve on), turns ended without Autoplay | No crash, no hang; 91 "re-check (turn start)" lines and no warning or error line of the mod's in `UI.log` | watched |
| `p9-control` | The same seed, the mod removed from `Mods/` | No line of the mod in `Modding.log`. The two games read the same at turns 16, 31, 46 and 61 (no AI had built a gated unit). At turn 91, mod on: Rome 16 military units, 14 of them Warriors, no Iron; Greece 2 Hoplite 2 with Iron; one AI a Spearman. Vanilla: Rome 4 Legions with Iron, 6 units in all | watched |
| `p9-cost` | `tower-bench cost`, 20 turns, one replicate per arm | Turn wall time 2221 ms off, 2237 ms on: 16 ms against a noise of 28 ms, not told apart; resident memory 47 MB lower with the mod on (noise); error lines equal | watched |
| `p9-hotseat` | A two-human hotseat game (`SR_LAB_MODE=HOTSEAT`) | Data groups applied (Standard and curve); `UI.log`: one line, "multiplayer game: the loss re-check is off ...", and no re-check line after it | watched |

The `Database.log` line "Database XML root elements must start with either <Database> or <GameEffects>" after
`StartupErrorMessages.xml` appears in the vanilla control too: it is not this mod's.
