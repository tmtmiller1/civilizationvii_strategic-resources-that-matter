-- Written by scripts/build-data.mjs; edit the script, not this file.
-- AGE_EXPLORATION, Gated Units on: the units below are grant-only, so the free unit before each one stays trainable
-- until its owner could train it. See scripts/build-data.mjs.

INSERT OR IGNORE INTO Types (Type, Kind)
    VALUES ('TRAIT_SR_LOCKED', 'KIND_TRAIT'), ('SR_LINE_ATTACH_TYPE', 'KIND_MODIFIER'), ('SR_LINE_GRANT_TYPE', 'KIND_MODIFIER');
INSERT OR IGNORE INTO Traits (TraitType, InternalOnly)
    VALUES ('TRAIT_SR_LOCKED', 1);
INSERT OR IGNORE INTO DynamicModifiers (ModifierType, CollectionType, EffectType)
    VALUES ('SR_LINE_ATTACH_TYPE', 'COLLECTION_MAJOR_PLAYERS', 'EFFECT_ATTACH_MODIFIERS'), ('SR_LINE_GRANT_TYPE', 'COLLECTION_OWNER', 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_HAS_HARDWOOD', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 0);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_HAS_HARDWOOD', 'ResourceType', 'RESOURCE_HARDWOOD'), ('SR_LINE_HAS_HARDWOOD', 'Amount', '1');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_NO_HARDWOOD', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 1);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_NO_HARDWOOD', 'ResourceType', 'RESOURCE_HARDWOOD'), ('SR_LINE_NO_HARDWOOD', 'Amount', '1');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_HAS_IRON', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 0);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_HAS_IRON', 'ResourceType', 'RESOURCE_IRON'), ('SR_LINE_HAS_IRON', 'Amount', '1');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_NO_IRON', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 1);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_NO_IRON', 'ResourceType', 'RESOURCE_IRON'), ('SR_LINE_NO_IRON', 'Amount', '1');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_HAS_NITER', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 0);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_HAS_NITER', 'ResourceType', 'RESOURCE_NITER'), ('SR_LINE_HAS_NITER', 'Amount', '1');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_NO_NITER', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 1);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_NO_NITER', 'ResourceType', 'RESOURCE_NITER'), ('SR_LINE_NO_NITER', 'Amount', '1');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_HAS_PITCH', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 0);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_HAS_PITCH', 'ResourceType', 'RESOURCE_PITCH'), ('SR_LINE_HAS_PITCH', 'Amount', '1');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_NO_PITCH', 'REQUIREMENT_PLAYER_HAS_X_RESOURCE_TYPE', 1);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_NO_PITCH', 'ResourceType', 'RESOURCE_PITCH'), ('SR_LINE_NO_PITCH', 'Amount', '1');
-- RESOURCE_HARDWOOD or RESOURCE_PITCH: a copy of any of them.
INSERT OR IGNORE INTO RequirementSets (RequirementSetId, RequirementSetType)
    VALUES ('SR_LINE_ANY_HARDWOOD_OR_PITCH', 'REQUIREMENTSET_TEST_ANY');
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    VALUES ('SR_LINE_ANY_HARDWOOD_OR_PITCH', 'SR_LINE_HAS_HARDWOOD'), ('SR_LINE_ANY_HARDWOOD_OR_PITCH', 'SR_LINE_HAS_PITCH');
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    VALUES ('SR_LINE_HAS_HARDWOOD_OR_PITCH', 'REQUIREMENT_REQUIREMENTSET_IS_MET', 0);
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    VALUES ('SR_LINE_HAS_HARDWOOD_OR_PITCH', 'RequirementSetId', 'SR_LINE_ANY_HARDWOOD_OR_PITCH');

-- UNIT_BOMBARD: base, needs RESOURCE_NITER; keeps UNIT_TREBUCHET trainable without it.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_BOMBARD', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_BOMBARD' AND TraitType IS NULL;
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_BOMBARD', 'ModifierId', 'SR_LINE_GRANT_UNIT_BOMBARD' FROM Units WHERE UnitType = 'UNIT_BOMBARD' AND TraitType IS NULL;
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_BOMBARD', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_BOMBARD' AND TraitType IS NULL;
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_BOMBARD', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_BOMBARD' FROM Units WHERE UnitType = 'UNIT_BOMBARD' AND TraitType IS NULL;
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_BOMBARD', 'UnitType', 'UNIT_BOMBARD' FROM Units WHERE UnitType = 'UNIT_BOMBARD' AND TraitType IS NULL;
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_BOMBARD' FROM Units WHERE UnitType = 'UNIT_BOMBARD' AND TraitType IS NULL;
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BOMBARD', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_BOMBARD' AND TraitType IS NULL;
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_BOMBARD' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_BOMBARD' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_BOMBARD', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_BOMBARD' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_BOMBARD');

