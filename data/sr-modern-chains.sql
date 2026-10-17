-- Written by scripts/build-data.mjs; edit the script, not this file.
-- AGE_MODERN, Modern Supply Chains on: the second resource's tags and page lines, and under the locked levels (the column set)
-- the grant-only lock of every gated unit behind both its resources, on top of the plain line file. See scripts/build-data.mjs.
-- The second resource's tags, so the age's penalty modifiers reach the unit for it too.

INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_SUPPLY_COAL' FROM Types WHERE Type IN (
    'UNIT_ASSAULT_GUN',
    'UNIT_AT_GUN',
    'UNIT_BATTLESHIP',
    'UNIT_CHANG_BEUN',
    'UNIT_CHANG_BEUN_2',
    'UNIT_CHANG_BEUN_3',
    'UNIT_COSSACK_2',
    'UNIT_COSSACK_3',
    'UNIT_DREADNOUGHT',
    'UNIT_FIELD_CANNON',
    'UNIT_FIELD_GUN',
    'UNIT_GHILMAN_2',
    'UNIT_GHILMAN_3',
    'UNIT_HEAVY_ARTILLERY',
    'UNIT_HUSSAR_2',
    'UNIT_HUSSAR_3',
    'UNIT_KATYUSHA',
    'UNIT_KATYUSHA_2',
    'UNIT_LANDSHIP',
    'UNIT_MIKASA',
    'UNIT_MIKASA_2',
    'UNIT_MORTAR',
    'UNIT_REVENGE',
    'UNIT_REVENGE_2',
    'UNIT_TANK',
    'UNIT_TURTLE_SHIP_2',
    'UNIT_TURTLE_SHIP_3');

INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_SUPPLY_NITER' FROM Types WHERE Type IN (
    'UNIT_BARBARY_CORSAIR',
    'UNIT_BARBARY_CORSAIR_2',
    'UNIT_BARBARY_CORSAIR_3',
    'UNIT_CRUISER',
    'UNIT_DESTROYER',
    'UNIT_IRONCLAD');

INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_SUPPLY_OIL' FROM Types WHERE Type IN (
    'UNIT_BIPLANE',
    'UNIT_BOMBER',
    'UNIT_DIVEBOMBER',
    'UNIT_FIGHTER',
    'UNIT_HEAVY_BOMBER',
    'UNIT_STUKA',
    'UNIT_STUKA_2',
    'UNIT_TRENCH_FIGHTER',
    'UNIT_ZERO',
    'UNIT_ZERO_2');

INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_RANGED_NITER' FROM Types WHERE Type IN (
    'UNIT_BARBARY_CORSAIR',
    'UNIT_BARBARY_CORSAIR_2',
    'UNIT_BARBARY_CORSAIR_3',
    'UNIT_CRUISER',
    'UNIT_DESTROYER',
    'UNIT_IRONCLAD');

INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_BOMBARD_NITER' FROM Types WHERE Type IN (
    'UNIT_BARBARY_CORSAIR',
    'UNIT_BARBARY_CORSAIR_2',
    'UNIT_BARBARY_CORSAIR_3',
    'UNIT_CRUISER',
    'UNIT_DESTROYER',
    'UNIT_IRONCLAD');

INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_RANGED_OIL' FROM Types WHERE Type IN (
    'UNIT_BIPLANE',
    'UNIT_BOMBER',
    'UNIT_DIVEBOMBER',
    'UNIT_FIGHTER',
    'UNIT_HEAVY_BOMBER',
    'UNIT_STUKA',
    'UNIT_STUKA_2',
    'UNIT_TRENCH_FIGHTER',
    'UNIT_ZERO',
    'UNIT_ZERO_2');

INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_BOMBARD_OIL' FROM Types WHERE Type IN (
    'UNIT_BIPLANE',
    'UNIT_BOMBER',
    'UNIT_DIVEBOMBER',
    'UNIT_FIGHTER',
    'UNIT_HEAVY_BOMBER',
    'UNIT_STUKA',
    'UNIT_STUKA_2',
    'UNIT_TRENCH_FIGHTER',
    'UNIT_ZERO',
    'UNIT_ZERO_2');

INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_RANGED_COAL' FROM Types WHERE Type IN (
    'UNIT_ASSAULT_GUN',
    'UNIT_AT_GUN',
    'UNIT_BATTLESHIP',
    'UNIT_CHANG_BEUN',
    'UNIT_CHANG_BEUN_2',
    'UNIT_CHANG_BEUN_3',
    'UNIT_DREADNOUGHT',
    'UNIT_FIELD_CANNON',
    'UNIT_FIELD_GUN',
    'UNIT_HEAVY_ARTILLERY',
    'UNIT_KATYUSHA',
    'UNIT_KATYUSHA_2',
    'UNIT_MIKASA',
    'UNIT_MIKASA_2',
    'UNIT_MORTAR',
    'UNIT_REVENGE',
    'UNIT_REVENGE_2',
    'UNIT_TURTLE_SHIP_2',
    'UNIT_TURTLE_SHIP_3');

INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_BOMBARD_COAL' FROM Types WHERE Type IN (
    'UNIT_ASSAULT_GUN',
    'UNIT_AT_GUN',
    'UNIT_BATTLESHIP',
    'UNIT_CHANG_BEUN',
    'UNIT_CHANG_BEUN_2',
    'UNIT_CHANG_BEUN_3',
    'UNIT_DREADNOUGHT',
    'UNIT_FIELD_CANNON',
    'UNIT_FIELD_GUN',
    'UNIT_HEAVY_ARTILLERY',
    'UNIT_KATYUSHA',
    'UNIT_KATYUSHA_2',
    'UNIT_MIKASA',
    'UNIT_MIKASA_2',
    'UNIT_MORTAR',
    'UNIT_REVENGE',
    'UNIT_REVENGE_2',
    'UNIT_TURTLE_SHIP_2',
    'UNIT_TURTLE_SHIP_3');


-- The COAL line on each unit's page, by the loaded penalty level (none when the penalty is off).
INSERT OR IGNORE INTO CivilopediaPageChapterParagraphs (SectionID, PageID, ChapterID, Paragraph, SortIndex)
    SELECT 'UNITS', u.UnitType, 'SR_SUPPLY_2', CASE a.Value WHEN '-2' THEN 'LOC_SR_PEDIA_UNIT_COAL_LIGHT' WHEN '-3' THEN 'LOC_SR_PEDIA_UNIT_COAL_STANDARD' WHEN '-5' THEN 'LOC_SR_PEDIA_UNIT_COAL_HARSH' END, 10
    FROM Units u JOIN ModifierArguments a ON a.ModifierId = 'SR_COMBAT_PENALTY_COAL' AND a.Name = 'Amount'
    WHERE a.Value IN ('-2', '-3', '-5') AND u.UnitType IN (
    'UNIT_ASSAULT_GUN',
    'UNIT_AT_GUN',
    'UNIT_BATTLESHIP',
    'UNIT_CHANG_BEUN',
    'UNIT_CHANG_BEUN_2',
    'UNIT_CHANG_BEUN_3',
    'UNIT_COSSACK_2',
    'UNIT_COSSACK_3',
    'UNIT_DREADNOUGHT',
    'UNIT_FIELD_CANNON',
    'UNIT_FIELD_GUN',
    'UNIT_GHILMAN_2',
    'UNIT_GHILMAN_3',
    'UNIT_HEAVY_ARTILLERY',
    'UNIT_HUSSAR_2',
    'UNIT_HUSSAR_3',
    'UNIT_KATYUSHA',
    'UNIT_KATYUSHA_2',
    'UNIT_LANDSHIP',
    'UNIT_MIKASA',
    'UNIT_MIKASA_2',
    'UNIT_MORTAR',
    'UNIT_REVENGE',
    'UNIT_REVENGE_2',
    'UNIT_TANK',
    'UNIT_TURTLE_SHIP_2',
    'UNIT_TURTLE_SHIP_3');
-- And its gate line, once the gate files have set the column: the upgrading minimum tells the value.
INSERT OR IGNORE INTO CivilopediaPageChapterParagraphs (SectionID, PageID, ChapterID, Paragraph, SortIndex)
    SELECT 'UNITS', u.UnitType, 'SR_LOCK_2', CASE WHEN g.Value = '1' THEN 'LOC_SR_PEDIA_UNIT_COAL_GATE_UPGRADE' ELSE 'LOC_SR_PEDIA_UNIT_COAL_GATE_TRAINING' END, 10
    FROM Units u JOIN GlobalParameters g ON g.Name = 'STRATEGIC_RESOURCE_MINIMUM_FOR_UNIT_UPGRADING'
    WHERE u.StrategicResource IS NOT NULL AND u.UnitType IN (
    'UNIT_ASSAULT_GUN',
    'UNIT_AT_GUN',
    'UNIT_BATTLESHIP',
    'UNIT_CHANG_BEUN',
    'UNIT_CHANG_BEUN_2',
    'UNIT_CHANG_BEUN_3',
    'UNIT_COSSACK_2',
    'UNIT_COSSACK_3',
    'UNIT_DREADNOUGHT',
    'UNIT_FIELD_CANNON',
    'UNIT_FIELD_GUN',
    'UNIT_GHILMAN_2',
    'UNIT_GHILMAN_3',
    'UNIT_HEAVY_ARTILLERY',
    'UNIT_HUSSAR_2',
    'UNIT_HUSSAR_3',
    'UNIT_KATYUSHA',
    'UNIT_KATYUSHA_2',
    'UNIT_LANDSHIP',
    'UNIT_MIKASA',
    'UNIT_MIKASA_2',
    'UNIT_MORTAR',
    'UNIT_REVENGE',
    'UNIT_REVENGE_2',
    'UNIT_TANK',
    'UNIT_TURTLE_SHIP_2',
    'UNIT_TURTLE_SHIP_3');

