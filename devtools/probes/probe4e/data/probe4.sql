-- probe4e: the lock is Units.StrategicResource alone (independents are exempt from it by the game's own rule);
-- TraitType and CanTrain untouched. A grant per unit behind has-resource lifts it for majors.
UPDATE Units SET StrategicResource = 'RESOURCE_IRON' WHERE UnitType IN ('UNIT_WARRIOR', 'UNIT_SPEARMAN', 'UNIT_LEGION');
UPDATE Units SET StrategicResource = 'RESOURCE_HORSES' WHERE UnitType = 'UNIT_CHARIOT';