-- UNIT_CARRACK: base, needs RESOURCE_HARDWOOD or RESOURCE_PITCH; keeps UNIT_COG trainable without it.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_CARRACK', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_CARRACK' AND TraitType IS NULL;
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_CARRACK', 'ModifierId', 'SR_LINE_GRANT_UNIT_CARRACK' FROM Units WHERE UnitType = 'UNIT_CARRACK' AND TraitType IS NULL;
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_CARRACK', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_CARRACK' AND TraitType IS NULL;
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_CARRACK', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_CARRACK' FROM Units WHERE UnitType = 'UNIT_CARRACK' AND TraitType IS NULL;
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_CARRACK', 'UnitType', 'UNIT_CARRACK' FROM Units WHERE UnitType = 'UNIT_CARRACK' AND TraitType IS NULL;
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_CARRACK' FROM Units WHERE UnitType = 'UNIT_CARRACK' AND TraitType IS NULL;
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CARRACK', 'SR_LINE_HAS_HARDWOOD_OR_PITCH' FROM Units WHERE UnitType = 'UNIT_CARRACK' AND TraitType IS NULL;
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_CARRACK' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_CARRACK' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CARRACK', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_CARRACK' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_CARRACK');

-- UNIT_CETBANG_2: unique, needs RESOURCE_HARDWOOD or RESOURCE_PITCH; keeps UNIT_CETBANG trainable without it.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_CETBANG_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_CETBANG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_CETBANG_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_CETBANG_2' FROM Units WHERE UnitType = 'UNIT_CETBANG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_CETBANG_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_CETBANG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_CETBANG_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_CETBANG_2' FROM Units WHERE UnitType = 'UNIT_CETBANG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_CETBANG_2', 'UnitType', 'UNIT_CETBANG_2' FROM Units WHERE UnitType = 'UNIT_CETBANG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_CETBANG_2' FROM Units WHERE UnitType = 'UNIT_CETBANG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CETBANG_2', 'SR_LINE_HAS_HARDWOOD_OR_PITCH' FROM Units WHERE UnitType = 'UNIT_CETBANG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_CETBANG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_CETBANG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CETBANG_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_CETBANG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_CETBANG_3: unique, needs RESOURCE_HARDWOOD or RESOURCE_PITCH.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_CETBANG_3', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_CETBANG_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_CETBANG_3', 'ModifierId', 'SR_LINE_GRANT_UNIT_CETBANG_3' FROM Units WHERE UnitType = 'UNIT_CETBANG_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_CETBANG_3', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_CETBANG_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_CETBANG_3', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_CETBANG_3' FROM Units WHERE UnitType = 'UNIT_CETBANG_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_CETBANG_3', 'UnitType', 'UNIT_CETBANG_3' FROM Units WHERE UnitType = 'UNIT_CETBANG_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_CETBANG_3' FROM Units WHERE UnitType = 'UNIT_CETBANG_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CETBANG_3', 'SR_LINE_HAS_HARDWOOD_OR_PITCH' FROM Units WHERE UnitType = 'UNIT_CETBANG_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_CETBANG_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_CETBANG_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CETBANG_3', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_CETBANG_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_CORSAIR_2: granted, needs RESOURCE_HARDWOOD or RESOURCE_PITCH; keeps UNIT_CORSAIR trainable without it.
-- The game grants it already: its grants also need the resource.
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT m.SubjectRequirementSetId, 'SR_LINE_HAS_HARDWOOD_OR_PITCH' FROM Modifiers m JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType' AND a.Value = 'UNIT_CORSAIR_2'
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NOT NULL
    AND m.SubjectRequirementSetId IN (SELECT RequirementSetId FROM RequirementSets WHERE RequirementSetType = 'REQUIREMENTSET_TEST_ALL');
