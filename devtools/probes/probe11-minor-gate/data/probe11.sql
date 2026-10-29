-- Probe 11: the Warrior blocked for every non-major player without a Settler (PermanentlyDisabled false).
INSERT INTO Types (Type, Kind) VALUES ('SR_P11_DISABLE_ALL_PLAYERS', 'KIND_MODIFIER');
INSERT INTO DynamicModifiers (ModifierType, CollectionType, EffectType)
VALUES ('SR_P11_DISABLE_ALL_PLAYERS', 'COLLECTION_ALL_PLAYERS', 'EFFECT_PLAYER_DISABLE_BUILD_UNIT');
INSERT INTO Requirements (RequirementId, RequirementType, Inverse) VALUES
    ('SR_P11_NOT_MAJOR', 'REQUIREMENT_PLAYER_IS_MAJOR', 1),
    ('SR_P11_NO_SETTLER', 'REQUIREMENT_PLAYER_HAS_AT_LEAST_NUM_UNIT_TYPE', 1);
INSERT INTO RequirementArguments (RequirementId, Name, Value) VALUES
    ('SR_P11_NO_SETTLER', 'UnitType', 'UNIT_SETTLER'), ('SR_P11_NO_SETTLER', 'Amount', '1');
INSERT INTO RequirementSets (RequirementSetId, RequirementSetType) VALUES ('SR_P11_MINOR_NO_SETTLER', 'REQUIREMENTSET_TEST_ALL');
INSERT INTO RequirementSetRequirements (RequirementSetId, RequirementId) VALUES
    ('SR_P11_MINOR_NO_SETTLER', 'SR_P11_NOT_MAJOR'), ('SR_P11_MINOR_NO_SETTLER', 'SR_P11_NO_SETTLER');
INSERT INTO Modifiers (ModifierId, ModifierType, SubjectRequirementSetId)
VALUES ('SR_P11_NO_WARRIOR', 'SR_P11_DISABLE_ALL_PLAYERS', 'SR_P11_MINOR_NO_SETTLER');
INSERT INTO ModifierArguments (ModifierId, Name, Value) VALUES
    ('SR_P11_NO_WARRIOR', 'UnitType', 'UNIT_WARRIOR'), ('SR_P11_NO_WARRIOR', 'PermanentlyDisabled', 'false');
INSERT INTO GameModifiers (ModifierId) VALUES ('SR_P11_NO_WARRIOR');