-- The NITER line on each unit's page, by the loaded penalty level (none when the penalty is off).
INSERT OR IGNORE INTO CivilopediaPageChapterParagraphs (SectionID, PageID, ChapterID, Paragraph, SortIndex)
    SELECT 'UNITS', u.UnitType, 'SR_SUPPLY_2', CASE a.Value WHEN '-2' THEN 'LOC_SR_PEDIA_UNIT_NITER_LIGHT' WHEN '-3' THEN 'LOC_SR_PEDIA_UNIT_NITER_STANDARD' WHEN '-5' THEN 'LOC_SR_PEDIA_UNIT_NITER_HARSH' END, 10
    FROM Units u JOIN ModifierArguments a ON a.ModifierId = 'SR_COMBAT_PENALTY_NITER' AND a.Name = 'Amount'
    WHERE a.Value IN ('-2', '-3', '-5') AND u.UnitType IN (
    'UNIT_BARBARY_CORSAIR',
    'UNIT_BARBARY_CORSAIR_2',
    'UNIT_BARBARY_CORSAIR_3',
    'UNIT_CRUISER',
    'UNIT_DESTROYER',
    'UNIT_IRONCLAD');
-- And its gate line, once the gate files have set the column: the upgrading minimum tells the value.
INSERT OR IGNORE INTO CivilopediaPageChapterParagraphs (SectionID, PageID, ChapterID, Paragraph, SortIndex)
    SELECT 'UNITS', u.UnitType, 'SR_LOCK_2', CASE WHEN g.Value = '1' THEN 'LOC_SR_PEDIA_UNIT_NITER_GATE_UPGRADE' ELSE 'LOC_SR_PEDIA_UNIT_NITER_GATE_TRAINING' END, 10
    FROM Units u JOIN GlobalParameters g ON g.Name = 'STRATEGIC_RESOURCE_MINIMUM_FOR_UNIT_UPGRADING'
    WHERE u.StrategicResource IS NOT NULL AND u.UnitType IN (
    'UNIT_BARBARY_CORSAIR',
    'UNIT_BARBARY_CORSAIR_2',
    'UNIT_BARBARY_CORSAIR_3',
    'UNIT_CRUISER',
    'UNIT_DESTROYER',
    'UNIT_IRONCLAD');

-- The OIL line on each unit's page, by the loaded penalty level (none when the penalty is off).
INSERT OR IGNORE INTO CivilopediaPageChapterParagraphs (SectionID, PageID, ChapterID, Paragraph, SortIndex)
    SELECT 'UNITS', u.UnitType, 'SR_SUPPLY_2', CASE a.Value WHEN '-2' THEN 'LOC_SR_PEDIA_UNIT_OIL_LIGHT' WHEN '-3' THEN 'LOC_SR_PEDIA_UNIT_OIL_STANDARD' WHEN '-5' THEN 'LOC_SR_PEDIA_UNIT_OIL_HARSH' END, 10
    FROM Units u JOIN ModifierArguments a ON a.ModifierId = 'SR_COMBAT_PENALTY_OIL' AND a.Name = 'Amount'
    WHERE a.Value IN ('-2', '-3', '-5') AND u.UnitType IN (
    'UNIT_BIPLANE',
    'UNIT_BOMBER',
    'UNIT_DIVEBOMBER',
    'UNIT_FIGHTER',
    'UNIT_HEAVY_BOMBER',
    'UNIT_STUKA',
    'UNIT_STUKA_2',
    'UNIT_TRENCH_FIGHTER',
    'UNIT_ZERO',
    'UNIT_ZERO_2');
-- And its gate line, once the gate files have set the column: the upgrading minimum tells the value.
INSERT OR IGNORE INTO CivilopediaPageChapterParagraphs (SectionID, PageID, ChapterID, Paragraph, SortIndex)
    SELECT 'UNITS', u.UnitType, 'SR_LOCK_2', CASE WHEN g.Value = '1' THEN 'LOC_SR_PEDIA_UNIT_OIL_GATE_UPGRADE' ELSE 'LOC_SR_PEDIA_UNIT_OIL_GATE_TRAINING' END, 10
    FROM Units u JOIN GlobalParameters g ON g.Name = 'STRATEGIC_RESOURCE_MINIMUM_FOR_UNIT_UPGRADING'
    WHERE u.StrategicResource IS NOT NULL AND u.UnitType IN (
    'UNIT_BIPLANE',
    'UNIT_BOMBER',
    'UNIT_DIVEBOMBER',
    'UNIT_FIGHTER',
    'UNIT_HEAVY_BOMBER',
    'UNIT_STUKA',
    'UNIT_STUKA_2',
    'UNIT_TRENCH_FIGHTER',
    'UNIT_ZERO',
    'UNIT_ZERO_2');

-- The locks, under the locked levels only.

INSERT OR IGNORE INTO Types (Type, Kind)
    VALUES ('TRAIT_SR_LOCKED', 'KIND_TRAIT'), ('SR_LINE_ATTACH_TYPE', 'KIND_MODIFIER'), ('SR_LINE_GRANT_TYPE', 'KIND_MODIFIER');
INSERT OR IGNORE INTO Traits (TraitType, InternalOnly)
    VALUES ('TRAIT_SR_LOCKED', 1);
INSERT OR IGNORE INTO DynamicModifiers (ModifierType, CollectionType, EffectType)
    VALUES ('SR_LINE_ATTACH_TYPE', 'COLLECTION_MAJOR_PLAYERS', 'EFFECT_ATTACH_MODIFIERS'), ('SR_LINE_GRANT_TYPE', 'COLLECTION_OWNER', 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_HAS_COAL', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 0);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_HAS_COAL', 'ResourceType', 'RESOURCE_COAL'), ('SR_LINE_HAS_COAL', 'Amount', '1');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_NO_COAL', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 1);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_NO_COAL', 'ResourceType', 'RESOURCE_COAL'), ('SR_LINE_NO_COAL', 'Amount', '1');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_HAS_NITER', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 0);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_HAS_NITER', 'ResourceType', 'RESOURCE_NITER'), ('SR_LINE_HAS_NITER', 'Amount', '1');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_NO_NITER', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 1);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_NO_NITER', 'ResourceType', 'RESOURCE_NITER'), ('SR_LINE_NO_NITER', 'Amount', '1');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_HAS_OIL', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 0);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_HAS_OIL', 'ResourceType', 'RESOURCE_OIL'), ('SR_LINE_HAS_OIL', 'Amount', '1');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_NO_OIL', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 1);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_NO_OIL', 'ResourceType', 'RESOURCE_OIL'), ('SR_LINE_NO_OIL', 'Amount', '1');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_HAS_RUBBER', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 0);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_HAS_RUBBER', 'ResourceType', 'RESOURCE_RUBBER'), ('SR_LINE_HAS_RUBBER', 'Amount', '1');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_NO_RUBBER', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 1);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_NO_RUBBER', 'ResourceType', 'RESOURCE_RUBBER'), ('SR_LINE_NO_RUBBER', 'Amount', '1');

-- UNIT_ASSAULT_GUN: base, needs RESOURCE_NITER, RESOURCE_COAL; keeps UNIT_HEAVY_ARTILLERY trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_ASSAULT_GUN', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_ASSAULT_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_ASSAULT_GUN', 'ModifierId', 'SR_LINE_GRANT_UNIT_ASSAULT_GUN' FROM Units WHERE UnitType = 'UNIT_ASSAULT_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_ASSAULT_GUN', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_ASSAULT_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_ASSAULT_GUN', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_ASSAULT_GUN' FROM Units WHERE UnitType = 'UNIT_ASSAULT_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_ASSAULT_GUN', 'UnitType', 'UNIT_ASSAULT_GUN' FROM Units WHERE UnitType = 'UNIT_ASSAULT_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_ASSAULT_GUN' FROM Units WHERE UnitType = 'UNIT_ASSAULT_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_ASSAULT_GUN', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_ASSAULT_GUN' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_ASSAULT_GUN');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_ASSAULT_GUN', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_ASSAULT_GUN' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_ASSAULT_GUN');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_ASSAULT_GUN' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_ASSAULT_GUN' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_ASSAULT_GUN', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_ASSAULT_GUN' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_ASSAULT_GUN');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_ASSAULT_GUN' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_ASSAULT_GUN' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_ASSAULT_GUN', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_ASSAULT_GUN' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_ASSAULT_GUN');

-- UNIT_AT_GUN: base, needs RESOURCE_NITER, RESOURCE_COAL; keeps UNIT_FIELD_GUN trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_AT_GUN', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_AT_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_AT_GUN', 'ModifierId', 'SR_LINE_GRANT_UNIT_AT_GUN' FROM Units WHERE UnitType = 'UNIT_AT_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_AT_GUN', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_AT_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_AT_GUN', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_AT_GUN' FROM Units WHERE UnitType = 'UNIT_AT_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_AT_GUN', 'UnitType', 'UNIT_AT_GUN' FROM Units WHERE UnitType = 'UNIT_AT_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_AT_GUN' FROM Units WHERE UnitType = 'UNIT_AT_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_AT_GUN', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_AT_GUN' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_AT_GUN');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_AT_GUN', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_AT_GUN' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_AT_GUN');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_AT_GUN' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_AT_GUN' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_AT_GUN', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_AT_GUN' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_AT_GUN');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_AT_GUN' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_AT_GUN' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_AT_GUN', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_AT_GUN' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_AT_GUN');