-- And UNIT_CORSAIR stays granted without RESOURCE_HARDWOOD, on the game's own terms for UNIT_CORSAIR other than its techs.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_CORSAIR', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_CORSAIR' AND EXISTS (SELECT 1 FROM Modifiers m JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType' AND a.Value = 'UNIT_CORSAIR'
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NOT NULL);
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_CORSAIR', 'ModifierId', 'SR_LINE_GRANT_UNIT_CORSAIR' FROM Units WHERE UnitType = 'UNIT_CORSAIR' AND EXISTS (SELECT 1 FROM Modifiers m JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType' AND a.Value = 'UNIT_CORSAIR'
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NOT NULL);
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_CORSAIR', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_CORSAIR' AND EXISTS (SELECT 1 FROM Modifiers m JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType' AND a.Value = 'UNIT_CORSAIR'
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NOT NULL);
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_CORSAIR', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_CORSAIR' FROM Units WHERE UnitType = 'UNIT_CORSAIR' AND EXISTS (SELECT 1 FROM Modifiers m JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType' AND a.Value = 'UNIT_CORSAIR'
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NOT NULL);
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_CORSAIR', 'UnitType', 'UNIT_CORSAIR' FROM Units WHERE UnitType = 'UNIT_CORSAIR' AND EXISTS (SELECT 1 FROM Modifiers m JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType' AND a.Value = 'UNIT_CORSAIR'
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NOT NULL);
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_CORSAIR' FROM Units WHERE UnitType = 'UNIT_CORSAIR' AND EXISTS (SELECT 1 FROM Modifiers m JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType' AND a.Value = 'UNIT_CORSAIR'
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NOT NULL);
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CORSAIR', 'SR_LINE_NO_HARDWOOD' FROM Units WHERE UnitType = 'UNIT_CORSAIR' AND EXISTS (SELECT 1 FROM Modifiers m JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType' AND a.Value = 'UNIT_CORSAIR'
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NOT NULL);
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_CORSAIR', 'SR_LINE_NO_PITCH' FROM Units WHERE UnitType = 'UNIT_CORSAIR' AND EXISTS (SELECT 1 FROM Modifiers m JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType' AND a.Value = 'UNIT_CORSAIR'
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NOT NULL);
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT DISTINCT 'SR_LINE_REQS_UNIT_CORSAIR', rr.RequirementId FROM Modifiers m JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType' AND a.Value = 'UNIT_CORSAIR'
    JOIN RequirementSetRequirements rr ON rr.RequirementSetId = m.SubjectRequirementSetId JOIN Requirements rq ON rq.RequirementId = rr.RequirementId
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NOT NULL
    AND rq.RequirementType <> 'REQUIREMENT_PLAYER_HAS_COMPLETED_PROGRESSION_TREE_NODE' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_CORSAIR');

-- UNIT_CORSAIR_3: granted, needs RESOURCE_HARDWOOD or RESOURCE_PITCH.
-- The game grants it already: its grants also need the resource.
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT m.SubjectRequirementSetId, 'SR_LINE_HAS_HARDWOOD_OR_PITCH' FROM Modifiers m JOIN DynamicModifiers d ON d.ModifierType = m.ModifierType
    JOIN ModifierArguments a ON a.ModifierId = m.ModifierId AND a.Name = 'UnitType' AND a.Value = 'UNIT_CORSAIR_3'
    WHERE d.EffectType = 'EFFECT_ADJUST_PLAYER_VALID_UNIT_BUILD' AND m.ModifierId NOT LIKE 'SR_LINE_%' AND m.SubjectRequirementSetId IS NOT NULL
    AND m.SubjectRequirementSetId IN (SELECT RequirementSetId FROM RequirementSets WHERE RequirementSetType = 'REQUIREMENTSET_TEST_ALL');

