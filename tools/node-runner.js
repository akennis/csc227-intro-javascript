/**
 * node-runner.js — run a program the way jsrunner.js does, but in Node.
 *
 * Used by tools/gen-labs.js (verify solutions) and tools/grade-worker.js (the
 * grade of record). Produces the same result shape as runCode() so jsrunner's
 * grade() compares browser and CLI runs identically:
 *   runner "worker" → a fresh vm context (no DOM), like the browser Web Worker;
 *   runner "frame"  → a fresh jsdom window holding the problem's `html`.
 * Same instrumentation (prepare) and same in-sandbox prelude, so loop guards,
 * console capture, canon() and the `_t` helpers behave identically.
 *
 * NOT a security boundary and has no hard timeout of its own: callers that run
 * untrusted code must do so inside a worker_threads Worker they can terminate
 * (grade.js does). Requires the dev dependencies `acorn` and `jsdom`.
 */
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { prepare, sandboxPrelude, checksSource, platformConfig, transformJsx } from "../jsrunner.js";

const require = createRequire(import.meta.url);

// The same pinned library versions the browser loads from LIBS (jsrunner.js),
// read from node_modules so grading works offline.
const LIB_FILES = {
  react: [["react", "umd/react.development.js"], ["react-dom", "umd/react-dom.development.js"]],
};

// The packages' "exports" maps hide their umd/ folders, so resolve each
// package root through its package.json and read the file directly.
function libSource([pkg, file]) {
  return readFileSync(join(dirname(require.resolve(pkg + "/package.json")), file), "utf8");
}

/**
 * @param {string} src
 * @param {{runner?:"worker"|"frame", html?:string, checks?:Array, loopBudget?:number, timeout?:number,
 *          mock?:Function|string, storage?:Object|boolean, node?:boolean, jsx?:boolean, libs?:string[]}} [opts]
 * @returns {Promise<{logs:Array, errors:string[], checks:Array, timedOut:boolean}>}
 */
export async function runInNode(src, {
  runner = "worker", html = "", checks = [], loopBudget = 1500, timeout = 4000,
  mock = null, storage = null, node = false, jsx = false, libs = [],
} = {}) {
  const result = { logs: [], errors: [], checks: checks.map(() => null), timedOut: false };
  let prepared;
  try {
    prepared = await prepare(jsx ? await transformJsx(src) : src);
  } catch (err) {
    result.errors.push(`SyntaxError: ${err.message}`);
    return result;
  }
  const onMessage = (m) => {
    if (m.type === "log") result.logs.push({ level: m.level, text: m.text });
    else if (m.type === "error") result.errors.push(m.text);
    else if (m.type === "check")
      result.checks[m.i] = m.ok ? { ok: true, value: m.value, shown: m.shown } : { ok: false, error: m.error };
  };

  let evalIn, global, win = null;
  if (runner === "frame") {
    // Lazy: jsdom is large (seconds to load from a slow disk); worker-runner
    // problems never need it.
    const { JSDOM, VirtualConsole } = await loadJsdom();
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("jsdomError", (err) => onMessage({ type: "error", text: errorText(win, err.detail || err) }));
    const dom = new JSDOM(`<!doctype html><html><head></head><body>\n${html}\n</body></html>`,
      { runScripts: "dangerously", pretendToBeVisual: true, virtualConsole, url: "about:blank" });
    win = dom.window;
    global = win;
    evalIn = (code) => win.eval(code);
  } else {
    const ctx = vm.createContext({
      console: {}, setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask,
      performance, structuredClone, URL, URLSearchParams, TextEncoder, TextDecoder,
    });
    global = ctx;
    evalIn = (code, filename = "student.js") => vm.runInContext(code, ctx, { filename });
  }
  global.__jsrPost = onMessage;
  const cfg = { loopBudget, lineOffset: 0, ...platformConfig({ mock, storage, node }) };
  evalIn(`(${sandboxPrelude})(${JSON.stringify(cfg)}, m => __jsrPost(m));` +
    `globalThis.__jsrCodeUrl = "student.js";`, "prelude.js");

  if (win) {
    for (const name of libs) for (const entry of LIB_FILES[name]) win.eval(libSource(entry));
  }
  try {
    evalIn(prepared.code);
  } catch (err) {
    onMessage({ type: "error", text: errorText(global, err) });
  }
  if (global.__jsrMain) {
    try { await global.__jsrMain; } catch (err) { onMessage({ type: "error", text: errorText(global, err) }); }
  }
  if (win) {
    // The browser frame parses the program before load; replay those events.
    win.document.dispatchEvent(new win.Event("DOMContentLoaded", { bubbles: true }));
    win.dispatchEvent(new win.Event("load"));
  }
  // Async work that never finishes (a callback that's never called) would
  // otherwise leave these awaits pending forever, so they race a deadline,
  // like the browser runner's timeout. (A *synchronous* hang still needs the
  // caller's worker_threads kill — see grade.js.)
  let timer;
  const deadline = new Promise(r => { timer = setTimeout(() => r("timeout"), timeout); });
  const finished = (async () => {
    // Same as the browser Worker: wait for pending timers/requests to settle.
    if (!win) await global.__jsrIdle();
    await new Promise(r => setTimeout(r, 0));
    if (checks.length) await evalIn(checksSource(checks));
  })();
  if (await Promise.race([finished, deadline]) === "timeout") {
    result.timedOut = true;
    result.errors.push(`Stopped after ${timeout / 1000} s — the program never finished`);
  }
  clearTimeout(timer);
  if (win) win.close();
  return result;
}

let jsdomPromise = null;
/** Load jsdom once (exported so a grading worker can warm it up before its clock starts). */
export function loadJsdom() {
  return jsdomPromise ||= import("jsdom");
}

function errorText(global, err) {
  try { return global.__jsrErrText(err); } catch { return String(err && err.message || err); }
}
