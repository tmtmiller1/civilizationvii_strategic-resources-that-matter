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
