# Strategic Resources: scope

Kept in the mod repo since 2026-10-11 (before that in `mod_ideas_tested/strategic_resources/`). The probe mods of
sections 7a to 7c (`probe/`, `probe2/`, `probe3/`) are in `devtools/probes/`; the evidence for every claim after 7d is
`docs/verification-runs.md`.

Status: scoped 2026-10-10. Probes P1 to P6 run 2026-10-11 (section 7a); round 2 on re-checks, crashes, gate routes and
AI players (7b); round 3 on cost, the late curve, the re-check script and the Modern age (7c); what they change for the
design in 7d. Built as 1.0 the same day in `tower_mods/strategic_resources/` (section 7e); the evidence is that
project's `docs/verification-runs.md`. Open: multiplayer. Engine claims in sections 2 to 6 were read from the 1.5.0 game
files or the compiled vanilla DB (`firaxis-bug-reports/repro/runs/g1-A-vanilla/gameplay-copy.sqlite`) and predate the
probes; where sections 7a to 7e disagree, they win. Corpus check 2026-10-10: none of the 1251 reference mods sets
`Units.StrategicResource` or touches `IgnoresUnitStrategicResourceRequirements`; none of the installed Workshop or local
mods does either. Two local mods rewrite the per-copy resource effects (Multiplayer Balance Mod 3661281644, and the
anime resources mod 3696941273) but neither adds a gate or a penalty for having none. RHQ AI Mod (3507042742) checks in
its build scripts that aircraft need no `StrategicResource`, so a Rubber gate on aircraft could break its air logic.

Name: **Strategic Resources** (mod id `tower-strategic-resources`).

## 1. Where the idea comes from

r/CivVII thread "When resources truly mattered" (2026-10-10). The post misses Civ V and Civ VI, where lacking Oil
locked you out of units or weakened them, and resources were a reason to go to war. The replies split:

| Commenter | Position | What it asks of a mod |
| --- | --- | --- |
| OP | Hard lock-out on units without the resource | A hard gate |
| barnu1rd | 7's +1 per copy is too weak; a hard gate is too much, but being kneecapped is right. Trade in 7 makes resources easy to get, so a gate would work better here than in 6. Suggests a unit cap or a higher cost without the resource | A soft gate: dearer or slower, not forbidden |
| Substantial_Cow2349 | Civ VI per-unit resource cost gave weight to pillaging, city placement and targeting city-states | Consumption, and resources that can be taken away |
| quickonthedrawl (29 upvotes) | Gating removes depth: today the delta between your count and a rival's matters, +2 or +3 strength is huge, and you keep settling for more Iron even when you have some | Keep the count curve; do not replace it with a checkbox |
| Unfortunate-Incident | After Antiquity it is easy to reach 6 of the important ones | The count curve saturates, so the delta stops mattering late |

A mod that answers all of them keeps the vanilla per-copy bonus, adds a real penalty for having none, and makes the hard
gate an option rather than the default.

## 2. What 1.5.0 does today

Empire-class resources pay out through count-scaled modifiers; nothing gates a unit.

| Age | Resource | Effect (per copy) | Unit tags |
| --- | --- | --- | --- |
| Antiquity, Exploration | Horses | +1 combat strength | `UNIT_CLASS_CAVALRY` |
| Antiquity, Exploration | Iron | +1 combat strength | `UNIT_CLASS_INFANTRY` |
| Exploration | Niter | +1 combat strength | `UNIT_CLASS_NAVAL`, `UNIT_CLASS_SIEGE` |
| Exploration | Hardwood | naval unit production | - |
| Modern | Niter | +1 combat strength | infantry and ranged |
| Modern | Oil | +1 combat strength; +10% factory production | `UNIT_CLASS_CAVALRY`, `UNIT_CLASS_HEAVY` |
| Modern | Coal | +1 combat strength; railyard and port production | `UNIT_CLASS_LIGHT` (naval) |
| Modern | Rubber | +1 combat strength | `UNIT_CLASS_INFANTRY`, `UNIT_CLASS_AIRCRAFT` |

Source: `age-*/data/resources-gameeffects.xml`, effect `EFFECT_UNIT_ADJUST_COMBAT_STRENGTH_PER_RESOURCE`.

The Civ VI gate machinery looks dormant rather than removed:

- `Units.StrategicResource` exists and is empty on all 144 units.
- `CivilizationLevels.IgnoresUnitStrategicResourceRequirements` is `false` for full civs and `true` for independents
  and city-states (`base-standard/data/civilizations.xml:47-50`). A flag that exempts some players from a requirement
  means the engine still checks one.
- `LOC_UNITCOMMAND_UPGRADE_REQUIRES_RESOURCE_ACCESS` ships with text: "Your civilization needs {2_AmountNeeded}
  {1_ResourceName} to upgrade this type of unit." (`base-standard/text/en_us/UnitCommandsText.xml`).
- The production chooser already shows `result.FailureReasons` as the tooltip on a disabled item
  (`base-standard/ui/production-chooser/production-chooser-helpers.js:703`), so a native refusal would explain itself.