-- UNIT_GALLEON: base, needs RESOURCE_HARDWOOD or RESOURCE_PITCH.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_GALLEON', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_GALLEON' AND TraitType IS NULL;
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_GALLEON', 'ModifierId', 'SR_LINE_GRANT_UNIT_GALLEON' FROM Units WHERE UnitType = 'UNIT_GALLEON' AND TraitType IS NULL;
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_GALLEON', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_GALLEON' AND TraitType IS NULL;
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_GALLEON', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_GALLEON' FROM Units WHERE UnitType = 'UNIT_GALLEON' AND TraitType IS NULL;
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_GALLEON', 'UnitType', 'UNIT_GALLEON' FROM Units WHERE UnitType = 'UNIT_GALLEON' AND TraitType IS NULL;
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_GALLEON' FROM Units WHERE UnitType = 'UNIT_GALLEON' AND TraitType IS NULL;
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_GALLEON', 'SR_LINE_HAS_HARDWOOD_OR_PITCH' FROM Units WHERE UnitType = 'UNIT_GALLEON' AND TraitType IS NULL;
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_GALLEON' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_GALLEON' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_GALLEON', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_GALLEON' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_GALLEON');

-- UNIT_GOLD_BANGLES_2: unique, needs RESOURCE_IRON; keeps UNIT_GOLD_BANGLES trainable without it.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_GOLD_BANGLES_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_GOLD_BANGLES_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_GOLD_BANGLES_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_GOLD_BANGLES_2' FROM Units WHERE UnitType = 'UNIT_GOLD_BANGLES_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_GOLD_BANGLES_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_GOLD_BANGLES_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_GOLD_BANGLES_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_GOLD_BANGLES_2' FROM Units WHERE UnitType = 'UNIT_GOLD_BANGLES_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_GOLD_BANGLES_2', 'UnitType', 'UNIT_GOLD_BANGLES_2' FROM Units WHERE UnitType = 'UNIT_GOLD_BANGLES_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_GOLD_BANGLES_2' FROM Units WHERE UnitType = 'UNIT_GOLD_BANGLES_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_GOLD_BANGLES_2', 'SR_LINE_HAS_IRON' FROM Units WHERE UnitType = 'UNIT_GOLD_BANGLES_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_GOLD_BANGLES_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_GOLD_BANGLES_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_GOLD_BANGLES_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_GOLD_BANGLES_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_HWACHA_3: unique, needs RESOURCE_NITER; keeps UNIT_HWACHA_2 trainable without it.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_HWACHA_3', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_HWACHA_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_HWACHA_3', 'ModifierId', 'SR_LINE_GRANT_UNIT_HWACHA_3' FROM Units WHERE UnitType = 'UNIT_HWACHA_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_HWACHA_3', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_HWACHA_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_HWACHA_3', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_HWACHA_3' FROM Units WHERE UnitType = 'UNIT_HWACHA_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_HWACHA_3', 'UnitType', 'UNIT_HWACHA_3' FROM Units WHERE UnitType = 'UNIT_HWACHA_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_HWACHA_3' FROM Units WHERE UnitType = 'UNIT_HWACHA_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HWACHA_3', 'SR_LINE_HAS_NITER' FROM Units WHERE UnitType = 'UNIT_HWACHA_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_HWACHA_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_HWACHA_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_HWACHA_3', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_HWACHA_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_KALAM_2: unique, needs RESOURCE_HARDWOOD or RESOURCE_PITCH; keeps UNIT_KALAM trainable without it.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_KALAM_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_KALAM_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_KALAM_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_KALAM_2' FROM Units WHERE UnitType = 'UNIT_KALAM_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_KALAM_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_KALAM_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_KALAM_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_KALAM_2' FROM Units WHERE UnitType = 'UNIT_KALAM_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_KALAM_2', 'UnitType', 'UNIT_KALAM_2' FROM Units WHERE UnitType = 'UNIT_KALAM_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_KALAM_2' FROM Units WHERE UnitType = 'UNIT_KALAM_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_KALAM_2', 'SR_LINE_HAS_HARDWOOD_OR_PITCH' FROM Units WHERE UnitType = 'UNIT_KALAM_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_KALAM_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_KALAM_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_KALAM_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_KALAM_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_KALAM_3: unique, needs RESOURCE_HARDWOOD or RESOURCE_PITCH.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_KALAM_3', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_KALAM_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_KALAM_3', 'ModifierId', 'SR_LINE_GRANT_UNIT_KALAM_3' FROM Units WHERE UnitType = 'UNIT_KALAM_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_KALAM_3', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_KALAM_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_KALAM_3', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_KALAM_3' FROM Units WHERE UnitType = 'UNIT_KALAM_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_KALAM_3', 'UnitType', 'UNIT_KALAM_3' FROM Units WHERE UnitType = 'UNIT_KALAM_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_KALAM_3' FROM Units WHERE UnitType = 'UNIT_KALAM_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_KALAM_3', 'SR_LINE_HAS_HARDWOOD_OR_PITCH' FROM Units WHERE UnitType = 'UNIT_KALAM_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_KALAM_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_KALAM_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_KALAM_3', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_KALAM_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_KISPOKO_NENA_TO_2: unique, needs RESOURCE_IRON; keeps UNIT_KISPOKO_NENA_TO trainable without it.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_KISPOKO_NENA_TO_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_KISPOKO_NENA_TO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_KISPOKO_NENA_TO_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_KISPOKO_NENA_TO_2' FROM Units WHERE UnitType = 'UNIT_KISPOKO_NENA_TO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_KISPOKO_NENA_TO_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_KISPOKO_NENA_TO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_KISPOKO_NENA_TO_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_KISPOKO_NENA_TO_2' FROM Units WHERE UnitType = 'UNIT_KISPOKO_NENA_TO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_KISPOKO_NENA_TO_2', 'UnitType', 'UNIT_KISPOKO_NENA_TO_2' FROM Units WHERE UnitType = 'UNIT_KISPOKO_NENA_TO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_KISPOKO_NENA_TO_2' FROM Units WHERE UnitType = 'UNIT_KISPOKO_NENA_TO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_KISPOKO_NENA_TO_2', 'SR_LINE_HAS_IRON' FROM Units WHERE UnitType = 'UNIT_KISPOKO_NENA_TO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_KISPOKO_NENA_TO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_KISPOKO_NENA_TO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_KISPOKO_NENA_TO_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_KISPOKO_NENA_TO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_LEIOMANO_2: unique, needs RESOURCE_IRON; keeps UNIT_LEIOMANO trainable without it.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_LEIOMANO_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_LEIOMANO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_LEIOMANO_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_LEIOMANO_2' FROM Units WHERE UnitType = 'UNIT_LEIOMANO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_LEIOMANO_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_LEIOMANO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_LEIOMANO_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_LEIOMANO_2' FROM Units WHERE UnitType = 'UNIT_LEIOMANO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_LEIOMANO_2', 'UnitType', 'UNIT_LEIOMANO_2' FROM Units WHERE UnitType = 'UNIT_LEIOMANO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_LEIOMANO_2' FROM Units WHERE UnitType = 'UNIT_LEIOMANO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_LEIOMANO_2', 'SR_LINE_HAS_IRON' FROM Units WHERE UnitType = 'UNIT_LEIOMANO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_LEIOMANO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_LEIOMANO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_LEIOMANO_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_LEIOMANO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_MAN_AT_ARMS: base, needs RESOURCE_IRON; keeps UNIT_SWORDSMAN trainable without it.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_MAN_AT_ARMS', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_MAN_AT_ARMS' AND TraitType IS NULL;
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_MAN_AT_ARMS', 'ModifierId', 'SR_LINE_GRANT_UNIT_MAN_AT_ARMS' FROM Units WHERE UnitType = 'UNIT_MAN_AT_ARMS' AND TraitType IS NULL;
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_MAN_AT_ARMS', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_MAN_AT_ARMS' AND TraitType IS NULL;
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_MAN_AT_ARMS', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_MAN_AT_ARMS' FROM Units WHERE UnitType = 'UNIT_MAN_AT_ARMS' AND TraitType IS NULL;
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_MAN_AT_ARMS', 'UnitType', 'UNIT_MAN_AT_ARMS' FROM Units WHERE UnitType = 'UNIT_MAN_AT_ARMS' AND TraitType IS NULL;
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_MAN_AT_ARMS' FROM Units WHERE UnitType = 'UNIT_MAN_AT_ARMS' AND TraitType IS NULL;
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_MAN_AT_ARMS', 'SR_LINE_HAS_IRON' FROM Units WHERE UnitType = 'UNIT_MAN_AT_ARMS' AND TraitType IS NULL;
-- Not for a civilization whose unique replaces it: the grant would lift the replacement.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType, Inverse)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT', 1 FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_MAN_AT_ARMS' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_NOT_' || u.TraitType, 'TraitType', u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_MAN_AT_ARMS' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_MAN_AT_ARMS', 'SR_LINE_NOT_' || u.TraitType FROM UnitReplaces r JOIN Units u ON u.UnitType = r.CivUniqueUnitType
    WHERE r.ReplacesUnitType = 'UNIT_MAN_AT_ARMS' AND u.TraitType IS NOT NULL AND u.TraitType <> 'TRAIT_SR_LOCKED' AND EXISTS (SELECT 1 FROM RequirementSets WHERE RequirementSetId = 'SR_LINE_REQS_UNIT_MAN_AT_ARMS');

