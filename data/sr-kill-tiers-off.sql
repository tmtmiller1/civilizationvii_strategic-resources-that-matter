-- Strategic Resources: "Free Tier-Up by Kills" set to Off (game scope, after the gate files).
-- The game moves a unit up a tier by itself once it has the kills its UnitUpgradeKills row asks for (the Sengoku's
-- Samurai: three at each tier), and that swap never checks the upgrading minimum or the unit's StrategicResource
-- (DESIGN.md 7f, "The Samurai's tier-up by kills"). The table has only UnitType and KillCount, so the only way to make
-- the step need the resource is to take the row out: the unit then moves up through the ordinary upgrade, which the
-- gate checks. Only for a tier that needs a resource, and only while upgrades are gated (the upgrading minimum is 1 or
-- more, which Gated Units "Training and upgrade" writes). This replaces any other mod's change to those kill counts.
-- Selected through the tables, so it does nothing when the Sengoku DLC isn't there. Independents and city-states never
-- field these units and ignore the column.

-- The tier pages: the gate's own line, "upgraded into", instead of the training line they carry while kills move them.
UPDATE CivilopediaPageChapterParagraphs
SET Paragraph = replace(Paragraph, '_GATE_TRAINING', '_GATE_UPGRADE')
WHERE SectionID = 'UNITS' AND ChapterID = 'SR_LOCK'
  AND PageID IN (SELECT k.UnitType FROM UnitUpgradeKills k JOIN Units u ON u.UnitType = k.UnitType
    WHERE u.StrategicResource IS NOT NULL)
  AND EXISTS (SELECT 1 FROM GlobalParameters
    WHERE Name = 'STRATEGIC_RESOURCE_MINIMUM_FOR_UNIT_UPGRADING' AND CAST(Value AS INTEGER) >= 1);

DELETE FROM UnitUpgradeKills
WHERE UnitType IN (SELECT UnitType FROM Units WHERE StrategicResource IS NOT NULL)
  AND EXISTS (SELECT 1 FROM GlobalParameters
    WHERE Name = 'STRATEGIC_RESOURCE_MINIMUM_FOR_UNIT_UPGRADING' AND CAST(Value AS INTEGER) >= 1);
