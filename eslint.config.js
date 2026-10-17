// Dev-only ESLint flat config: the size and complexity limits on ui/, and correctness rules everywhere.
// Not shipped; release.sh leaves it out.

// @eslint/js ships with eslint itself, so it needs no entry of its own in package.json.
import js from "@eslint/js";

// Engine globals the shipped scripts read without importing them.
const ENGINE_GLOBALS = {
  Game: "readonly",
  GameContext: "readonly",
  GameInfo: "readonly",
  Players: "readonly",
  Units: "readonly",
  Armies: "readonly",
  Configuration: "readonly",
  Locale: "readonly",
  engine: "readonly",
  Controls: "readonly",
  UI: "readonly",
  CityQueryType: "readonly",
  CityOperationTypes: "readonly"
};

const BROWSER_GLOBALS = {
  window: "readonly",
  document: "readonly",
  console: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  HTMLElement: "readonly",
  getComputedStyle: "readonly",
  localStorage: "readonly",
  globalThis: "readonly"
};

const NODE_GLOBALS = {
  process: "readonly",
  console: "readonly",
  globalThis: "readonly",
  Buffer: "readonly",
  URL: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  structuredClone: "readonly"
};

// Engine globals the lab tooling in devtools/ uses to set up games: the shell's setup and lobby calls.
const LAB_GLOBALS = {
  GameModeTypes: "readonly",
  GameSetup: "readonly",
  Network: "readonly",
  ServerType: "readonly",
  SlotStatus: "readonly",
  setInterval: "readonly",
  CustomEvent: "readonly",
  GameplayMap: "readonly"
};

// Test and tool code: correctness rules only. The size limits are for the shipped modules; a test file is a list
// of scenarios, and splitting one to satisfy a statement count hides the story.
const TOOL_RULES = {
  ...js.configs.recommended.rules,
  "max-len": ["warn", { code: 120, ignoreUrls: true, ignoreRegExpLiterals: true }],
  "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
  eqeqeq: ["error", "always", { null: "ignore" }]
};

export default [
  // Tower Settings Keeper, copied unchanged from its own repo; it is linted and tested there.
  { ignores: ["ui/settings-keeper.js", "node_modules/**", "dist/**", "coverage/**", ".stryker-tmp/**"] },
  {
    files: ["ui/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...ENGINE_GLOBALS, ...BROWSER_GLOBALS }
    },
    rules: {
      complexity: ["error", 10],
      "max-lines-per-function": ["error", { max: 50, skipBlankLines: true, skipComments: true, IIFEs: true }],
      "max-lines": ["error", { max: 500, skipBlankLines: true, skipComments: true }],
      // Strings, templates, regular expressions and URLs are exempt so data and copy are not penalised.
      "max-len": [
        "error",
        {
          code: 120,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true
        }
      ],
      "max-params": ["error", 5],
      "max-depth": ["error", 4],
      "max-statements": ["error", 18],
      "no-undef": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      // Match the engine's own `== null` idiom.
      eqeqeq: ["error", "always", { null: "ignore" }]
    }
  },
  {
    files: ["tests/**/*.mjs", "scripts/**/*.mjs", "devtools/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // Tests stand in for the browser and the engine, so they read and assign those globals too.
      globals: { ...NODE_GLOBALS, ...ENGINE_GLOBALS, ...BROWSER_GLOBALS, ...LAB_GLOBALS }
    },
    rules: TOOL_RULES
  }
];
