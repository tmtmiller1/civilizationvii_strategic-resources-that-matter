-- Strategic Resources: "Free Tier-Up by Kills" set to Off (game scope, after the gate files).
-- The game moves a unit up a tier by itself once it has the kills its UnitUpgradeKills row asks for (the Sengoku's
-- Samurai: three at each tier), and that swap never checks the upgrading minimum or the unit's StrategicResource
-- (DESIGN.md 7f, "The Samurai's tier-up by kills"). The table has only UnitType and KillCount, so the only way to make
-- the step need the resource is to take the row out and open the ordinary upgrade, which the gate checks. Only for a
-- tier that needs a resource, and only while upgrades are gated (the upgrading minimum is 1 or more, which Gated Units
-- "Training and upgrade" writes). This replaces any other mod's change to those kill counts. Selected through the
-- tables, so it does nothing when the Sengoku DLC isn't there. Independents and city-states never field these units
-- and ignore the column. Every statement reads UnitUpgradeKills, so the delete comes last.

-- The tier pages: the gate's own line, "upgraded into", instead of the training line they carry while kills move them.
UPDATE CivilopediaPageChapterParagraphs
SET Paragraph = replace(Paragraph, '_GATE_TRAINING', '_GATE_UPGRADE')
WHERE SectionID = 'UNITS' AND ChapterID = 'SR_LOCK'
  AND PageID IN (SELECT k.UnitType FROM UnitUpgradeKills k JOIN Units u ON u.UnitType = k.UnitType
    WHERE u.StrategicResource IS NOT NULL)
  AND EXISTS (SELECT 1 FROM GlobalParameters
    WHERE Name = 'STRATEGIC_RESOURCE_MINIMUM_FOR_UNIT_UPGRADING' AND CAST(Value AS INTEGER) >= 1);

-- Taking the kill rows out alone left the Samurai with no way up at all (1.1.0): the engine offered no upgrade, with
-- Iron, Heraldry, gold and moves. Two things close it, both watched in the 2026-10-16 lab (Sengoku, Exploration):
-- the engine refuses the upgrade of any unit tagged UNIT_CLASS_ALT_UPGRADE, which the DLC puts on every Samurai tier,
-- and the target needs a tech unlock, which the tiers never had. With both, the Samurai upgrades for gold and the
-- game's own Iron check ("needs 1 Iron to upgrade this type of Unit").

-- Each tier gets the unlock of the unit it replaces, for its own civilization, the shape the Tercio and Leiomano tiers
-- already have: Samurai 2 at Heraldry (Man-at-Arms), Samurai 3 at Metal Casting (Pikeman).
INSERT OR IGNORE INTO ProgressionTreeNodeUnlocks (ProgressionTreeNodeType, TargetType, RequiredTraitType, TargetKind,
    UnlockDepth)
SELECT n.ProgressionTreeNodeType, k.UnitType, u.TraitType, 'KIND_UNIT', 1
FROM UnitUpgradeKills k
JOIN Units u ON u.UnitType = k.UnitType
JOIN UnitReplaces r ON r.CivUniqueUnitType = k.UnitType
JOIN ProgressionTreeNodeUnlocks n ON n.TargetType = r.ReplacesUnitType AND n.TargetKind = 'KIND_UNIT'
WHERE u.StrategicResource IS NOT NULL AND u.TraitType IS NOT NULL
  AND u.TraitType IN (SELECT TraitType FROM Traits)
  AND NOT EXISTS (SELECT 1 FROM ProgressionTreeNodeUnlocks x WHERE x.TargetType = k.UnitType AND x.TargetKind = 'KIND_UNIT')
  AND EXISTS (SELECT 1 FROM GlobalParameters
    WHERE Name = 'STRATEGIC_RESOURCE_MINIMUM_FOR_UNIT_UPGRADING' AND CAST(Value AS INTEGER) >= 1);

-- The tag off each of those tiers and off the unit that upgrades into one (the tier-1 Samurai).
DELETE FROM TypeTags
WHERE Tag = 'UNIT_CLASS_ALT_UPGRADE'
  AND Type IN (
    SELECT g.Unit FROM UnitUpgrades g JOIN UnitUpgradeKills k ON k.UnitType = g.UpgradeUnit
      JOIN Units u ON u.UnitType = k.UnitType WHERE u.StrategicResource IS NOT NULL
    UNION
    SELECT k.UnitType FROM UnitUpgradeKills k JOIN Units u ON u.UnitType = k.UnitType
      WHERE u.StrategicResource IS NOT NULL)
  AND EXISTS (SELECT 1 FROM GlobalParameters
    WHERE Name = 'STRATEGIC_RESOURCE_MINIMUM_FOR_UNIT_UPGRADING' AND CAST(Value AS INTEGER) >= 1);

DELETE FROM UnitUpgradeKills
WHERE UnitType IN (SELECT UnitType FROM Units WHERE StrategicResource IS NOT NULL)
  AND EXISTS (SELECT 1 FROM GlobalParameters
    WHERE Name = 'STRATEGIC_RESOURCE_MINIMUM_FOR_UNIT_UPGRADING' AND CAST(Value AS INTEGER) >= 1);
