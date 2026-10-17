-- Written by scripts/build-data.mjs; edit the script, not this file.
-- AGE_ANTIQUITY, Gated Units on: the units below are grant-only, so the free unit before each one stays trainable
-- until its owner could train it. See scripts/build-data.mjs.

INSERT OR IGNORE INTO Types (Type, Kind)
    VALUES ('TRAIT_SR_LOCKED', 'KIND_TRAIT'), ('SR_LINE_ATTACH_TYPE', 'KIND_MODIFIER'), ('SR_LINE_GRANT_TYPE', 'KIND_MODIFIER');
INSERT OR IGNORE INTO Traits (TraitType, InternalOnly)
    VALUES ('TRAIT_SR_LOCKED', 1);
INSERT OR IGNORE INTO DynamicModifiers (ModifierType, CollectionType, EffectType)
    VALUES ('SR_LINE_ATTACH_TYPE', 'COLLECTION_MAJOR_PLAYERS', 'EFFECT_ATTACH_MODIFIERS'), ('SR_LINE_GRANT_TYPE', 'COLLECTION_OWNER', 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_HAS_IRON', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 0);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_HAS_IRON', 'ResourceType', 'RESOURCE_IRON'), ('SR_LINE_HAS_IRON', 'Amount', '1');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_NO_IRON', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 1);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_NO_IRON', 'ResourceType', 'RESOURCE_IRON'), ('SR_LINE_NO_IRON', 'Amount', '1');

