# Contributing

Strategic Resources is a Civilization VII mod made mostly of game data, with two small scripts. This page covers the
setup, the one check to run before you submit, and the conventions the code follows.

## Typed JavaScript, no build step

The scripts are typed JavaScript, not TypeScript. Civilization VII loads `.js` files directly; there is no transpile
step, and what ships is what you wrote. Types come from JSDoc annotations checked by `tsc --noEmit` (`checkJs`,
strict), so the `/** @param … */` blocks are the type system. Engine globals are typed by hand in `types/`. Don't add
`.ts` files or a build step.

The data files in `data/` are generated, see below; edit the script that writes them, not the files.

## Setup

```sh
npm install
```

## Before you submit: `npm run verify`

```sh
npm run verify
```

This must pass with zero errors and zero warnings. It runs:

1. `tsc --noEmit`: JSDoc type checking.
2. `eslint ui`: style and size limits.
3. every test in `tests/` (`node tests/run-all.mjs`, which finds each test file by itself; `node tests/run-all.mjs
   data i18n` runs only the files whose names contain one of the words).

`npm run release:gate` adds coverage (`c8`), and `npm run mutation` runs Stryker on the engine-free modules
(`ui/sr-supply.js`, `ui/sr-recheck-core.js`).

## The data

`scripts/gate-map.mjs` holds the rules that decide which units draw on which resource, per age, and the unit classes
the game's own per-copy bonus covers. `scripts/build-data.mjs` turns them into `data/`:

```sh
npm run data          # rewrite data/
npm run data:check    # exit 1 if data/ is out of date
```

The rules are applied to the game's own tables, dumped from a running game of each age into `devtools/gate-map/` by
`node scripts/dump-gate-tables.mjs <antiquity|exploration|modern>`. `tests/data.mjs` checks the generated files against
the rules and the dumps, the expected unit lists, and the shapes that crash or mislead the game: a resource requirement
on an attach parent, a modifier nothing reaches, a unit or resource the game does not have. When a game patch adds
units, dump the three ages again, run `npm run data`, and update the expected lists in `tests/data.mjs` and the table in
the design notes.

`data/sr-setup.sql` (the game setup options) is written by hand.

## Style limits (enforced by ESLint)

- cyclomatic complexity ≤ 10
- max statements per function ≤ 18
- max nesting depth ≤ 4
- max parameters ≤ 5
- max lines per function ≤ 50, per file ≤ 500
- line length ≤ 120 (strings, templates, regular expressions and URLs exempt)

When a function trips a limit, extract a small, named helper rather than disabling the rule.

## Conventions

- Engine access is defensive. Every engine call is guarded; the scripts degrade and log, and never throw out of an
  event handler. An intentional `catch` that swallows says why in a comment (`tests/no-empty-catch.mjs`).
- Logging goes through `ui/sr-log.js` only, tagged `[StrategicResources]`. `console.log` never reaches `UI.log`.
  `const DBG = true;` there turns on the per-turn lines; `release.sh` sets it to false in the shipped copy.
- Localization. Every string a player sees is a `LOC_SR_` tag in `text/en_us/StrategicResourcesText.xml` and in all
  eleven other languages (`tests/i18n.mjs` checks parity, placeholders, language codes and that each translation is
  translated). A duplicate tag rolls back the whole file in game.
- Comments explain why (engine behaviour, workarounds), not what.
- Settings. The mod has none. If one is added, it goes in this mod's own slice of the shared `modSettings`
  `localStorage` key; never add a top-level `localStorage` key.

## Naming

- Functions are camelCase and start with a verb; constants that never change are UPPER_SNAKE_CASE; files are
  kebab-case and start with `sr-` (the game's module loader can confuse two mods' files with the same name).
- Verbs keep one meaning: `read…` reads the engine and returns plain data; `compute…` is pure; `resolve…` looks
  something up with a fallback; `build…` creates a structure without attaching it; `render…` fills an element the
  caller passes in; `force…` makes the engine do something.
- Names stored in saves or read by the game never change: the mod id, the `LOC_SR_` tags, the `SR_SUPPLY_` tags, the
  modifier ids, the setup parameter ids (`StrategicResourcesUnsupplied`, `StrategicResourcesLateCurve`) and their
  values. Renaming one breaks games started with an older version.

## Project layout

```
strategic-resources.modinfo   the groups: shell (setup options, text), game (tags, scripts), per age and setup value
data/                         generated data, plus sr-setup.sql
ui/                           sr-recheck.js (turn-start re-check), sr-unit-panel.js (panel line), their pure helpers,
                              sr-log.js, settings-keeper.js (unchanged copy)
text/<locale>/                StrategicResourcesText.xml, twelve languages
scripts/                      data generator, table dump, deploy, release helpers
tests/                        Node tests and the static gates
devtools/                     gate-map dumps, sr-lab.mjs (lab games with setup values, a language or hotseat)
docs/                         verification runs, compatibility, Workshop description draft
```

## Trying a change in game

The game runs plain copies from its Mods folder. `node scripts/deploy.mjs` replaces `Mods/strategic-resources` with
the files that ship, `--check` reports a stale copy, and `--remove` takes it out (while it is there it loads into
every game, your own included). Data changes need a new game. Test in Tower Bench lab games, never your own;
`node devtools/sr-lab.mjs lab start --seed 4242` starts one, and `SR_LAB_SETUP`, `SR_LAB_LANGUAGE` and
`SR_LAB_MODE=HOTSEAT` set the setup values, the language or a hotseat game (see the file's header).

## Releasing

`./release.sh` runs the release gate, builds `dist/strategic-resources-vX.Y.Z.zip`, checks it against an allow-list,
and writes the Steam Workshop manifest without a description field.

## License

MIT. See [LICENSE](LICENSE). By contributing you agree your changes are licensed under the same terms.
