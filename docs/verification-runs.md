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
| `p3b-antiquity` (Standard, curve on) | Rows loaded | 18 `MELEE`, 7 `RANGED`, 7 `BOMBARD` rows; every penalty and cancel row is `MELEE` (no gated Antiquity unit has ranged or bombard strength); the ranged and bombard rows are the curve's, on the Hwarang | watched |
| `p3b-antiquity` | No Iron, no Horses | Spearman 22/0/0, Chariot 27/0/0 (melee/ranged/bombard); Slinger 5/15/5 and Hwarang 5/15/8 unchanged | watched |
| `p3b-antiquity` | Iron and Horses gained by new improvements | Spearman 25/0/0, Chariot 30/0/0 at once | watched |
| `p3b-antiquity` | Iron cleared | Spearman stayed 25/0/0 until the roll; turn 2: 22/0/0. Chariot (Horses still held) 30/0/0 | watched |
| `p3b-exploration` (Light, curve off) | Rows loaded | Penalty and cancel: 6 `MELEE`, 4 `RANGED`, 4 `BOMBARD` (Niter and Iron have units with ranged strength, Horses does not) | watched |
| `p3b-exploration` | No Niter, Iron or Horses | Man-at-Arms 38/0/0, Courser 38/0/0, Catapult 23/18/38, Bombard 33/28/48; Crossbowman 25/35/25 unchanged | watched |
| `p3b-exploration` | Each gained by a new improvement | Catapult 25/20/40 and Bombard 35/30/50 on Niter; Man-at-Arms 40/0/0 on Iron; Courser 40/0/0 on Horses; each at once. Xunleichong 2 (Iron, ranged and bombard above 0) placed while Iron was held: 40/25/10 | watched |
| `p3b-exploration` | Niter and Iron cleared | Unchanged until the roll; turn 2: Catapult 23/18/38, Bombard 33/28/48, Man-at-Arms 38/0/0, Xunleichong 2 38/23/8; Courser (Horses held) 40/0/0 | watched |
| `p3b-modern` (Harsh, curve on) | No Niter, Oil or Rubber | Tank 60/0/0, Field Cannon 30/40/30, Mortar 35/30/50, Biplane 50/30/25; Line Infantry 50/0/0 unchanged | watched |
| `p3b-modern` | Each gained by a new improvement | Niter: Field Cannon 35/45/35, Mortar 40/35/55; Oil: Tank 65/0/0; Rubber: Biplane 55/35/30; each at once | watched |
| `p3b-modern` | Niter and Oil cleared | Unchanged until the roll; turn 2: Tank 60/0/0, Field Cannon 30/40/30, Mortar 35/30/50. The Biplane was gone from the player's units after the turn (placed in a city with no air slot), so its loss was not read | watched |
| `p3c-modern` (Standard, curve on) | Coal: Ironclad (melee, ranged and bombard above 0) | No Coal: 42/17/17. Coal gained by a new mine: 45/20/20 at once. Coal cleared: 45/20/20 until the roll; turn 2: 42/17/17 | watched |
| not run | The curve's ranged and bombard rows above 7 copies | Planned in the `sr-reload` soak after the reload; that game died first (phase 10). Covered by `tests/data.mjs` only | not watched |

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

## Phase 10: save and reload, age transitions

Scripts: `devtools/soak/sr-reload-game.js`, `devtools/soak/sr-idle-game.js` (load a save, read once, idle with no
input for `OPTS_JSON` seconds) and `devtools/soak/sr-age-game.js`, run by `tools/crash-soak/run-soak.sh` (copy them
into that folder first); `devtools/sr-short-age-probe/` ends Antiquity and Exploration after 10 points. The save
`SR-LAB-RELOAD.Civ7Save` (Modern, turn 2, Standard, curve on; Tank without Oil, Field Cannon with Niter at 60,24) and
its mod-off twin `SR-LAB-RELOAD-VANILLA.Civ7Save` (the same game built without the mod) are kept in
`tools/crash-soak/runs/sr-reload/`; copy one to `Saves/Single/` to load it, and never give `run-soak.sh` the label
`sr-reload`, which would clear that folder.

