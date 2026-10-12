// The mod's one logger. console.log never reaches UI.log in this engine, so every level writes through
// console.warn or console.error. release.sh sets DBG to false in the shipped copy, which silences debug lines only.

const DBG = true;
const TAG = "[StrategicResourcesThatMatter]";

/** @param {unknown[]} parts */
function line(parts) {
  return [TAG, ...parts];
}

export const log = {
  /** Per-turn detail, for development only. @param {...unknown} parts */
  debug(...parts) {
    if (DBG) console.warn(...line(parts));
  },
  /** One-off facts a player's log should keep, such as the multiplayer notice. @param {...unknown} parts */
  info(...parts) {
    console.warn(...line(parts));
  },
  /** Something did not work and the mod fell back. @param {...unknown} parts */
  warn(...parts) {
    console.warn(...line(parts));
  },
  /** @param {...unknown} parts */
  error(...parts) {
    console.error(...line(parts));
  }
};