-- UNIT_BARBARY_CORSAIR: unique, needs RESOURCE_COAL, RESOURCE_NITER.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_BARBARY_CORSAIR', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_BARBARY_CORSAIR', 'ModifierId', 'SR_LINE_GRANT_UNIT_BARBARY_CORSAIR' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_BARBARY_CORSAIR', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_BARBARY_CORSAIR', 'UnitType', 'UNIT_BARBARY_CORSAIR' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_BARBARY_CORSAIR' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_BARBARY_CORSAIR_2: unique, needs RESOURCE_COAL, RESOURCE_NITER; keeps UNIT_BARBARY_CORSAIR trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_BARBARY_CORSAIR_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_BARBARY_CORSAIR_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_BARBARY_CORSAIR_2' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_BARBARY_CORSAIR_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR_2' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_BARBARY_CORSAIR_2', 'UnitType', 'UNIT_BARBARY_CORSAIR_2' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_BARBARY_CORSAIR_2' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR_2', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR_2');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR_2', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR_2');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_BARBARY_CORSAIR_3: unique, needs RESOURCE_COAL, RESOURCE_NITER; keeps UNIT_BARBARY_CORSAIR_2 trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_BARBARY_CORSAIR_3', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_BARBARY_CORSAIR_3', 'ModifierId', 'SR_LINE_GRANT_UNIT_BARBARY_CORSAIR_3' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR_3', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_BARBARY_CORSAIR_3', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR_3' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_BARBARY_CORSAIR_3', 'UnitType', 'UNIT_BARBARY_CORSAIR_3' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_BARBARY_CORSAIR_3' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR_3', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_3' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR_3');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR_3', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_3' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR_3');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BARBARY_CORSAIR_3', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_BARBARY_CORSAIR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_BATTLESHIP: base, needs RESOURCE_OIL, RESOURCE_COAL; keeps UNIT_DREADNOUGHT trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_BATTLESHIP', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_BATTLESHIP' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_BATTLESHIP', 'ModifierId', 'SR_LINE_GRANT_UNIT_BATTLESHIP' FROM Units WHERE UnitType = 'UNIT_BATTLESHIP' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_BATTLESHIP', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_BATTLESHIP' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_BATTLESHIP', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_BATTLESHIP' FROM Units WHERE UnitType = 'UNIT_BATTLESHIP' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_BATTLESHIP', 'UnitType', 'UNIT_BATTLESHIP' FROM Units WHERE UnitType = 'UNIT_BATTLESHIP' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_BATTLESHIP' FROM Units WHERE UnitType = 'UNIT_BATTLESHIP' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BATTLESHIP', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_BATTLESHIP' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BATTLESHIP');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BATTLESHIP', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_BATTLESHIP' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BATTLESHIP');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_BATTLESHIP' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_BATTLESHIP' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BATTLESHIP', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_BATTLESHIP' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BATTLESHIP');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_BATTLESHIP' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_BATTLESHIP' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BATTLESHIP', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_BATTLESHIP' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BATTLESHIP');

-- UNIT_BIPLANE: base, needs RESOURCE_RUBBER, RESOURCE_OIL.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_BIPLANE', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_BIPLANE' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_BIPLANE', 'ModifierId', 'SR_LINE_GRANT_UNIT_BIPLANE' FROM Units WHERE UnitType = 'UNIT_BIPLANE' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_BIPLANE', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_BIPLANE' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_BIPLANE', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_BIPLANE' FROM Units WHERE UnitType = 'UNIT_BIPLANE' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_BIPLANE', 'UnitType', 'UNIT_BIPLANE' FROM Units WHERE UnitType = 'UNIT_BIPLANE' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_BIPLANE' FROM Units WHERE UnitType = 'UNIT_BIPLANE' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BIPLANE', 'SR_LINE_HAS_RUBBER' FROM Units WHERE UnitType = 'UNIT_BIPLANE' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BIPLANE');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BIPLANE', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_BIPLANE' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BIPLANE');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_BIPLANE' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_BIPLANE' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BIPLANE', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_BIPLANE' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BIPLANE');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_BIPLANE' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_BIPLANE' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BIPLANE', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_BIPLANE' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BIPLANE');

-- UNIT_BOMBER: base, needs RESOURCE_RUBBER, RESOURCE_OIL.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_BOMBER', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_BOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_BOMBER', 'ModifierId', 'SR_LINE_GRANT_UNIT_BOMBER' FROM Units WHERE UnitType = 'UNIT_BOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_BOMBER', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_BOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_BOMBER', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_BOMBER' FROM Units WHERE UnitType = 'UNIT_BOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_BOMBER', 'UnitType', 'UNIT_BOMBER' FROM Units WHERE UnitType = 'UNIT_BOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_BOMBER' FROM Units WHERE UnitType = 'UNIT_BOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BOMBER', 'SR_LINE_HAS_RUBBER' FROM Units WHERE UnitType = 'UNIT_BOMBER' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BOMBER');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BOMBER', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_BOMBER' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BOMBER');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_BOMBER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_BOMBER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BOMBER', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_BOMBER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BOMBER');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_BOMBER' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_BOMBER' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BOMBER', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_BOMBER' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BOMBER');

-- UNIT_CHANG_BEUN: unique, needs RESOURCE_NITER, RESOURCE_COAL.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_CHANG_BEUN', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_CHANG_BEUN', 'ModifierId', 'SR_LINE_GRANT_UNIT_CHANG_BEUN' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_CHANG_BEUN', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_CHANG_BEUN', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_CHANG_BEUN' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_CHANG_BEUN', 'UnitType', 'UNIT_CHANG_BEUN' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_CHANG_BEUN' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CHANG_BEUN', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_CHANG_BEUN');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CHANG_BEUN', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_CHANG_BEUN');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CHANG_BEUN', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_CHANG_BEUN_2: unique, needs RESOURCE_NITER, RESOURCE_COAL; keeps UNIT_CHANG_BEUN trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_CHANG_BEUN_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_CHANG_BEUN_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_CHANG_BEUN_2' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_CHANG_BEUN_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_CHANG_BEUN_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_CHANG_BEUN_2' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_CHANG_BEUN_2', 'UnitType', 'UNIT_CHANG_BEUN_2' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_CHANG_BEUN_2' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CHANG_BEUN_2', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_CHANG_BEUN_2');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CHANG_BEUN_2', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_CHANG_BEUN_2');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CHANG_BEUN_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_CHANG_BEUN_3: unique, needs RESOURCE_NITER, RESOURCE_COAL; keeps UNIT_CHANG_BEUN_2 trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_CHANG_BEUN_3', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_CHANG_BEUN_3', 'ModifierId', 'SR_LINE_GRANT_UNIT_CHANG_BEUN_3' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_CHANG_BEUN_3', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_CHANG_BEUN_3', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_CHANG_BEUN_3' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_CHANG_BEUN_3', 'UnitType', 'UNIT_CHANG_BEUN_3' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_CHANG_BEUN_3' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CHANG_BEUN_3', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_3' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_CHANG_BEUN_3');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CHANG_BEUN_3', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_3' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_CHANG_BEUN_3');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CHANG_BEUN_3', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_CHANG_BEUN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_COSSACK_2: unique, needs RESOURCE_OIL, RESOURCE_COAL; keeps UNIT_COSSACK trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_COSSACK_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_COSSACK_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_COSSACK_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_COSSACK_2' FROM Units WHERE UnitType = 'UNIT_COSSACK_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_COSSACK_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_COSSACK_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_COSSACK_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_COSSACK_2' FROM Units WHERE UnitType = 'UNIT_COSSACK_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_COSSACK_2', 'UnitType', 'UNIT_COSSACK_2' FROM Units WHERE UnitType = 'UNIT_COSSACK_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_COSSACK_2' FROM Units WHERE UnitType = 'UNIT_COSSACK_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_COSSACK_2', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_COSSACK_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_COSSACK_2');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_COSSACK_2', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_COSSACK_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_COSSACK_2');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_COSSACK_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_COSSACK_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_COSSACK_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_COSSACK_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_COSSACK_3: unique, needs RESOURCE_OIL, RESOURCE_COAL; keeps UNIT_COSSACK_2 trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_COSSACK_3', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_COSSACK_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_COSSACK_3', 'ModifierId', 'SR_LINE_GRANT_UNIT_COSSACK_3' FROM Units WHERE UnitType = 'UNIT_COSSACK_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_COSSACK_3', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_COSSACK_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_COSSACK_3', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_COSSACK_3' FROM Units WHERE UnitType = 'UNIT_COSSACK_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_COSSACK_3', 'UnitType', 'UNIT_COSSACK_3' FROM Units WHERE UnitType = 'UNIT_COSSACK_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_COSSACK_3' FROM Units WHERE UnitType = 'UNIT_COSSACK_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_COSSACK_3', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_COSSACK_3' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_COSSACK_3');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_COSSACK_3', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_COSSACK_3' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_COSSACK_3');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_COSSACK_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_COSSACK_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_COSSACK_3', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_COSSACK_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_CRUISER: base, needs RESOURCE_COAL, RESOURCE_NITER; keeps UNIT_IRONCLAD trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_CRUISER', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_CRUISER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_CRUISER', 'ModifierId', 'SR_LINE_GRANT_UNIT_CRUISER' FROM Units WHERE UnitType = 'UNIT_CRUISER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_CRUISER', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_CRUISER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_CRUISER', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_CRUISER' FROM Units WHERE UnitType = 'UNIT_CRUISER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_CRUISER', 'UnitType', 'UNIT_CRUISER' FROM Units WHERE UnitType = 'UNIT_CRUISER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_CRUISER' FROM Units WHERE UnitType = 'UNIT_CRUISER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CRUISER', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_CRUISER' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_CRUISER');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CRUISER', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_CRUISER' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_CRUISER');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_CRUISER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_CRUISER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CRUISER', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_CRUISER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_CRUISER');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_CRUISER' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_CRUISER' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CRUISER', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_CRUISER' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_CRUISER');