-- UNIT_TERCIO_2: unique, needs RESOURCE_IRON; keeps UNIT_TERCIO trainable without it.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_TERCIO_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_TERCIO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_TERCIO_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_TERCIO_2' FROM Units WHERE UnitType = 'UNIT_TERCIO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_TERCIO_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_TERCIO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_TERCIO_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_TERCIO_2' FROM Units WHERE UnitType = 'UNIT_TERCIO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_TERCIO_2', 'UnitType', 'UNIT_TERCIO_2' FROM Units WHERE UnitType = 'UNIT_TERCIO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_TERCIO_2' FROM Units WHERE UnitType = 'UNIT_TERCIO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_TERCIO_2', 'SR_LINE_HAS_IRON' FROM Units WHERE UnitType = 'UNIT_TERCIO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_TERCIO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_TERCIO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_TERCIO_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_TERCIO_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_VIKINGR_2: unique, needs RESOURCE_HARDWOOD or RESOURCE_PITCH; keeps UNIT_VIKINGR trainable without it.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_VIKINGR_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_VIKINGR_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_VIKINGR_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_VIKINGR_2' FROM Units WHERE UnitType = 'UNIT_VIKINGR_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_VIKINGR_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_VIKINGR_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_VIKINGR_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_VIKINGR_2' FROM Units WHERE UnitType = 'UNIT_VIKINGR_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_VIKINGR_2', 'UnitType', 'UNIT_VIKINGR_2' FROM Units WHERE UnitType = 'UNIT_VIKINGR_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_VIKINGR_2' FROM Units WHERE UnitType = 'UNIT_VIKINGR_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_VIKINGR_2', 'SR_LINE_HAS_HARDWOOD_OR_PITCH' FROM Units WHERE UnitType = 'UNIT_VIKINGR_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_VIKINGR_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_VIKINGR_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_VIKINGR_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_VIKINGR_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_VIKINGR_3: unique, needs RESOURCE_HARDWOOD or RESOURCE_PITCH.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_VIKINGR_3', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_VIKINGR_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_VIKINGR_3', 'ModifierId', 'SR_LINE_GRANT_UNIT_VIKINGR_3' FROM Units WHERE UnitType = 'UNIT_VIKINGR_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_VIKINGR_3', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_VIKINGR_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_VIKINGR_3', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_VIKINGR_3' FROM Units WHERE UnitType = 'UNIT_VIKINGR_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_VIKINGR_3', 'UnitType', 'UNIT_VIKINGR_3' FROM Units WHERE UnitType = 'UNIT_VIKINGR_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_VIKINGR_3' FROM Units WHERE UnitType = 'UNIT_VIKINGR_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_VIKINGR_3', 'SR_LINE_HAS_HARDWOOD_OR_PITCH' FROM Units WHERE UnitType = 'UNIT_VIKINGR_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_VIKINGR_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_VIKINGR_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_VIKINGR_3', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_VIKINGR_3' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

