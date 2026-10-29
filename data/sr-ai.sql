-- Strategic Resources: the game's own AI weights, so the AI goes after the resources this mod makes matter.
-- Without them the AI settles and grows as in the base game, where a strategic resource counts for 3 on a city site
-- (coast counts for 15) and a resource tile beside a city for 2. In a 90-turn Antiquity lab game (p15-ai-antiquity-on)
-- no AI held Iron before turn 91, so the penalty fell on the AI far more than on a player who looks for Iron.
-- Major civs only: both lists hang off TRAIT_LEADER_MAJOR_CIV, which every major leader inherits, so independents and
-- city-states play as before. AI lists are read when a game is created (engine-closed.md, AI data), which a save
-- made before this file never sees.

-- City sites: the game's "Specific Resource" condition, one row per resource a unit here draws on. Selected through
-- Resources, so a resource another mod or an update takes out is skipped.
INSERT OR IGNORE INTO AiFavoredItems (ListType, Item, StringVal, Value, TooltipString)
SELECT 'Default Settlement Plot Evaluations', 'Specific Resource', ResourceType, 20,
    'LOC_SETTLEMENT_RECOMMENDATION_STRATEGIC_RESOURCES'
FROM Resources
WHERE ResourceType IN ('RESOURCE_HORSES', 'RESOURCE_IRON', 'RESOURCE_IVORY', 'RESOURCE_NITER', 'RESOURCE_HARDWOOD',
    'RESOURCE_PITCH', 'RESOURCE_OIL', 'RESOURCE_COAL', 'RESOURCE_RUBBER');

-- Growth and trade: an unclaimed resource tile beside a settlement and an imported resource weigh more. A bias of V
-- multiplies the AI's score by 1 + V/100.
INSERT OR IGNORE INTO AiListTypes (ListType) VALUES ('Strategic Resources Pseudoyield Biases');
INSERT OR IGNORE INTO AiLists (ListType, LeaderType, System)
VALUES ('Strategic Resources Pseudoyield Biases', 'TRAIT_LEADER_MAJOR_CIV', 'PseudoYieldBiases');
-- StringVal is empty here, and a NULL in the key never matches, so INSERT OR IGNORE alone would add the rows twice.
INSERT INTO AiFavoredItems (ListType, Item, Value)
SELECT 'Strategic Resources Pseudoyield Biases', Item, Value
FROM (SELECT 'PSEUDOYIELD_ADJACENT_UNCLAIMED_RESOURCE' AS Item, 200 AS Value
      UNION ALL SELECT 'PSEUDOYIELD_RESOURCE_IMPORT', 100) AS b
WHERE NOT EXISTS (SELECT 1 FROM AiFavoredItems f
                  WHERE f.ListType = 'Strategic Resources Pseudoyield Biases' AND f.Item = b.Item);