| Run | What | Observation | Status |
| --- | --- | --- | --- |
| `p3c-modern` (lab) | Saved with `Network.saveGame` from the game page, Oil gained after the save, then `Network.loadGame` from the game page | The load came up at turn 2 with one new "loss re-check on" line and one "re-check (game loaded)" line. Before anything else was read, the game died 205 s after the load: SIGSEGV at address 0 on the `AppHost application thread` (`CivilizationVII-2026-10-11-134127.ips`, top frames `+0x21091fc`, `+0x2107ef0`, `+0x838b3c`) | watched (crash) |
| `sr-reload` (soak, loaded from the shell) | The same save loaded through the main menu, as a player would | Back as saved: Tank 62/0/0 (the Oil gained after the save is gone), Field Cannon 35/45/35, Ironclad 42/17/17; production unchanged (Tank 460 at 8 turns, Field Cannon 270 at 3, Line Infantry 290 at 3, at 68 Production); setup values Standard and curve On; 232 `SR_` modifiers, Oil penalty -3; panel line on the Tank "Unsupplied: no Oil (-3 Combat Strength, slower to train)". Then, idle at turn 2, the game died between 14:00:14 and 14:04:13, about 4 minutes after the load. No crash report was written | watched (death) |
| `sr-reload` | Panel line with the Field Cannon selected after the Tank | Read "Unsupplied: no Oil ..." although the Field Cannon draws on Niter and held it. Either the panel had not switched units within the 2 s the script waited or the line is stale; not told apart | not watched |
| not run | A loss after the reload re-checked one roll later | The game died before the step | not watched |
| `sr-rl-prep1` (lab, mod absent) | A save made the same way without the mod: Modern, seed 4242, Tank and Field Cannon at 63,24, Ironclad at 64,23, Coal at 66,24 then cleared, Niter at 60,24, one turn ended, `Network.saveGame` as `SR-LAB-RELOAD-VANILLA` | Saved at turn 2 (Tank 65/0/0, Field Cannon 35/45/35, Ironclad 45/20/20; Niter held). Kept in `tools/crash-soak/runs/sr-reload/`. The lab restored cleanly, registry unchanged | watched |
| `sr-rl-prep2` (lab, data-only copy) | A copy of the mod with the same id, data and text and no `UIScripts` or `ImportFiles`, in a fresh Modern game | `Modding.log` applied `strategic-resources-game`, `-modern`, `-modern-standard`, `-modern-curve`; `Database.log` no errors; live database 116 `SR_` rows in `GameModifiers` and 232 in `Modifiers` (the full mod's count); no `[StrategicResources]` line in `UI.log`; a placed Tank read 62 | watched |
| `sr-rl-prep3` (soak, `sr-idle-game.js`) | `SR-LAB-RELOAD-VANILLA` loaded from the main menu with nothing of the mod in `Mods/`, idle 60 s | Loaded into the game at turn 2; the save re-enabled the same six other mods the `SR-LAB-RELOAD` save does (Aging Warehouses, Demographics, Emigration, All Display Options, Cultural Diffusion, Universal Auto Explore); 0 `SR_` rows; clean quit after the minute | watched |
| `sr-rl-a1` (soak, arm A: full mod, `SR-LAB-RELOAD`) | The same load as `sr-reload`, then idle 480 s with no input | Back as saved (Tank 62/0/0, Field Cannon 35/45/35, Ironclad 42/17/17, production unchanged, Standard and curve On, 232 `SR_` modifiers, panel line, one "loss re-check on" and one "re-check (game loaded)" line). Clean after 8 min: load 14:36:45, read again 14:44:54, quit by the harness. No crash report | watched (clean) |
| `sr-rl-a2` (soak, arm A, second run) | The same | Back as saved, the same readings. Clean after 8 min: load 14:46:36, read again 14:54:45, quit by the harness. No crash report | watched (clean) |
| not run | Arm B (data-only copy, `SR-LAB-RELOAD`) and arm C (`SR-LAB-RELOAD-VANILLA`, mod absent), two runs each | Not run: the plan stops after two clean A runs, since B and C can only be read against a death in A | not watched |
| not run | Antiquity to Exploration and Exploration to Modern: rows per age, carried units, one "on" line per age, a loss re-checked in the new age | Not started: stopped after the two deaths above (repo `CLAUDE.md`: report after the first falsification) | not watched |

Two deaths after loading a save of a game with the mod, both while idle a few minutes after the load (`p3c-modern`,
`sr-reload`). The first hypothesis, that the load call from the game page caused it (`engine-closed.md`: save-load
calls from the game context crash the UI host thread), is falsified: the load from the main menu died too. The
positive control was then run twice more on 2026-10-11 (`sr-rl-a1`, `sr-rl-a2`): the same save, the same mod files,
the same main-menu load through `run-soak.sh`, idle 8 minutes each (the deaths came at about 3.5 and 4 minutes). Both
runs were clean. The death does not reproduce under this harness today, so nothing is settled: the mod is neither
cleared nor implicated, and the planned arms B (data-only copy) and C (a save made without the mod) were not run,
since a clean or dying B or C can only be read against a death in A. What is known about the one crash with a report:
its signature `1311346:CivilizationVII+0x21091fc,+0x2107ef0,+0x838b3c` on the `AppHost application thread` was also
written on 2026-09-30 (473 s after launch) and 2026-10-03 (830 s after launch) in lab games run before this mod
existed, so the game has this crash without the mod; whether the mod makes it more likely is open. Over the four loads
of `SR-LAB-RELOAD` so far, two died and two did not. The cheapest next test is more repetitions of arm A (and arm C
with `SR-LAB-RELOAD-VANILLA`, which is ready) until a death shows which side it falls on; a longer idle may be needed.
The `sr-idle-game.js` soak script and the prepared saves are in place for that. No new games died in phases 3 to 9
(90 AI turns in `p9-soak`; lab games idled for minutes).

