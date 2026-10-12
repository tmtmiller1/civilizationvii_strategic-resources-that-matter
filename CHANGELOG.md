# Changelog

All notable changes to the Strategic Resources That Matter mod for Civilization VII. The format follows
[Keep a Changelog](https://keepachangelog.com/) and Semantic Versioning. The Steam Workshop change note for each
release is generated from the matching section below by `scripts/steam-changelog.mjs`.

## [1.1.0] - 2026-10-12

Gated Units: a third game setup option, off by default, that locks a unit behind its resource.

### Added
- Gated Units (Off, Training, Training and upgrade; Off by default). With it on, a unit that draws on a strategic
  resource cannot be trained or bought while its owner has none of it. It stays in the production list, greyed
  out, with a "Locked: no Iron" pill after its stats, and is locked again the moment the last one goes. Under Training and
  upgrade no unit can be upgraded into it either; under Training upgrades stay free. Units already in the field are
  never gated, and heal as usual. Independent powers and city-states are never gated. The AI is locked by the same
  rule and never sticks on a locked unit.
- The unit panel's status is now one more cell in the unit's stats, the resource's icon over the penalty in red,
  with the sentence as its tooltip; under the gate the tooltip ends with "New ones cannot be trained.". A resource's
  description reads "Needed to train: ...",
  the lost-supply notification adds "New ones cannot be trained until then.", and a second first-time callout,
  "Locked unit", explains the lock. The Civilopedia page gains a chapter, "Gated units", and each gated unit's page a
  line "Cannot be trained or bought without Iron." All in the twelve languages.
- The production list's line is now a pill, like the game's own "Ageless", in the short form ("Needs Niter",
  "Niter: 2", "Locked: no Iron"), tinted while the unit is short; the whole sentence sits in the item's hover
  tooltip under the unit's description, and on the purchase list it says what cannot be bought.

### Changed
- The Civilopedia page, the setup descriptions and the callouts no longer count resources in "copies": a unit is
  short while its owner "has none of" the resource, and the game's bonus counts "each of a resource you hold".
- The Civilopedia page's opening sentence now points at the option; the mod's description names three options.
- A resource's "Supplies units" line no longer names a unit the player's own unique unit replaces when that unique
  unit is reached by upgrade alone (the Sengoku's Iron line named the Man-at-Arms and Pikeman).

### Known limits
- A unit already in the production queue when the resource is lost keeps its progress and is completed; the game
  checks the resource when a unit is queued or bought.
- A mod that sets the game's resource-minimum parameters itself keeps the engine's rule by its own numbers; this
  mod's lock texts then step back to their plain form.

## [1.0.0] - 2026-10-11

Horses, Iron, Niter, Oil, Coal and Rubber matter again: going without one costs the units that need it.

### Added
- Unsupplied units. A unit that draws on a strategic resource its owner holds no copy of fights weaker and trains
  slower: -3 Combat Strength and a third less Production toward it by default. One copy lifts the penalty, and the
  game's own +1 per copy applies as before. Melee strength always; ranged and bombard strength only on units that have
  them. Cavalry need Horses; infantry from the second tier need Iron; Exploration siege and heavy warships from the
  second tier need Niter; Modern artillery Niter, armour and battleships Oil, light warships Coal, aircraft Rubber.
  Unique units need what the unit they replace needs. Modern infantry need nothing. A copy that reaches a player over
  a trade route counts the same as a mined one, from the turn the route lands.
- Losing a resource hurts. The game notices a resource arriving but not one going away; the mod has it check every
  player again at the start of each turn, so a resource lost to a raid or a lost settlement brings the penalty back a
  turn later, for the AI players too.
- Past six copies, where the game's own bonus stops, units gain +1 more Combat Strength at 8, 10, 12, 14, 16, 18 and 20
  copies.
- Two game setup options: Unsupplied Units (Off, Light, Standard, Harsh; Standard by default) and Strategic Resources
  Past Six (Off, On; On by default).
- The unit panel says when a unit is unsupplied, for example "Unsupplied: no Iron (-3 Combat Strength, slower to
  train)".
- The combat preview names the penalty as a line of its own, for both sides, for example "-3 Unsupplied: no Niter",
  and the strength past six copies as one line beside the game's own, for example "+1 Niter: 8 or more copies".
- The production list marks each unit that needs a resource: "Needs Niter" in red while you hold none, "Niter: 2"
  once you hold copies, or the full sentence "Needs Niter. Without it: -3 Combat Strength, slower to train." where
  the item has room. The game's own text on the item is unchanged.
- A strategic resource's description, on the map and in the commerce screen, names the units it supplies for you in
  this age, for example "Supplies units: AT Gun, Assault Gun, Field Cannon and 3 more."
- A Civilopedia page under Game Concepts, Combat: the setup values, what counts as a copy, losing one, past six
  copies, and which units need what. Each unit that needs a resource says so on its own page, with the penalty the
  game was set up with.
- A notification when you lose your last copy of a resource your units need, at the start of the next turn: "Supply
  lost: no Niter. Your Field Cannon and 3 other units fight at -3 and train slower until you get Niter back." Once per
  loss; it ends with the turn and never holds the turn up. Two losses in one turn share one notification.
- The first time you select one of your units while it is short of its resource, an advisor callout explains the rule
  and offers the Civilopedia page. It shows once, not in every game, and only with tutorials or advisor warnings on.
- Text in all twelve of the game's languages.
- Carries the Tower Settings Keeper, so every mod's settings survive a restart.

Single-player. In multiplayer, losing a resource does not bring the penalty back until that player gains a resource.
