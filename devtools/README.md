# devtools

Lab-game setup, probe mods and soak tests used to check this mod in the real game. None of it ships in the Workshop download.

`any-dlc-check/` is the offline check to run before a release (DESIGN.md section 7g): `python3 -I dlc_types.py
<game Resources folder> <compiled DB> <types.json>` lists the parents only a DLC defines, then `python3 -I
anydlc_check.py <compiled DB> <work copy> <types.json> <this repo>` deletes them on a copy, reloads the mod's data and
compares `PRAGMA foreign_key_check` before and after (`--files`, `--extra` and `--ref` pick other data files or a
commit).

`probes/probe5-obsolete` to `probe8-nogrant` are the four throwaway mods behind the grant-only lines (DESIGN.md 7f,
"Grant-only lines"): a build lock on the Bombard, a trait lock with a grant, the Legion with `CanTrain` 0, and the
Legion without the mod's grant. Each puts the Trebuchet -> Bombard upgrade row back over the gate's line file, loads
after it (LoadOrder 10003), and comes out of `Mods/` after its run. `probe9-grants` and `probe9b-grants-iron` hold the
game's own Warrior reward shapes (a grant, a production bonus, a unit-type requirement) against Rome's copy.
