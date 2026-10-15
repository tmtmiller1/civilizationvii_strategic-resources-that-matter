-- Written by scripts/build-data.mjs; edit the script, not this file.
-- AGE_ANTIQUITY: the units that draw on a resource (DESIGN.md section 4), and their strength types.

INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_SUPPLY_HORSES' FROM Types WHERE Type IN (
    'UNIT_CHARIOT',
    'UNIT_DANTINAS_TATHA',
    'UNIT_DANTINAS_TATHA_2',
    'UNIT_HORSEMAN',
    'UNIT_MAGARRU',
    'UNIT_MAGARRU_2',
    'UNIT_NUMIDIAN_CAVALRY',
    'UNIT_NUMIDIAN_CAVALRY_2',
    'UNIT_PURABHETTARAH',
    'UNIT_PURABHETTARAH_2');

INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_SUPPLY_IRON' FROM Types WHERE Type IN (
    'UNIT_GAISATAI_2',
    'UNIT_GAISATAI_3',
    'UNIT_HOPLITE_2',
    'UNIT_HOPLITE_3',
    'UNIT_IMMORTAL',
    'UNIT_IMMORTAL_2',
    'UNIT_LEGION',
    'UNIT_LEGION_2',
    'UNIT_MEDJAY_2',
    'UNIT_MEDJAY_3',
    'UNIT_PHALANX',
    'UNIT_SPEARMAN');

INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_CURVE_RANGED_HORSES' FROM Types WHERE Type IN (
    'UNIT_HWARANG',
    'UNIT_HWARANG_2');

INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_CURVE_BOMBARD_HORSES' FROM Types WHERE Type IN (
    'UNIT_HWARANG',
    'UNIT_HWARANG_2');
