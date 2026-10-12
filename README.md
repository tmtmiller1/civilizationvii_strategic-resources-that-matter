# Strategic Resources That Matter

A Civilization VII mod. Horses, Iron, Niter, Oil, Coal and Rubber matter again. A unit that draws on one of them
fights weaker and trains slower while its owner holds no copy of it, and every copy you do hold still adds the game's
own bonus, so the count keeps mattering. Lose your last copy, to a raid on the mine or a lost settlement, and the
penalty is back a turn later. Past six copies, where the game's own bonus stops, the count keeps adding strength.

![The unit panel of a Chariot with no Horses](docs/screenshots/unit-panel-en.png)

*A Chariot with no Horses: 27 Combat Strength instead of 30, and the line under its stats says why.*

Single-player. In multiplayer, losing a resource does not bring the penalty back until that player gains a resource.

---

## What the player sees

Nothing is forbidden. Every unit can still be trained and upgraded as in the base game. What changes is the price of
going without:

- **No copy of the resource:** the unit has less Combat Strength (melee, and ranged and bombard where it has them),
  and a city puts less Production toward it, so it takes longer to train. With the default setting that is -3 Combat
  Strength and a third less Production, which makes the unit take half as long again.
- **One copy or more:** no penalty. The game's own +1 Combat Strength per copy applies as before, up to six copies.
- **More than six copies:** +1 more Combat Strength at 8, 10, 12, 14, 16, 18 and 20 copies, on the same units the
  game's per-copy bonus covers.

The game tells you why, in your language:

- **Unit panel:** when you select a unit that is short of its resource, a line under its stats says so: "Unsupplied:
  no Iron (-3 Combat Strength, slower to train)".
- **Combat preview:** the penalty is a line of its own beside the game's modifiers, for your unit and for the enemy's:
  "-3 Unsupplied: no Niter". Past six copies the extra strength shows as one line beside the game's own, such as "+1
  Niter: 8 or more copies".
- **Production list:** a unit that needs a resource says so on its item, beside the game's own text: "Needs Niter" in
  red while you hold none (the turn count shown is the slower one), "Niter: 2" once you hold copies. Where the item has
  room for a sentence it reads "Needs Niter. Without it: -3 Combat Strength, slower to train." The line follows a copy
  gained or lost while the list is open.
- **Resources:** a strategic resource's description, on the map and in the commerce screen, ends with the units it
  supplies for you in this age: "Supplies units: AT Gun, Assault Gun, Field Cannon and 3 more." Resources that supply
  nothing in this age say nothing extra.
- **Civilopedia:** a page under Game Concepts, Combat, "Strategic Resources That Matter", with the rules and the table
  below; and on each gated unit's page a line such as "Needs Iron: without a copy, -3 Combat Strength and slower to
  train", with the penalty your game was set up with.
- **Notification:** when you lose your last copy of a resource your units need, one notification at the start of the
  next turn: "Supply lost: no Niter. Your Field Cannon and 3 other units fight at -3 and train slower until you get
  Niter back." Once per loss; it ends with the turn, never holds the turn up, and a right-click dismisses it. Two
  losses in one turn share one notification.
- **The first time:** the first time you select one of your units while it is short of its resource, an advisor
  callout explains the rule in two sentences, and "Tell me more" opens the Civilopedia page. It shows once, not in
  every game, and only with tutorials or advisor warnings on in the game's options.

## Which units need what

A civilization's unique unit needs what the unit it replaces needs.

| Age | Units | Resource |
| --- | --- | --- |
| Antiquity | Cavalry: Chariot, Horseman and their unique versions | Horses |
| Antiquity | Infantry from the second tier: Spearman, Phalanx, Legion, Immortal and the others | Iron |
| Exploration | Cavalry: Courser, Knight, Lancer and their unique versions | Horses |
| Exploration | Infantry from the second tier: Man-At-Arms, Pikeman and their unique versions | Iron |
| Exploration | Siege: Catapult, Trebuchet, Bombard, Hwacha | Niter |
| Exploration | Heavy warships from the second tier: Carrack, Galleon and their unique versions | Niter |
| Modern | Artillery: Field Cannon, Field Gun, AT Gun, Mortar, Howitzer, Assault Gun | Niter |
| Modern | Armour: Landship, Tank and their unique versions | Oil |
| Modern | Battleships: Dreadnought, Battleship and their unique versions | Oil |
| Modern | Light warships: Ironclad, Cruiser, Destroyer, Barbary Corsair | Coal |
| Modern | Aircraft | Rubber |

A copy that reaches you over a trade route counts the same as one you mine yourself, from the turn the route lands.

Free of any requirement: the Warrior line and the Scout, ranged infantry (Archer, Crossbowman, Arquebusier), the Cog
and the Ship of the Line, the Cuirassier, the Submarine, and Modern infantry, so every player can always defend.

## Losing a resource

The game notices a new resource the moment it arrives: a mine finishing on Iron lifts the penalty on your Spearmen
at once. It does not notice one going away. The mod makes it check every player again at the start of each turn, so
a resource lost by pillage, by a tile changing hands or by anything else brings the penalty back one turn later, for
you and for the AI players alike. A trade route ended by a war takes its copies with it at once; an import that
dries up at the other end is gone from your count at once and the penalty follows one turn later. A player who still
holds a copy keeps the bonus. The same check keeps the strength past six copies honest when the count falls, and
raises the notification above when your last copy goes.

