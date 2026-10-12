-- In-place locks. TRAIT_LEADER_MINOR_CIV is the Foederati's trait: no major player carries it, every minor does.
UPDATE Units SET TraitType = 'TRAIT_LEADER_MINOR_CIV' WHERE UnitType IN ('UNIT_WARRIOR', 'UNIT_SPEARMAN', 'UNIT_LEGION');
-- The other lock: can the grant lift CanTrain 0?
UPDATE Units SET CanTrain = 0 WHERE UnitType = 'UNIT_CHARIOT';