-- UNIT_DESTROYER: base, needs RESOURCE_COAL, RESOURCE_NITER; keeps UNIT_CRUISER trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_DESTROYER', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_DESTROYER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_DESTROYER', 'ModifierId', 'SR_LINE_GRANT_UNIT_DESTROYER' FROM Units WHERE UnitType = 'UNIT_DESTROYER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_DESTROYER', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_DESTROYER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_DESTROYER', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_DESTROYER' FROM Units WHERE UnitType = 'UNIT_DESTROYER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_DESTROYER', 'UnitType', 'UNIT_DESTROYER' FROM Units WHERE UnitType = 'UNIT_DESTROYER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_DESTROYER' FROM Units WHERE UnitType = 'UNIT_DESTROYER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_DESTROYER', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_DESTROYER' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_DESTROYER');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_DESTROYER', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_DESTROYER' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_DESTROYER');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_DESTROYER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_DESTROYER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_DESTROYER', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_DESTROYER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_DESTROYER');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_DESTROYER' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_DESTROYER' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_DESTROYER', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_DESTROYER' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_DESTROYER');

-- UNIT_DIVEBOMBER: base, needs RESOURCE_RUBBER, RESOURCE_OIL; keeps UNIT_TRENCH_FIGHTER trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_DIVEBOMBER', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_DIVEBOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_DIVEBOMBER', 'ModifierId', 'SR_LINE_GRANT_UNIT_DIVEBOMBER' FROM Units WHERE UnitType = 'UNIT_DIVEBOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_DIVEBOMBER', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_DIVEBOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_DIVEBOMBER', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_DIVEBOMBER' FROM Units WHERE UnitType = 'UNIT_DIVEBOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_DIVEBOMBER', 'UnitType', 'UNIT_DIVEBOMBER' FROM Units WHERE UnitType = 'UNIT_DIVEBOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_DIVEBOMBER' FROM Units WHERE UnitType = 'UNIT_DIVEBOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_DIVEBOMBER', 'SR_LINE_HAS_RUBBER' FROM Units WHERE UnitType = 'UNIT_DIVEBOMBER' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_DIVEBOMBER');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_DIVEBOMBER', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_DIVEBOMBER' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_DIVEBOMBER');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_DIVEBOMBER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_DIVEBOMBER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_DIVEBOMBER', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_DIVEBOMBER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_DIVEBOMBER');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_DIVEBOMBER' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_DIVEBOMBER' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_DIVEBOMBER', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_DIVEBOMBER' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_DIVEBOMBER');

-- UNIT_DREADNOUGHT: base, needs RESOURCE_OIL, RESOURCE_COAL; keeps UNIT_FRIGATE trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_DREADNOUGHT', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_DREADNOUGHT' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_DREADNOUGHT', 'ModifierId', 'SR_LINE_GRANT_UNIT_DREADNOUGHT' FROM Units WHERE UnitType = 'UNIT_DREADNOUGHT' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_DREADNOUGHT', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_DREADNOUGHT' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_DREADNOUGHT', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_DREADNOUGHT' FROM Units WHERE UnitType = 'UNIT_DREADNOUGHT' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_DREADNOUGHT', 'UnitType', 'UNIT_DREADNOUGHT' FROM Units WHERE UnitType = 'UNIT_DREADNOUGHT' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_DREADNOUGHT' FROM Units WHERE UnitType = 'UNIT_DREADNOUGHT' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_DREADNOUGHT', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_DREADNOUGHT' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_DREADNOUGHT');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_DREADNOUGHT', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_DREADNOUGHT' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_DREADNOUGHT');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_DREADNOUGHT' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_DREADNOUGHT' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_DREADNOUGHT', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_DREADNOUGHT' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_DREADNOUGHT');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_DREADNOUGHT' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_DREADNOUGHT' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_DREADNOUGHT', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_DREADNOUGHT' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_DREADNOUGHT');

-- UNIT_FIELD_CANNON: base, needs RESOURCE_NITER, RESOURCE_COAL.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_FIELD_CANNON', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_FIELD_CANNON' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_FIELD_CANNON', 'ModifierId', 'SR_LINE_GRANT_UNIT_FIELD_CANNON' FROM Units WHERE UnitType = 'UNIT_FIELD_CANNON' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_FIELD_CANNON', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_FIELD_CANNON' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_FIELD_CANNON', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_FIELD_CANNON' FROM Units WHERE UnitType = 'UNIT_FIELD_CANNON' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_FIELD_CANNON', 'UnitType', 'UNIT_FIELD_CANNON' FROM Units WHERE UnitType = 'UNIT_FIELD_CANNON' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_FIELD_CANNON' FROM Units WHERE UnitType = 'UNIT_FIELD_CANNON' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_FIELD_CANNON', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_FIELD_CANNON' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_FIELD_CANNON');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_FIELD_CANNON', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_FIELD_CANNON' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_FIELD_CANNON');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_FIELD_CANNON' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_FIELD_CANNON' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_FIELD_CANNON', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_FIELD_CANNON' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_FIELD_CANNON');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_FIELD_CANNON' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_FIELD_CANNON' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_FIELD_CANNON', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_FIELD_CANNON' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_FIELD_CANNON');

-- UNIT_FIELD_GUN: base, needs RESOURCE_NITER, RESOURCE_COAL; keeps UNIT_FIELD_CANNON trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_FIELD_GUN', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_FIELD_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_FIELD_GUN', 'ModifierId', 'SR_LINE_GRANT_UNIT_FIELD_GUN' FROM Units WHERE UnitType = 'UNIT_FIELD_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_FIELD_GUN', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_FIELD_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_FIELD_GUN', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_FIELD_GUN' FROM Units WHERE UnitType = 'UNIT_FIELD_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_FIELD_GUN', 'UnitType', 'UNIT_FIELD_GUN' FROM Units WHERE UnitType = 'UNIT_FIELD_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_FIELD_GUN' FROM Units WHERE UnitType = 'UNIT_FIELD_GUN' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_FIELD_GUN', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_FIELD_GUN' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_FIELD_GUN');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_FIELD_GUN', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_FIELD_GUN' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_FIELD_GUN');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_FIELD_GUN' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_FIELD_GUN' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_FIELD_GUN', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_FIELD_GUN' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_FIELD_GUN');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_FIELD_GUN' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_FIELD_GUN' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_FIELD_GUN', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_FIELD_GUN' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_FIELD_GUN');

-- UNIT_FIGHTER: base, needs RESOURCE_RUBBER, RESOURCE_OIL; keeps UNIT_BIPLANE trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_FIGHTER', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_FIGHTER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_FIGHTER', 'ModifierId', 'SR_LINE_GRANT_UNIT_FIGHTER' FROM Units WHERE UnitType = 'UNIT_FIGHTER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_FIGHTER', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_FIGHTER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_FIGHTER', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_FIGHTER' FROM Units WHERE UnitType = 'UNIT_FIGHTER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_FIGHTER', 'UnitType', 'UNIT_FIGHTER' FROM Units WHERE UnitType = 'UNIT_FIGHTER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_FIGHTER' FROM Units WHERE UnitType = 'UNIT_FIGHTER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_FIGHTER', 'SR_LINE_HAS_RUBBER' FROM Units WHERE UnitType = 'UNIT_FIGHTER' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_FIGHTER');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_FIGHTER', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_FIGHTER' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_FIGHTER');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_FIGHTER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_FIGHTER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_FIGHTER', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_FIGHTER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_FIGHTER');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_FIGHTER' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_FIGHTER' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_FIGHTER', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_FIGHTER' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_FIGHTER');

-- UNIT_GHILMAN_2: unique, needs RESOURCE_OIL, RESOURCE_COAL; keeps UNIT_GHILMAN trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_GHILMAN_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_GHILMAN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_GHILMAN_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_GHILMAN_2' FROM Units WHERE UnitType = 'UNIT_GHILMAN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_GHILMAN_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_GHILMAN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_GHILMAN_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_GHILMAN_2' FROM Units WHERE UnitType = 'UNIT_GHILMAN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_GHILMAN_2', 'UnitType', 'UNIT_GHILMAN_2' FROM Units WHERE UnitType = 'UNIT_GHILMAN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_GHILMAN_2' FROM Units WHERE UnitType = 'UNIT_GHILMAN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_GHILMAN_2', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_GHILMAN_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_GHILMAN_2');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_GHILMAN_2', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_GHILMAN_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_GHILMAN_2');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_GHILMAN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_GHILMAN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_GHILMAN_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_GHILMAN_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_GHILMAN_3: unique, needs RESOURCE_OIL, RESOURCE_COAL; keeps UNIT_GHILMAN_2 trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_GHILMAN_3', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_GHILMAN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_GHILMAN_3', 'ModifierId', 'SR_LINE_GRANT_UNIT_GHILMAN_3' FROM Units WHERE UnitType = 'UNIT_GHILMAN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_GHILMAN_3', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_GHILMAN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_GHILMAN_3', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_GHILMAN_3' FROM Units WHERE UnitType = 'UNIT_GHILMAN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_GHILMAN_3', 'UnitType', 'UNIT_GHILMAN_3' FROM Units WHERE UnitType = 'UNIT_GHILMAN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_GHILMAN_3' FROM Units WHERE UnitType = 'UNIT_GHILMAN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_GHILMAN_3', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_GHILMAN_3' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_GHILMAN_3');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_GHILMAN_3', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_GHILMAN_3' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_GHILMAN_3');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_GHILMAN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_GHILMAN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_GHILMAN_3', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_GHILMAN_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_HEAVY_ARTILLERY: base, needs RESOURCE_NITER, RESOURCE_COAL; keeps UNIT_MORTAR trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_HEAVY_ARTILLERY', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_HEAVY_ARTILLERY' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_HEAVY_ARTILLERY', 'ModifierId', 'SR_LINE_GRANT_UNIT_HEAVY_ARTILLERY' FROM Units WHERE UnitType = 'UNIT_HEAVY_ARTILLERY' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_HEAVY_ARTILLERY', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_HEAVY_ARTILLERY' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_HEAVY_ARTILLERY', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_HEAVY_ARTILLERY' FROM Units WHERE UnitType = 'UNIT_HEAVY_ARTILLERY' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_HEAVY_ARTILLERY', 'UnitType', 'UNIT_HEAVY_ARTILLERY' FROM Units WHERE UnitType = 'UNIT_HEAVY_ARTILLERY' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_HEAVY_ARTILLERY' FROM Units WHERE UnitType = 'UNIT_HEAVY_ARTILLERY' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HEAVY_ARTILLERY', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_HEAVY_ARTILLERY' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_HEAVY_ARTILLERY');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HEAVY_ARTILLERY', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_HEAVY_ARTILLERY' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_HEAVY_ARTILLERY');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_HEAVY_ARTILLERY' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_HEAVY_ARTILLERY' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HEAVY_ARTILLERY', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_HEAVY_ARTILLERY' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_HEAVY_ARTILLERY');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_HEAVY_ARTILLERY' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_HEAVY_ARTILLERY' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HEAVY_ARTILLERY', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_HEAVY_ARTILLERY' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_HEAVY_ARTILLERY');

