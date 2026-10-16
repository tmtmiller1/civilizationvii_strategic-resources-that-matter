# Checks still owed

Written on 2026-10-15, after the 1.0.2 release. Two lists: what a person has to look at or click in the game, because
the game won't open a tooltip or take a click from script (phase 13, `p13-review-plot-de`), and lab runs that need a
game but no person. The 1.0.2 launches with Silla off and on, and the 1.0.1 Exploration siege check, are run
separately and go straight into `verification-runs.md`. When anything below is watched, move it into
`verification-runs.md` with its run label and take it off this page.

## By hand

A lab game can set each of these up (`node devtools/sr-lab.mjs lab start ...`, see CONTRIBUTING.md); the looking and
clicking is the owner's. Standard penalty unless a line says otherwise.

| # | Set up | Do | You should see | Open since |
| --- | --- | --- | --- | --- |
| 1 | Antiquity, a city with no Iron | Open the production list and hover the Spearman | Under the unit's description, in red: "Needs Iron. Without it: -3 Combat Strength, slower to train." With one Iron: "Needs Iron (you have 1)." | The production tooltip has never been watched (compatibility.md, "Production item tooltips") |
| 2 | The same city, Gated Units on Training, some gold | Switch the city panel to Purchase | The Spearman listed, greyed, with the "Locked: no Iron" pill; its tooltip ends "Needs Iron: cannot be bought without it." With Gated Units off, the "Needs Iron" pill as on the Production tab | The purchase view couldn't be reached from script (`p13-production-purchase`, `p13-review-purchase`) |
| 3 | A game where the first-time callout hasn't shown: clear `tower-strategic-resources-that-matter.unsuppliedCalloutSeen` and call `TutorialManager.unsee("tower_sr_unsupplied_first")` from the lab | Select a Chariot with no Horses; click Close. Reset again; click Tell me more | Close shuts the callout and nothing else happens; Tell me more opens the Civilopedia on Strategic Resources | The buttons were only pressed through the game's input calls, never by hand |
| 4 | German (`SR_LAB_LANGUAGE=de_DE`), Readable Tooltips off, Modern, Niter on the map | Hover a Niter tile | The plot tooltip ends "Versorgt Einheiten: Angriffsgeschütz, Feldgeschütz, Feldkanone und 3 weitere." | No plot tooltip opened from script that day (`p13-resource-c`, `p13-review-plot-de`) |
| 5 | Antiquity, Gated Units on Training, Iron on the map, none held | Hover the Iron tile | "Needed to train: Legion." under the resource's description | Watched in the module only (`p15-ui-resource`) |
| 6 | Exploration, Sengoku, Gated Units on Training and upgrade | Open the Civilopedia on Strategic Resources, the Gated units chapter, then the Samurai's tier 2 and tier 3 pages | The chapter says the Samurai move up to tier 2 and 3 by themselves after three kills at each tier, and that step doesn't need Iron, even under Training and upgrade. The tier pages read "Cannot be trained or bought without Iron." | The old check here (the upgrade refused for want of Iron) can't happen: in `w2b1-x1` a Samurai with no Iron became tier 2 by itself at its third kill and tier 3 at its sixth, since the game's kills step does the upgrade without asking for Iron (DESIGN.md, "The Samurai's tier-up by kills"). The text was rewritten to match and hasn't been read in game |
| 7 | Any age, a trade route importing a resource your units need, at war with a civilization whose units can reach the route | Let the enemy plunder the route | The import leaves your resource list (the commerce screen), and the penalty comes back, at once or one turn later; note which | A plunder can't be produced from script (`p11-plunder`) |
| 8 | Any game in normal play | When a discovery or story puts Horses or Niter on your land, improve the tile | The penalty lifts the moment the improvement lands, as for a mined copy | Read from code (phase 11, "A narrative event's resource") |
| 9 | Each of Spanish, French, Italian, Korean, Polish, Brazilian Portuguese and both Chinese (`SR_LAB_LANGUAGE`) | Open the Strategic Resources Civilopedia page and a gated unit's page; select an unsupplied unit; open the production list; lose a resource over a turn | Every line in that language, the game's own unit and resource names inside them, nothing cut but the sidebar title. Polish: the sidebar title measured 354 px against a 235 px box, so it's cut like the game's own long entries; check it still reads | Read, not seen, in those eight; English, German, Japanese and Russian were seen |
| 10 | The combat preview with your own unit defending | In single-player the game opens the preview only for an attack you're about to make, so this side only appears in a hotseat game (`SR_LAB_MODE=HOTSEAT`): from the second seat, attack the first seat's Chariot with no Horses | The defender's column lists "-3 Unsupplied: no Horses" | DESIGN.md 7e. It's the watched attacker's-eye case seen from the other seat, so the owner may close it as can't-happen in single-player |

Two mods named in compatibility.md aren't installed on this Mac and were never tested: Better City UI (Workshop
3793577174) and Better Nested Tooltips (3735528208). Testing them means subscribing. What to check once they're on:
the production pill inside Better City UI's own production list, and the resource line inside a nested tooltip, each
with Mod Commons on and off.

## Lab checks

### The grant-only lines (after the copies, 2026-10-15 evening)

