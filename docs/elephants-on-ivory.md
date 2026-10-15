# Future update: war elephants on Ivory

Scoped on 2026-10-15 from a Workshop comment ("Elephant units should need elephants instead of horses"). Read from the
1.5.0 game files, the dumps in `devtools/gate-map/` and the live database, with a map sample of 32 seeded games for the
balance question. Nothing here is built. Status: scoped, not started; the balance section changes what the
recommendation is, and one decision and a probe are open.

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
capital ends up, straight-line distance, and no trade or imports.

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

   Recommendation: Ivory with three copies if the probe shows the counted requirement works on a unit ability;
   otherwise keep Horses and say why in the reply. Ivory or Horses is dropped: either one lifting the penalty is even
   easier than Ivory only.
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