- No game JS reads `StrategicResource`; whatever enforces it is native.

Watched 2026-10-11 (section 7a): the column is enforced, but for training it never lifts; only the upgrade check
honours it as a gate.

## 3. What the player gets

Three layers, each switchable on its own.

1. **Unsupplied.** A unit whose class draws on a resource you have no copy of fights at a penalty (default -3 combat
   strength) and costs more to train (default +50% production). With one copy you are at vanilla; each further copy
   adds vanilla's +1. This is barnu1rd's kneecap, and it keeps quickonthedrawl's count delta whole.
2. **Hard gate** (setup option, off by default). The unit cannot be trained or upgraded without the resource, Civ VI
   style, through `Units.StrategicResource`. The OP's version.
3. **A steeper late curve** (setup option). Answers the saturation point: the per-copy bonus keeps going past 6 but
   at half rate, so a rival with 10 still beats one with 6. Tuning only, no new mechanism.

Pillaging needs no new work if the engine already drops resource access when a resource improvement is pillaged (probe
P5). Then a raid on an Iron mine weakens the owner's infantry the next turn, which is Substantial_Cow2349's point.

Not in 1.0: Civ VI-style consumption (each unit spends N of a stockpile). Civ VII has no strategic stockpile, so this
needs a script ledger like the depletion mod's. Parked as a 1.2 question.

## 4. Gate map

One resource per unit. Where vanilla gives a class two resources, the gate follows the one that makes historical sense,
and the other keeps only its count bonus. Built from the live compiled database of each age (`Units`, `TypeTags`,
`UnitReplaces`) by the rules in `tower_mods/strategic_resources/scripts/gate-map.mjs`; a unique unit is judged as the
unit it replaces, a unit that replaces nothing by its own tags and tier. `tests/data.mjs` there asserts these lists.

| Age | Rule | Resource | Units (2026-10-11, 1.5.0 with the DLC on the development machine) |
| --- | --- | --- | --- |
| Antiquity | cavalry | Horses | Chariot, Horseman; Dantinas Tatha 1-2, Magarru 1-2, Numidian Cavalry 1-2, Purabhettarah 1-2 |
| Antiquity | infantry from tier 2 (the Warrior line and the Scout are free) | Iron | Spearman, Phalanx; Gaisatai 2-3, Hoplite 2-3, Immortal 1-2, Legion 1-2, Medjay 2-3 |
| Exploration | cavalry | Horses | Courser, Knight, Lancer; Boyar 1-3, Chevaler 1-3, Mamluk 1-3, Tobang 1-3 |
| Exploration | infantry from tier 2 | Iron | Man-at-Arms, Pikeman; Gold Bangles, Kispoko Nena To, Leiomano, Samurai, Tercio, Xunleichong (each 2-3) |
| Exploration | land siege | Niter | Catapult, Trebuchet, Bombard; Hwacha 1-3 |
| Exploration | heavy warships from tier 2 (ships of the line; the Cog is free) | Niter | Carrack, Galleon; Cetbang, Corsair, Kalam, Vikingr (each 2-3) |
| Modern | artillery: land siege and land ranged | Niter | Field Cannon, Field Gun, AT Gun, Mortar, Heavy Artillery, Assault Gun; Chang Beun 1-3, Katyusha 1-2 |
| Modern | armour: cavalry from tier 2 (the Cuirassier is free) | Oil | Landship, Tank; Cossack 2-3, Ghilman 2-3, Hussar 2-3 |
| Modern | battleships: heavy warships from tier 2 (the Frigate is free) | Oil | Dreadnought, Battleship; Mikasa 1-2, Revenge 1-2, Turtle Ship 2-3 |
| Modern | light warships | Coal | Ironclad, Cruiser, Destroyer; Barbary Corsair 1-3 |
| Modern | aircraft | Rubber | Biplane, Fighter, Trench Fighter, Dive Bomber, Bomber, Heavy Bomber; Stuka 1-2, Zero 1-2 |
| Modern | infantry | none | count bonus only; gating the basic line unit would lock players out of defence |

Totals: Antiquity 22 units, Exploration 45, Modern 43. Not gated, by the rules: ranged infantry (Archer, Crossbowman,
Arquebusier and their uniques; the Keshig and Hwarang follow the archer they replace), the Submarine (neither light nor
heavy), and the Modern infantry line including the Sepoy (it replaces Line Infantry, so its siege tag does not make it
artillery). There are no carriers in 1.5.0.

## 5. How it would be built

| Layer | Mechanism | Script needed |
| --- | --- | --- |
| Unsupplied, combat | A unit ability per class with `REQUIREMENT_PLAYER_HAS_RESOURCE` (inverse) as its owner requirement and a flat combat strength change; attached by `GameEffects` per age | no |
| Unsupplied, cost | `EFFECT_CITY_ADJUST_UNIT_PRODUCTION` with a unit tag and the same inverse requirement, negative percent | no |
| Hard gate | `UPDATE Units SET StrategicResource = ...` per the gate map | no |
| Steeper curve | additional `EFFECT_UNIT_ADJUST_COMBAT_STRENGTH_PER_RESOURCE` rows with a count requirement (`REQUIREMENT_PLAYER_HAS_X_RESOURCES`) | no |
| Plot and unit tooltip line ("Unsupplied: no Iron") | Readable Tooltips-style plot section, unit panel line | yes, UI only |
| Setup options | `GameSetup` parameters gating each layer's database criteria | no |