Watched: the Trebuchet, Cog and Swordsman lines in Exploration, the Frigate line in Modern, Goryeo's Hwacha line,
the four copies (Rome, Persia, Meiji Japan, Great Britain) into their uniques, each without the resource, with it,
and a roll after losing it; the Warrior grant and the Warrior requirement against the copy; the Options list and the
plain-frame log line; independents against vanilla controls in Antiquity and Exploration (`verification-runs.md`,
`p16-lines-*`, `p16-copies-*`, `p16-look-rome`, `p16-grant-rome`, `p16-independents-*`).
Still owed:

- An AI player without Niter at Gunpowder building Trebuchets. Fed Science, every AI reached Gunpowder by turn 27
  (`p16-ai-exploration`): the two holding Niter queued a Bombard and a Hwacha 3, the two without queued no siege at
  all and nothing sat locked in a queue; a longer pass lost the game context to the age ending early. What's left is
  seeing a Niter-less AI choose a Trebuchet, which needs a slower game than the lab's turn limit allows.
## The death after a reload (next-work prompt step 2)

Of six loads of the old save, the first two died and the four arm A runs after them were clean (DESIGN.md 7e,
`verification-runs.md` phase 10). The old saves name the mod's pre-rename id and predate the 1.0.1 and 1.0.2 data, so
the first job is fresh saves.

1. Deploy 1.0.2 (`node scripts/deploy.mjs`; on 2026-10-15 the copy in `Mods/` was still the broken 1.0.1 one). Back
   up `Mods.sqlite` and note its hash. `node devtools/sr-lab.mjs lab start --seed 4242 --age AGE_MODERN`, then the
   `sr-rl-prep1` steps: a Tank and a Field Cannon at 63,24, an Ironclad at 64,23, Coal at 66,24 then cleared, Niter at
   60,24, one turn ended, `Network.saveGame` as `SR-LAB-RELOAD-102`. `lab stop`. The same with the mod out of
   `Mods/` (`node scripts/deploy.mjs --remove`) as `SR-LAB-RELOAD-102-VANILLA`, then deploy again. Keep both saves in
   a folder no soak label uses, such as `tools/crash-soak/runs/sr-reload-102-saves/`.
2. Arm A: copy `devtools/soak/sr-idle-game.js` into `tools/crash-soak/` (it reads the renamed
   `StrategicResourcesThatMatter*` parameters) and the save into `Saves/Single/`, then
   `MOD=strategic_resources_that_matter SAVE=SR-LAB-RELOAD-102.Civ7Save OPTS_JSON=480 zsh run-soak.sh sr-idle-game.js
   sr-rl102-a1 900`, and `-a2`, `-a3` and so on, about 20 s apart. Stop at the first death or after 10 clean loads.
3. After each run: any `~/Library/Logs/DiagnosticReports/CivilizationVII-*.ips` newer than the launch, the soak's log
   tail, and the `[StrategicResourcesThatMatter]` lines in `UI.log` before the next launch overwrites it.
4. If one dies, read those tails before any theory (the disproof gate), then two runs each of arm B (a data-only copy,
   the `sr-rl-prep2` shape, with `SR-LAB-RELOAD-102`) and arm C (`SR-LAB-RELOAD-102-VANILLA`, nothing of the mod in
   `Mods/`). If ten are clean, record "not reproduced in 10" and leave B and C unrun.

### Surfaces a script can reach (next-work prompt step 3)

- **A carried unit with the new age's resource held** (`verification-runs.md`, "A carried unit read with the new age's
  resource held"). The `sr-age2` run with the short-age probe, Exploration start, but holding Niter through the
  transition: in Modern turn 1 the Catapult carried over as a Field Cannon reads 35/45/35, not 32/42/32. If the Niter
  tile doesn't survive the transition, record that instead.
- **A route with a city-state.** A Modern or Exploration lab game with a city-state alive (`isMinor`) that holds a
  strategic resource: a Merchant's route to it, then `getResources()` and the penalty on a unit that needs that
  resource, as `p11-import-1` read them.
- **The Japanese fixes from `p15-ui-ja`.** `SR_LAB_LANGUAGE=ja_JP`, Exploration, Sengoku, Gated Units on Training and
  upgrade: lose Horses over a turn and read the notification (no space between 。 and the tail), and read Iron's
  resource line (`describeResourceSupply`): it lists no Man-at-Arms or Pikeman, the units the Samurai tiers replace.
- **The per-copy bonus test** (compatibility.md, finding 1). Neither mod DESIGN.md named for it (3661281644,
  3696941273) is on this Mac any more, and no installed mod writes `MOD_IRON_INFANTRY_COMBAT_STRENGTH`. A stand-in of
  our own does the same thing: a throwaway probe in `devtools/probes/per-copy/` with
  `DELETE FROM GameModifiers WHERE ModifierId = 'MOD_IRON_INFANTRY_COMBAT_STRENGTH';` (load order 9000, Antiquity).
  A Spearman with 0, 1 and 8 Iron, read through `simulateAttackAsync` as in phase 12: 22 with "-3 Unsupplied: no
  Iron"; 25 with no line of the mod's and no "+1 Iron Resource"; 26 with "+1 Iron: 8 or more" and no "+6 Iron
  Resource". The same three without the probe show the game's own Iron line beside the mod's.
