// The status pill the mod draws wherever it says what a unit is short of: on a production item and on the unit
// panel. One look everywhere: the game's own pill shape (ui-next/components/pills.js), red with light text while the
// unit is short, the game's neutral pill otherwise. The item's disabled state dims the whole item to 0.8, which the
// red still reads through.

// Wider side padding than the game's small pill, so the text clears the rounded ends.
const PILL_CLASSES = ["font-body", "text-sm", "pointer-events-none", "min-h-7", "px-3", "flex", "items-center",
  "self-start", "rounded-full", "leading-normal", "whitespace-nowrap"];
export const WARNING_CLASS = "sr-pill--warning";
const PLAIN = { border: "1px solid #53565D", background: "#23252b", color: "#E5D2AC" };
const WARNING = { border: "1px solid #FF7A66", background: "#A8201A", color: "#FFF3E3" };

/**
 * A pill element, or null where the DOM is not there.
 * @param {string} text
 * @param {{ warning?: boolean, className?: string }} [options]
 * @returns {HTMLElement | null}
 */
export function statusPill(text, { warning = false, className = "" } = {}) {
  if (typeof document === "undefined") return null;
  const element = document.createElement("div");
  element.classList.add(...PILL_CLASSES);
  if (className) element.classList.add(className);
  element.setAttribute("role", "paragraph");
  stylePill(element, warning);
  element.textContent = text;
  return element;
}

/**
 * Puts the pill's look on an element already drawn, warning or plain.
 * @param {HTMLElement} element
 * @param {boolean} warning
 */
export function stylePill(element, warning) {
  const look = warning ? WARNING : PLAIN;
  element.classList.toggle(WARNING_CLASS, warning);
  element.style.border = look.border;
  element.style.background = look.background;
  element.style.color = look.color;
}

/**
 * The sentence in the game's own negative style for a tooltip or any text the game stylizes.
 * @param {string} text
 * @returns {string}
 */
export const negative = (text) => `[STYLE:text-negative]${text}[/STYLE]`;
