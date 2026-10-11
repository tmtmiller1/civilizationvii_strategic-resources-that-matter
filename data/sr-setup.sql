-- Strategic Resources: the game setup options (frontend database, shell scope).
-- Each option writes its value into the game configuration under its ConfigurationKey, and the modinfo's
-- ConfigurationValueMatches criteria load the matching data groups when the game is created.
-- INSERT OR IGNORE: a second copy of the mod (Workshop and local) must not roll this file back.

INSERT OR IGNORE INTO Parameters
    (ParameterID, Name, Description, Domain, DefaultValue, ConfigurationGroup, ConfigurationKey, GroupID,
     ChangeableAfterGameStart, SortIndex)
VALUES
    ('StrategicResourcesUnsupplied', 'LOC_SR_SETUP_UNSUPPLIED_NAME', 'LOC_SR_SETUP_UNSUPPLIED_DESCRIPTION',
     'StrategicResourcesUnsuppliedLevels', 'SR_UNSUPPLIED_STANDARD', 'Game', 'StrategicResourcesUnsupplied',
     'GameOptions', 0, 2100),
    ('StrategicResourcesLateCurve', 'LOC_SR_SETUP_LATE_CURVE_NAME', 'LOC_SR_SETUP_LATE_CURVE_DESCRIPTION',
     'StrategicResourcesLateCurveValues', 'SR_LATE_CURVE_ON', 'Game', 'StrategicResourcesLateCurve',
     'GameOptions', 0, 2101);

INSERT OR IGNORE INTO DomainValues (Domain, Value, Name, Description, SortIndex)
VALUES
    ('StrategicResourcesUnsuppliedLevels', 'SR_UNSUPPLIED_OFF', 'LOC_SR_SETUP_UNSUPPLIED_OFF',
     'LOC_SR_SETUP_UNSUPPLIED_OFF_DESCRIPTION', 10),
    ('StrategicResourcesUnsuppliedLevels', 'SR_UNSUPPLIED_LIGHT', 'LOC_SR_SETUP_UNSUPPLIED_LIGHT',
     'LOC_SR_SETUP_UNSUPPLIED_LIGHT_DESCRIPTION', 20),
    ('StrategicResourcesUnsuppliedLevels', 'SR_UNSUPPLIED_STANDARD', 'LOC_SR_SETUP_UNSUPPLIED_STANDARD',
     'LOC_SR_SETUP_UNSUPPLIED_STANDARD_DESCRIPTION', 30),
    ('StrategicResourcesUnsuppliedLevels', 'SR_UNSUPPLIED_HARSH', 'LOC_SR_SETUP_UNSUPPLIED_HARSH',
     'LOC_SR_SETUP_UNSUPPLIED_HARSH_DESCRIPTION', 40),
    ('StrategicResourcesLateCurveValues', 'SR_LATE_CURVE_OFF', 'LOC_SR_SETUP_LATE_CURVE_OFF',
     'LOC_SR_SETUP_LATE_CURVE_OFF_DESCRIPTION', 10),
    ('StrategicResourcesLateCurveValues', 'SR_LATE_CURVE_ON', 'LOC_SR_SETUP_LATE_CURVE_ON',
     'LOC_SR_SETUP_LATE_CURVE_ON_DESCRIPTION', 20);
