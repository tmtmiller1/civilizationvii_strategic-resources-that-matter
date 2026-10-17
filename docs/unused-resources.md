# Design background: the resources the mod doesn't use yet

Written on 2026-10-16 from the owner's question "list those we aren't currently using and potential uses for them".
Status: ideas only, nothing built, nothing probed. Ivory for the elephants has its own scoping in
[elephants-on-ivory.md](elephants-on-ivory.md), and Hardwood on more ships, Pitch, Tin beside Iron and the nuclear
weapons are in [future-resources.md](future-resources.md). This file covers the rest and reopens that doc's "Not in
scope" line about yield-only resources and the Factory class.

Sources: the 1.5.0 base data (`base-standard/data/resources.xml`, `resources-v2.xml` and each age's
`resources.xml` overrides), the live compiled database (`Debug/gameplay-copy.sqlite`, a Modern game with the usual mod
set, which matched the base data for every resource here), and the unit dumps in `devtools/gate-map/` run through
`buildGateMap` for the coverage gaps.

## What the mod uses today

Seven resources: Horses, Iron, Niter, Hardwood, Coal, Oil and Rubber. They're all Empire class in the ages the mod
gates them, and the first six are the ones the base game already ties to units through its per-copy Combat Strength
bonuses.

## How resource classes move between ages

Civilization VII has no "strategic" class. A resource's class is set in the base data and then overridden per age, so
the same resource can be Empire in one age and Bonus or Treasure in the next. The Empire set per age:

| Age | Empire resources |
| --- | --- |
| Antiquity | Horses, Iron, Gold, Silver, Ivory, Marble, Wine, Rice, Limestone, Hardwood |
| Exploration | Iron, Niter, Marble, Wine, Rice, Limestone, Hardwood |
| Modern | Niter, Coal, Oil, Rubber, Gold, Silver, Marble, Rice, Limestone, Hardwood |

The moves that matter here:

- **Exploration.** Gold, Silver, Horses, Furs, Cocoa, Spices, Sugar and Tea become Treasure. Ivory becomes Bonus.
- **Modern.** Horses, Ivory, Spices, Wine and Sugar become Bonus. Cocoa and Tea become Factory, and Furs becomes City.
- **Later additions.** Rice, Limestone and Hardwood come from `resources-v2.xml`, added after the original list.

The Modern Factory class has eight: Citrus, Cocoa, Coffee, Cotton, Kaolin, Quinine, Tea and Tin. Tin, Cotton and Kaolin
are placed in all three ages, but they're only Factory in Modern. Before that Tin and Cotton are Bonus and Kaolin is
City.

## Unit lines with no resource today

From `GATES` in `scripts/gate-map.mjs` over the dumps. Unique units follow the unit they replace, so only the base lines
are listed.

| Age | Lines left free |
| --- | --- |
| Antiquity | Warrior and Slinger, Archer, Ballista, Galley and Quadrireme |
| Exploration | Swordsman, Heavy Archer, Crossbowman and Arquebusier, Catapult and Trebuchet, Cog, Privateer 1 and 2 |
| Modern | Line Infantry, Rifleman and Infantry Company, Cuirassier, Ship of the Line, Submarine |

Two of these weren't in the README's picture. Modern tier-1 cavalry (the Cuirassier and the uniques that replace it)
isn't gated, because Horses are Bonus in Modern and Oil only starts at tier 2. The Submarine isn't gated either, since
it isn't tagged Heavy or Light.

The Modern infantry gap is the widest one, and the game itself hints at a fit: its own Rubber bonus reaches
`UNIT_CLASS_INFANTRY` (`VANILLA_PER_COPY` in `gate-map.mjs`), while the mod gates Rubber on aircraft only.

## Candidate uses

### Empire resources

