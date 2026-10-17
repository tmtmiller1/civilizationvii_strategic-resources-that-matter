// Engine and browser stand-ins the tests install on globalThis, and a snapshot to put the real globals back.

// Records the current value of each named global; the returned function puts them all back.
export function snapshotGlobals(names) {
  const saved = names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]);
  return () => {
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  };
}

// console.warn and console.error captured into an array, for asserting on log lines.
export function captureConsole() {
  const lines = [];
  const original = { warn: console.warn, error: console.error };
  console.warn = (...parts) => lines.push(["warn", parts.join(" ")]);
  console.error = (...parts) => lines.push(["error", parts.join(" ")]);
  return { lines, restore: () => Object.assign(console, original) };
}

// A GameInfo-style table: iterable rows plus lookup by the type name, index or hash.
export function table(rows, key) {
  const list = rows.map((row, index) => ({ $index: index, $hash: 1000 + index, ...row }));
  return Object.assign(list, {
    lookup: (k) => list.find((row) => row[key] === k || row.$index === k || row.$hash === k) ?? null
  });
}

// A minimal element: class list, attributes, text, children and querySelector by one class name.
export function element(classes = []) {
  const classSet = new Set(classes);
  const node = {
    children: [],
    attributes: {},
    textContent: "",
    style: {},
    classList: {
      add: (...names) => names.forEach((n) => classSet.add(n)),
      remove: (...names) => names.forEach((n) => classSet.delete(n)),
      contains: (n) => classSet.has(n),
      toggle: (n, force) => {
        if (force ?? !classSet.has(n)) classSet.add(n); else classSet.delete(n);
        return classSet.has(n);
      }
    },
    setAttribute: (k, v) => {
      node.attributes[k] = v;
    },
    appendChild: (child) => {
      // As in the DOM: a child already in the tree moves to the end.
      node.children = node.children.filter((c) => c !== child);
      node.children.push(child);
      return child;
    },
    querySelector: (selector) => find(node, selector.replace(/^\./, "")),
    querySelectorAll: (selector) => findAll(node, selector.replace(/^\./, ""))
  };
  return node;
}

function find(node, className) {
  for (const child of node.children) {
    if (child.classList.contains(className)) return child;
    const deeper = find(child, className);
    if (deeper) return deeper;
  }
  return null;
}

// Every descendant with the class, in document order.
function findAll(node, className, out = []) {
  for (const child of node.children) {
    if (child.classList.contains(className)) out.push(child);
    findAll(child, className, out);
  }
  return out;
}
