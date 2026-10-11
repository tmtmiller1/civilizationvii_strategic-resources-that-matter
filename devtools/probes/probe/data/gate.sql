-- P1/P2/P4/P6: the dormant Civ VI gate column.
UPDATE Units SET StrategicResource = 'RESOURCE_IRON'   WHERE UnitType IN ('UNIT_WARRIOR', 'UNIT_SPEARMAN');
UPDATE Units SET StrategicResource = 'RESOURCE_HORSES' WHERE UnitType IN ('UNIT_CHARIOT', 'UNIT_HORSEMAN');
