-- Written by scripts/build-data.mjs; edit the script, not this file.
-- AGE_ANTIQUITY: the units that draw on a resource (DESIGN.md section 4), and their strength types.

INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_SUPPLY_HORSES' FROM Types WHERE Type IN (
    'UNIT_CHARIOT',
    'UNIT_HORSEMAN',
    'UNIT_MAGARRU',
    'UNIT_MAGARRU_2',
    'UNIT_NUMIDIAN_CAVALRY',
    'UNIT_NUMIDIAN_CAVALRY_2');

INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_SUPPLY_IVORY' FROM Types WHERE Type IN (
    'UNIT_DANTINAS_TATHA',
    'UNIT_DANTINAS_TATHA_2',
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

-- The war elephants draw on Ivory (sr-antiquity-elephants-modifiers.xml gives them +1 per Ivory), so the game's
-- +1 per Horses on cavalry stops at them: an inverse tag requirement joins that modifier's own all-of set.
INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_ELEPHANT' FROM Types WHERE Type IN (
    'UNIT_DANTINAS_TATHA',
    'UNIT_DANTINAS_TATHA_2',
    'UNIT_PURABHETTARAH',
    'UNIT_PURABHETTARAH_2');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_NOT_ELEPHANT', 'REQUIREMENT_UNIT_TAG_MATCHES', 1);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_NOT_ELEPHANT', 'Tag', 'SR_ELEPHANT');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT SubjectRequirementSetId, 'SR_NOT_ELEPHANT' FROM Modifiers WHERE ModifierId = 'MOD_HORSES_CAVALRY_COMBAT_STRENGTH'
    AND SubjectRequirementSetId IN (SELECT RequirementSetId FROM RequirementSets WHERE RequirementSetType = 'REQUIREMENTSET_TEST_ALL');
