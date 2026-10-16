# Future update: war elephants on Ivory

Scoped on 2026-10-15 from a Workshop comment ("Elephant units should need elephants instead of horses"). Read from the
1.5.0 game files, the dumps in `devtools/gate-map/` and the live database, with a map sample of 32 seeded games for the
balance question. Nothing here is built. Status: scoped, not started; the balance section changes what the
recommendation is, and one decision and a probe are open. A second pass the same day put the four options side by side
("Side by side" below), with the AI and the Horses question, and wrote the probe and a wider sample as lab recipes;
the decision is the owner's, at the end.

## The units

| Unit | Civilization | Age | Today | Why |
| --- | --- | --- | --- | --- |
| Yuthahathi (`UNIT_DANTINAS_TATHA`, `_2`) | Khmer | Antiquity | Horses | Cavalry tag; replaces the Chariot and Horseman |
| Purabhettarah (`UNIT_PURABHETTARAH`, `_2`) | Maurya | Antiquity | Horses | Cavalry tag; replaces the Chariot and Horseman |
| Voi Chien (`UNIT_VOI_CHIEN` 1-3) | Đại Việt (DLC) | Exploration | free | Ranged; replaces the Heavy Archer, Crossbowman and Arquebusier |
| Chang Beun (`UNIT_CHANG_BEUN` 1-3) | Siam | Modern | Niter | Mounted and ranged; replaces the Field Cannon, Field Gun and AT Gun |

The update covers the two Antiquity elephants. Ivory isn't an Empire resource after Antiquity (it's Bonus class in
Exploration and Modern), so it can't stand beside Horses and Niter there, and the Voi Chien and Chang Beun keep what
the unit they replace needs. Both Antiquity elephants become Coursers at the age change (Cavalry is a shadow tag that
Exploration maps to `UNIT_COURSER`), and Coursers need Horses as before.

## Ivory in Antiquity

- Empire class, the same as Horses, and tradeable, so it should count, import and trade the same way. That's read
  from the data, not watched.
- Harvested with a Camp (Horses use a Pasture). Neither has a tech unlock.
- Spawns on eight kinds of tile: desert flat, sagebrush, grassland forest, plains flat and hill, watering hole,
  tropical flat and rainforest. Horses spawn on grassland flat and plains flat only.
- Weight 1.0 like Horses, and it isn't a staple (Horses are), but the map script sizes each resource by how many tiles
  can take it, so Ivory comes out about seven times as common as Horses (see below). Every one of 32 sampled maps had
  it.
- Its effect today: +1 Culture and +10% wonder Production in plains, tropical and desert cities. No unit uses it.
- Start biases: Khmer lean tropical (5) and floodplain (40); Maurya lean vegetated (5). Tropical and vegetated land
  suits Ivory better than Horses; floodplains take neither.

## Balance: Ivory is far easier to get than Horses

The worry was that Ivory is rarer than Horses, so elephants on Ivory would be harder to supply. It's the other way
round. The map script (`resource-generator.js`, `placeResourcesWithBlueNoise`) sets each resource's count from the
number of tiles that can take it: on a Small map Horses have about 160 to 190 eligible tiles and Ivory about 540, so the
script asks for about 4 Horses and 23 to 31 Ivory (its own log: `RESOURCE_HORSES: desired=4.17 ... 3 hits`,
`RESOURCE_IVORY: desired=23.21 ... 24 hits`).

The sample: 32 seeded Antiquity Play Now games (Small, six players), 20 on Continents, 6 on Pangaea and 6 on Fractal,
with player 0 set to Khmer and player 1 to Maurya, read at turn 1 by `devtools/probes/ivory-balance/ivory-sampler.mjs`
(raw rows beside it). Distance is in tiles from each player's founding unit; "own landmass" uses the plot's area id.

| Map | Maps | Horses per map | Ivory per map |
| --- | --- | --- | --- |
| Continents | 20 | 3.8 (3 to 5) | 25.9 (18 to 33) |
| Pangaea | 6 | 4.5 | 29.2 |
| Fractal | 6 | 4.2 | 27.5 |