-- UNIT_GAISATAI_2: unique, needs RESOURCE_IRON; keeps UNIT_GAISATAI trainable without it.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_GAISATAI_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_GAISATAI_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_GAISATAI_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_GAISATAI_2' FROM Units WHERE UnitType = 'UNIT_GAISATAI_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_GAISATAI_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_GAISATAI_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_GAISATAI_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_GAISATAI_2' FROM Units WHERE UnitType = 'UNIT_GAISATAI_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_GAISATAI_2', 'UnitType', 'UNIT_GAISATAI_2' FROM Units WHERE UnitType = 'UNIT_GAISATAI_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_GAISATAI_2' FROM Units WHERE UnitType = 'UNIT_GAISATAI_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_GAISATAI_2', 'SR_LINE_HAS_IRON' FROM Units WHERE UnitType = 'UNIT_GAISATAI_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_GAISATAI_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_GAISATAI_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_GAISATAI_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_GAISATAI_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_HOPLITE_2: unique, needs RESOURCE_IRON; keeps UNIT_HOPLITE trainable without it.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_HOPLITE_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_HOPLITE_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_HOPLITE_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_HOPLITE_2' FROM Units WHERE UnitType = 'UNIT_HOPLITE_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_HOPLITE_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_HOPLITE_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_HOPLITE_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_HOPLITE_2' FROM Units WHERE UnitType = 'UNIT_HOPLITE_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_HOPLITE_2', 'UnitType', 'UNIT_HOPLITE_2' FROM Units WHERE UnitType = 'UNIT_HOPLITE_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_HOPLITE_2' FROM Units WHERE UnitType = 'UNIT_HOPLITE_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HOPLITE_2', 'SR_LINE_HAS_IRON' FROM Units WHERE UnitType = 'UNIT_HOPLITE_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_HOPLITE_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_HOPLITE_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HOPLITE_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_HOPLITE_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_IMMORTAL: unique, needs RESOURCE_IRON.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_IMMORTAL', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_IMMORTAL' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_IMMORTAL', 'ModifierId', 'SR_LINE_GRANT_UNIT_IMMORTAL' FROM Units WHERE UnitType = 'UNIT_IMMORTAL' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_IMMORTAL', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_IMMORTAL' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_IMMORTAL', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_IMMORTAL' FROM Units WHERE UnitType = 'UNIT_IMMORTAL' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_IMMORTAL', 'UnitType', 'UNIT_IMMORTAL' FROM Units WHERE UnitType = 'UNIT_IMMORTAL' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_IMMORTAL' FROM Units WHERE UnitType = 'UNIT_IMMORTAL' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_IMMORTAL', 'SR_LINE_HAS_IRON' FROM Units WHERE UnitType = 'UNIT_IMMORTAL' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_IMMORTAL' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_IMMORTAL' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_IMMORTAL', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_IMMORTAL' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_LEGION: unique, needs RESOURCE_IRON.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_LEGION', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_LEGION' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_LEGION', 'ModifierId', 'SR_LINE_GRANT_UNIT_LEGION' FROM Units WHERE UnitType = 'UNIT_LEGION' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_LEGION', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_LEGION' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_LEGION', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_LEGION' FROM Units WHERE UnitType = 'UNIT_LEGION' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_LEGION', 'UnitType', 'UNIT_LEGION' FROM Units WHERE UnitType = 'UNIT_LEGION' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_LEGION' FROM Units WHERE UnitType = 'UNIT_LEGION' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_LEGION', 'SR_LINE_HAS_IRON' FROM Units WHERE UnitType = 'UNIT_LEGION' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_LEGION' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_LEGION' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_LEGION', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_LEGION' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_MEDJAY_2: unique, needs RESOURCE_IRON; keeps UNIT_MEDJAY trainable without it.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_MEDJAY_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_MEDJAY_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_MEDJAY_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_MEDJAY_2' FROM Units WHERE UnitType = 'UNIT_MEDJAY_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_MEDJAY_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_MEDJAY_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_MEDJAY_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_MEDJAY_2' FROM Units WHERE UnitType = 'UNIT_MEDJAY_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_MEDJAY_2', 'UnitType', 'UNIT_MEDJAY_2' FROM Units WHERE UnitType = 'UNIT_MEDJAY_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_MEDJAY_2' FROM Units WHERE UnitType = 'UNIT_MEDJAY_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_MEDJAY_2', 'SR_LINE_HAS_IRON' FROM Units WHERE UnitType = 'UNIT_MEDJAY_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_MEDJAY_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_MEDJAY_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_MEDJAY_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_MEDJAY_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_SPEARMAN: base, needs RESOURCE_IRON; keeps UNIT_WARRIOR trainable without it.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_SPEARMAN', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_SPEARMAN' AND TraitType IS NULL;
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_SPEARMAN', 'ModifierId', 'SR_LINE_GRANT_UNIT_SPEARMAN' FROM Units WHERE UnitType = 'UNIT_SPEARMAN' AND TraitType IS NULL;
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_SPEARMAN', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_SPEARMAN' AND TraitType IS NULL;
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_SPEARMAN', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_SPEARMAN' FROM Units WHERE UnitType = 'UNIT_SPEARMAN' AND TraitType IS NULL;
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_SPEARMAN', 'UnitType', 'UNIT_SPEARMAN' FROM Units WHERE UnitType = 'UNIT_SPEARMAN' AND TraitType IS NULL;
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_SPEARMAN' FROM Units WHERE UnitType = 'UNIT_SPEARMAN' AND TraitType IS NULL;
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_SPEARMAN', 'SR_LINE_HAS_IRON' FROM Units WHERE UnitType = 'UNIT_SPEARMAN' AND TraitType IS NULL;
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_SPEARMAN' AND u.TraitType IS NOT NULL;
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_SPEARMAN' AND u.TraitType IS NOT NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_SPEARMAN', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_SPEARMAN' AND u.TraitType IS NOT NULL AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_SPEARMAN');