Layers 1 to 3 are data-only. That keeps the AI, multiplayer and save safety of plain modifiers, and the mod has no
gameplay script at all. The AI reads unit data at game creation; whether it builds around a gate it cannot meet is
probe P4.

## 6. Integration with other Tower mods

| Mod | Coupling |
| --- | --- |
| Resource Depletion and Prospecting | Depletion makes supply contested over time; a dry Iron mine makes legions unsupplied. The pair is the real "fight for resources" loop |
| Demographics | per-civ count of each strategic resource as a series; unsupplied unit count |
| Mod Commons | none; no UI surface contested |

## 7. Probe ladder (disproof gate)

| ID | Hypothesis | Cheapest disproof | Kills if wrong |
| --- | --- | --- | --- |
| P1 | 1.5.0 still enforces `Units.StrategicResource` for full civs | One `UPDATE` setting Iron on one Antiquity infantry unit; start a game with no Iron in reach; read `Game.CityOperations.canStart` and the production chooser item | Layer 2 (hard gate); fall back to a script refusal or drop it |
| P2 | The upgrade path checks the same column (the shipped "needs {N} {Resource} to upgrade" text) | Same setup, one unit of the predecessor class, try the upgrade command | Only the upgrade half of layer 2 |
| P3 | `REQUIREMENT_PLAYER_HAS_RESOURCE` with `inverse` evaluates per owner for a unit ability and flips when the resource arrives | One ability on one unit, gain Iron mid-game via a trade route, read the unit's combat strength before and after | Layer 1 combat; fall back to a per-turn script grant |
| P4 | The AI does not stall on a unit it cannot train | 20 autoplay turns with the gate on and an AI without Iron; read its production queue | Ship the hard gate as off, or with AI exemption via its own requirement |
| P5 | Pillaging a resource improvement drops the owner's count until repaired | Pillage one Iron mine in the lab, read the resource count | Pillage interplay is lost unless scripted |
| P6 | Independents and city-states keep building through the gate | Same game as P1, watch an independent with cavalry and no Horses | Only a wording fix if they also obey |

## 7a. Probe results (watched 2026-10-11, game 1.5.0)

Setup: throwaway data mod `probe/` (`sr-probe`). It sets `StrategicResource` to `RESOURCE_IRON` on `UNIT_WARRIOR` and
`UNIT_SPEARMAN` and to `RESOURCE_HORSES` on `UNIT_CHARIOT` and `UNIT_HORSEMAN`, and gives every major player's
Warriors two penalties through `COLLECTION_MAJOR_PLAYERS` → `EFFECT_ATTACH_MODIFIERS` →
`EFFECT_ADJUST_UNIT_BASE_COMBAT_STRENGTH`, each behind an inverse owner requirement: A is
`REQUIREMENT_PLAYER_HAS_RESOURCE` (-3), B is `REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE` with Amount 1 (-10). The
different sizes show which one fired. Tower Bench lab game, Play Now seed 4242, Antiquity, 21 turns, the 22 usual mods
enabled. Control: the same seed with the probe removed, 20 turns. Iron was given by `WorldBuilder.MapPlots.setResource`
on a tile, followed by a real mine (city `EXPAND` for player 0, AI growth for the AIs).
Readings came from `Game.CityOperations.canStart` / `canStartQuery`, `Game.UnitCommands.canStart`,
`unit.Combat.getMeleeStrength(false)` and `player.Resources.getResources()`.

