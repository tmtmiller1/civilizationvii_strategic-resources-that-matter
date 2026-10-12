import assert from "node:assert/strict";
import { captureConsole, snapshotGlobals, table } from "./_engine-stubs.mjs";

// The lost-supply notification: the first look at load says nothing, a loss at a turn start raises one notification
// for the local player with every loss of that turn in it, and a resource still at zero is not reported again. The
// notification is composed at TurnBegin (checkSupplyLost) and sent when the local player's turn is activated
// (sendSupplyLost): the engine still lists last turn's notification at TurnBegin and drops a second one of a type.

const restoreGlobals = snapshotGlobals(["GameInfo", "Players", "Units", "Locale", "Game", "GameContext"]);
const log = captureConsole();

globalThis.Locale = { compose: (key, ...args) => (args.length ? `${key}(${args.join(",")})` : `<${key}>`) };
globalThis.GameInfo = {
  Units: table([
    { UnitType: "UNIT_FIELD_CANNON", Name: "LOC_UNIT_FIELD_CANNON_NAME" },
    { UnitType: "UNIT_TANK", Name: "LOC_UNIT_TANK_NAME" },
    { UnitType: "UNIT_INFANTRY", Name: "LOC_UNIT_INFANTRY_NAME" }
  ], "UnitType"),
  Resources: table([
    { ResourceType: "RESOURCE_NITER", Name: "LOC_RESOURCE_NITER_NAME" },
    { ResourceType: "RESOURCE_OIL", Name: "LOC_RESOURCE_OIL_NAME" },
    { ResourceType: "RESOURCE_COAL", Name: "LOC_RESOURCE_COAL_NAME" }
  ], "ResourceType"),
  TypeTags: [{ Type: "UNIT_FIELD_CANNON", Tag: "SR_SUPPLY_NITER" }, { Type: "UNIT_TANK", Tag: "SR_SUPPLY_OIL" }],
  ModifierArguments: [
    { ModifierId: "SR_COMBAT_PENALTY_NITER", Name: "Amount", Value: "-3" },
    { ModifierId: "SR_COMBAT_PENALTY_OIL", Name: "Amount", Value: "-3" }
  ]
};
const hashOf = (/** @type {string} */ type) => globalThis.GameInfo.Resources.lookup(type).$hash;
const unitHash = (/** @type {string} */ type) => globalThis.GameInfo.Units.lookup(type).$hash;

/** @type {string[]} the local player's on-map resources */
let held = [];
/** @type {Record<string, { type: number }>} */
const unitsById = {
  a: { type: unitHash("UNIT_FIELD_CANNON") }, b: { type: unitHash("UNIT_FIELD_CANNON") },
  c: { type: unitHash("UNIT_INFANTRY") }, d: { type: unitHash("UNIT_TANK") }
};
const local = {
  id: 0,
  isMajor: true,
  Resources: { getResources: () => held.map((r) => ({ uniqueResource: { resource: hashOf(r) }, isOffMap: false })) },
  Units: { getUnitIds: () => Object.keys(unitsById) }
};
globalThis.Players = { get: (id) => (id === 0 ? local : null) };
globalThis.GameContext = { localPlayerID: 0 };
globalThis.Units = { get: (id) => unitsById[id] ?? null };
/** @type {[any, number][]} */
const sent = [];
Object.defineProperty(globalThis, "Game", {
  configurable: true,
  writable: true,
  value: {
    turn: 7,
    getHash: (/** @type {string} */ s) => `#${s}`,
    Notifications: { send: (/** @type {any} */ n, /** @type {number} */ p) => sent.push([n, p]) }
  }
});