-- UNIT_HEAVY_BOMBER: base, needs RESOURCE_RUBBER, RESOURCE_OIL; keeps UNIT_BOMBER trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_HEAVY_BOMBER', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_HEAVY_BOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_HEAVY_BOMBER', 'ModifierId', 'SR_LINE_GRANT_UNIT_HEAVY_BOMBER' FROM Units WHERE UnitType = 'UNIT_HEAVY_BOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_HEAVY_BOMBER', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_HEAVY_BOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_HEAVY_BOMBER', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_HEAVY_BOMBER' FROM Units WHERE UnitType = 'UNIT_HEAVY_BOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_HEAVY_BOMBER', 'UnitType', 'UNIT_HEAVY_BOMBER' FROM Units WHERE UnitType = 'UNIT_HEAVY_BOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_HEAVY_BOMBER' FROM Units WHERE UnitType = 'UNIT_HEAVY_BOMBER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HEAVY_BOMBER', 'SR_LINE_HAS_RUBBER' FROM Units WHERE UnitType = 'UNIT_HEAVY_BOMBER' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_HEAVY_BOMBER');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HEAVY_BOMBER', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_HEAVY_BOMBER' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_HEAVY_BOMBER');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_HEAVY_BOMBER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_HEAVY_BOMBER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HEAVY_BOMBER', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_HEAVY_BOMBER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_HEAVY_BOMBER');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_HEAVY_BOMBER' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_HEAVY_BOMBER' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HEAVY_BOMBER', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_HEAVY_BOMBER' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_HEAVY_BOMBER');

-- UNIT_HUSSAR_2: unique, needs RESOURCE_OIL, RESOURCE_COAL; keeps UNIT_HUSSAR trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_HUSSAR_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_HUSSAR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_HUSSAR_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_HUSSAR_2' FROM Units WHERE UnitType = 'UNIT_HUSSAR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_HUSSAR_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_HUSSAR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_HUSSAR_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_HUSSAR_2' FROM Units WHERE UnitType = 'UNIT_HUSSAR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_HUSSAR_2', 'UnitType', 'UNIT_HUSSAR_2' FROM Units WHERE UnitType = 'UNIT_HUSSAR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_HUSSAR_2' FROM Units WHERE UnitType = 'UNIT_HUSSAR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HUSSAR_2', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_HUSSAR_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_HUSSAR_2');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HUSSAR_2', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_HUSSAR_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_HUSSAR_2');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_HUSSAR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_HUSSAR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HUSSAR_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_HUSSAR_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_HUSSAR_3: unique, needs RESOURCE_OIL, RESOURCE_COAL; keeps UNIT_HUSSAR_2 trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_HUSSAR_3', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_HUSSAR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_HUSSAR_3', 'ModifierId', 'SR_LINE_GRANT_UNIT_HUSSAR_3' FROM Units WHERE UnitType = 'UNIT_HUSSAR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_HUSSAR_3', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_HUSSAR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_HUSSAR_3', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_HUSSAR_3' FROM Units WHERE UnitType = 'UNIT_HUSSAR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_HUSSAR_3', 'UnitType', 'UNIT_HUSSAR_3' FROM Units WHERE UnitType = 'UNIT_HUSSAR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_HUSSAR_3' FROM Units WHERE UnitType = 'UNIT_HUSSAR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HUSSAR_3', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_HUSSAR_3' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_HUSSAR_3');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HUSSAR_3', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_HUSSAR_3' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_HUSSAR_3');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_HUSSAR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_HUSSAR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HUSSAR_3', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_HUSSAR_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_IRONCLAD: base, needs RESOURCE_COAL, RESOURCE_NITER.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_IRONCLAD', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_IRONCLAD' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_IRONCLAD', 'ModifierId', 'SR_LINE_GRANT_UNIT_IRONCLAD' FROM Units WHERE UnitType = 'UNIT_IRONCLAD' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_IRONCLAD', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_IRONCLAD' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_IRONCLAD', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_IRONCLAD' FROM Units WHERE UnitType = 'UNIT_IRONCLAD' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_IRONCLAD', 'UnitType', 'UNIT_IRONCLAD' FROM Units WHERE UnitType = 'UNIT_IRONCLAD' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_IRONCLAD' FROM Units WHERE UnitType = 'UNIT_IRONCLAD' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_IRONCLAD', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_IRONCLAD' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_IRONCLAD');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_IRONCLAD', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_IRONCLAD' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_IRONCLAD');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_IRONCLAD' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_IRONCLAD' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_IRONCLAD', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_IRONCLAD' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_IRONCLAD');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_IRONCLAD' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_IRONCLAD' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_IRONCLAD', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_IRONCLAD' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_IRONCLAD');

-- UNIT_KATYUSHA: unique, needs RESOURCE_NITER, RESOURCE_COAL.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_KATYUSHA', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_KATYUSHA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_KATYUSHA', 'ModifierId', 'SR_LINE_GRANT_UNIT_KATYUSHA' FROM Units WHERE UnitType = 'UNIT_KATYUSHA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_KATYUSHA', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_KATYUSHA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_KATYUSHA', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_KATYUSHA' FROM Units WHERE UnitType = 'UNIT_KATYUSHA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_KATYUSHA', 'UnitType', 'UNIT_KATYUSHA' FROM Units WHERE UnitType = 'UNIT_KATYUSHA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_KATYUSHA' FROM Units WHERE UnitType = 'UNIT_KATYUSHA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_KATYUSHA', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_KATYUSHA' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_KATYUSHA');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_KATYUSHA', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_KATYUSHA' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_KATYUSHA');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_KATYUSHA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_KATYUSHA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_KATYUSHA', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_KATYUSHA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_KATYUSHA_2: unique, needs RESOURCE_NITER, RESOURCE_COAL; keeps UNIT_KATYUSHA trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_KATYUSHA_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_KATYUSHA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_KATYUSHA_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_KATYUSHA_2' FROM Units WHERE UnitType = 'UNIT_KATYUSHA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_KATYUSHA_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_KATYUSHA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_KATYUSHA_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_KATYUSHA_2' FROM Units WHERE UnitType = 'UNIT_KATYUSHA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_KATYUSHA_2', 'UnitType', 'UNIT_KATYUSHA_2' FROM Units WHERE UnitType = 'UNIT_KATYUSHA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_KATYUSHA_2' FROM Units WHERE UnitType = 'UNIT_KATYUSHA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_KATYUSHA_2', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_KATYUSHA_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_KATYUSHA_2');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_KATYUSHA_2', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_KATYUSHA_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_KATYUSHA_2');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_KATYUSHA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_KATYUSHA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_KATYUSHA_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_KATYUSHA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_LANDSHIP: base, needs RESOURCE_OIL, RESOURCE_COAL; keeps UNIT_CUIRASSIER trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_LANDSHIP', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_LANDSHIP' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_LANDSHIP', 'ModifierId', 'SR_LINE_GRANT_UNIT_LANDSHIP' FROM Units WHERE UnitType = 'UNIT_LANDSHIP' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_LANDSHIP', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_LANDSHIP' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_LANDSHIP', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_LANDSHIP' FROM Units WHERE UnitType = 'UNIT_LANDSHIP' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_LANDSHIP', 'UnitType', 'UNIT_LANDSHIP' FROM Units WHERE UnitType = 'UNIT_LANDSHIP' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_LANDSHIP' FROM Units WHERE UnitType = 'UNIT_LANDSHIP' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_LANDSHIP', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_LANDSHIP' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_LANDSHIP');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_LANDSHIP', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_LANDSHIP' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_LANDSHIP');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_LANDSHIP' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_LANDSHIP' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_LANDSHIP', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_LANDSHIP' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_LANDSHIP');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_LANDSHIP' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_LANDSHIP' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_LANDSHIP', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_LANDSHIP' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_LANDSHIP');