## Game setup options

Two options in game setup, beside the game's own options such as age length:

| Option | Values | Default |
| --- | --- | --- |
| Unsupplied Units | Off; Light (-2, 20% less Production); Standard (-3, 33% less); Harsh (-5, 50% less, twice as long to train) | Standard |
| Strategic Resources Past Six | Off; On (+1 at 8, 10, 12, 14, 16, 18 and 20 copies) | On |

Play Now uses the defaults. The options are fixed for the whole game once it starts.

## AI players

The AI plays under the same rules and needs no special handling: the penalty is ordinary unit and city data, and the
turn-start check covers every major player. Independent powers and city-states are not penalised. In testing, an AI
with no Iron kept building Warriors where, with Iron, it built Legions.

## Compatibility

- Adds unit tags, modifiers and two game setup options. Changes no base-game row and replaces no base-game file.
- The unit panel line comes from a wrapper around the panel's own refresh, so mods that change the unit panel keep
  working. The production line goes in the slot the game keeps for mods on each production item, and the resource
  line into the text the game's description component draws; neither replaces a screen or a tooltip. Tested with
  Readable Tooltips, QD Improved Plot Tooltip, Building Location Advisor, City Hall, Better Commerce Screen UI and Mod
  Commons.
- The notification is an ordinary game notification of the mod's own type, and the callout an item in the game's own
  tutorial manager, so mods that restyle the notification train or the tutorials show them as they show the game's
  (tested with Mav's UI Overhaul, Nasuellia Popups and Nasuellia Diplomacy Screens).
- Mods that rewrite the game's per-copy resource bonus leave the penalty alone; the curve past six copies follows the
  base game's unit classes (read from code, not tested).
- Ships the Tower Settings Keeper, which runs first and keeps every mod's settings readable after a restart. The mod
  itself stores one flag: whether the first-time callout has shown.

More detail, by kind of mod: [docs/compatibility.md](docs/compatibility.md).

## Saves

The setup options and the unit data are fixed when a game is created. A game started with the mod needs it to load;
adding the mod to a game already under way does nothing until a new game is started.

## Install

Subscribe on the Steam Workshop, or copy the `strategic-resources` folder into
`~/Library/Application Support/Civilization VII/Mods/` (macOS) or `%LOCALAPPDATA%\Firaxis Games\Sid Meier's
Civilization VII\Mods\` (Windows), and enable it under Add-ons.

## Known limits

- Single-player only. The turn-start check is a local call, not a network request, so in a multiplayer game the mod
  switches it off and says so in the game's log. There, a lost resource brings its penalty back only once that player
  gains some resource.
- A loss shows one turn later, not at once.
- The first-time callout follows the game's options: with tutorials and advisor warnings both off it never shows.
  The game marks it seen in that save anyway, so turning warnings on later shows it in the next new game. In
  multiplayer neither the notification nor the callout shows.
- The curve stops at 20 copies.

## How it works

- `data/`: each unit that needs a resource gets one tag, `SR_SUPPLY_<NAME>`. Per age and setup value, every major
  player's units get the combat penalty and their cities the production cut, each cancelled by an equal bonus while
  the player holds a copy. The curve is a set of +1 bonuses behind higher copy counts. The files are written by
  `scripts/build-data.mjs` from the rules in `scripts/gate-map.mjs`.
- `ui/sr-recheck.js`: at the start of every turn, gains and drops one off-map copy of a resource nothing else reads,
  for every major player. Gaining a resource is what makes the game re-check a player's requirements at the next
  turn roll.
- `ui/sr-supply-lost.js`: the notification, raised from the same turn start for the local player when a resource
  held at the last turn start is gone. The notification type and its icon are in `data/sr-notification*.xml`.
- `ui/sr-callout.js`: the first-time callout, an item in the game's tutorial manager at the advisor-warning level.
- `ui/sr-unit-panel.js`: the line on the unit panel.
- `ui/sr-production-line.js`: the line on a production item, in the game's `ProductionModInfo` slot.
- `ui/sr-resource-line.js`: the line in a strategic resource's description, added where the game's `Stylize`
  component draws that text.
- `ui/sr-registry.js`, `ui/sr-player-supply.js`, `ui/sr-supply.js`: the shared registry wrapper, engine reads and pure
  rules the lines, the notification and the callout use, so they never disagree.
- `ui/settings-keeper.js`: the Tower Settings Keeper, unchanged.

The evidence for each of these, run by run, is in [docs/verification-runs.md](docs/verification-runs.md).

## Development

Typed JavaScript checked by `tsc`, ESLint with size limits, and Node tests; no build step. See
[CONTRIBUTING.md](CONTRIBUTING.md).

```sh
npm install
npm run verify        # type check, lint, tests
npm run data          # rewrite data/ from the gate map
node scripts/deploy.mjs
```

## License

MIT. See [LICENSE](LICENSE).