| ID | Verdict | What was seen |
| --- | --- | --- |
| P1 | Holds, but too strongly: training never unlocks | Vanilla control: Warrior trainable on turn 1. Probe: Warrior refused from turn 1 to 21, including with a mined Iron in the empire, before and after a turn roll. Spearman was refused with Bronze Working researched and Iron held. AIs holding Iron (Persia from turn 14; Goryeo and Đại Việt from turn 20) were refused too. The refusal has no `FailureReasons` and no `Requirements`, so the chooser shows a greyed item with no tooltip. Gated units also lose their tech requirement in the result (vanilla Spearman/Chariot/Horseman report `NeededProgressionTreeNode`; gated, they report nothing), so the gate is checked first |
| P2 | Holds | With mined Iron: Warrior → Spearman upgrade `Success`, 120 gold. Iron removed: refused, `FailureReasons` "Your Civilization needs 1 Iron to upgrade this type of Unit." Iron back: allowed. The check reads the live count, in the same turn |
| P3 | Half holds: flips on gain, latches on loss | Both A and B work with `inverse`, and both evaluate per owner. No Iron: Warrior 7 (20 − 3 − 10), for player 0 and for Persia. Mine completed: player 0's Warrior 20 at once, with no roll needed. Persia mined seeded Iron during the AI turns: its Warrior 7 → 20. But losing Iron does not bring the penalty back. Player 0's Iron was cleared on turn 9, and through turn 21 its Warriors stayed at 20, including one placed afterwards. Đại Việt's mine was pillaged on turn 20 (Iron gone from its list at once), and its Warrior stayed at 20 after the roll. The upgrade check over the same state said "needs 1 Iron", so the count did drop and the requirement did not follow |
| P4 | Holds: no stall, but the gate removes the AI's early army | No AI queue stuck on a gated unit. Queues ran scouts, buildings, settlers, archers and Greece's Hoplite (it replaces the Warrior and was not gated). Turn 20, vanilla: Persia, Hawaii, Goryeo and Đại Việt had 2 Warriors each (8). Probe: 0, with nothing military built in their place except Goryeo's Archer, which it also built in vanilla. Đại Việt showed an empty queue at one reading on turn 20 and had an item again on turn 21 |
| P5 | Holds | `UNITOPERATION_PILLAGE` on Đại Việt's Iron mine ("Damage the Mine") removed Iron from `getResources()` in the same turn; the mine stayed damaged after the roll. The resource count part holds; the combat-penalty part does not, see P3 |
| P6 | Holds | 18 independents had 18 Warriors on turn 9, 35 on turn 14 and 36 on turn 20, with no Iron. The vanilla control had 36 on turn 20. Independents ignore the gate completely (`IgnoresUnitStrategicResourceRequirements`) |

Other things seen on the way:

- `player.Resources.gainOffMapResource(<resource hash>)` adds an off-map entry that `getResources()` lists. Such an
  entry counts for nothing seen here: not the training gate, not the upgrade gate (still refused while two were held),
  not either requirement (Warrior stayed at 7). `ASSIGN_RESOURCE` refuses it. It accepted both the resource's `$index` and its
  `$hash`; each call added one Iron entry.
- A farm on an Iron tile does not give Iron; it took a mine.
- Vanilla Antiquity Play Now starts every major with a Founder only, so a gated Warrior costs no starting unit.

## 7b. Probe round 2 (watched 2026-10-11, game 1.5.0)

Setup: `probe2/` (`sr-probe2`), Warrior base 20, no `StrategicResource` gate. Rows, each switchable:

| Row | Shape | Effect |
| --- | --- | --- |
| `SRP2_ATTACH_PEN` | attach per major → child on player units | −10, unconditional |
| `SRP2_ATTACH_OWN` | same, `REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE` Iron ≥ 1 as the child's `OwnerRequirements` | +7 |
| `SRP2_ATTACH_SUBJ` | same requirement as the attach parent's `SubjectRequirements` | +3 |
| `SRP2_ATTACH_SUBJ_HR` | as SUBJ, with `REQUIREMENT_PLAYER_HAS_RESOURCE` | +3 |
| `SRP2_ATTACH_GATE` | child `EFFECT_PLAYER_DISABLE_BUILD_UNIT` Warrior, inverse has-Iron as the child's `SubjectRequirements` | build block |
| `SRP2_ATTACH_GRANT` | child `EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD` `UNIT_FOEDERATI`, has-Iron as the child's `SubjectRequirements` | positive gate |

The Foederati has `TraitType="TRAIT_LEADER_MINOR_CIV"`, so no major can build it unless granted: the shape vanilla's
`ATTACH_FOEDERATI` uses. Same seed (4242) and steps throughout; Iron given by a real mine via city `EXPAND` on turn 3;
loss by clearing the tile or by an enemy pillage. Bench: `tower-bench-private`.

**A requirement on the attach parent crashes the game.** Watched, with every other mod off:

| Rows | Runs | Result |
| --- | --- | --- |
| none (control) | 1 | no crash; Iron gained |
| PEN + OWN + SUBJ + GATE | 3 | crash when player 0 gains Iron |
| SUBJ alone | 1 + bisect | crash when player 0 gains Iron. `bisect` over all 23 enabled mods: ISOLATED, `sr-probe2` alone crashes and the other 22 without it are clean |
| SUBJ_HR alone | 2 | crash during game creation, before turn 1 |
| PEN, OWN, GATE, GRANT, each alone or together | 5 | no crash |

Signatures: SUBJ is `AsyncWorker1`, null read, `+0x122151c,+0xa7e83c,+0xa7a1f0` (9 of 9 identical); SUBJ_HR is
`AsyncWorker2`, null read, `+0x121e668,+0x1246910,+0x13a52b0` (2 of 2). Vanilla does put requirements on attach
parents over `COLLECTION_MAJOR_PLAYERS` (80 rows: has-pantheon, is-religion-founder), but never a resource
requirement. Rule for the mod: player-resource requirements go on the child, never on the attach parent.

**Requirements are re-checked on a resource gain, not on a loss.**