-- UNIT_XUNLEICHONG_2: unique, needs RESOURCE_IRON; keeps UNIT_XUNLEICHONG trainable without it.
INSERT INTO Modifiers (ModifierId, ModifierType)
    SELECT 'SR_LINE_ATTACH_UNIT_XUNLEICHONG_2', 'SR_LINE_ATTACH_TYPE' FROM Units WHERE UnitType = 'UNIT_XUNLEICHONG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_ATTACH_UNIT_XUNLEICHONG_2', 'ModifierId', 'SR_LINE_GRANT_UNIT_XUNLEICHONG_2' FROM Units WHERE UnitType = 'UNIT_XUNLEICHONG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType)
    SELECT 'SR_LINE_REQS_UNIT_XUNLEICHONG_2', 'REQUIREMENTSET_TEST_ALL' FROM Units WHERE UnitType = 'UNIT_XUNLEICHONG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
    SELECT 'SR_LINE_GRANT_UNIT_XUNLEICHONG_2', 'SR_LINE_GRANT_TYPE', 'SR_LINE_REQS_UNIT_XUNLEICHONG_2' FROM Units WHERE UnitType = 'UNIT_XUNLEICHONG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO ModifierArguments (ModifierId, Name, Value)
    SELECT 'SR_LINE_GRANT_UNIT_XUNLEICHONG_2', 'UnitType', 'UNIT_XUNLEICHONG_2' FROM Units WHERE UnitType = 'UNIT_XUNLEICHONG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO GameModifiers (ModifierId)
    SELECT 'SR_LINE_ATTACH_UNIT_XUNLEICHONG_2' FROM Units WHERE UnitType = 'UNIT_XUNLEICHONG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_XUNLEICHONG_2', 'SR_LINE_HAS_IRON' FROM Units WHERE UnitType = 'UNIT_XUNLEICHONG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