-- A civic's grant of a gated unit with no condition (Kinsei, Samurai 2): the grant needs the resource, and
-- the build lock the civic puts on the unit it replaces is switched off (see scripts/build-data.mjs).
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    VALUES ('SR_LINE_NEVER', 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT');
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_NEVER', 'TraitType', 'TRAIT_SR_LOCKED');
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    VALUES ('SR_LINE_NEVER_SET', 'REQUIREMENTSET_TEST_ALL');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    VALUES ('SR_LINE_NEVER_SET', 'SR_LINE_NEVER');
UPDATE Modifiers SET SubjectRequirementSetId = 'SR_LINE_NEVER_SET'
    WHERE ModifierId IN (SELECT m2.ModifierId FROM ProgressionTreeNodeUnlocks n
    JOIN Modifiers m ON m.ModifierId = n.TargetType AND n.TargetKind = 'KIND_MODIFIER'
    JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType'
    JOIN Units u ON u.UnitType = a.Value
    JOIN UnitReplaces r ON r.CivUniqueUnitType = u.UnitType
    JOIN ProgressionTreeNodeUnlocks n2 ON n2.ProgressionTreeNodeType = n.ProgressionTreeNodeType AND n2.TargetKind = 'KIND_MODIFIER'
    JOIN Modifiers m2 ON m2.ModifierId = n2.TargetType
    JOIN DynamicModifiers d2 ON d2.ModifierType = m2.ModifierType
    JOIN ModifierArguments a2 ON a2.ModifierId = m2.ModifierId AND a2.Name = 'UnitType' AND a2.Value = r.ReplacesUnitType
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NULL AND u.StrategicResource IS NOT NULL
    AND d2.EffectType = 'EFFECT_PLAYER_DISABLE_BUILD_UNIT' AND m2.SubjectRequirementSetId IS NULL);
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT DISTINCT 'SR_LINE_HAS_' || substr(u.StrategicResource, 10), 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 0 FROM ProgressionTreeNodeUnlocks n
    JOIN Modifiers m ON m.ModifierId = n.TargetType AND n.TargetKind = 'KIND_MODIFIER'
    JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType'
    JOIN Units u ON u.UnitType = a.Value
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NULL AND u.StrategicResource IS NOT NULL;
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT DISTINCT 'SR_LINE_HAS_' || substr(u.StrategicResource, 10), 'ResourceType', u.StrategicResource FROM ProgressionTreeNodeUnlocks n
    JOIN Modifiers m ON m.ModifierId = n.TargetType AND n.TargetKind = 'KIND_MODIFIER'
    JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType'
    JOIN Units u ON u.UnitType = a.Value
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NULL AND u.StrategicResource IS NOT NULL;
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT DISTINCT 'SR_LINE_HAS_' || substr(u.StrategicResource, 10), 'Amount', '1' FROM ProgressionTreeNodeUnlocks n
    JOIN Modifiers m ON m.ModifierId = n.TargetType AND n.TargetKind = 'KIND_MODIFIER'
    JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType'
    JOIN Units u ON u.UnitType = a.Value
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NULL AND u.StrategicResource IS NOT NULL;
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT DISTINCT 'SR_LINE_NEEDS_' || substr(u.StrategicResource, 10), 'REQUIREMENTSET_TEST_ALL' FROM ProgressionTreeNodeUnlocks n
    JOIN Modifiers m ON m.ModifierId = n.TargetType AND n.TargetKind = 'KIND_MODIFIER'
    JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType'
    JOIN Units u ON u.UnitType = a.Value
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NULL AND u.StrategicResource IS NOT NULL;
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT DISTINCT 'SR_LINE_NEEDS_' || substr(u.StrategicResource, 10), 'SR_LINE_HAS_' || substr(u.StrategicResource, 10) FROM ProgressionTreeNodeUnlocks n
    JOIN Modifiers m ON m.ModifierId = n.TargetType AND n.TargetKind = 'KIND_MODIFIER'
    JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType'
    JOIN Units u ON u.UnitType = a.Value
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NULL AND u.StrategicResource IS NOT NULL;
UPDATE Modifiers SET SubjectRequirementSetId = (SELECT 'SR_LINE_NEEDS_' || substr(u.StrategicResource, 10)
    FROM ModifierArguments a JOIN Units u ON u.UnitType = a.Value
    WHERE a.ModifierId = Modifiers.ModifierId AND a.Name = 'UnitType')
    WHERE ModifierId IN (SELECT m.ModifierId FROM ProgressionTreeNodeUnlocks n
    JOIN Modifiers m ON m.ModifierId = n.TargetType AND n.TargetKind = 'KIND_MODIFIER'
    JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType'
    JOIN Units u ON u.UnitType = a.Value
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NULL AND u.StrategicResource IS NOT NULL);

-- The traits last, once every requirement has read the game's own.
UPDATE Units SET TraitType = 'TRAIT_LEADER_MINOR_CIV' WHERE UnitType IN ('UNIT_SPEARMAN') AND TraitType IS NULL;
UPDATE Units SET TraitType = 'TRAIT_SR_LOCKED' WHERE UnitType IN ('UNIT_GAISATAI_2', 'UNIT_HOPLITE_2', 'UNIT_IMMORTAL', 'UNIT_LEGION', 'UNIT_MEDJAY_2') AND TraitType IS NOT NULL;
-- The Civilopedia keeps the city-state-trait units with the ordinary ones, not under unique units.
UPDATE CivilopediaPageQueries SET SQL = replace(SQL, 'AND TraitType IS NULL',
    'AND (TraitType IS NULL OR UnitType IN ("UNIT_SPEARMAN"))')
    WHERE SectionID = 'UNITS' AND SQL LIKE '%AND TraitType IS NULL%';
UPDATE CivilopediaPageQueries SET SQL = replace(SQL, 'AND TraitType IS NOT NULL',
    'AND TraitType IS NOT NULL AND UnitType NOT IN ("UNIT_SPEARMAN")')
    WHERE SectionID = 'UNITS' AND SQL LIKE '%AND TraitType IS NOT NULL%';
-- Their portraits keep the plain frame (ui/sr-line-look.js).
INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_LINE_PLAIN' FROM Types WHERE Type IN ('UNIT_SPEARMAN');

-- UNIT_WARRIOR_SR_PERSIA: this civilization's UNIT_WARRIOR, standing in for it and upgrading straight into UNIT_IMMORTAL.
CREATE TEMP TABLE sr_copy AS SELECT * FROM Units WHERE UnitType = 'UNIT_WARRIOR'
    AND EXISTS (SELECT 1 FROM Units WHERE UnitType = 'UNIT_IMMORTAL' AND TraitType = 'TRAIT_SR_LOCKED')
    AND EXISTS (SELECT 1 FROM Traits WHERE TraitType = 'TRAIT_PERSIA')
    AND NOT EXISTS (SELECT 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
        WHERE r.ReplacesUnitType = 'UNIT_WARRIOR' AND u.TraitType = 'TRAIT_PERSIA');
UPDATE sr_copy SET UnitType = 'UNIT_WARRIOR_SR_PERSIA', TraitType = 'TRAIT_PERSIA';
INSERT INTO Types (Type, Kind) SELECT UnitType, 'KIND_UNIT' FROM sr_copy;
INSERT INTO Units SELECT * FROM sr_copy;
INSERT INTO UnitReplaces (CivUniqueUnitType, ReplacesUnitType) SELECT UnitType, 'UNIT_WARRIOR' FROM sr_copy;
INSERT INTO UnitUpgrades (Unit, UpgradeUnit) SELECT UnitType, 'UNIT_IMMORTAL' FROM sr_copy;
INSERT OR IGNORE INTO CivilopediaPageExcludes (PageID, SectionID) SELECT UnitType, 'UNITS' FROM sr_copy;
INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT UnitType, 'SR_LINE_PLAIN' FROM sr_copy;
CREATE TEMP TABLE sr_rows AS SELECT * FROM Unit_Stats WHERE UnitType = 'UNIT_WARRIOR' AND EXISTS (SELECT 1 FROM sr_copy);
UPDATE sr_rows SET UnitType = 'UNIT_WARRIOR_SR_PERSIA';
INSERT INTO Unit_Stats SELECT * FROM sr_rows;
DROP TABLE sr_rows;
CREATE TEMP TABLE sr_rows AS SELECT * FROM Unit_Costs WHERE UnitType = 'UNIT_WARRIOR' AND EXISTS (SELECT 1 FROM sr_copy);
UPDATE sr_rows SET UnitType = 'UNIT_WARRIOR_SR_PERSIA';
INSERT INTO Unit_Costs SELECT * FROM sr_rows;
DROP TABLE sr_rows;
CREATE TEMP TABLE sr_rows AS SELECT * FROM Unit_Advisories WHERE UnitType = 'UNIT_WARRIOR' AND EXISTS (SELECT 1 FROM sr_copy);
UPDATE sr_rows SET UnitType = 'UNIT_WARRIOR_SR_PERSIA';
INSERT INTO Unit_Advisories SELECT * FROM sr_rows;
DROP TABLE sr_rows;
CREATE TEMP TABLE sr_rows AS SELECT * FROM TypeTags WHERE Type = 'UNIT_WARRIOR' AND EXISTS (SELECT 1 FROM sr_copy);
UPDATE sr_rows SET Type = 'UNIT_WARRIOR_SR_PERSIA';
INSERT INTO TypeTags SELECT * FROM sr_rows;
DROP TABLE sr_rows;
DROP TABLE sr_copy;

-- Story rewards that make UNIT_WARRIOR cheaper get a twin for UNIT_WARRIOR_SR_PERSIA.
CREATE TEMP TABLE sr_mods AS SELECT m.* FROM Modifiers m JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType' AND a.Value = 'UNIT_WARRIOR'
    JOIN NarrativeRewards r ON r.ModifierID = m.ModifierId
    WHERE d.EffectType = 'EFFECT_CITY_ADJUST_UNIT_PRODUCTION' AND EXISTS (SELECT 1 FROM Units WHERE UnitType = 'UNIT_WARRIOR_SR_PERSIA');
CREATE TEMP TABLE sr_args AS SELECT a.* FROM ModifierArguments a JOIN sr_mods m ON m.ModifierId = a.ModifierId;
UPDATE sr_args SET Value = 'UNIT_WARRIOR_SR_PERSIA' WHERE Name = 'UnitType';
UPDATE sr_args SET ModifierId = ModifierId || '_SR_PERSIA';
CREATE TEMP TABLE sr_rewards AS SELECT r.NarrativeRewardType AS Reward, m.ModifierId AS Mid FROM NarrativeRewards r JOIN sr_mods m ON m.ModifierId = r.ModifierID;
UPDATE sr_mods SET ModifierId = ModifierId || '_SR_PERSIA';
INSERT INTO Modifiers SELECT * FROM sr_mods;
INSERT INTO ModifierArguments SELECT * FROM sr_args;
INSERT INTO NarrativeRewards (NarrativeRewardType, ModifierID) SELECT Reward || '_SR_PERSIA', Mid || '_SR_PERSIA' FROM sr_rewards;
INSERT INTO NarrativeStory_Rewards (NarrativeRewardType, NarrativeStoryType, Activation, BonusEligible, Temporary) SELECT Reward || '_SR_PERSIA', s.NarrativeStoryType, s.Activation, s.BonusEligible, s.Temporary FROM sr_rewards
    JOIN NarrativeStory_Rewards s ON s.NarrativeRewardType = Reward;
DROP TABLE sr_rewards;
DROP TABLE sr_args;
DROP TABLE sr_mods;

-- UNIT_WARRIOR_SR_ROME: this civilization's UNIT_WARRIOR, standing in for it and upgrading straight into UNIT_LEGION.
CREATE TEMP TABLE sr_copy AS SELECT * FROM Units WHERE UnitType = 'UNIT_WARRIOR'
    AND EXISTS (SELECT 1 FROM Units WHERE UnitType = 'UNIT_LEGION' AND TraitType = 'TRAIT_SR_LOCKED')
    AND EXISTS (SELECT 1 FROM Traits WHERE TraitType = 'TRAIT_ROME')
    AND NOT EXISTS (SELECT 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
        WHERE r.ReplacesUnitType = 'UNIT_WARRIOR' AND u.TraitType = 'TRAIT_ROME');
UPDATE sr_copy SET UnitType = 'UNIT_WARRIOR_SR_ROME', TraitType = 'TRAIT_ROME';
INSERT INTO Types (Type, Kind) SELECT UnitType, 'KIND_UNIT' FROM sr_copy;
INSERT INTO Units SELECT * FROM sr_copy;
INSERT INTO UnitReplaces (CivUniqueUnitType, ReplacesUnitType) SELECT UnitType, 'UNIT_WARRIOR' FROM sr_copy;
INSERT INTO UnitUpgrades (Unit, UpgradeUnit) SELECT UnitType, 'UNIT_LEGION' FROM sr_copy;
INSERT OR IGNORE INTO CivilopediaPageExcludes (PageID, SectionID) SELECT UnitType, 'UNITS' FROM sr_copy;
INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT UnitType, 'SR_LINE_PLAIN' FROM sr_copy;
CREATE TEMP TABLE sr_rows AS SELECT * FROM Unit_Stats WHERE UnitType = 'UNIT_WARRIOR' AND EXISTS (SELECT 1 FROM sr_copy);
UPDATE sr_rows SET UnitType = 'UNIT_WARRIOR_SR_ROME';
INSERT INTO Unit_Stats SELECT * FROM sr_rows;
DROP TABLE sr_rows;
CREATE TEMP TABLE sr_rows AS SELECT * FROM Unit_Costs WHERE UnitType = 'UNIT_WARRIOR' AND EXISTS (SELECT 1 FROM sr_copy);
UPDATE sr_rows SET UnitType = 'UNIT_WARRIOR_SR_ROME';
INSERT INTO Unit_Costs SELECT * FROM sr_rows;
DROP TABLE sr_rows;
CREATE TEMP TABLE sr_rows AS SELECT * FROM Unit_Advisories WHERE UnitType = 'UNIT_WARRIOR' AND EXISTS (SELECT 1 FROM sr_copy);
UPDATE sr_rows SET UnitType = 'UNIT_WARRIOR_SR_ROME';
INSERT INTO Unit_Advisories SELECT * FROM sr_rows;
DROP TABLE sr_rows;
CREATE TEMP TABLE sr_rows AS SELECT * FROM TypeTags WHERE Type = 'UNIT_WARRIOR' AND EXISTS (SELECT 1 FROM sr_copy);
UPDATE sr_rows SET Type = 'UNIT_WARRIOR_SR_ROME';
INSERT INTO TypeTags SELECT * FROM sr_rows;
DROP TABLE sr_rows;
DROP TABLE sr_copy;

-- Story rewards that make UNIT_WARRIOR cheaper get a twin for UNIT_WARRIOR_SR_ROME.
CREATE TEMP TABLE sr_mods AS SELECT m.* FROM Modifiers m JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType' AND a.Value = 'UNIT_WARRIOR'
    JOIN NarrativeRewards r ON r.ModifierID = m.ModifierId
    WHERE d.EffectType = 'EFFECT_CITY_ADJUST_UNIT_PRODUCTION' AND EXISTS (SELECT 1 FROM Units WHERE UnitType = 'UNIT_WARRIOR_SR_ROME');
CREATE TEMP TABLE sr_args AS SELECT a.* FROM ModifierArguments a JOIN sr_mods m ON m.ModifierId = a.ModifierId;
UPDATE sr_args SET Value = 'UNIT_WARRIOR_SR_ROME' WHERE Name = 'UnitType';
UPDATE sr_args SET ModifierId = ModifierId || '_SR_ROME';
CREATE TEMP TABLE sr_rewards AS SELECT r.NarrativeRewardType AS Reward, m.ModifierId AS Mid FROM NarrativeRewards r JOIN sr_mods m ON m.ModifierId = r.ModifierID;
UPDATE sr_mods SET ModifierId = ModifierId || '_SR_ROME';
INSERT INTO Modifiers SELECT * FROM sr_mods;
INSERT INTO ModifierArguments SELECT * FROM sr_args;
INSERT INTO NarrativeRewards (NarrativeRewardType, ModifierID) SELECT Reward || '_SR_ROME', Mid || '_SR_ROME' FROM sr_rewards;
INSERT INTO NarrativeStory_Rewards (NarrativeRewardType, NarrativeStoryType, Activation, BonusEligible, Temporary) SELECT Reward || '_SR_ROME', s.NarrativeStoryType, s.Activation, s.BonusEligible, s.Temporary FROM sr_rewards
    JOIN NarrativeStory_Rewards s ON s.NarrativeRewardType = Reward;
DROP TABLE sr_rewards;
DROP TABLE sr_args;
DROP TABLE sr_mods;