- Gain: OWN switched on at once when the mine landed (10 → 17), GRANT made the Foederati trainable at once, and the
  round-1 inverse penalty switched off at once. No roll needed.
- Loss: after the tile was cleared, OWN stayed on (17) and the Foederati stayed trainable, across rolls and on units
  created afterwards. Turn 3 to 8 in one run, through a pop growth and a finished Scout. The non-inverse form latches
  just like the inverse one, so the latch is in the engine's re-check, not in `inverse`.
- Forcing it: `player.Resources.gainOffMapResource(<hash>)` (alone, or followed by `removeOffMapResource`) on a
  latched player made the next turn roll re-check everything: Warrior back to 10, Foederati locked. Watched 2 of 2.
  Nothing changed before the roll.
- Vanilla's own `+1 Iron Resource` (combat preview, `PreviewTextResources`/`PreviewTextModifier`) reads the live
  count: it vanished at once after a clear and after an enemy pillaged the mine.

**Training gates.**

- GATE (`EFFECT_PLAYER_DISABLE_BUILD_UNIT` behind inverse has-Iron) blocked the Warrior from turn 1 but did not lift
  on gaining Iron, at once or after a roll. Not usable as a gate.
- GRANT (Foederati shape) works: locked without Iron, trainable the moment Iron arrives, locked again after the next
  forced re-check.

**AI players (watched 2026-10-11, same seed, rows PEN + OWN + GRANT, Iron seeded beside every AI capital on turn 3).**

- The AI builds a unit unlocked by the grant. By turn 24 Persia had 2 Foederati, Hawaii 1, Đại Việt 2 (queued from
  turn 12); Greece and Goryeo built their first by turn 34. Each AI's Warriors went 10 → 17 as it gained Iron.
- The latch and the forced re-check behave on AIs as on the human. Đại Việt (turn 24) and Persia (turn 26): Iron
  cleared, one roll later still 17; `gainOffMapResource` + `removeOffMapResource` called for that player from the UI
  page, one roll later 10. Only the called player changed; the other AIs, still holding Iron, stayed at 17. 2 of 2.
- After the relock neither built another Foederati in 9 turns, while Greece, Goryeo and Hawaii (still with Iron) each
  built one. Đại Việt's new Warrior came out at 10.
- `Game.CityOperations.canStart` asked from the local client returns `Success: false` for every AI city, vanilla
  units included, so AI access was read from queues and units, not from `canStart`.

Not tested: the forced re-check in multiplayer. The call is made from the UI page on one machine and is not a
`sendRequest`, so it may change state on that machine only.

Not settled: one game hung (UI thread at 200% CPU, no log output, debugger silent) on the roll after a pillage with
PEN + OWN + GATE. It did not repeat in five scripted replays, two of them with the probe, including a faithful replay
of the hung session. Treated as unexplained, not as a probe effect. AI behaviour is covered above.

## 7c. Probe round 3 (watched 2026-10-11, game 1.5.0)

Setup: `probe3/` (`sr-probe3`), every requirement on a child, plus `ui/sr-recheck.js`, a game-scope UIScript that
calls `gainOffMapResource` + `removeOffMapResource` on a dummy (Horses) for a major player. Seed 4242, Antiquity
(Warrior/Iron) and Modern (Tank/Oil). Combat read with `getMeleeStrength`, per-copy effects through the combat
preview (`PreviewTextModifier`), cost through `BuildQueue.getTurnsLeft`.

