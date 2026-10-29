-- Written by hand. The units an age change carries a player's army into stay free to train under the locked levels
-- (the owner, 2026-10-29). The age change builds each carried unit as the type Unit_ShadowReplacements names for its
-- class, through the player's own build list (getBuildUnit), so a civilization's unique that replaces it counts too
-- (Joseon's Turtle Ship for the Ship of the Line). A grant-only unit there crashed the game at the Modern age change
-- (verification-runs.md Phase 25). Each keeps its Unsupplied penalty; only the lock goes. The set is read through the
-- game's tables, so a mod that changes the carry-over table is followed. The line files skip the trait change for the
-- same set (scripts/build-data.mjs CARRIED_SQL); this file clears the column the gate files set and tags the units for
-- the UI (ui/sr-supply.js buildGateIndex).

INSERT OR IGNORE INTO Tags (Tag, Category) VALUES ('SR_CARRIED_FREE', 'UNIT_CLASS');

INSERT OR IGNORE INTO TypeTags (Type, Tag)
    SELECT Type, 'SR_CARRIED_FREE' FROM Types WHERE Type IN (SELECT UnitType FROM Units)
      AND (Type IN (SELECT UnitType FROM Unit_ShadowReplacements WHERE CoreClass = 'CORE_CLASS_MILITARY')
       OR Type IN (SELECT CivUniqueUnitType FROM UnitReplaces WHERE ReplacesUnitType IN
           (SELECT UnitType FROM Unit_ShadowReplacements WHERE CoreClass = 'CORE_CLASS_MILITARY')));

-- Only a column this mod's gate wrote: one of the unit's own supply resources.
UPDATE Units SET StrategicResource = NULL
    WHERE UnitType IN (SELECT Type FROM TypeTags WHERE Tag = 'SR_CARRIED_FREE')
      AND StrategicResource IN (SELECT 'RESOURCE_' || substr(t.Tag, 11) FROM TypeTags t
          WHERE t.Type = Units.UnitType AND t.Tag LIKE 'SR_SUPPLY_%');

DELETE FROM CivilopediaPageChapterParagraphs
    WHERE ChapterID = 'SR_LOCK' AND PageID IN (SELECT Type FROM TypeTags WHERE Tag = 'SR_CARRIED_FREE');