try {
  const { checkSupplyLost, sendSupplyLost, startSupplyLost, NOTIFICATION_TYPE } =
    await import("/tower-strategic-resources-that-matter/ui/sr-supply-lost.js");
  const { resetIndexes } = await import("/tower-strategic-resources-that-matter/ui/sr-player-supply.js");
  /** One turn start: TurnBegin, then the local player's PlayerTurnActivated. */
  const turnStart = () => {
    checkSupplyLost();
    sendSupplyLost(0);
  };

  // A check before any look takes the first look and says nothing.
  held = [];
  turnStart();
  assert.equal(sent.length, 0);

  // Load: the player already holds nothing; the first look reports nothing, and neither does the next turn.
  startSupplyLost();
  turnStart();
  assert.equal(sent.length, 0, "a load never reports a loss");

  // Niter held, then gone: one notification naming the Field Cannon and one other unit.
  held = ["RESOURCE_NITER", "RESOURCE_NITER", "RESOURCE_OIL"];
  turnStart();
  assert.equal(sent.length, 0, "a gain says nothing");
  held = ["RESOURCE_OIL"];
  turnStart();
  assert.equal(sent.length, 1);
  const [first, player] = sent[0];
  assert.equal(player, 0);
  assert.equal(first.Type, `#${NOTIFICATION_TYPE}`);
  assert.equal(first.Message, "LOC_SR_NOTIFY_LOST_MESSAGE(<LOC_RESOURCE_NITER_NAME>)");
  assert.equal(first.Summary,
    "LOC_SR_NOTIFY_LOST_MANY(LOC_RESOURCE_NITER_NAME,LOC_UNIT_FIELD_CANNON_NAME,1,-3)");
  assert.ok(log.lines.some(([, text]) => text.includes("supply lost, turn 7: RESOURCE_NITER")));

  // Still at zero next turn: not reported again.
  turnStart();
  assert.equal(sent.length, 1, "once per loss, not every turn");

  // Two losses in one turn go into one notification.
  held = ["RESOURCE_NITER", "RESOURCE_OIL"];
  turnStart();
  held = [];
  turnStart();
  assert.equal(sent.length, 2);
  assert.equal(sent[1][0].Message,
    "LOC_SR_NOTIFY_LOST_MESSAGE(LOC_SR_LIST_PAIR(<LOC_RESOURCE_NITER_NAME>,<LOC_RESOURCE_OIL_NAME>))");
  assert.equal(sent[1][0].Summary, "LOC_SR_NOTIFY_LOST_MANY(LOC_RESOURCE_NITER_NAME,LOC_UNIT_FIELD_CANNON_NAME,1,-3) " +
    "LOC_SR_NOTIFY_LOST_ONE(LOC_RESOURCE_OIL_NAME,LOC_UNIT_TANK_NAME,-3)");

  // Losses on two turns in a row: each turn's notification is sent once that turn is activated, not at TurnBegin.
  held = ["RESOURCE_NITER", "RESOURCE_OIL"];
  turnStart();
  held = ["RESOURCE_OIL"];
  checkSupplyLost();
  assert.equal(sent.length, 2, "nothing is sent at TurnBegin");
  sendSupplyLost(3);
  assert.equal(sent.length, 2, "another player's activation sends nothing");
  sendSupplyLost(0);
  assert.equal(sent.length, 3);
  assert.equal(sent[2][0].Message, "LOC_SR_NOTIFY_LOST_MESSAGE(<LOC_RESOURCE_NITER_NAME>)");
  held = [];
  turnStart();
  assert.equal(sent.length, 4, "the next turn's loss is raised too");
  assert.equal(sent[3][0].Message, "LOC_SR_NOTIFY_LOST_MESSAGE(<LOC_RESOURCE_OIL_NAME>)");
  sendSupplyLost(0);
  assert.equal(sent.length, 4, "sent once");

  // A notification composed in one turn is not sent in a later one (no activation came in between).
  held = ["RESOURCE_NITER"];
  turnStart();
  held = [];
  checkSupplyLost();
  globalThis.Game.turn = 8;
  sendSupplyLost(0);
  globalThis.Game.turn = 7;
  assert.equal(sent.length, 4, "a stale composition is dropped");
  sent.splice(2);

  // A resource with no penalty loaded (Coal here) is not watched at all.
  held = ["RESOURCE_COAL"];
  turnStart();
  held = [];
  turnStart();
  assert.equal(sent.length, 2);

  // A loss reaching no unit still says what it costs.
  delete unitsById.d;
  held = ["RESOURCE_OIL"];
  turnStart();
  held = [];
  turnStart();
  assert.equal(sent[2][0].Summary, "LOC_SR_NOTIFY_LOST_NONE(LOC_RESOURCE_OIL_NAME,-3)");

  // No local player (Autoplay): nothing, and the next look starts over.
  held = ["RESOURCE_NITER"];
  turnStart();
  globalThis.GameContext = { localPlayerID: -1 };
  turnStart();
  startSupplyLost();
  globalThis.GameContext = { localPlayerID: 0 };
  held = [];
  turnStart();
  assert.equal(sent.length, 3, "a loss across an Autoplay stretch is not reported");

  // Under the hard gate: the sentence gains its tail, and a resource with no penalty but a column (Coal here,
  // penalty Off) still raises the lock sentence.
  sent.splice(0);
  globalThis.GameInfo.Units = table([
    { UnitType: "UNIT_FIELD_CANNON", Name: "LOC_UNIT_FIELD_CANNON_NAME", StrategicResource: "RESOURCE_NITER" },
    { UnitType: "UNIT_TANK", Name: "LOC_UNIT_TANK_NAME", StrategicResource: "RESOURCE_OIL" },
    { UnitType: "UNIT_INFANTRY", Name: "LOC_UNIT_INFANTRY_NAME" },
    { UnitType: "UNIT_IRONCLAD", Name: "LOC_UNIT_IRONCLAD_NAME", StrategicResource: "RESOURCE_COAL" }
  ], "UnitType");
  globalThis.GameInfo.TypeTags.push({ Type: "UNIT_IRONCLAD", Tag: "SR_SUPPLY_COAL" });
  globalThis.GameInfo.GlobalParameters = [{ Name: "STRATEGIC_RESOURCE_MINIMUM_FOR_PRODUCTION_ANYWHERE", Value: "1" },
    { Name: "STRATEGIC_RESOURCE_MINIMUM_FOR_PURCHASE_ANYWHERE", Value: "1" }];
  resetIndexes();
  unitsById.a = { type: globalThis.GameInfo.Units.lookup("UNIT_FIELD_CANNON").$hash };
  unitsById.b = { type: globalThis.GameInfo.Units.lookup("UNIT_TANK").$hash };
  startSupplyLost();
  held = ["RESOURCE_NITER", "RESOURCE_COAL"];
  turnStart();
  held = [];
  turnStart();
  assert.equal(sent.length, 1);
  assert.equal(sent[0][0].Message,
    "LOC_SR_NOTIFY_LOST_MESSAGE(LOC_SR_LIST_PAIR(<LOC_RESOURCE_NITER_NAME>,<LOC_RESOURCE_COAL_NAME>))",
    "a loss of a resource the gate names is reported even with no penalty on it");
  assert.equal(sent[0][0].Summary, "LOC_SR_NOTIFY_LOST_ONE(LOC_RESOURCE_NITER_NAME,LOC_UNIT_FIELD_CANNON_NAME,-3) " +
    "<LOC_SR_NOTIFY_LOCKED_TAIL> LOC_SR_NOTIFY_LOCKED(LOC_RESOURCE_COAL_NAME)");
  globalThis.GameInfo.GlobalParameters = [];
  resetIndexes();
  const { withTail } = await import("/tower-strategic-resources-that-matter/ui/sr-supply-lost.js");
  assert.equal(withTail("Fights at -3.", "New ones cannot be trained."), "Fights at -3. New ones cannot be trained.");
  assert.equal(withTail("戦闘力-3、訓練も遅くなります。", "それまで新たに訓練することはできません。"),
    "戦闘力-3、訓練も遅くなります。それまで新たに訓練することはできません。", "no space after a full-width stop");
  assert.equal(withTail("战斗力-3，训练变慢。", "在此之前无法训练新的。"), "战斗力-3，训练变慢。在此之前无法训练新的。");

} finally {
  log.restore();
  restoreGlobals();
}

console.log("sr-supply-lost tests passed");
