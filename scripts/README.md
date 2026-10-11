# scripts

Helper scripts for the data, releases and documentation.

## Files

- gate-map.mjs: The gate map as rules (which units draw on which resource, per age) and the unit classes the game's
  per-copy bonus covers. Pure; read by build-data.mjs and tests/data.mjs.
- build-data.mjs: Writes data/ from the gate map and the dumped tables (`--check` reports a stale file).
- dump-gate-tables.mjs: Saves the game's own `Units`, `TypeTags`, `UnitReplaces` and `UnitUpgrades` for one age from
  the running game's compiled database into devtools/gate-map/.
- deploy.mjs: Copies the files that ship into the game's Mods folder (`--check` reports a stale copy, `--remove`
  deletes it).
- steam-changelog.mjs: Keeps CHANGELOG.steam.txt (Steam Workshop change notes) in step with CHANGELOG.md. The same file
  is used by every Tower mod.
- build_readme_pdf.sh: Builds README.pdf from README.md with pandoc and tectonic.
- pdf_header.tex, table_wrap.lua: LaTeX header and pandoc filter for that build.
- The release gates are ordinary test files in tests/, run by `npm test`:
  - `tests/data.mjs`: the generated data, the gate lists, and the shapes that crash the game.
  - `tests/core-imports.mjs`: any `/core/` or `/base-standard/` module the scripts import exists in the installed game
    (none today; skips with a warning when no install is found).
  - `tests/loc-keys.mjs`: every LOC tag the scripts, data and modinfo name is defined.
  - `tests/modinfo.mjs`: every script is listed, the keeper is first, no runtime import cycles.
  - `tests/i18n.mjs`: every language has the same tags, translated.