| Item | Result |
| --- | --- |
| Cost penalty (layer 1) | `EFFECT_CITY_ADJUST_UNIT_PRODUCTION` −50% on the Warrior, unconditional, cancelled by +50% behind has-Iron (child `OwnerRequirements`). No Iron: 12 turns at 5 production for a 30-cost Warrior (vanilla 6); it cuts the production rate, the cost stays 30. Iron gained: back to the vanilla rate at once (28 left at 3.85 → 8 turns). It latches on loss like the combat bonus; the script's re-check put it back to the penalised rate (4 → 7 turns) |
| Late curve (layer 3), vanilla shape | A `GameModifiers` row over `COLLECTION_ALL_UNITS` with `EFFECT_UNIT_ADJUST_COMBAT_STRENGTH_PER_RESOURCE` (+2 per copy) adds to vanilla's +1 in one preview line: "+3 Iron Resource" with 1 copy. Reads the live count |
| Late curve, count-gated | Child `EFFECT_UNIT_ADJUST_COMBAT_STRENGTH_PER_RESOURCE` +3 per copy behind has-Iron ≥ 2: absent at 1 copy, "+12 Iron Resource" at 2 (2 + 4 + 6). On a drop to 1 it latched (+6 = 1 + 2 + 3, the gated row now multiplying the live count) until the next forced re-check (+3) |
| Re-check script, on change | `PlayerResourceChanged` reached the script during turn processing when a player lost its last copy of a type (Iron 1 → 0), and the forced re-check applied at the next roll (Warrior 17 → 10). It did not fire for a copy-count drop (2 → 1); a per-turn scan caught that one |
| Turn events in a UIScript | `TurnBegin`, `LocalPlayerTurnBegin` and `PlayerTurnActivated` all arrive. (The first build's scan on `TurnBegin` alone looked silent only because it logs nothing without a drop) |
| Gap in compare-and-force | A gain and a loss inside one turn (Oil gained by a rig and cleared before the roll) were never seen by any scan, and the bonus stayed latched (Tank 62 with no Oil, two rolls) |
| Force every turn | Forcing all majors at every `TurnBegin`, unconditionally, closed the gap: Tank 62 → 55 one roll later. A player still holding the resource kept its bonus (Hawaii's Tank 62 with 4 Oil over two forced rolls). No off-map entry left behind, no script errors in `UI.log` |
| Modern age | Same behaviour with Oil and the Tank: base 65, 55 without Oil, 62 the moment an Oil Rig landed, back to 55 after the forced re-check |

Also seen: `do grow` followed by `EXPAND` is fine; the round-2 crash that involved it was the parent-requirement row.
`WorldBuilder.MapPlots.setResource(-1, …)` does clear a plot, but only after `endBlock`; a read inside the block still
shows the old resource.

## 7d. What this changes

- **Layer 1 (unsupplied penalty) works as data plus a small script.** Penalty on everyone (combat and production),
  cancelled by has-resource modifiers on the child, never on the attach parent. Gains apply at once. Losses need the
  script: at every `TurnBegin`, for every major, gain and drop a dummy off-map resource, so each roll re-checks every
  player. Do not force only on a seen drop: a gain and loss inside one turn slip past (§7c). A loss shows one roll
  later. Watched on the human and on AIs, in Antiquity and Modern. The script must run in every game it shapes;
  multiplayer is untested, so ship single-player only until it is.
- **Layer 2 (hard gate) is possible through the Foederati shape**, not through `Units.StrategicResource` (round 1)
  or `EFFECT_PLAYER_DISABLE_BUILD_UNIT`. It needs a gated copy of each unit with an unused `TraitType` and a grant
  per resource, which is heavier data work and touches upgrades, replacements and the AI. Same one-turn lag on loss.
- **Layer 3 works as data.** Extra per-copy rows in the vanilla shape add to vanilla's bonus; a count threshold goes on
  a child behind has-resource ≥ N and needs the same per-turn re-check when the count drops (§7c).
- **The upgrade gate** (round 1, P2) ships as data today.
- P4 still applies: a working gate leaves the AI with almost no army in gated classes unless it is taught to get the
  resource first.

## 7e. The 1.0 build (watched 2026-10-11, game 1.5.0)

Built in `tower_mods/strategic_resources/`; every item below is in its `docs/verification-runs.md` with run labels.

**Penalty (layer 1).** Each gated unit carries one tag, `SR_SUPPLY_<NAME>`, so one modifier per resource covers it:
`REQUIREMENT_UNIT_TAG_MATCHES` for combat, and the `UnitClass` argument of `EFFECT_CITY_ADJUST_UNIT_PRODUCTION` for
production, which accepts the mod's own tag (Spearman 18 turns at 5 Production without Iron against 12 with it).
Levels: Light -2 and -20% production, Standard -3 and -33% (the rate cut that makes a unit cost half as much again),
Harsh -5 and -50%. Penalty and cancel are attached per major player with the requirement on the child only.

The combat change is made per strength type, and only on units that have that strength (the owner's decision,
2026-10-11). The first build used `Type ALL`, which also took a melee unit's ranged and bombard strength from 0 to -2
(Man-at-Arms 38/-2/-2). A melee unit's ranged and bombard are 0 because it has no such attack, and moving them off 0
in either direction is not safe: a positive value can turn on ranged behaviour. So there is one row for melee strength
(`Type MELEE`) on every gated unit, one for ranged strength (`Type RANGED`) only on gated units whose base
`Unit_Stats.RangedCombat` is above 0, and one for bombard (`Type BOMBARD`) only where `Unit_Stats.Bombard` is above 0,
each through its own tag (`SR_SUPPLY_`, `SR_RANGED_`, `SR_BOMBARD_<NAME>`) built from the dumped tables like the gate
map. The cancel mirrors each row. The curve is split the same way (`SR_CURVE_RANGED_` and `SR_CURVE_BOMBARD_<NAME>`
on the covered units that have those strengths). `tests/data.mjs` fails if any strength row can reach a unit whose
base value for that strength is 0. Watched in each age the same day (`p3b-antiquity`, `p3b-exploration`,
`p3b-modern`): melee units read ranged and bombard 0 with and without their resource; Catapult, Bombard, Xunleichong,
Field Cannon, Mortar and Biplane lose the penalty on all three strengths on gain, and get it back one roll after a loss.

**Re-check.** `ui/sr-recheck.js` forces every alive major at every `TurnBegin` and once at load, with `RESOURCE_CRABS`
as the dummy (valid in every age, read by nothing in the mod; `gainOffMapResource` returned 0, the remove left no entry
and no notification). Watched: losses by clearing (human, AI) and by an enemy pillage (AI) come back one roll later; a
gain and a loss inside one turn are caught; a holder keeps the bonus; in a hotseat game the script logs once that it is
off and does nothing. New fact: a resource put by WorldBuilder on a tile that already had a mine counted in
`getResources()` at once but did not switch the requirement until the next roll; a new mine switches it at once. The
tile's improvement must be the resource kind (`IMPROVEMENT_MINE_RESOURCE`): on a plain `IMPROVEMENT_MINE` a resource put
there never counts, even after rolls (`sr-reload2`, `sr-lab-curve`). Watched after a reload too: the human's loss
(`sr-reload2`), and the AI's (`sr-reload4`: Niter gained by its own expansion at turn 3, lost at turn 4).

**What a copy is (watched 2026-10-11, `p11-import-*`).** A copy is an entry of `player.Resources.getResources()` with
`isOffMap` false: a resource on the map that the player holds, on its own tile under the resource kind of improvement
or imported over a trade route from another civilization's settlement. An import is booked as an ordinary entry, the
same three fields as an owned one, with `value` the plot index of the exporter's tile and `Game.Resources.getOriginCity`
the partner's city; `getOffMapResources()` stays empty and `getCountImportedResources()` counts it. The engine counts
it for `REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE` and for the game's own per-copy bonus the turn the route lands, with
no roll (Field Cannon 32/42/32 to 35/45/35 within seconds of the merchant's `MAKE_TRADE_ROUTE`; preview "+1 Niter
Resource"), for the human and for an AI whose only copy is an import. It leaves two ways: a war with the partner ends
the route and brings the penalty back at once, the declaration re-evaluating the player's requirements; the exporter's
tile losing the resource leaves the route standing, drops the entry at once and brings the penalty back one roll
later, as for an owned tile. Destroying the route's `UNIT_TRADE_SHIP` ends nothing. The panel line follows the live
count both ways, so the mod needed no change. The other ways the game gives a resource all write it onto the map (the
discovery stories' `EFFECT_PLOT_PLACE_RESOURCE`, Niter and Horses among them; the independent-power bonuses'
`EFFECT_CITY_ADD_RESOURCE_TO_PLOT`, Cloves, Lapis Lazuli and Nickel only) or raise the count of Gold, Silver, Tea,
Spices, Furs or Cocoa (`EFFECT_PLAYER_ADJUST_RESOURCE_COUNT_PER_INSTANCE`); a route with a city-state was not watched
(none alive by turn 7). An off-map entry from `gainOffMapResource` counts for nothing (7a). A route does not end on
its own: one made at turn 2 was still supplying at turn 30 (`p11-expiry`; the 20-turn `TRADE_ROUTE_TURN_DURATION_BASE`
is not applied), so an imported copy stays until a war with the partner or the exporter's tile losing the resource.
A plunder by an enemy unit could not be produced from script (`PLUNDER_TRADE_ROUTE` is refused for placed units, and
another player's units cannot be commanded; `p11-plunder`): what it does to the importer's list is known only from
the game's notification text ("Resources received along that route have been lost") and is not watched.

**Late curve (layer 3).** Vanilla's per-copy bonus stops at six copies (`+6 Iron Resource` at 6, 8 and 10 copies,
watched with no data of the mod loaded). Extra per-copy rows in the vanilla shape would stop at six too, so the curve is
flat: +1 combat strength at 8, 10, 12, 14, 16, 18 and 20 copies, one point per two copies past six, on the units
vanilla's per-copy bonus covers in that age (`REQUIREMENTSET_TEST_ANY` over the same tags, so a unit with two of them is
counted once), on each strength the unit has. Watched at every count from 7 to 22 (melee), and for the ranged and
bombard rows on a Field Cannon at 7, 8 and 10 copies in the unit's strengths and in the combat preview (`sr-lab-curve`:
ranged 45, 46, 47 and bombard 35, 36, 37 beside melee 35, 36, 37, with vanilla's "+6 Niter Resource"); a drop across a
threshold is corrected one roll later on all three. Behind the "Strategic Resources Past Six" setup option, default On.

**Upgrade gate: left out of 1.0.** `Units.StrategicResource` blocks training for full civs for good (7a, P1), so it
may only go on units nobody trains. In the three ages the only gated combat units with `CanTrain` 0 that an upgrade
leads to are the Sengoku Samurai tiers 2 and 3 (`scripts/gate-map.mjs` `upgradeOnlyGatedUnits`; the Antiquity and
Modern lists are empty). For the Sengoku the upgrade is the only route to tier 2 and 3 infantry, since the Samurai
replaces the Swordsman line. Gating it would lock one civilization out of its infantry line without Iron while every
other civilization trains its tier 2 infantry at the soft penalty: a hard training gate for one civilization, which
1.0 does not ship. Every other gated unit is trained directly. Pinned by `tests/data.mjs`.

**Setup options.** `GameSetup` parameters in the frontend database (`data/sr-setup.sql`), read by
`ConfigurationValueMatches` criteria combined with `AgeInUse`, one data group per age and value. Play Now writes the
defaults (Standard, On); `GameSetup.setGameParameterValue` before the start writes the others. Watched: Standard and On
load 8 penalty and 14 curve rows in Antiquity; Light with the curve Off loads 12 penalty rows and no curve in
Exploration; Harsh loads 16 and 28 in Modern; Off loads only the 14 curve rows and no unit is penalised.

**Unit panel.** One line under the stats of the selected-unit panel, from a `Controls.decorate("unit-actions")`
wrapper around `setupUnitInfo`, read from the live count, so it shows a loss before the penalty lands. Watched in
English and German, with Readable Tooltips still the plot tooltip winner.

**AI.** 90 turns of Antiquity, seed 4242, mod on and off: the games stayed identical until turn 61 (no AI had built a
gated unit), then diverged; at turn 91 Rome had 14 Warriors and no Iron with the mod, 4 Legions with Iron in the
vanilla game. No crash, no hang, one re-check line per turn. Cost: 16 ms per turn against a noise of 28 ms (one
replicate per arm).

**Save and reload: blocking, open (2026-10-11).** A Modern game with the mod, saved at turn 2 and loaded, came back as
saved (strengths, production cut, setup values, rows, panel line, one "on" line), then died while idle a few minutes
after the load, twice: 205 s after a load from the game page (SIGSEGV on the `AppHost application thread`) and about
4 minutes after a load from the main menu (no crash report). Later the same day the positive control was repeated four
times (`sr-rl-a1` to `sr-rl-a4`: the same save, the same files, the same main-menu load, idle 8 minutes each) and every
run was clean: not reproduced in 4 runs on 2026-10-11. The question is open: two of six loads of that save died, both
in the first two loads of the day. The planned data-only and mod-off arms were not run (they read only against a death
in the control); the mod-off save (`SR-LAB-RELOAD-VANILLA`) and the data-only copy check are prepared. The one crash
with a report carries a signature the game wrote twice in September lab games before this mod existed. Whether to
release with this risk is the owner's call. Runs, hypotheses and the next test: `docs/verification-runs.md`, phase 10.

**Age transitions (watched 2026-10-11, `sr-age1`, `sr-age2`).** With the short-age probe (Antiquity and Exploration end
after 10 points) both transitions passed hands-free: the new age's groups are applied and the old age's are gone
(`Modding.log`), the tags and modifiers are the new age's (72, 166, 232 `SR_` modifiers in Antiquity, Exploration,
Modern), carried units read the new age's penalty (a Catapult carried into Modern as a Field Cannon 32/42/32 without
Niter, a Mortar 37/32/52), a gain in the new age lifts the penalty at once and a loss is re-checked one roll later
(Catapult in Exploration, Tank in Modern), and the log has one "loss re-check on" line per age and one "re-check
(turn start)" line per turn. The Antiquity-start run's Exploration stalled at 9 of 10 points for 22 turns under the
probe (the probe's doing, not the mod's); the Exploration-start run reached Modern at turn 10.

