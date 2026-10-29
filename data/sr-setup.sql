-- Strategic Resources: the game setup options (frontend database, shell scope).
-- Each option writes its value into the game configuration under its ConfigurationKey, and the modinfo's
-- ConfigurationValueMatches criteria load the matching data groups when the game is created.
-- INSERT OR IGNORE: a second copy of the mod (Workshop and local) must not roll this file back.
-- Unsupplied Units carries the lock as its two hardest values (1.2): a save from an earlier version keeps its own
-- Gated Units value, which the modinfo still reads.

INSERT OR IGNORE INTO Parameters
    (ParameterID, Name, Description, Domain, DefaultValue, ConfigurationGroup, ConfigurationKey, GroupID,
     ChangeableAfterGameStart, SortIndex)
VALUES
    ('StrategicResourcesThatMatterUnsupplied', 'LOC_SR_SETUP_UNSUPPLIED_NAME', 'LOC_SR_SETUP_UNSUPPLIED_DESCRIPTION',
     'StrategicResourcesThatMatterUnsuppliedLevels', 'SR_UNSUPPLIED_STANDARD', 'Game', 'StrategicResourcesThatMatterUnsupplied',
     'GameOptions', 0, 2100),
    ('StrategicResourcesThatMatterLateCurve', 'LOC_SR_SETUP_LATE_CURVE_NAME', 'LOC_SR_SETUP_LATE_CURVE_DESCRIPTION',
     'StrategicResourcesThatMatterLateCurveValues', 'SR_LATE_CURVE_ON', 'Game', 'StrategicResourcesThatMatterLateCurve',
     'GameOptions', 0, 2101),
    ('StrategicResourcesThatMatterChains', 'LOC_SR_SETUP_CHAINS_NAME', 'LOC_SR_SETUP_CHAINS_DESCRIPTION',
     'StrategicResourcesThatMatterChainsValues', 'SR_CHAINS_OFF', 'Game', 'StrategicResourcesThatMatterChains',
     'GameOptions', 0, 2102),
    ('StrategicResourcesThatMatterKillTiers', 'LOC_SR_SETUP_KILL_TIERS_NAME', 'LOC_SR_SETUP_KILL_TIERS_DESCRIPTION',
     'StrategicResourcesThatMatterKillTierValues', 'SR_KILL_TIERS_ON', 'Game', 'StrategicResourcesThatMatterKillTiers',
     'GameOptions', 0, 2103),
    ('StrategicResourcesThatMatterAbundance', 'LOC_SR_SETUP_ABUNDANCE_NAME', 'LOC_SR_SETUP_ABUNDANCE_DESCRIPTION',
     'StrategicResourcesThatMatterAbundanceValues', 'SR_ABUNDANCE_STANDARD', 'Game', 'StrategicResourcesThatMatterAbundance',
     'GameOptions', 0, 2104);

INSERT OR IGNORE INTO DomainValues (Domain, Value, Name, Description, SortIndex)
VALUES
    ('StrategicResourcesThatMatterUnsuppliedLevels', 'SR_UNSUPPLIED_OFF', 'LOC_SR_SETUP_UNSUPPLIED_OFF',
     'LOC_SR_SETUP_UNSUPPLIED_OFF_DESCRIPTION', 10),
    ('StrategicResourcesThatMatterUnsuppliedLevels', 'SR_UNSUPPLIED_LIGHT', 'LOC_SR_SETUP_UNSUPPLIED_LIGHT',
     'LOC_SR_SETUP_UNSUPPLIED_LIGHT_DESCRIPTION', 20),
    ('StrategicResourcesThatMatterUnsuppliedLevels', 'SR_UNSUPPLIED_STANDARD', 'LOC_SR_SETUP_UNSUPPLIED_STANDARD',
     'LOC_SR_SETUP_UNSUPPLIED_STANDARD_DESCRIPTION', 30),
    ('StrategicResourcesThatMatterUnsuppliedLevels', 'SR_UNSUPPLIED_HARSH', 'LOC_SR_SETUP_UNSUPPLIED_HARSH',
     'LOC_SR_SETUP_UNSUPPLIED_HARSH_DESCRIPTION', 40),
    ('StrategicResourcesThatMatterUnsuppliedLevels', 'SR_UNSUPPLIED_LOCKED', 'LOC_SR_SETUP_UNSUPPLIED_LOCKED',
     'LOC_SR_SETUP_UNSUPPLIED_LOCKED_DESCRIPTION', 50),
    ('StrategicResourcesThatMatterUnsuppliedLevels', 'SR_UNSUPPLIED_LOCKED_UPGRADE', 'LOC_SR_SETUP_UNSUPPLIED_LOCKED_UPGRADE',
     'LOC_SR_SETUP_UNSUPPLIED_LOCKED_UPGRADE_DESCRIPTION', 60),
    ('StrategicResourcesThatMatterLateCurveValues', 'SR_LATE_CURVE_OFF', 'LOC_SR_SETUP_LATE_CURVE_OFF',
     'LOC_SR_SETUP_LATE_CURVE_OFF_DESCRIPTION', 10),
    ('StrategicResourcesThatMatterLateCurveValues', 'SR_LATE_CURVE_ON', 'LOC_SR_SETUP_LATE_CURVE_ON',
     'LOC_SR_SETUP_LATE_CURVE_ON_DESCRIPTION', 20),
    ('StrategicResourcesThatMatterChainsValues', 'SR_CHAINS_OFF', 'LOC_SR_SETUP_CHAINS_OFF',
     'LOC_SR_SETUP_CHAINS_OFF_DESCRIPTION', 10),
    ('StrategicResourcesThatMatterChainsValues', 'SR_CHAINS_ON', 'LOC_SR_SETUP_CHAINS_ON',
     'LOC_SR_SETUP_CHAINS_ON_DESCRIPTION', 20),
    ('StrategicResourcesThatMatterKillTierValues', 'SR_KILL_TIERS_OFF', 'LOC_SR_SETUP_KILL_TIERS_OFF',
     'LOC_SR_SETUP_KILL_TIERS_OFF_DESCRIPTION', 10),
    ('StrategicResourcesThatMatterKillTierValues', 'SR_KILL_TIERS_ON', 'LOC_SR_SETUP_KILL_TIERS_ON',
     'LOC_SR_SETUP_KILL_TIERS_ON_DESCRIPTION', 20),
    ('StrategicResourcesThatMatterAbundanceValues', 'SR_ABUNDANCE_STANDARD', 'LOC_SR_SETUP_ABUNDANCE_STANDARD',
     'LOC_SR_SETUP_ABUNDANCE_STANDARD_DESCRIPTION', 10),
    ('StrategicResourcesThatMatterAbundanceValues', 'SR_ABUNDANCE_MORE', 'LOC_SR_SETUP_ABUNDANCE_MORE',
     'LOC_SR_SETUP_ABUNDANCE_MORE_DESCRIPTION', 20),
    ('StrategicResourcesThatMatterAbundanceValues', 'SR_ABUNDANCE_PLENTY', 'LOC_SR_SETUP_ABUNDANCE_PLENTY',
     'LOC_SR_SETUP_ABUNDANCE_PLENTY_DESCRIPTION', 30);