-- UNIT_MIKASA: unique, needs RESOURCE_OIL, RESOURCE_COAL.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_MIKASA', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_MIKASA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_MIKASA', 'ModifierId', 'SR_LINE_GRANT_UNIT_MIKASA' FROM Units WHERE UnitType = 'UNIT_MIKASA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_MIKASA', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_MIKASA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_MIKASA', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_MIKASA' FROM Units WHERE UnitType = 'UNIT_MIKASA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_MIKASA', 'UnitType', 'UNIT_MIKASA' FROM Units WHERE UnitType = 'UNIT_MIKASA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_MIKASA' FROM Units WHERE UnitType = 'UNIT_MIKASA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_MIKASA', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_MIKASA' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_MIKASA');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_MIKASA', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_MIKASA' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_MIKASA');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_MIKASA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_MIKASA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_MIKASA', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_MIKASA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_MIKASA_2: unique, needs RESOURCE_OIL, RESOURCE_COAL; keeps UNIT_MIKASA trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_MIKASA_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_MIKASA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_MIKASA_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_MIKASA_2' FROM Units WHERE UnitType = 'UNIT_MIKASA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_MIKASA_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_MIKASA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_MIKASA_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_MIKASA_2' FROM Units WHERE UnitType = 'UNIT_MIKASA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_MIKASA_2', 'UnitType', 'UNIT_MIKASA_2' FROM Units WHERE UnitType = 'UNIT_MIKASA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_MIKASA_2' FROM Units WHERE UnitType = 'UNIT_MIKASA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_MIKASA_2', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_MIKASA_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_MIKASA_2');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_MIKASA_2', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_MIKASA_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_MIKASA_2');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_MIKASA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_MIKASA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_MIKASA_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_MIKASA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_MORTAR: base, needs RESOURCE_NITER, RESOURCE_COAL.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_MORTAR', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_MORTAR' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_MORTAR', 'ModifierId', 'SR_LINE_GRANT_UNIT_MORTAR' FROM Units WHERE UnitType = 'UNIT_MORTAR' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_MORTAR', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_MORTAR' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_MORTAR', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_MORTAR' FROM Units WHERE UnitType = 'UNIT_MORTAR' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_MORTAR', 'UnitType', 'UNIT_MORTAR' FROM Units WHERE UnitType = 'UNIT_MORTAR' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_MORTAR' FROM Units WHERE UnitType = 'UNIT_MORTAR' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_MORTAR', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_MORTAR' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_MORTAR');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_MORTAR', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_MORTAR' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_MORTAR');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_MORTAR' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_MORTAR' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_MORTAR', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_MORTAR' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_MORTAR');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_MORTAR' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_MORTAR' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_MORTAR', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_MORTAR' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_MORTAR');

-- UNIT_REVENGE: unique, needs RESOURCE_OIL, RESOURCE_COAL.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_REVENGE', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_REVENGE' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_REVENGE', 'ModifierId', 'SR_LINE_GRANT_UNIT_REVENGE' FROM Units WHERE UnitType = 'UNIT_REVENGE' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_REVENGE', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_REVENGE' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_REVENGE', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_REVENGE' FROM Units WHERE UnitType = 'UNIT_REVENGE' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_REVENGE', 'UnitType', 'UNIT_REVENGE' FROM Units WHERE UnitType = 'UNIT_REVENGE' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_REVENGE' FROM Units WHERE UnitType = 'UNIT_REVENGE' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_REVENGE', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_REVENGE' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_REVENGE');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_REVENGE', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_REVENGE' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_REVENGE');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_REVENGE' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_REVENGE' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_REVENGE', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_REVENGE' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_REVENGE_2: unique, needs RESOURCE_OIL, RESOURCE_COAL; keeps UNIT_REVENGE trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_REVENGE_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_REVENGE_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_REVENGE_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_REVENGE_2' FROM Units WHERE UnitType = 'UNIT_REVENGE_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_REVENGE_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_REVENGE_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_REVENGE_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_REVENGE_2' FROM Units WHERE UnitType = 'UNIT_REVENGE_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_REVENGE_2', 'UnitType', 'UNIT_REVENGE_2' FROM Units WHERE UnitType = 'UNIT_REVENGE_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_REVENGE_2' FROM Units WHERE UnitType = 'UNIT_REVENGE_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_REVENGE_2', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_REVENGE_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_REVENGE_2');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_REVENGE_2', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_REVENGE_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_REVENGE_2');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_REVENGE_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_REVENGE_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_REVENGE_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_REVENGE_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_STUKA: unique, needs RESOURCE_RUBBER, RESOURCE_OIL.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_STUKA', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_STUKA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_STUKA', 'ModifierId', 'SR_LINE_GRANT_UNIT_STUKA' FROM Units WHERE UnitType = 'UNIT_STUKA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_STUKA', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_STUKA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_STUKA', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_STUKA' FROM Units WHERE UnitType = 'UNIT_STUKA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_STUKA', 'UnitType', 'UNIT_STUKA' FROM Units WHERE UnitType = 'UNIT_STUKA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_STUKA' FROM Units WHERE UnitType = 'UNIT_STUKA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_STUKA', 'SR_LINE_HAS_RUBBER' FROM Units WHERE UnitType = 'UNIT_STUKA' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_STUKA');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_STUKA', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_STUKA' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_STUKA');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_STUKA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_STUKA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_STUKA', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_STUKA' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_STUKA_2: unique, needs RESOURCE_RUBBER, RESOURCE_OIL; keeps UNIT_STUKA trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_STUKA_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_STUKA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_STUKA_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_STUKA_2' FROM Units WHERE UnitType = 'UNIT_STUKA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_STUKA_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_STUKA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_STUKA_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_STUKA_2' FROM Units WHERE UnitType = 'UNIT_STUKA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_STUKA_2', 'UnitType', 'UNIT_STUKA_2' FROM Units WHERE UnitType = 'UNIT_STUKA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_STUKA_2' FROM Units WHERE UnitType = 'UNIT_STUKA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_STUKA_2', 'SR_LINE_HAS_RUBBER' FROM Units WHERE UnitType = 'UNIT_STUKA_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_STUKA_2');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_STUKA_2', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_STUKA_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_STUKA_2');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_STUKA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_STUKA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_STUKA_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_STUKA_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_TANK: base, needs RESOURCE_OIL, RESOURCE_COAL; keeps UNIT_LANDSHIP trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_TANK', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_TANK' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_TANK', 'ModifierId', 'SR_LINE_GRANT_UNIT_TANK' FROM Units WHERE UnitType = 'UNIT_TANK' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_TANK', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_TANK' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_TANK', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_TANK' FROM Units WHERE UnitType = 'UNIT_TANK' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_TANK', 'UnitType', 'UNIT_TANK' FROM Units WHERE UnitType = 'UNIT_TANK' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_TANK' FROM Units WHERE UnitType = 'UNIT_TANK' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_TANK', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_TANK' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_TANK');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_TANK', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_TANK' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_TANK');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_TANK' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_TANK' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_TANK', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_TANK' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_TANK');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_TANK' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_TANK' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_TANK', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_TANK' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_TANK');

-- UNIT_TRENCH_FIGHTER: base, needs RESOURCE_RUBBER, RESOURCE_OIL.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_TRENCH_FIGHTER', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_TRENCH_FIGHTER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_TRENCH_FIGHTER', 'ModifierId', 'SR_LINE_GRANT_UNIT_TRENCH_FIGHTER' FROM Units WHERE UnitType = 'UNIT_TRENCH_FIGHTER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_TRENCH_FIGHTER', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_TRENCH_FIGHTER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_TRENCH_FIGHTER', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_TRENCH_FIGHTER' FROM Units WHERE UnitType = 'UNIT_TRENCH_FIGHTER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_TRENCH_FIGHTER', 'UnitType', 'UNIT_TRENCH_FIGHTER' FROM Units WHERE UnitType = 'UNIT_TRENCH_FIGHTER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_TRENCH_FIGHTER' FROM Units WHERE UnitType = 'UNIT_TRENCH_FIGHTER' AND StrategicResource IS NOT NULL AND TraitType IS NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_TRENCH_FIGHTER', 'SR_LINE_HAS_RUBBER' FROM Units WHERE UnitType = 'UNIT_TRENCH_FIGHTER' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_TRENCH_FIGHTER');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_TRENCH_FIGHTER', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_TRENCH_FIGHTER' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_TRENCH_FIGHTER');
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_TRENCH_FIGHTER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_TRENCH_FIGHTER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_TRENCH_FIGHTER', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_TRENCH_FIGHTER' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_TRENCH_FIGHTER');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_TRENCH_FIGHTER' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || substr(rr.RequirementId, 12), 'TraitType', substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_TRENCH_FIGHTER' AND u.TraitType = 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_TRENCH_FIGHTER', 'SR_LINE_NOT_' || substr(rr.RequirementId, 12) FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = 'SR_LINE_REQS_' || u.UnitType AND rr.RequirementId LIKE 'SR_LINE_IS_%'
    WHERE r.ReplacesUnitType = 'UNIT_TRENCH_FIGHTER' AND u.TraitType = 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_TRENCH_FIGHTER');