| Starts and resource | Starts | Within 3 | Within 5 | Within 8 | None on own landmass | Median nearest |
| --- | --- | --- | --- | --- | --- | --- |
| Khmer and Maurya, Ivory | 64 | 48% | 75% | 95% | 0% | 4 |
| Khmer and Maurya, Horses | 64 | 12% | 22% | 36% | 3% | 11 |
| Every other civilization, Horses | 128 | 12% | 23% | 40% | 6% | 11 |
| Every other civilization, Ivory | 128 | 55% | 77% | 93% | 2% | 3 |

What it means:

- **Today the elephants are on equal terms.** Khmer and Maurya find Horses as often as everyone else does (36% against
  40% within 8 tiles), so their elephants are as hard to supply as anyone's Chariot or Horseman.
- **Ivory only would make them the easiest supplied cavalry in the game.** 95% of Khmer and Maurya starts have Ivory
  within 8 tiles, against 40% of other starts with Horses. These are already strong units: the Yuthahathi is 35 Combat
  Strength for 70 Production where the Chariot it replaces is 30 for 80, and the Purabhettarah matches the Chariot
  with +5 against fortified districts, also for 70. The elephants move 2 where the Chariot moves 3.
- **What would be even.** The share of Khmer and Maurya starts with at least N Ivory within 8 tiles: 1 copy 95%,
  2 copies 78%, 3 copies 58%, 4 copies 34%. Needing 3 or 4 Ivory lands where everyone else's single Horses does.
  Needing both Ivory and Horses lands at 34%.
- **A side finding on Horses themselves.** Only 2.3 of 6 starts per map have Horses within 8 tiles, and 2 of 32 maps
  had none within 8 tiles of any start. Antiquity cavalry under this mod is short of Horses for most players, Khmer
  and Maurya included. That's vanilla placement, and it's worth its own look at the Antiquity Horses penalty.

Limits of the sample: Small maps only, the three Voronoi scripts, turn-1 founder positions rather than where the
capital ends up, straight-line distance, and no trade or imports. One more, found on the second pass: the sampler sets
only players 0 and 1, and the other four slots kept civilizations from later ages in 93 of the 128 "every other" starts
(53 Exploration, 40 Modern), so that row mixes in start biases an Antiquity game wouldn't have. The 35 Antiquity
civilizations among them read the same: 37% with Horses within 8 tiles, every one with Ivory within 8.

## Side by side (2026-10-15)

### Which civilizations have war elephants

The four units in the table at the top, checked against the compiled Antiquity database
(`gameplay-copy-usualset-antiquity-seed4242-20261015-150736.sqlite`) and the base data. The Yuthahathi is 35 Combat
Strength for 70 Production (its second tier 40 for 110) and the Purabhettarah 30 for 70 (35 for 110), against the
Chariot's 30 for 80 and the Horseman's 35 for 120; all of them unlock with The Wheel, and the second tiers with Iron
Working. Khmer and Maurya are base-game civilizations and Ivory a base-game resource, so no option here writes a row a
DLC owner could be missing; the Voi Chien is Đại Việt's (DLC), which is one more reason the options leave it alone.
Every option below is about the two Antiquity elephants only. The Voi Chien stays free and the Chang Beun stays on
Niter whatever the owner picks, since Ivory is a Bonus resource after Antiquity.

### Who can field them on the typical map

The 32-map sample above (Small, six players, founders at turn 1). Each cell is the share of starts with what the option
asks for within 8 tiles, and within 5 tiles in brackets. Within 5 is about what a first city reaches; within 8 takes a
second or third settlement in that direction.

| Option | Khmer (32 starts) | Maurya (32 starts) | Both (64) | Everyone else's Horses today (128) |
| --- | --- | --- | --- | --- |
| Keep Horses | 41% (22%) | 31% (22%) | 36% (22%) | 40% (23%) |
| Ivory, three copies | 69% (12%) | 47% (16%) | 58% (14%) | 40% (23%) |
| Ivory and Horses | 41% (19%) | 28% (12%) | 34% (16%) | 40% (23%) |
| Ivory only | 97% (75%) | 94% (75%) | 95% (75%) | 40% (23%) |

