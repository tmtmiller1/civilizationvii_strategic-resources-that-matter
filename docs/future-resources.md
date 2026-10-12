# Future update: more resources, more units

Scoped on 2026-10-12 from the owner's questions after the 1.0.0 release ("we missed Uranium for nukes? Timber for
Exploration ships?" and "there are absolutely nukes"). Nothing here is built. Status: scoped, not started.

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
- **Pitch** (Bonus class, all ages) is the other ship-flavoured resource; the base game ties no unit to it either.

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
  unit which resource gates it before any data is written.
- Texts: the resource line and pedia lines per resource, twelve languages; the setup descriptions stay.
- A probe first (the disproof gate in `CLAUDE.md`): one unit, one new resource, one lab game, read `canStart` and the
  panel before building the map.
- Watch the AI: a ship line gated on Hardwood changes what coastal AIs build in Exploration; a soak with and without
  it, as phase 15 did for Iron.

## Not in scope

Resources that only feed yields (Limestone, Marble, Rice, the treasure fleet goods) and the Factory resources; the
mod is about units.
