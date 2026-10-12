-- probe4d: the lock trait is the independents' own leader trait, which no major player carries.
UPDATE Units SET TraitType = 'TRAIT_LEADER_INDEPENDENT' WHERE UnitType IN ('UNIT_WARRIOR', 'UNIT_SPEARMAN', 'UNIT_LEGION');
UPDATE Units SET CanTrain = 0 WHERE UnitType = 'UNIT_CHARIOT';
