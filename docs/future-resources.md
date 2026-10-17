# Future update: more resources, more units

Scoped on 2026-10-12 from the owner's questions after the 1.0.0 release ("we missed Uranium for nukes? Timber for
Exploration ships?" and "there are absolutely nukes"). Status: Hardwood is built (1.2, DESIGN.md 7h): the
Exploration heavy warships from tier 2 draw on it instead of Niter, by one rule in `gate-map.mjs`, and two resources
per unit exist as the Modern Supply Chains option, with the second one held by the grant-only lines rather than the
column. Pitch, Tin and the nuclear weapons are still open. Map placement and icons for Hardwood and Pitch, which
resource gates a unit that could need two, and the probe as a lab recipe were added on 2026-10-15 ("Hardwood and
Pitch on the map" below); the Hardwood probe became the 1.2 lab run instead.

## What the game has (1.5.0, read from the dumped tables in `devtools/gate-map/`)

Civilization VII has no "strategic" resource class. Its classes are Bonus, City, Empire, Treasure (Exploration) and
Factory (Modern). The six the mod gates, Horses, Iron, Niter, Oil, Coal and Rubber, are Empire-class resources that
the base game itself ties to military units through its per-copy Combat Strength bonuses; the gate map follows those
bonuses, which is why the set is six and not "every strategic resource".

- **Nuclear weapons exist, Uranium does not.** In the Modern age, Nuclear Fission unlocks the Manhattan Project
  wonder, which grants an Atomic Bomb (`WMD_NUCLEAR_DEVICE`, an inventory item of kind WMD, not a unit) and
  unlocks two city projects: Produce Nuclear Weapon (`PROJECT_PRODUCE_WMD`, cost 1000, repeatable) and Operation Ivy
  (`PROJECT_OPERATION_IVY`, cost 2400, once, +1 blast radius, the Military legacy path's last step). A bomb is
  delivered by the WMD Strike action of a Bomber based in an aerodrome, a squadron or a carrier; a thermonuclear
  device (`WMD_THERMONUCLEAR_DEVICE`) is defined too. None of these rows names a resource: the wonder needs the
  tech, the projects need the wonder (`PrereqConstructible`), and no Uranium, Plutonium or other resource exists in
  any age's tables. The unit table alone misses all of this, which is how the first read of "no nukes" went wrong.
- **Hardwood** exists in all three ages as an Empire resource, with no unit tied to it in the base game. Timber is
  not a resource. One locally installed overhaul (Homo Ludens) ties its Carrack to Hardwood, which shows the engine
  takes any resource in `Units.StrategicResource`.
- **Pitch** (Bonus class in every age's tables, but placed on the map in Exploration and Modern only) is the other
  ship-flavoured resource; the base game ties no unit to it either.

## Candidates

| Resource | Units that would read as needing it | Notes |
| --- | --- | --- |
| Hardwood | Exploration warships: Cog, Carrack, Galleon, Ship of the Line, Privateer; Antiquity Galley and Quadrireme | Carrack and Galleon already need Niter; a second resource per unit means a second gate map column, which the penalty's tags and the engine's single `StrategicResource` column do not have. The cleaner cut is Hardwood on the hull line the mod leaves free today (Cog, Ship of the Line, the Antiquity galleys) and Niter where it is |
| Pitch | Ships, as an alternative to Hardwood | Bonus class; weaker fit |
| Tin | Antiquity second-tier infantry beside Iron, for the Bronze Working flavour | Bonus class; the same two-resources-per-unit problem |
| Nuclear weapons | The Manhattan Project wonder, Produce Nuclear Weapon and Operation Ivy | No resource to hang them on: Uranium is not in the game. Delivery already runs through the Bomber, which the mod gates on Rubber. A gate on the bombs themselves is a different mechanism from the unit column: a wonder can take a requirement on its unlock, and a project a production modifier behind a has-resource requirement (soft), but whether a project can be refused outright on a resource is a probe, not a known fact. The stand-in resource would be a design choice (Oil, Coal, or a new Uranium resource added by the mod with its own map placement, which is a far larger change) |

## What it would take

- One `supplyTag` per new resource and the unit rows in `scripts/gate-map.mjs`; `scripts/build-data.mjs` writes the
  rest (tags, penalty modifiers per level, the gate column, the pedia lines), and `tests/data.mjs` pins the output.
- The engine takes one resource per unit in `Units.StrategicResource`. A unit that should need two (a Galleon on
  Niter and Hardwood) cannot be gated on both; the soft penalty can stack two tags, the hard gate cannot. Decide per
  unit which resource gates it before any data is written. What the code does today (read 2026-10-15): the first rule
  in `GATES[age]` that matches the unit, or the unit it replaces, wins (`scripts/gate-map.mjs:7`; `buildGateMap`
  takes `find` at `:138` into a map of one resource per unit). So the order of the rules is the decision: a Hardwood
  rule placed after the two Niter rules leaves the Carrack, the Galleon and their uniques on Niter and takes only the
  ships those rules pass over; placed before them, it takes every ship it matches off Niter. Everything downstream
  follows that one resource: the single `SR_SUPPLY_` tag, the column, the pedia line, and the UI, whose index keeps
  one resource per unit (`buildSupplyIndex` in `ui/sr-supply.js`; a unit with two `SR_SUPPLY_` tags would show
  whichever row it read last). Two per unit would need a list in the gate map, two stacking penalties and that index
  rewritten, and the column would still take one.
- Texts: the resource line and pedia lines per resource, twelve languages; the setup descriptions stay.
- A probe first: one unit, one new resource, one lab game, read `canStart` and the panel before building the map.
  Written out below ("The probe, as a lab recipe").
- Watch the AI: a ship line gated on Hardwood changes what coastal AIs build in Exploration; a soak with and without
  it, as phase 15 did for Iron.

## Hardwood and Pitch on the map (read 2026-10-15)

Read from the compiled Antiquity and Modern databases
(`gameplay-copy-usualset-antiquity-seed4242-20261015-150736.sqlite` and
`other_peoples_mods_analysis/_debug-db/gameplay-copy.sqlite`), the game's map scripts and its icon files. The mod
doesn't place resources: the game's map script does, so "placement" here is where the game already puts them.

| | Hardwood | Pitch |
| --- | --- | --- |
| Class | Empire in all three ages | Bonus in all three ages |
| Placed in (`Resource_ValidAges`) | Antiquity, Exploration, Modern | Exploration and Modern; never on an Antiquity map |
| Tiles (`Resource_ValidBiomes`) | Tundra flat (open, taiga, tundra bog) and hill; tropical flat (open, rainforest, mangrove) and hill | Tundra with taiga, plains with forest, grassland with savanna woodland; flat only |
| Improvement | Woodcutter (`IMPROVEMENT_WOODCUTTER_RESOURCE`), no tech | The same |
| Map script | Weight 1.0, at least one per landmass, lake-eligible, not a staple | The same |
| Its own effect | +10% Production towards naval units (its tooltip), +1 Culture | +1 Gold on water buildings (its tooltip), +1 Gold and +1 Production |
| Icon | `blp:resicon_hardwood`, and `_fow` under fog (`base-standard/data/icons/resource-icons-v2.xml:37, 102`) | `blp:resicon_pitch` and `_fow` (`:57, 127`) |

What it means for the mod:

- **Icons need nothing new.** The panel cell draws a resource's icon through `UI.getIconURL(resourceType)`
  (`ui/sr-unit-panel.js:77-78`), and every text composes the resource's own name, so both resources show like Horses.
- **Hardwood sits where Niter, Oil, Coal and Rubber already are.** None of them is a staple. Which resource types a map
  gets is chosen inside the game (`ResourceBuilder.getGeneratedMapResources`, called by `maps/resource-generator.js`),
  and each age allows fewer types per map (`Resource_Distribution.MaxResourceTypes`: 25, 25, 27) than it has valid ones
  (35, 41, 35). Read from the data, not watched: the staples (Horses and Iron among them) look like the ones always
  kept, so a map may come without Hardwood, as it may come without Niter today; how often is a lab count (below). It
  only turns up on tundra and in the tropics, so a temperate start is far from it.
- **Pitch has two questions the others don't.** It's never placed in Antiquity, so it can't gate the galleys. And it's
  Bonus class: the mod's idea of a copy (an entry of `player.Resources.getResources()`, watched for Empire resources in
  phase 11) hasn't been checked for a Bonus resource, which the game assigns to a settlement. That's the probe's first
  question for Pitch.
- **The ships today.** In Exploration the Niter rule takes heavy warships from tier 2 (Carrack, Galleon; Cetbang,
  Corsair, Kalam, Vikingr 2 and 3). Left free: the tier-1 heavy ships (Cog; Cetbang, Corsair, Kalam, Vikingr 1) and the
  light ones (Sloop 1 to 3, Privateer 1 and 2). In Antiquity no ship is gated: Galley, Quadrireme, Dhow 1 and 2, and the
  Kalia 1 and 2 (DLC). In Modern the Ship of the Line (`UNIT_FRIGATE`) is free. Any Hardwood rows for a DLC ship (the
  Kalia) go through the guarded `Types` insert, like every tag since 1.0.2.

### The probe, as a lab recipe (written 2026-10-15, not run)

One unit, one new resource, one game, before any gate-map rule is written. A throwaway data mod in
`devtools/probes/hardwood/`, shaped like `probe4f` (load order 9000, Exploration only, never shipped):

- `hardwood.sql`: the three tags (`SR_SUPPLY_HARDWOOD`, `SR_RANGED_HARDWOOD`, `SR_BOMBARD_HARDWOOD`) as
  `INSERT OR IGNORE INTO Tags (Tag, Category) VALUES (..., 'UNIT_CLASS')`, each put on the Cog with the guarded
  `INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, '<tag>' FROM Types WHERE Type IN ('UNIT_COG');` (it has
  all three strengths: 30, 35 ranged, 30 bombard), and `UPDATE Units SET StrategicResource = 'RESOURCE_HARDWOOD'
  WHERE UnitType = 'UNIT_COG';`.
- `hardwood-modifiers.xml` and `hardwood-game.xml`: copies of the nine `SR_ATTACH_*_NITER` modifiers (combat, ranged,
  bombard, production and preview), their children and their `GameModifiers` rows from
  `data/sr-exploration-standard-*.xml`, with `RESOURCE_HARDWOOD`, the Hardwood tags and `_HARDWOOD` ids.
- A Pitch twin (`pitch.sql`, `pitch-*.xml`) on the Sloop, the same shape (30, 5 ranged, 5 bombard).

Then, with the mod deployed and the probe in `Mods/`, `SR_LAB_SETUP='{"StrategicResourcesThatMatterGate":
"SR_GATE_TRAINING"}' node devtools/sr-lab.mjs lab start --seed 4242 --age AGE_EXPLORATION`, a coastal capital:

1. `Game.CityOperations.canStartQuery` for the Cog with no Hardwood: refused, listed greyed with "Locked: no
   Hardwood" and the Hardwood icon in the pill.
2. Place a Cog: 27/32/27, each 3 below its base. Select it: the panel cell shows the Hardwood icon and "Unsupplied:
   no Hardwood (-3 Combat Strength, slower to train)".
3. Write Hardwood on a bare owned tropical or tundra tile (`WorldBuilder.MapPlots.setResource`) and expand onto it, so
   it gets the Woodcutter: the Cog trainable within the turn, its strength back at once, the panel cell gone, and the
   Hardwood description (`describeResourceSupply`) reading "Needed to train: Cog."
4. Clear the tile: the lock back within the turn, the penalty one roll later.
5. The same four steps for Pitch on the Sloop. If step 3 doesn't count the Pitch tile in `getResources()`, a Bonus
   resource can't supply units and Pitch is out.
6. The map count, from the same run's setup: `ivory-sampler.mjs`'s `measure` with `RESOURCE_HARDWOOD` and
   `RESOURCE_PITCH` in place of Horses and Ivory, 20 Exploration seeds on Continents at Standard: how many maps carry
   each, how many per map, and how many starts have one within 8 tiles.

Restore `Mods.sqlite` and `Mods/` afterwards.

## Not in scope

Resources that only feed yields (Limestone, Marble, Rice, the treasure fleet goods) and the Factory resources; the
mod is about units.
