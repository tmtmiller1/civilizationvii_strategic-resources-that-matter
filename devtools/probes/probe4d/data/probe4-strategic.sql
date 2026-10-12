-- probe4b only: the upgrade gate column on grant-locked units (the Legion is Rome's Spearman).
UPDATE Units SET StrategicResource = 'RESOURCE_IRON' WHERE UnitType IN ('UNIT_SPEARMAN', 'UNIT_LEGION');