**Next (not in 1.0).**

- Training gate (1.1): the Foederati shape from 7b, a gated copy of each unit with an unused `TraitType` and a grant
  per resource. Depends on 7b (grant unlocks on gain, relocks after a forced re-check) and P4 (the AI builds granted
  units); needs a look at upgrades and unique replacements.
- Building gates: none in 1.0 (units only, the owner's call). A Factory or Railyard on Coal would use the same tag and
  cancel shape on `EFFECT_CITY_ADJUST_CONSTRUCTIBLE_PRODUCTION`.
- Consumption (1.2 question): a script ledger like the depletion mod's; Civ VII has no strategic stockpile.
- Demographics integration: a per-civ series of strategic copies and unsupplied units.
- Multiplayer: the re-check is a UI-page call, not a network request. Needs a probe of whether it changes state on
  every client or only the caller's, before the script may run in multiplayer.
- The upgrade gate on the Samurai tiers, if the owner wants a one-civilization hard gate.

## 8. Setup options

| Option | Values | Default |
| --- | --- | --- |
| Unsupplied Units | Off, Light (-2, -20% production), Standard (-3, -33%), Harsh (-5, -50%) | Standard |
| Strategic Resources Past Six | Off, On | On |

The hard gate has no option in 1.0 (7e).

## 9. Versions

- **1.0**: layer 1, the loss re-check, layer 3, setup options, the unit panel line. Single-player.
- **1.1**: the training gate (Foederati shape).
- **1.2**: open question: Civ VI-style consumption on a script ledger, shared with the depletion mod.

## 10. Decisions (the owner, 2026-10-11)

- Hard gate: not in 1.0. The upgrade gate was to ship where a unit qualified; its only candidates, the Samurai tiers 2
  and 3, would make it a hard training gate for one civilization, so 1.0 leaves it out (7e). The owner can reverse this.
- Units only; no building gates.
- Modern infantry not gated (count bonus only).
- Single-player only. In multiplayer, losing a resource does not bring the penalty back until that player gains a
  resource.