Read as "can field them on the typical map":

- **Keep Horses.** Usually neither can: 59% of Khmer starts and 69% of Maurya starts had no Horses within 8 tiles, and
  on 13 of the 32 maps neither of them did. Their elephants fight at the penalty until they import Horses, exactly like
  everyone else's Chariots.
- **Ivory, three copies.** Khmer usually can, once it has settled toward the Ivory; Maurya about half the time. Hardly
  anyone has three within a first city's reach (14%), so the third copy is a settling decision.
- **Ivory and Horses.** Usually neither can, about as often as with Horses alone, since Horses are the scarce half.
- **Ivory only.** Both nearly always can, most of them from their first city.

### What each option needs, and what it does to the AI

| Option | Data and text | Unit panel, pill, notification | Gated Units | AI |
| --- | --- | --- | --- | --- |
| Keep Horses | Nothing | Nothing | As today | As today |
| Ivory, three copies | The gate-map override, a counted requirement (`REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE`, `Amount` 3) on the elephants' penalty and cancel rows in place of one copy, and texts that say "3 Ivory" | A per-unit threshold in `ui/sr-supply.js`; today one copy lifts everything | The column counts against one minimum for every unit, set to one copy, so a gated elephant trains with one Ivory and fights at the penalty until the third | Builds elephants with one or two Ivory and fights at -3; nothing in its data makes it look for a third |
| Ivory and Horses | Two tags on each elephant, so the two penalties stack (-6 with neither, at Standard); texts for both | The UI keeps one resource per unit (`buildSupplyIndex` keeps whichever tag it reads last); it would need a list | The column takes one resource, so the gate would hold only one of the two | Penalised on whichever it lacks, which is usually Horses |
| Ivory only | The gate-map override, and five text keys in twelve languages | Nothing: every line composes the resource's name | `RESOURCE_IVORY` in the column; locks almost no one | Khmer and Maurya AIs field supplied elephants in nearly every game, where today most of them can't |

Whether the AI's unit choice reads the requirement, from its data: it doesn't. No column in any of the game's AI tables
(`AiFavoredItems`, `AiLists`, `UnitAiInfos`, `Strategies`, `StrategyConditions`, `PseudoYields` and the rest) names a
resource, and no strategy condition tests one. The elephants' weight is a flat 50 in "Khmer Unit Biases" and "Maurya
Unit Biases" (`age-antiquity/data/ai-shared.xml:195-196, 210-211`) whatever the empire holds. Settling weighs resource
classes, not resources: Empire class counts 3 by default, and Horses and Ivory are both Empire class in Antiquity, so no
option changes where an AI settles. What stops the AI is the engine. Under Gated Units its build is refused like yours
and it moves on: in `p15-ai-antiquity-on` no AI held Iron before turn 91, and Goryeo and Đại Việt built Warriors,
Slingers, Archers, settlers, buildings and wonders, with no queue stuck. Under the penalty alone it builds the unit
anyway and the unit fights at -3 (`p9-control`: Rome had 14 Warriors and no Iron at turn 91, against 4 Legions with Iron
in the game without the mod, though the two games had parted by then). What a Khmer or Maurya AI builds in place of an
elephant it can't supply is a lab reading; the recipe is in "Probe first" below. The game's `AI_UnitBroker.csv` logs
the one unit chosen for each need (city defence, standing army, scouting) with its value, not the units passed over,
so it has to be read for the same seed with and without Ivory.

### The side question: Antiquity Horses where they're scarce

From the same sample, all 192 starts:

- 39% had Horses within 8 tiles and 23% within 5. On average 3.7 of the 6 starts on a map had none within 8.
- 30 of the 32 maps had fewer Horses than major civilizations: 3 Horses on 11 maps, 4 on 12, 5 on 7, 6 on 2.
- Starts per map with Horses within 8 tiles: none on 3 maps, one on 4, two on 9, three on 12, four on 4.
- By map script: Continents 34% of starts, Pangaea 42%, Fractal 50%.

