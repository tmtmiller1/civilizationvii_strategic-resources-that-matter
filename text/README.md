# Translating More Important Strategic Resources (`text/`)

Every string a player sees is a `LOC_SR_*` tag defined here and looked up by the game. The scripts set no display text
of their own, so a translation needs no code change.

| File | Contents |
| --- | --- |
| `en_us/StrategicResourcesText.xml` | The source: the mod's name and description, the unit panel line, the setup options. |
| `<lang>/StrategicResourcesText.xml` | The same tags in one language. |

The eleven other languages use the game's own words for its terms (Combat Strength, Production, the resource names
come from the game). English uses an `EnglishText` block with `Row`; every other language a `LocalizedText` block with
`Replace` and the `Language` code the modinfo loads it under (`zh_hk` is `zh_Hant_HK`). To change the English, change
every language; `tests/i18n.mjs` checks that the tags, placeholders and codes match and that each row is translated.
A duplicate tag rolls back the whole file in game.
