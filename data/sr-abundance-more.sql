-- Strategic Resources: "Strategic Resources on the Map" set to MORE (game scope, after the supply tags and Modern
-- Supply Chains, LoadOrder 210).
-- The map script places each resource by data (base-standard/maps/resource-placement-common.js): its density in a
-- terrain class is 0.15 x the class row's Weight / the resources sharing that class, and MinimumPerLandmass copies
-- are forced onto each player landmass. The class rows set Weight 1.0, so they carry the change; Resources.Weight
-- only counts where a class row leaves Weight empty, and gets the same factor. Multiplied rather than set, so a mod
-- that already changed these rows keeps its own proportions. Staple keeps the resource on the map: the game picks only
-- 25 to 27 resource types per map (Resource_Distribution.MaxResourceTypes) and keeps the staples, so without it a
-- Modern map can come with no Coal at all (seed 4242: Coal and Hardwood 0, with Staple 24 and 37).
-- Only the resources this age's units draw on (their SR_SUPPLY_ tags, with Pitch where it stands in for Hardwood) get
-- the weights. Hardwood is a staple in every age, at its own weight where nothing draws on it: an age change only adds
-- types new to the incoming age (base-standard/scripts/age-transition-post-load.js), and Hardwood is valid from
-- Antiquity, so a game that starts there has Hardwood later only if its first map placed some; a staple is never one
-- of the types an age change removes to make room. Each new staple also gets a map slot of its own
-- (Resource_Distribution.MaxResourceTypes), so it comes on top of the map's other types rather than in place of one
-- (verification-runs.md Phase 23).
-- First the room: one more type per resource this file makes a staple that isn't one already.
UPDATE Resource_Distribution SET MaxResourceTypes = MaxResourceTypes + (
    SELECT COUNT(*) FROM Resources WHERE Staple = 0 AND ResourceType IN (
    SELECT 'RESOURCE_' || substr(Tag, 11) FROM TypeTags WHERE Tag LIKE 'SR_SUPPLY_%'
    UNION SELECT 'RESOURCE_PITCH' WHERE EXISTS (SELECT 1 FROM TypeTags WHERE Tag = 'SR_EITHER_HARDWOOD_OR_PITCH')
    UNION SELECT 'RESOURCE_HARDWOOD'));

UPDATE Resource_ValidBiomes SET Weight = COALESCE(Weight, 1.0) * 2
WHERE ResourceType IN (
    SELECT 'RESOURCE_' || substr(Tag, 11) FROM TypeTags WHERE Tag LIKE 'SR_SUPPLY_%'
    UNION SELECT 'RESOURCE_PITCH' WHERE EXISTS (SELECT 1 FROM TypeTags WHERE Tag = 'SR_EITHER_HARDWOOD_OR_PITCH'));

UPDATE Resources SET Weight = Weight * 2, MinimumPerLandmass = MAX(MinimumPerLandmass, 2), Staple = 1
WHERE ResourceType IN (
    SELECT 'RESOURCE_' || substr(Tag, 11) FROM TypeTags WHERE Tag LIKE 'SR_SUPPLY_%'
    UNION SELECT 'RESOURCE_PITCH' WHERE EXISTS (SELECT 1 FROM TypeTags WHERE Tag = 'SR_EITHER_HARDWOOD_OR_PITCH'));

UPDATE Resources SET Staple = 1 WHERE ResourceType = 'RESOURCE_HARDWOOD';

-- Where no unit of this age draws on Hardwood (Antiquity), it's there only for the later ages: half its weight, and
-- off the hills, the tile classes it shares with Iron. A type that shares a class takes a share of that class's
-- density whatever its weight, so the hills are what thin Iron out (seed 4242 on More: Iron 12 to 9 with Hardwood
-- on them). Hardwood placed now stays through the age changes as a staple.
DELETE FROM Resource_ValidBiomes WHERE ResourceType = 'RESOURCE_HARDWOOD' AND TerrainType = 'TERRAIN_HILL'
    AND 'RESOURCE_HARDWOOD' NOT IN (
    SELECT 'RESOURCE_' || substr(Tag, 11) FROM TypeTags WHERE Tag LIKE 'SR_SUPPLY_%'
    UNION SELECT 'RESOURCE_PITCH' WHERE EXISTS (SELECT 1 FROM TypeTags WHERE Tag = 'SR_EITHER_HARDWOOD_OR_PITCH'));
UPDATE Resource_ValidBiomes SET Weight = COALESCE(Weight, 1.0) * 0.5 WHERE ResourceType = 'RESOURCE_HARDWOOD'
    AND 'RESOURCE_HARDWOOD' NOT IN (
    SELECT 'RESOURCE_' || substr(Tag, 11) FROM TypeTags WHERE Tag LIKE 'SR_SUPPLY_%'
    UNION SELECT 'RESOURCE_PITCH' WHERE EXISTS (SELECT 1 FROM TypeTags WHERE Tag = 'SR_EITHER_HARDWOOD_OR_PITCH'));
UPDATE Resources SET Weight = Weight * 0.5 WHERE ResourceType = 'RESOURCE_HARDWOOD'
    AND 'RESOURCE_HARDWOOD' NOT IN (
    SELECT 'RESOURCE_' || substr(Tag, 11) FROM TypeTags WHERE Tag LIKE 'SR_SUPPLY_%'
    UNION SELECT 'RESOURCE_PITCH' WHERE EXISTS (SELECT 1 FROM TypeTags WHERE Tag = 'SR_EITHER_HARDWOOD_OR_PITCH'));
