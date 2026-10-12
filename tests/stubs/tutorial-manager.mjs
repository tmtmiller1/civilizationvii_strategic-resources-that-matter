// Stand-in for the game's /base-standard/ui/tutorial/tutorial-manager.js: records what a script adds and processes.
// Set `throws` before the import to make add() fail.
const TutorialManager = {
  /** @type {any[]} */
  added: [],
  /** @type {string[]} */
  processed: [],
  throws: false,
  /** @param {any} def */
  add(def) {
    if (TutorialManager.throws) throw new Error("manager refused");
    TutorialManager.added.push(def);
  },
  /** @param {string} name */
  process(name) {
    TutorialManager.processed.push(name);
  }
};
export default TutorialManager;
