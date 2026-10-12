# Future update: more resources, more units

Scoped on 2026-10-12 from the owner's question after the 1.0.0 release ("we missed Uranium for nukes? Timber for
Exploration ships?"). Nothing here is built. Status: scoped, not started.

## What the game has (1.5.0, read from the dumped tables in `devtools/gate-map/`)

Civilization VII has no "strategic" resource class. Its classes are Bonus, City, Empire, Treasure (Exploration) and
Factory (Modern). The six the mod gates, Horses, Iron, Niter, Oil, Coal and Rubber, are Empire-class resources that
the base game itself ties to military units through its per-copy Combat Strength bonuses; the gate map follows those
bonuses, which is why the set is six and not "every strategic resource".

- **Uranium** does not exist in 1.5.0, in any age, and the game has no nuclear units. Nothing to gate until an age
  or an expansion adds it; when one does, it is one row in the gate map per unit, one tag, the texts in twelve
  languages and the Civilopedia lines, the same shape as the six.
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
| Uranium | Nothing yet | Not in the game |

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
