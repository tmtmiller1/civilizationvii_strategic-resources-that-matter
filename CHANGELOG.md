# Changelog

All notable changes to the Strategic Resources That Matter mod for Civilization VII. The format follows
[Keep a Changelog](https://keepachangelog.com/) and Semantic Versioning. The Steam Workshop change note for each
release is generated from the matching section below by `scripts/steam-changelog.mjs`.

## [Unreleased]

## [1.2.0] - 2026-10-16

Hardwood for the Exploration warships, the lock folded into Unsupplied Units, a new Modern Supply Chains option, and
the commander's Upgrade All reading the lock. Built from Workshop suggestions.

### Added
- A new game setup option, Modern Supply Chains, Off by default. On, every Modern unit that needs a resource needs a
  second one: artillery Niter and Coal, armour and battleships Oil and Coal, light warships Coal and Niter, aircraft
  Rubber and Oil. Each missing resource costs the full penalty, the unit panel shows one cell per missing resource,
  and under a locked value the unit needs both to be trained. Iron isn't placed on Modern maps, so Coal stands for
  steel.
- The Civilopedia page gains a "Modern supply chains" chapter, and a unit's page a second line for its second
  resource.

### Changed
- The Exploration heavy warships (Carrack, Galleon and their unique versions) need Hardwood instead of Niter. Niter
  stays with the Bombard and the Hwacha, and the Ironclad line with Coal.
- The lock is no longer its own option. Unsupplied Units has two more values after Harsh, "Locked: training" and
  "Locked: training and upgrade": the Harsh penalty in the field, and a unit that needs a resource can't be trained
  or bought without it (nor upgraded into, under the second). A save started with the old Gated Units option keeps
  the lock it was started with.

### Fixed
- Under "Locked: training and upgrade", a commander's Upgrade All showed as possible and named a price for units the
  lock stops; pressing it did nothing. The button now greys with the reason ("Warrior: cannot be upgraded without
  Iron.") when no unit in the army can be upgraded, and names the units that stay as they are when some can.

## [1.1.1] - 2026-10-16

Two fixes for the Sengoku's Samurai under Gated Units, both watched in test games on every setting.

### Fixed
- With Free Tier-Up by Kills set to Off, the Sengoku's Samurai could never upgrade, even with Iron, Heraldry and gold.
  They now upgrade like any other unit: tier 2 once you have Heraldry, tier 3 once you have Metal Casting, for gold,
  and only while you hold Iron.
- With Gated Units on, a Sengoku player with no Iron lost the Samurai altogether once Kinsei was researched: the civic
  made tier 2 count as available, so tier 1 went obsolete, and tier 2 needs Iron. Now tier 1 stays trainable until
  you hold Iron, and tier 2 takes over from then, as in the base game.

## [1.1.0] - 2026-10-16

The Sengoku's Samurai move up a tier after three kills, and the game doesn't ask for Iron then, even with Gated Units
on "Training and upgrade". A new setup option lets you keep that, as in the base game, or make the Samurai upgrade
like any other unit, with Iron.

### Added
- A new game setup option, Free Tier-Up by Kills, On by default. On, the Sengoku's Samurai move up a tier after three
  kills whether or not you hold Iron, as in the base game. Off, with Gated Units on "Training and upgrade", kills don't
  move them up any more: they upgrade like any other unit, which needs Iron. Off also overrides any other mod's change
  to the Samurai's kill counts.

### Fixed
- The Civilopedia no longer says the Sengoku's Samurai need Iron to reach tier 2 and 3 under "Training and upgrade".
  The Samurai move up by themselves after three kills at each tier, and the game doesn't ask for Iron then, so the
  page now says that, and names the new option that changes it.

## [1.0.3] - 2026-10-15

With Gated Units on, a player without Niter keeps a siege unit. Gunpowder used to take the Catapult and the Trebuchet
out of the production list because the Bombard was unlocked, even though you couldn't train it, so you were left with
nothing.

### Fixed
- Under Gated Units, a free unit stays trainable until you hold the resource for the next unit in its line: the
  Trebuchet after Gunpowder, the Warrior after Bronze Working, the Swordsman, the Cog, the Cuirassier and the Frigate
  after the techs for their gated successors, and the unique units in those lines, Rome's and Persia's included. Once
  you have the resource, the old unit goes out of date and upgrades as in the base game. The gated unit stays in the
  production list, greyed out, while you can't train it. Rome, Persia, Meiji Japan and Great Britain get their own
  Warrior or Frigate for this, under the same name and with the same look, which upgrades straight into their unique
  unit and takes the story rewards a Warrior or Frigate would. With Gated Units off, nothing changes.

## [1.0.2] - 2026-10-15

Games start again for players who don't own every DLC. The mod tagged other civilizations' unique units, like the
Hwarang and the Numidian Cavalry, and when one of those DLCs was missing the game refused to start.

### Fixed
- The unit tags only go on units that are in your game, so any mix of DLC loads, and so does a game update that
  removes a unit.

## [1.0.1] - 2026-10-15

The Catapult and the Trebuchet no longer need Niter. Neither one uses gunpowder, so in the Exploration Age Niter is now
for the Bombard and the heavy warships. The license now says that Civilization VII and its art and data belong to
Firaxis and 2K.

### Changed
- Exploration siege needs Niter from the third tier only: the Bombard and the Hwacha that replaces it. The Catapult,
  the Trebuchet and the two Hwacha that replace them are free of any requirement, with Gated Units on or off. The
  game's own +1 Combat Strength per Niter still applies to them, as in the base game, and so does the mod's extra
  strength past six.
- The LICENSE file ends with a notice that Sid Meier's Civilization VII and its assets belong to Firaxis Games and 2K,
  that the MIT license doesn't cover them, and that the game screenshots are there for illustration.

## [1.0.0] - 2026-10-12

Horses, Iron, Niter, Oil, Coal and Rubber matter again: going without one costs the units that need it, and can
lock them.

### Added
- Unsupplied units. A unit that needs a strategic resource its owner has none of fights weaker and trains slower:
  -3 Combat Strength and a third less Production toward it by default. One of the resource lifts the penalty, and the
  game's own +1 for each applies as before. Melee strength always; ranged and bombard strength only on units that
  have them. Cavalry need Horses; infantry from the second tier need Iron; Exploration siege and heavy warships from
  the second tier need Niter; Modern artillery Niter, armour and battleships Oil, light warships Coal, aircraft
  Rubber. Unique units need what the unit they replace needs. Modern infantry need nothing. A resource that reaches
  a player over a trade route counts the same as a mined one, from the turn the route lands.
- Losing a resource hurts. The game notices a resource arriving but not one going away; the mod has it check every
  player again at the start of each turn, so a resource lost to a raid or a lost settlement brings the penalty back a
  turn later, for the AI players too.
- Past six, where the game's own bonus stops, units gain +1 more Combat Strength at 8, 10, 12, 14, 16, 18 and 20 of
  a resource.
- Gated Units, off by default. With it on, a unit that needs a strategic resource cannot be trained or bought while
  its owner has none of it. It stays in the production list, greyed out, with a "Locked: no Iron" pill after its
  stats, and is locked again the moment the last one goes. Under Training and upgrade no unit can be upgraded into
  it either; under Training upgrades stay free. Units already in the field are never gated, and heal as usual.
  Independent powers and city-states are never gated. The AI is locked by the same rule and never sticks on a locked
  unit.
- Three game setup options: Unsupplied Units (Off, Light, Standard, Harsh; Standard by default), Strategic
  Resources Past Six (Off, On; On by default) and Gated Units (Off, Training, Training and upgrade; Off by default).
- The unit panel says when a unit is unsupplied: one more cell in its stats, the resource's icon over the penalty in
  red, with "Unsupplied: no Iron (-3 Combat Strength, slower to train)" as its tooltip; under Gated Units the tooltip
  ends with "New ones cannot be trained.".
- The combat preview names the penalty as a line of its own, for both sides, for example "-3 Unsupplied: no Niter",
  and the strength past six as one line beside the game's own, for example "+1 Niter: 8 or more".
- The production list marks each unit that needs a resource with a pill like the game's own "Ageless":
  "Unsupplied: no Niter" on a red tint while you have none, "Niter: 2" once you have some, "Locked: no Iron" under
  Gated Units. The item's hover tooltip carries the whole sentence under the unit's description, and on the purchase
  list it says what cannot be bought. The game's own text on the item is unchanged.
- A strategic resource's description, on the map and in the commerce screen, names the units it supplies for you in
  this age, for example "Supplies units: AT Gun, Assault Gun, Field Cannon and 3 more."; under Gated Units, "Needed
  to train: ...".
- A Civilopedia page under Game Concepts, Combat: the setup values, what counts as having a resource, losing one,
  past six, which units need what, and the gate. Each unit that needs a resource says so on its own page, with the
  penalty the game was set up with, and under Gated Units what it cannot be trained or bought without.
- A notification when you lose the last of a resource your units need, at the start of the next turn: "Supply lost:
  no Niter. Your Field Cannon and 3 other units fight at -3 and train slower until you get Niter back.", with "New
  ones cannot be trained until then." under Gated Units. Once per loss; it ends with the turn and never holds the
  turn up. Two losses in one turn share one notification.
- The first time you select one of your units while it is short of its resource, an advisor callout explains the
  rule and offers the Civilopedia page; under Gated Units a second callout, "Locked unit", explains the lock. Each
  shows once, not in every game, and only with tutorials or advisor warnings on.
- Text in all twelve of the game's languages.
- Carries the Tower Settings Keeper, so every mod's settings survive a restart.

### Known limits
- Single-player. In multiplayer, losing a resource does not bring the penalty back until that player gains a
  resource.
- Under Gated Units, a unit already in the production queue when the resource is lost keeps its progress and is
  completed; the game checks the resource when a unit is queued or bought.
- A mod that sets the game's resource-minimum parameters itself keeps the engine's rule by its own numbers; this
  mod's lock texts then step back to their plain form.