-- Only for the civilization it belongs to, by the trait the game gives it.
INSERT OR IGNORE INTO Requirements (RequirementId, RequirementType)
    SELECT 'SR_LINE_IS_' || TraitType, 'REQUIREMENT_PLAYER_HAS_CIVILIZATION_OR_LEADER_TRAIT' FROM Units WHERE UnitType = 'UNIT_XUNLEICHONG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT OR IGNORE INTO RequirementArguments (RequirementId, Name, Value)
    SELECT 'SR_LINE_IS_' || TraitType, 'TraitType', TraitType FROM Units WHERE UnitType = 'UNIT_XUNLEICHONG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId)
    SELECT 'SR_LINE_REQS_UNIT_XUNLEICHONG_2', 'SR_LINE_IS_' || TraitType FROM Units WHERE UnitType = 'UNIT_XUNLEICHONG_2' AND TraitType IS NOT NULL AND TraitType <> 'TRAIT_SR_LOCKED';

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
UPDATE Units SET TraitType = 'TRAIT_LEADER_MINOR_CIV' WHERE UnitType IN ('UNIT_BOMBARD', 'UNIT_CARRACK', 'UNIT_GALLEON', 'UNIT_MAN_AT_ARMS') AND TraitType IS NULL;
UPDATE Units SET TraitType = 'TRAIT_SR_LOCKED' WHERE UnitType IN ('UNIT_CETBANG_2', 'UNIT_CETBANG_3', 'UNIT_GOLD_BANGLES_2', 'UNIT_HWACHA_3', 'UNIT_KALAM_2', 'UNIT_KALAM_3', 'UNIT_KISPOKO_NENA_TO_2', 'UNIT_LEIOMANO_2', 'UNIT_TERCIO_2', 'UNIT_VIKINGR_2', 'UNIT_VIKINGR_3', 'UNIT_XUNLEICHONG_2') AND TraitType IS NOT NULL;
-- The Civilopedia keeps the city-state-trait units with the ordinary ones, not under unique units.
UPDATE CivilopediaPageQueries SET SQL = replace(SQL, 'AND TraitType IS NULL',
    'AND (TraitType IS NULL OR UnitType IN ("UNIT_BOMBARD", "UNIT_CARRACK", "UNIT_GALLEON", "UNIT_MAN_AT_ARMS"))')
    WHERE SectionID = 'UNITS' AND SQL LIKE '%AND TraitType IS NULL%';
UPDATE CivilopediaPageQueries SET SQL = replace(SQL, 'AND TraitType IS NOT NULL',
    'AND TraitType IS NOT NULL AND UnitType NOT IN ("UNIT_BOMBARD", "UNIT_CARRACK", "UNIT_GALLEON", "UNIT_MAN_AT_ARMS")')
    WHERE SectionID = 'UNITS' AND SQL LIKE '%AND TraitType IS NOT NULL%';
-- Their portraits keep the plain frame (ui/sr-line-look.js).
INSERT OR IGNORE INTO TypeTags (Type, Tag) SELECT Type, 'SR_LINE_PLAIN' FROM Types WHERE Type IN ('UNIT_BOMBARD', 'UNIT_CARRACK', 'UNIT_GALLEON', 'UNIT_MAN_AT_ARMS');