-- UNIT_TURTLE_SHIP_2: unique, needs RESOURCE_OIL, RESOURCE_COAL; keeps UNIT_TURTLE_SHIP trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_TURTLE_SHIP_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_TURTLE_SHIP_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_TURTLE_SHIP_2' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_TURTLE_SHIP_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_TURTLE_SHIP_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_TURTLE_SHIP_2' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_TURTLE_SHIP_2', 'UnitType', 'UNIT_TURTLE_SHIP_2' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_TURTLE_SHIP_2' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_TURTLE_SHIP_2', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_TURTLE_SHIP_2');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_TURTLE_SHIP_2', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_TURTLE_SHIP_2');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_TURTLE_SHIP_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_TURTLE_SHIP_3: unique, needs RESOURCE_OIL, RESOURCE_COAL; keeps UNIT_TURTLE_SHIP_2 trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_TURTLE_SHIP_3', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_TURTLE_SHIP_3', 'ModifierId', 'SR_LINE_GRANT_UNIT_TURTLE_SHIP_3' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_TURTLE_SHIP_3', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_TURTLE_SHIP_3', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_TURTLE_SHIP_3' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_TURTLE_SHIP_3', 'UnitType', 'UNIT_TURTLE_SHIP_3' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_TURTLE_SHIP_3' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_TURTLE_SHIP_3', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_3' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_TURTLE_SHIP_3');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_TURTLE_SHIP_3', 'SR_LINE_HAS_COAL' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_3' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_TURTLE_SHIP_3');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_TURTLE_SHIP_3', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_TURTLE_SHIP_3' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_ZERO: unique, needs RESOURCE_RUBBER, RESOURCE_OIL.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_ZERO', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_ZERO' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_ZERO', 'ModifierId', 'SR_LINE_GRANT_UNIT_ZERO' FROM Units WHERE UnitType = 'UNIT_ZERO' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_ZERO', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_ZERO' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_ZERO', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_ZERO' FROM Units WHERE UnitType = 'UNIT_ZERO' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_ZERO', 'UnitType', 'UNIT_ZERO' FROM Units WHERE UnitType = 'UNIT_ZERO' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_ZERO' FROM Units WHERE UnitType = 'UNIT_ZERO' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_ZERO', 'SR_LINE_HAS_RUBBER' FROM Units WHERE UnitType = 'UNIT_ZERO' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_ZERO');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_ZERO', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_ZERO' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_ZERO');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_ZERO' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_ZERO' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_ZERO', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_ZERO' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_ZERO_2: unique, needs RESOURCE_RUBBER, RESOURCE_OIL; keeps UNIT_ZERO trainable without it.
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_ZERO_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_ZERO_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_ZERO_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_ZERO_2' FROM Units WHERE UnitType = 'UNIT_ZERO_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_ZERO_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_ZERO_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_ZERO_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_ZERO_2' FROM Units WHERE UnitType = 'UNIT_ZERO_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_ZERO_2', 'UnitType', 'UNIT_ZERO_2' FROM Units WHERE UnitType = 'UNIT_ZERO_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_ZERO_2' FROM Units WHERE UnitType = 'UNIT_ZERO_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_ZERO_2', 'SR_LINE_HAS_RUBBER' FROM Units WHERE UnitType = 'UNIT_ZERO_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_ZERO_2');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_ZERO_2', 'SR_LINE_HAS_OIL' FROM Units WHERE UnitType = 'UNIT_ZERO_2' AND StrategicResource IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_ZERO_2');
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_ZERO_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_ZERO_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_ZERO_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_ZERO_2' AND StrategicResource IS NOT NULL AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- The traits last, once every requirement has read the game's own.
UPDATE Units SET TraitType = 'TRAIT_LEADER_MINOR_CIV' WHERE UnitType IN ('UNIT_ASSAULT_GUN', 'UNIT_AT_GUN', 'UNIT_BATTLESHIP', 'UNIT_BIPLANE', 'UNIT_BOMBER', 'UNIT_CRUISER', 'UNIT_DESTROYER', 'UNIT_DIVEBOMBER', 'UNIT_DREADNOUGHT', 'UNIT_FIELD_CANNON', 'UNIT_FIELD_GUN', 'UNIT_FIGHTER', 'UNIT_HEAVY_ARTILLERY', 'UNIT_HEAVY_BOMBER', 'UNIT_IRONCLAD', 'UNIT_LANDSHIP', 'UNIT_MORTAR', 'UNIT_TANK', 'UNIT_TRENCH_FIGHTER') AND TraitType IS NULL AND StrategicResource IS NOT NULL;
UPDATE Units SET TraitType = 'TRAIT_SR_LOCKED' WHERE UnitType IN ('UNIT_BARBARY_CORSAIR', 'UNIT_BARBARY_CORSAIR_2', 'UNIT_BARBARY_CORSAIR_3', 'UNIT_CHANG_BEUN', 'UNIT_CHANG_BEUN_2', 'UNIT_CHANG_BEUN_3', 'UNIT_COSSACK_2', 'UNIT_COSSACK_3', 'UNIT_GHILMAN_2', 'UNIT_GHILMAN_3', 'UNIT_HUSSAR_2', 'UNIT_HUSSAR_3', 'UNIT_KATYUSHA', 'UNIT_KATYUSHA_2', 'UNIT_MIKASA', 'UNIT_MIKASA_2', 'UNIT_REVENGE', 'UNIT_REVENGE_2', 'UNIT_STUKA', 'UNIT_STUKA_2', 'UNIT_TURTLE_SHIP_2', 'UNIT_TURTLE_SHIP_3', 'UNIT_ZERO', 'UNIT_ZERO_2') AND TraitType IS NOT NULL AND StrategicResource IS NOT NULL;
-- The Civilopedia keeps the city-state-trait units with the ordinary ones, not under unique units.
UPDATE CivilopediaPageQueries SET SQL = replace(SQL, 'AND TraitType IS NULL',
    'AND (TraitType IS NULL OR UnitType IN ("UNIT_ASSAULT_GUN", "UNIT_AT_GUN", "UNIT_BATTLESHIP", "UNIT_BIPLANE", "UNIT_BOMBER", "UNIT_CRUISER", "UNIT_DESTROYER", "UNIT_DIVEBOMBER", "UNIT_DREADNOUGHT", "UNIT_FIELD_CANNON", "UNIT_FIELD_GUN", "UNIT_FIGHTER", "UNIT_HEAVY_ARTILLERY", "UNIT_HEAVY_BOMBER", "UNIT_IRONCLAD", "UNIT_LANDSHIP", "UNIT_MORTAR", "UNIT_TANK", "UNIT_TRENCH_FIGHTER"))')
    WHERE SectionID = 'UNITS' AND SQL LIKE '%AND TraitType IS NULL%'
    AND EXISTS (SELECT 1 FROM Units WHERE StrategicResource IS NOT NULL);
UPDATE CivilopediaPageQueries SET SQL = replace(SQL, 'AND TraitType IS NOT NULL',
    'AND TraitType IS NOT NULL AND UnitType NOT IN ("UNIT_ASSAULT_GUN", "UNIT_AT_GUN", "UNIT_BATTLESHIP", "UNIT_BIPLANE", "UNIT_BOMBER", "UNIT_CRUISER", "UNIT_DESTROYER", "UNIT_DIVEBOMBER", "UNIT_DREADNOUGHT", "UNIT_FIELD_CANNON", "UNIT_FIELD_GUN", "UNIT_FIGHTER", "UNIT_HEAVY_ARTILLERY", "UNIT_HEAVY_BOMBER", "UNIT_IRONCLAD", "UNIT_LANDSHIP", "UNIT_MORTAR", "UNIT_TANK", "UNIT_TRENCH_FIGHTER")')
    WHERE SectionID = 'UNITS' AND SQL LIKE '%AND TraitType IS NOT NULL%'
    AND EXISTS (SELECT 1 FROM Units WHERE StrategicResource IS NOT NULL);
-- Their portraits keep the plain frame (ui/sr-line-look.js).
INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_LINE_PLAIN' FROM Types WHERE Type IN ('UNIT_ASSAULT_GUN', 'UNIT_AT_GUN', 'UNIT_BATTLESHIP', 'UNIT_BIPLANE', 'UNIT_BOMBER', 'UNIT_CRUISER', 'UNIT_DESTROYER', 'UNIT_DIVEBOMBER', 'UNIT_DREADNOUGHT', 'UNIT_FIELD_CANNON', 'UNIT_FIELD_GUN', 'UNIT_FIGHTER', 'UNIT_HEAVY_ARTILLERY', 'UNIT_HEAVY_BOMBER', 'UNIT_IRONCLAD', 'UNIT_LANDSHIP', 'UNIT_MORTAR', 'UNIT_TANK', 'UNIT_TRENCH_FIGHTER')
    AND EXISTS (SELECT 1 FROM Units WHERE StrategicResource IS NOT NULL);

-- UNIT_FRIGATE_SR_GREAT_BRITAIN: this civilization's UNIT_FRIGATE, standing in for it and upgrading straight into UNIT_REVENGE.
CREATE TEMP TABLE sr_copy AS SELECT * FROM Units WHERE UnitType = 'UNIT_FRIGATE'
    AND EXISTS (SELECT 1 FROM Units WHERE UnitType = 'UNIT_REVENGE' AND TraitType = 'TRAIT_SR_LOCKED')
    AND EXISTS (SELECT 1 FROM Traits WHERE TraitType = 'TRAIT_GREAT_BRITAIN')
    AND NOT EXISTS (SELECT 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
        WHERE r.ReplacesUnitType = 'UNIT_FRIGATE' AND u.TraitType = 'TRAIT_GREAT_BRITAIN');