In plain words: on a typical Small map, three or four of the six civilizations start with no Horses within 8 tiles, and
there are fewer Horses than civilizations, so under the default Standard setting most players' Chariots and Horsemen
fight at -3 and train a third slower unless they trade for Horses. Imports count from the turn the route lands (phase
11), so trade is the way out, and the AI does make routes (`p11-import-ai`). That's vanilla placement meeting the mod's
rule, and it's a call of its own: leave it, since Horses being worth fighting and trading for is the point, or soften
Horses in Antiquity only, which would be a new per-resource setting. Nothing here decides it.

## Decisions for the owner

1. **Which requirement.** In order of how even they keep things:
   - **Keep Horses.** Even by construction and no work, but it doesn't answer the comment.
   - **Ivory, three copies.** Thematic and about as even as it gets (58% within 8 tiles; four copies is 34%). The
     game has the requirement for it: `REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE` with an `Amount`, used by vanilla
     narrative events (`Amount 4` of `RESOURCE_HORSES` in `age-antiquity/data/narrative-stories-gameeffects.xml`),
     though never on a unit ability, so it needs the probe. Costs: the Gated Units column only knows "any", so under the
     gate an elephant would train with one Ivory and fight at the penalty until it had three; the pill, panel and
     notification in `ui/sr-supply.js` would need a per-unit threshold; and the text must say "needs 3 Ivory".
     This breaks the mod's one rule that a single copy lifts the penalty.
   - **Ivory and Horses.** Even (34%), but the elephants then need two resources, the UI assumes one per unit, and
     the gate column takes one.
   - **Ivory only.** The comment's ask and the least work, but the balance numbers above make it a clear buff to two
     civilizations whose elephants are already strong.

   Recommendation from the first pass, written before "Side by side": Ivory with three copies if the probe shows the
   counted requirement works on a unit ability; otherwise keep Horses and say why in the reply. Ivory or Horses is
   dropped: either one lifting the penalty is even easier than Ivory only. The second pass adds that three copies are
   even only at 8 tiles; within a first city's reach 14% of Khmer and Maurya starts have them.
2. **The game's +1 per Horses.** The elephants keep the base game's +1 Combat Strength per Horses, and the mod's
   strength past six follows it, because both go by the Cavalry tag. A Khmer player would be penalised for having no
   Ivory and still scale with Horses. Leaving that alone keeps the mod from changing a base-game bonus; the other way
   is a per-copy +1 per Ivory on the elephants alone, written by the mod, which is new rules rather than a gate.
   Recommendation: leave the base game's Horses bonus alone and add nothing.
3. **What the Horses description says.** For a Khmer or Maurya player, Horses would supply no units in Antiquity
   (their own elephants replace the Chariot and Horseman), so the "Supplies units:" line drops off the Horses tooltip
   and appears on Ivory instead. That's correct, and it's how the player learns about the change. No decision needed
   unless it should be called out somewhere else too.

## What it would take (Ivory only)

