// Adds one line to a strategic resource's description wherever the game shows it: "Supplies units: Field Cannon, Field
// Gun and 2 more.", or "Needed to train: ..." under the hard gate. The plot tooltip and the commerce screen's resource
// tooltip both draw a resource's Tooltip text through the Stylize component, so the line is added there, keyed on that
// text, and the tooltips themselves are left as they are. Mods that draw their own plot or resource tooltip with
// Stylize get the line too.
//
// The units listed are the local player's: other civilizations' unique units and a unit the player's own unique unit
// replaces are left out. A resource that supplies none of them in this age gets no line.

import { log } from "/tower-strategic-resources-that-matter/ui/sr-log.js";
import { readIndexes } from "/tower-strategic-resources-that-matter/ui/sr-player-supply.js";
import { keepWrapped } from "/tower-strategic-resources-that-matter/ui/sr-registry.js";
import { unitsSuppliedBy } from "/tower-strategic-resources-that-matter/ui/sr-supply.js";

/** @type {Map<string, string> | null} a resource's Tooltip text key to the resource, for resources units draw on */
let tooltipIndex = null;
/** @type {Map<string, string | null>} "<player>:<resource>" to its line */
const lines = new Map();
let warned = false;

/** @returns {Map<string, string>} */
export function resourceTooltipIndex() {
  if (!tooltipIndex) {
    const drawnOn = new Set(readIndexes().supply.values());
    tooltipIndex = new Map();
    for (const row of /** @type {*} */ (GameInfo.Resources)) {
      if (drawnOn.has(row.ResourceType) && row.Tooltip) tooltipIndex.set(row.Tooltip, row.ResourceType);
    }
  }
  return tooltipIndex;
}

/**
 * The player's traits, from their civilization and their leader.
 * @param {*} player
 * @returns {Set<string>}
 */
function playerTraits(player) {
  const civilization = GameInfo.Civilizations.lookup(player.civilizationType)?.CivilizationType;
  const leader = GameInfo.Leaders.lookup(player.leaderType)?.LeaderType;
  const traits = new Set();
  for (const row of /** @type {*} */ (GameInfo.CivilizationTraits ?? [])) {
    if (row.CivilizationType === civilization) traits.add(row.TraitType);
  }
  for (const row of /** @type {*} */ (GameInfo.LeaderTraits ?? [])) {
    if (row.LeaderType === leader) traits.add(row.TraitType);
  }
  return traits;
}

/**
 * Display names of the gated units a player can train: no other civilization's unique unit, and not a unit the
 * player's own unique unit replaces.
 * @param {*} player
 * @param {Map<string, string>} supply
 * @returns {Map<string, string>}
 */
export function unitNamesFor(player, supply) {
  const traits = playerTraits(player);
  /** @type {Map<string, *>} */
  const own = new Map();
  for (const unitType of supply.keys()) {
    const row = GameInfo.Units.lookup(unitType);
    if (!row || row.CanTrain === false) continue;
    if (row.TraitType && !traits.has(row.TraitType)) continue;
    own.set(unitType, row);
  }
  for (const row of /** @type {*} */ (GameInfo.UnitReplaces ?? [])) {
    if (own.has(row.CivUniqueUnitType)) own.delete(row.ReplacesUnitType);
  }
  return new Map([...own].map(([unitType, row]) => [unitType, Locale.compose(row.Name)]));
}

/**
 * The line for a resource and the local player, or null.
 * @param {string} resourceType
 * @returns {string | null}
 */
export function describeResourceSupply(resourceType) {
  const playerId = GameContext.localPlayerID;
  const key = `${playerId}:${resourceType}`;
  if (lines.has(key)) return lines.get(key) ?? null;
  let line = null;
  const player = Players.get(playerId);
  if (player?.isMajor) {
    const { supply, gate } = readIndexes();
    const units = unitsSuppliedBy(resourceType, supply, unitNamesFor(player, supply));
    if (units) {
      // A key of the form "{1_First}, {2_Second}" carries the spacing: the game trims a separator key's own spaces.
      const list = units.names.reduce((first, second) => Locale.compose("LOC_SR_LIST_PAIR", first, second));
      const stem = gate.on ? "LOC_SR_RESOURCE_NEEDED" : "LOC_SR_RESOURCE_SUPPLIES";
      line = units.more > 0 ? Locale.compose(`${stem}_MORE`, list, units.more) : Locale.compose(stem, list);
    }
  }
  lines.set(key, line);
  return line;
}

/**
 * The text Stylize should draw: a strategic resource's description with the line under it, anything else as it is.
 * Never throws.
 * @param {unknown} text
 * @param {unknown[] | undefined} args
 * @returns {unknown}
 */
export function withSupplyLine(text, args) {
  if (typeof text !== "string" || !text.startsWith("LOC_")) return text;
  try {
    const resourceType = resourceTooltipIndex().get(text);
    if (!resourceType) return text;
    const line = describeResourceSupply(resourceType);
    return line ? `${Locale.compose(text, ...(args ?? []))}[N]${line}` : text;
  } catch (e) {
    if (!warned) log.warn("could not add the resource line:", e);
    warned = true;
    return text;
  }
}

/**
 * The Stylize factory: whatever was registered before, given the text with the line.
 * @param {(...sources: object[]) => object} mergeProps
 * @returns {(previous: Function) => Function}
 */
export function wrapStylize(mergeProps) {
  return (previous) =>
    function StrategicResourcesThatMatterStylize(/** @type {*} */ props) {
      return previous(mergeProps(props, {
        get text() {
          return withSupplyLine(props.text, props.args);
        }
      }));
    };
}

async function start() {
  try {
    const { ComponentRegistry } = /** @type {*} */ (await import("/core/ui-next/services/component-registry.js"));
    const solid = /** @type {*} */ (await import("/core/vendor/solid-js/dist/solid.js"));
    await keepWrapped(ComponentRegistry, solid, "Stylize", wrapStylize(solid.mergeProps));
  } catch (e) {
    log.warn("could not add the resource line:", e);
  }
}

if (typeof engine !== "undefined") start();