UPDATE sr_copy SET UnitType = 'UNIT_FRIGATE_SR_GREAT_BRITAIN', TraitType = 'TRAIT_GREAT_BRITAIN';
INSERT INTO Types (Type, Kind) SELECT UnitType, 'KIND_UNIT' FROM sr_copy;
INSERT INTO Units SELECT * FROM sr_copy;
INSERT INTO UnitReplaces (CivUniqueUnitType, ReplacesUnitType) SELECT UnitType, 'UNIT_FRIGATE' FROM sr_copy;
INSERT INTO UnitUpgrades (Unit, UpgradeUnit) SELECT UnitType, 'UNIT_REVENGE' FROM sr_copy;
INSERT OR IGNORE INTO CivilopediaPageExcludes (PageID, SectionID) SELECT UnitType, 'UNITS' FROM sr_copy;
INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT UnitType, 'SR_LINE_PLAIN' FROM sr_copy;
CREATE TEMP TABLE sr_rows AS SELECT * FROM Unit_Stats WHERE UnitType = 'UNIT_FRIGATE' AND EXISTS (SELECT 1 FROM sr_copy);
UPDATE sr_rows SET UnitType = 'UNIT_FRIGATE_SR_GREAT_BRITAIN';
INSERT INTO Unit_Stats SELECT * FROM sr_rows;
DROP TABLE sr_rows;
CREATE TEMP TABLE sr_rows AS SELECT * FROM Unit_Costs WHERE UnitType = 'UNIT_FRIGATE' AND EXISTS (SELECT 1 FROM sr_copy);
UPDATE sr_rows SET UnitType = 'UNIT_FRIGATE_SR_GREAT_BRITAIN';
INSERT INTO Unit_Costs SELECT * FROM sr_rows;
DROP TABLE sr_rows;
CREATE TEMP TABLE sr_rows AS SELECT * FROM Unit_Advisories WHERE UnitType = 'UNIT_FRIGATE' AND EXISTS (SELECT 1 FROM sr_copy);
UPDATE sr_rows SET UnitType = 'UNIT_FRIGATE_SR_GREAT_BRITAIN';
INSERT INTO Unit_Advisories SELECT * FROM sr_rows;
DROP TABLE sr_rows;
CREATE TEMP TABLE sr_rows AS SELECT * FROM TypeTags WHERE Type = 'UNIT_FRIGATE' AND EXISTS (SELECT 1 FROM sr_copy);
UPDATE sr_rows SET Type = 'UNIT_FRIGATE_SR_GREAT_BRITAIN';
INSERT INTO TypeTags SELECT * FROM sr_rows;
DROP TABLE sr_rows;
DROP TABLE sr_copy;

-- Story rewards that make UNIT_FRIGATE cheaper get a twin for UNIT_FRIGATE_SR_GREAT_BRITAIN.
CREATE TEMP TABLE sr_mods AS SELECT m.* FROM Modifiers m JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType' AND a.Value = 'UNIT_FRIGATE'
    JOIN NarrativeRewards r ON r.ModifierID = m.ModifierId
    WHERE d.EffectType = 'EFFECT_CITY_ADJUST_UNIT_PRODUCTION' AND EXISTS (SELECT 1 FROM Units WHERE UnitType = 'UNIT_FRIGATE_SR_GREAT_BRITAIN');
CREATE TEMP TABLE sr_args AS SELECT a.* FROM ModifierArguments a JOIN sr_mods m ON m.ModifierId = a.ModifierId;
UPDATE sr_args SET Value = 'UNIT_FRIGATE_SR_GREAT_BRITAIN' WHERE Name = 'UnitType';
UPDATE sr_args SET ModifierId = ModifierId || '_SR_GREAT_BRITAIN';
CREATE TEMP TABLE sr_rewards AS SELECT r.NarrativeRewardType AS Reward, m.ModifierId AS Mid FROM NarrativeRewards r JOIN sr_mods m ON m.ModifierId = r.ModifierID;
UPDATE sr_mods SET ModifierId = ModifierId || '_SR_GREAT_BRITAIN';
INSERT INTO Modifiers SELECT * FROM sr_mods;
INSERT INTO ModifierArguments SELECT * FROM sr_args;
INSERT INTO NarrativeRewards (NarrativeRewardType, ModifierID) SELECT Reward || '_SR_GREAT_BRITAIN', Mid || '_SR_GREAT_BRITAIN' FROM sr_rewards;
INSERT INTO NarrativeStory_Rewards (NarrativeRewardType, NarrativeStoryType, Activation, BonusEligible, Temporary) SELECT Reward || '_SR_GREAT_BRITAIN', s.NarrativeStoryType, s.Activation, s.BonusEligible, s.Temporary FROM sr_rewards
    JOIN NarrativeStory_Rewards s ON s.NarrativeRewardType = Reward;
DROP TABLE sr_rewards;
DROP TABLE sr_args;
DROP TABLE sr_mods;

-- UNIT_FRIGATE_SR_MEIJI: this civilization's UNIT_FRIGATE, standing in for it and upgrading straight into UNIT_MIKASA.
CREATE TEMP TABLE sr_copy AS SELECT * FROM Units WHERE UnitType = 'UNIT_FRIGATE'
    AND EXISTS (SELECT 1 FROM Units WHERE UnitType = 'UNIT_MIKASA' AND TraitType = 'TRAIT_SR_LOCKED')
    AND EXISTS (SELECT 1 FROM Traits WHERE TraitType = 'TRAIT_MEIJI')
    AND NOT EXISTS (SELECT 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
        WHERE r.ReplacesUnitType = 'UNIT_FRIGATE' AND u.TraitType = 'TRAIT_MEIJI');
UPDATE sr_copy SET UnitType = 'UNIT_FRIGATE_SR_MEIJI', TraitType = 'TRAIT_MEIJI';
INSERT INTO Types (Type, Kind) SELECT UnitType, 'KIND_UNIT' FROM sr_copy;
INSERT INTO Units SELECT * FROM sr_copy;
INSERT INTO UnitReplaces (CivUniqueUnitType, ReplacesUnitType) SELECT UnitType, 'UNIT_FRIGATE' FROM sr_copy;
INSERT INTO UnitUpgrades (Unit, UpgradeUnit) SELECT UnitType, 'UNIT_MIKASA' FROM sr_copy;
INSERT OR IGNORE INTO CivilopediaPageExcludes (PageID, SectionID) SELECT UnitType, 'UNITS' FROM sr_copy;
INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT UnitType, 'SR_LINE_PLAIN' FROM sr_copy;
CREATE TEMP TABLE sr_rows AS SELECT * FROM Unit_Stats WHERE UnitType = 'UNIT_FRIGATE' AND EXISTS (SELECT 1 FROM sr_copy);
UPDATE sr_rows SET UnitType = 'UNIT_FRIGATE_SR_MEIJI';
INSERT INTO Unit_Stats SELECT * FROM sr_rows;
DROP TABLE sr_rows;
CREATE TEMP TABLE sr_rows AS SELECT * FROM Unit_Costs WHERE UnitType = 'UNIT_FRIGATE' AND EXISTS (SELECT 1 FROM sr_copy);
UPDATE sr_rows SET UnitType = 'UNIT_FRIGATE_SR_MEIJI';
INSERT INTO Unit_Costs SELECT * FROM sr_rows;
DROP TABLE sr_rows;
CREATE TEMP TABLE sr_rows AS SELECT * FROM Unit_Advisories WHERE UnitType = 'UNIT_FRIGATE' AND EXISTS (SELECT 1 FROM sr_copy);
UPDATE sr_rows SET UnitType = 'UNIT_FRIGATE_SR_MEIJI';
INSERT INTO Unit_Advisories SELECT * FROM sr_rows;
DROP TABLE sr_rows;
CREATE TEMP TABLE sr_rows AS SELECT * FROM TypeTags WHERE Type = 'UNIT_FRIGATE' AND EXISTS (SELECT 1 FROM sr_copy);
UPDATE sr_rows SET Type = 'UNIT_FRIGATE_SR_MEIJI';
INSERT INTO TypeTags SELECT * FROM sr_rows;
DROP TABLE sr_rows;
DROP TABLE sr_copy;

-- Story rewards that make UNIT_FRIGATE cheaper get a twin for UNIT_FRIGATE_SR_MEIJI.
CREATE TEMP TABLE sr_mods AS SELECT m.* FROM Modifiers m JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType' AND a.Value = 'UNIT_FRIGATE'
    JOIN NarrativeRewards r ON r.ModifierID = m.ModifierId
    WHERE d.EffectType = 'EFFECT_CITY_ADJUST_UNIT_PRODUCTION' AND EXISTS (SELECT 1 FROM Units WHERE UnitType = 'UNIT_FRIGATE_SR_MEIJI');
CREATE TEMP TABLE sr_args AS SELECT a.* FROM ModifierArguments a JOIN sr_mods m ON m.ModifierId = a.ModifierId;
UPDATE sr_args SET Value = 'UNIT_FRIGATE_SR_MEIJI' WHERE Name = 'UnitType';
UPDATE sr_args SET ModifierId = ModifierId || '_SR_MEIJI';
CREATE TEMP TABLE sr_rewards AS SELECT r.NarrativeRewardType AS Reward, m.ModifierId AS Mid FROM NarrativeRewards r JOIN sr_mods m ON m.ModifierId = r.ModifierID;
UPDATE sr_mods SET ModifierId = ModifierId || '_SR_MEIJI';
INSERT INTO Modifiers SELECT * FROM sr_mods;
INSERT INTO ModifierArguments SELECT * FROM sr_args;
INSERT INTO NarrativeRewards (NarrativeRewardType, ModifierID) SELECT Reward || '_SR_MEIJI', Mid || '_SR_MEIJI' FROM sr_rewards;
INSERT INTO NarrativeStory_Rewards (NarrativeRewardType, NarrativeStoryType, Activation, BonusEligible, Temporary) SELECT Reward || '_SR_MEIJI', s.NarrativeStoryType, s.Activation, s.BonusEligible, s.Temporary FROM sr_rewards
    JOIN NarrativeStory_Rewards s ON s.NarrativeRewardType = Reward;
DROP TABLE sr_rewards;
DROP TABLE sr_args;
DROP TABLE sr_mods;