- `scripts/gate-map.mjs`: an override by unit type checked before the replaced-unit lookup in `buildGateMap`
  (`test` only sees the unit being replaced, so a rule placed first in `GATES` can't see the elephant), mapping the
  four elephant types to `RESOURCE_IVORY`. `build-data.mjs` then writes `SR_SUPPLY_IVORY`, the penalty and gate rows
  and the pedia rows from `gatedResources(age)` with no other change.
- Text: five new keys per language, `LOC_SR_PEDIA_UNIT_IVORY_{LIGHT,STANDARD,HARSH}` and
  `LOC_SR_PEDIA_UNIT_IVORY_GATE_{TRAINING,UPGRADE}`, sixty strings across twelve languages. Rewrite the
  "Horses, Iron, Niter, Oil, Coal or Rubber" lists, the Antiquity row of the pedia table, the README table and
  DESIGN.md section 4. The resource line, notification and combat preview compose the resource name and need nothing.
- Icons: Ivory already has resource icons; the panel and pills read them through `UI.getIconURL`.
- Tests: `tests/data.mjs` pins the Antiquity map (add `RESOURCE_IVORY`, drop the four from Horses); the live-database
  check loops over `gatedResources` and follows on its own.
- No new setup options or hand-written tags.

## Probe first

One lab game in Antiquity as Khmer, then Maurya, before any data is written:

1. With `Units.StrategicResource` set to Ivory on the Yuthahathi, does a Camp on Ivory lift the lock, and does
   `canStart` read it the way it reads Horses?
2. Does the penalty lift on the Camp at once and come back one turn after the Ivory is cleared?
3. Does an imported Ivory count?
4. Answered by the balance sample above. For the three-copy option instead: does
   `REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE` with `Amount 3` work as a unit ability's owner requirement, flip at once
   on the third Camp, and flip back one turn after a copy is cleared?
5. AI: a Khmer and a Maurya AI with no Ivory, with and without the change, as the Iron soak did. Their elephants are
   weighted at 50 in `ai-shared.xml`, and nothing in the AI tables plans for a named resource.
6. At the Exploration transition, the carried elephant becomes a Courser and reads the Horses penalty at once.

### The probe as a lab recipe (written 2026-10-15, not run)

All six need a game; none ran in the 2026-10-15 offline pass. The probe is a throwaway data mod in
`devtools/probes/ivory/`, shaped like `probe4f` (load order 9000, after the mod's 200 to 202, Antiquity only, never
shipped):

- `ivory-tags.sql`: `INSERT OR IGNORE INTO Tags (Tag, Category) VALUES ('SR_SUPPLY_IVORY', 'UNIT_CLASS');`, then
  `DELETE FROM TypeTags WHERE Tag = 'SR_SUPPLY_HORSES' AND Type IN (<the four elephants>);` and the guarded insert
  `INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_SUPPLY_IVORY' FROM Types WHERE Type IN
  ('UNIT_DANTINAS_TATHA', 'UNIT_DANTINAS_TATHA_2', 'UNIT_PURABHETTARAH', 'UNIT_PURABHETTARAH_2');`, and for question 1
  `UPDATE Units SET StrategicResource = 'RESOURCE_IVORY' WHERE UnitType IN (<the four>);` (the mod's Gated Units
  group writes the minimum parameters).
- `ivory-modifiers.xml` and `ivory-game.xml`: copies of the five `SR_ATTACH_*_HORSES` modifiers, their children and
  their `GameModifiers` rows from `data/sr-antiquity-standard-*.xml`, with `RESOURCE_IVORY`, `SR_SUPPLY_IVORY` and
  `_IVORY` ids in place of the Horses ones.
- `ivory-three-modifiers.xml`: the same with `Amount` 3 on the cancel rows' `REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE`,
  in place of `ivory-modifiers.xml`, for question 4.

Then, with the mod deployed (`node scripts/deploy.mjs`) and the probe copied into `Mods/`:

1. `SR_LAB_CIV=CIVILIZATION_KHMER SR_LAB_SETUP='{"StrategicResourcesThatMatterGate":"SR_GATE_TRAINING"}' node
   devtools/sr-lab.mjs lab start --seed 4242 --age AGE_ANTIQUITY`. Found the capital, unlock The Wheel. Read
   `Game.CityOperations.canStartQuery` for the Yuthahathi: refused, and listed greyed with "Locked: no Ivory". Write
   Ivory on a bare owned tile with `WorldBuilder.MapPlots.setResource` and expand onto it, so it gets its Camp:
   `Success` within the turn. Pass: the lock follows the Camp as it follows a Pasture for the Chariot.
2. Place a Yuthahathi with no Ivory: `getMeleeStrength(false)` 32 (35 - 3). Camp lands: 35 at once. Clear the tile
   with `setResource(-1)`: 35 until the roll, 32 after it.
3. Make a trade route to a partner whose settlement exports Ivory, as in `p11-import-1`: the entry appears in
   `getResources()` with `isOffMap` false and the penalty lifts the turn the route lands.
4. With `ivory-three-modifiers.xml` instead: 32 with one and two Camps, 35 on the third at once, 32 one roll after one
   is cleared. If the counted requirement doesn't flip on a unit ability, the three-copy option is off the table.
5. AI, the same seed with Khmer and Maurya as AI players (players 1 and 2, every other slot an Antiquity
   civilization), Gated Units on Training, 60 turns ended as a player would, with the game's AI logging on so
   `AI_UnitBroker.csv` is written. Once with the probe and once without, and once each with Ivory cleared from every
   tile within 8 of the two capitals at turn 1 (`setResource(-1)`). Every ten turns: each AI's units, its Ivory and
   Horses, its current production. Then read `AI_UnitBroker.csv` for players 1 and 2: which unit fills "Standing Army"
   and "City Defense Units" in each arm. Pass for the question: what they build when the elephant is locked, and that no
   queue sticks.
6. Run the Antiquity game into Exploration with `devtools/sr-short-age-probe` on, a Yuthahathi alive and no Horses:
   in Exploration it's a Courser at the Horses penalty (37), and a Camp on Ivory changes nothing.

Restore `Mods.sqlite` and `Mods/` afterwards, as the lab rules ask.

### The wider sample (other map sizes, capitals), written 2026-10-15, not run

`ivory-sampler.mjs` needs a running lab game: it drives the main menu over the Tower Bench port, starts each seed
with Play Now settings and reads the map at turn 1. Nothing on disk covers another size or the capitals, so this part
is a lab run too. Three changes to the sampler, then the same command:

- **Size.** After `setScript`, `Configuration.editMap().setMapSize(process.env.SIZE)`, then
  `Configuration.editMap().setMaxMajorPlayers(n)` and
  `Configuration.editGame().setParticipatingPlayerCount(n + Configuration.getGame().hiddenPlayerCount)`, with `n` the
  size's `DefaultPlayers` (Tiny 4, Small 6, Standard 8, Large 10, Huge 10), the way the base game's
  `ui/automation/automation-test-support.js:150-170, 261` does it.
- **Every slot Antiquity.** Set each AI slot's civilization with `setCivilizationTypeName`, cycling through Aksum,
  Egypt, Greece, Han, Maya, Mississippian, Persia and Rome, so the comparison row reads Antiquity start biases.
- **Capitals at The Wheel.** After Begin Game, found the local capital
  (`UNITOPERATION_FOUND_CITY` on the founder), then end turns until every alive major has The Wheel
  (`Players.get(pid).Techs.isNodeUnlocked("NODE_TECH_AQ_WHEEL")`) or turn 40. Per major, from
  `Players.get(pid).Cities.getCapital().location`: Ivory and Horses within 3, 5 and 8 tiles and on its own landmass,
  the copies it holds (`Resources.getResources()`), and the turn it got The Wheel.

Seeds 101 to 120 on Continents at Standard and at Large, and 6 each on Pangaea and Fractal at Standard: about 52 games.
Count, per option and per civilization, the share of capitals that can supply the elephants at the turn they unlock,
and how many civilizations have none of each.

## Trade-offs

- **Keep Horses** costs nothing and keeps the elephants exactly as hard to supply as everyone's cavalry. The player who
  asked gets a reply instead of a change, and an elephant that needs Horses still reads oddly.
- **Ivory, three copies** is the thematic answer that stays roughly even, but only once a player settles toward the
  Ivory: from the first city almost nobody has three. It breaks the mod's one rule that a single copy lifts the
  penalty, it needs a per-unit threshold in the UI and new wording in twelve languages, the gate can only count one
  copy, and the AI will build elephants at the penalty without looking for the third. It also waits on probe question
  4: if the counted requirement doesn't work on a unit ability, this option is gone.
- **Ivory and Horses** is even, but in practice it's the Horses rule with Ivory added on top: the scarce half decides.
  It's the most work (two resources per unit in the data, the UI and the gate) for the least visible change.
- **Ivory only** is what was asked for and the least work. It turns two strong units into the best-supplied cavalry in
  Antiquity, for the human and for the AI: about 95% of Khmer and Maurya starts against 40% of everyone else's for
  Horses.

Whatever the choice, the Horses side question stands on its own: most civilizations on a Small map start with no
Horses within 8 tiles.

Decision (the owner):