| Resource | Empire in | Fit | Notes |
| --- | --- | --- | --- |
| Limestone | All three ages | Antiquity siege (Ballista), since siege engines throw stone; Exploration Catapult and Trebuchet | Fills the siege gap in both early ages with one resource. A second idea is defence on walls and fortified districts, but that's outside the mod's unit focus |
| Ivory | Antiquity | War elephants | Scoped in [elephants-on-ivory.md](elephants-on-ivory.md). Ivory is about seven times as common as Horses, which shapes every option there |
| Gold, Silver | Antiquity, Modern | Buying units costs more without either, read as paying soldiers or hiring mercenaries | Either one should count, so the penalty doesn't stack. It's a purchase-cost modifier, not a unit gate, so it's new machinery. Both are Treasure in Exploration, so that age would be left out |
| Rice | All three ages | Rations: infantry heal slower in the field without it, or Commanders gain less XP | Rice is a staple food, so a gate on it would bite in regions where it doesn't grow. A soft effect suits it better than a lock |
| Wine | Antiquity, Exploration | Morale or healing in your own territory | Weak military link. Low priority |
| Marble | All three ages | None | Leave it alone |

### Modern Factory resources

| Resource | Fit | Notes |
| --- | --- | --- |
| Cotton | Uniforms for Modern infantry | The most direct answer to the infantry gap |
| Tin | Canned rations as a second resource for infantry, or alloys under Modern Supply Chains | future-resources.md has Tin beside Iron in Antiquity. It's Bonus there, which has the copy-counting question below |
| Quinine | Land units in rainforest or marsh fight at a penalty without it, for malaria | The most distinctive idea here. It's terrain-conditional, so it needs a plot requirement on the modifier as well as the resource |
| Citrus | Warships heal slower at sea without it, for scurvy | Would cover the Ship of the Line and Submarine gap without a gate |
| Coffee, Tea | A small bonus for infantry while you hold them | Better as a reward than a penalty |
| Kaolin, Cocoa | None | Leave them alone |

## What any of this runs into

- **Factory slots.** In Modern, factory resources go into factory slots for the economic legacy path. Making units need
  them competes with that, so any use of them should be an option that's off by default, like Modern Supply Chains.
- **Does a copy count?** The mod's idea of holding a resource is an entry in `player.Resources.getResources()`, watched
  for Empire resources only (phase 11). Bonus resources (Tin and Cotton before Modern, Pitch) and Factory resources
  haven't been checked. That's the first question for any probe here, and the Pitch probe in future-resources.md asks
  the same thing.
- **One resource per unit.** `Units.StrategicResource` takes one resource, and the UI index keeps one per unit
  (`buildSupplyIndex` in `ui/sr-supply.js`). A second resource on a unit that's already gated, such as Cotton on top of
  something else, only works the Supply Chains way: a stacking penalty, not a second lock. The free lines above don't
  have this problem.
- **New mechanisms.** The Gold and Silver purchase cost, the Rice healing, the Quinine terrain penalty and the Citrus
  healing at sea aren't gates. Each would be its own modifier family with its own texts, outside what `build-data.mjs`
  writes today.
- **The AI.** Nothing in the game's AI tables names a resource (elephants-on-ivory.md, "What each option needs"). A
  gated line changes what the AI can build, and a penalty line means it builds the unit anyway and fights weaker.
  Either needs a soak like the phase 15 Iron one.
- **Any DLC.** Rows for a DLC unique go through the guarded `Types` insert like every tag since 1.0.2.

## If one goes ahead

The gaps that are cheapest to close are plain gate rules on resources the mod already knows how to count:

1. **Limestone on early siege** (Antiquity Ballista, Exploration Catapult and Trebuchet). One rule per age in `GATES`.
   It needs a check that Limestone counts like the other Empire resources and a map count, since it isn't a staple.
2. **Hardwood on the Antiquity galleys and the Cog**, already written up in future-resources.md.
3. **Modern infantry**, either on Rubber, which follows the game's own bonus, or on Cotton as an option once the
   Factory copy question is answered.

Everything else on this page is a new mechanism and wants the owner's call before any probe.
