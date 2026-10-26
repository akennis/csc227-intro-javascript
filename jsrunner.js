/**
 * jsrunner.js — run untrusted learner JavaScript safely on a course page.
 *
 * One self-contained ES module (the CSC 227 counterpart of stanfordkarel.js).
 * It runs a learner's program in one of two sandboxes, captures its console,
 * evaluates hidden "checks" against it, and compares those results to the
 * results of a reference solution run the same way.
 *
 *   runCode(src, { runner: "worker" })   pure logic. A classic Web Worker; a
 *                                        wall-clock timeout terminate()s it, so
 *                                        nothing the learner writes can hang
 *                                        the page (the Karel worker pattern).
 *   runCode(src, { runner: "frame" })    DOM work. An <iframe sandbox=
 *                                        "allow-scripts" srcdoc> (opaque origin:
 *                                        it cannot touch the course page). A
 *                                        frame cannot be killed, so every loop is
 *                                        instrumented (prepare → protectLoops) to
 *                                        throw once one task runs too long.
 *
 * Both runners share sandboxPrelude(), which is stringified into the sandbox:
 * console capture, the loop guard, value formatting, and the check harness.
 * There is no build step; the only dependency is acorn, loaded lazily from a
 * pinned CDN URL in the browser (or the `acorn` package in Node).
 */

// ─────────────────────────── PARSER LOADER ──────────────────────────────────

const ACORN_URL = "https://cdn.jsdelivr.net/npm/acorn@8.14.0/dist/acorn.mjs";
let acornPromise = null;

function loadAcorn() {
  if (!acornPromise) {
    const inNode = typeof window === "undefined" && typeof process !== "undefined";
    acornPromise = import(inNode ? "acorn" : ACORN_URL);
  }
  return acornPromise;
}

// ─────────────────────────── SOURCE PREPARATION ─────────────────────────────

const LOOP_TYPES = new Set(["ForStatement", "WhileStatement", "DoWhileStatement", "ForInStatement", "ForOfStatement"]);
const FUNCTION_TYPES = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);

// Visit every AST node, tracking how many functions enclose it.
function walk(node, visit, depth = 0) {
  if (!node || typeof node.type !== "string") return;
  visit(node, depth);
  const inner = FUNCTION_TYPES.has(node.type) ? depth + 1 : depth;
  for (const key in node) {
    if (key === "loc") continue;
    const child = node[key];
    if (Array.isArray(child)) for (const c of child) walk(c, visit, inner);
    else if (child && typeof child.type === "string") walk(child, visit, inner);
  }
}

function patternNames(p, out) {
  if (!p) return out;
  if (p.type === "Identifier") out.push(p.name);
  else if (p.type === "ObjectPattern") p.properties.forEach(q => patternNames(q.type === "RestElement" ? q.argument : q.value, out));
  else if (p.type === "ArrayPattern") p.elements.forEach(q => patternNames(q, out));
  else if (p.type === "RestElement") patternNames(p.argument, out);
  else if (p.type === "AssignmentPattern") patternNames(p.left, out);
  return out;
}

/**
 * Parse learner source and return the instrumented program that actually runs.
 * Three rewrites, none of which adds or removes a newline (so error line
 * numbers still match the editor):
 *   1. every loop body starts with `__jsrGuard();` (non-block bodies are braced);
 *   2. code using top-level `await` is wrapped in an async IIFE stored on
 *      `globalThis.__jsrMain`, which the runner awaits before running checks;
 *   3. in that wrapped form, top-level declarations are copied onto globalThis
 *      at the end so checks can still call the learner's functions.
 * Throws a SyntaxError (acorn's message includes "(line:column)") for bad code.
 *
 * @param {string} src
 * @returns {Promise<{code:string, topLevelAwait:boolean}>}
 */
export async function prepare(src) {
  const acorn = await loadAcorn();
  let ast;
  try {
    ast = acorn.parse(src, { ecmaVersion: "latest", sourceType: "script", allowAwaitOutsideFunction: true });
  } catch (err) {
    throw new SyntaxError(err.message);
  }
  const edits = [];
  let topLevelAwait = false;
  walk(ast, (node, depth) => {
    if (depth === 0 && (node.type === "AwaitExpression" || (node.type === "ForOfStatement" && node.await)))
      topLevelAwait = true;
    if (!LOOP_TYPES.has(node.type)) return;
    const body = node.body;
    if (body.type === "BlockStatement") edits.push([body.start + 1, "__jsrGuard();"]);
    else edits.push([body.start, "{__jsrGuard();"], [body.end, "}"]);
  });
  edits.sort((a, b) => b[0] - a[0]);
  let code = src;
  for (const [at, text] of edits) code = code.slice(0, at) + text + code.slice(at);
  if (topLevelAwait) {
    const names = [];
    for (const stmt of ast.body) {
      if (stmt.type === "FunctionDeclaration" || stmt.type === "ClassDeclaration") names.push(stmt.id.name);
      else if (stmt.type === "VariableDeclaration") stmt.declarations.forEach(d => patternNames(d.id, names));
    }
    const exportAll = names.map(n => `globalThis.${n} = ${n};`).join(" ");
    code = `globalThis.__jsrMain = (async () => {${code}\n;${exportAll}})();`;
  }
  return { code, topLevelAwait };
}

// ─────────────────────────── SANDBOX PRELUDE ────────────────────────────────

/**
 * Runs INSIDE the sandbox (it is injected as source via toString, so it must
 * not reference anything outside its own body). Installs console capture, the
 * loop guard, the `_t` test helpers, and the check harness.
 * @param {{loopBudget:number, lineOffset:number}} cfg
 * @param {(msg:object) => void} post   sends a message out to the course page
 */
export function sandboxPrelude(cfg, post) {
  const G = globalThis;
  const MAX_ITEMS = 100;
  // The sandbox's own timers use the original setTimeout, so they never count
  // as "pending work" (see the idle tracker at the end).
  const rawSetTimeout = G.setTimeout.bind(G);

  function fmt(v, depth, seen) {
    if (typeof v === "string") return depth === 0 ? v : JSON.stringify(v);
    if (v === null || typeof v !== "object" && typeof v !== "function") {
      if (typeof v === "number" && Object.is(v, -0)) return "-0";
      if (typeof v === "bigint") return v + "n";
      if (typeof v === "symbol") return v.toString();
      return String(v);
    }
    if (typeof v === "function") return v.name ? `[Function: ${v.name}]` : "[Function (anonymous)]";
    if (v instanceof Error) return `${v.name}: ${v.message}`;
    if (typeof Node !== "undefined" && v instanceof Node) {
      if (v.nodeType === 3) return JSON.stringify(v.textContent);
      if (v.nodeType !== 1) return `[${v.nodeName}]`;
      const html = v.outerHTML;
      return html.length > 120 ? html.slice(0, 117) + "…" : html;
    }
    if (seen.has(v)) return "[Circular]";
    if (depth > 4) return Array.isArray(v) ? "[Array]" : "[Object]";
    seen.add(v);
    let out;
    const more = n => (n > MAX_ITEMS ? [`… ${n - MAX_ITEMS} more`] : []);
    if (Array.isArray(v)) {
      out = "[" + v.slice(0, MAX_ITEMS).map(x => fmt(x, depth + 1, seen)).concat(more(v.length)).join(", ") + "]";
    } else if (v instanceof Map) {
      const items = [...v].slice(0, MAX_ITEMS).map(([k, x]) => `${fmt(k, depth + 1, seen)} => ${fmt(x, depth + 1, seen)}`);
      out = `Map(${v.size}) {` + items.concat(more(v.size)).join(", ") + "}";
    } else if (v instanceof Set) {
      out = `Set(${v.size}) {` + [...v].slice(0, MAX_ITEMS).map(x => fmt(x, depth + 1, seen)).concat(more(v.size)).join(", ") + "}";
    } else if (v instanceof Date) {
      out = isNaN(v) ? "Invalid Date" : v.toISOString();
    } else if (typeof Promise !== "undefined" && v instanceof Promise) {
      out = "Promise {…}";
    } else {
      const keys = Object.keys(v);
      const body = keys.slice(0, MAX_ITEMS).map(k => {
        const key = /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
        return `${key}: ${fmt(v[k], depth + 1, seen)}`;
      }).concat(more(keys.length)).join(", ");
      const ctor = v.constructor && v.constructor !== Object && v.constructor.name ? v.constructor.name + " " : "";
      out = keys.length ? `${ctor}{${body}}` : `${ctor}{}`;
    }
    seen.delete(v);
    return out;
  }
  const show = v => fmt(v, 0, new Set());
  const showNested = v => fmt(v, 1, new Set());

  // A JSON-safe tagged tree that grading compares structurally, with a numeric
  // tolerance (so c*1.8+32 and c*9/5+32 agree) and order-insensitive keys.
  function canon(v, seen = new Set()) {
    if (v === undefined) return { u: 1 };
    if (v === null || typeof v === "string" || typeof v === "boolean") return v;
    if (typeof v === "number") return Number.isFinite(v) ? { n: v } : { n: String(v) };
    if (typeof v === "bigint") return { b: String(v) };
    if (typeof v === "symbol") return { y: v.toString() };
    if (typeof v === "function") return { f: v.name || "" };
    if (v instanceof Error) return { e: v.name + ": " + v.message };
    if (typeof Node !== "undefined" && v instanceof Node) return { d: v.nodeType === 1 ? v.outerHTML : v.textContent };
    if (seen.has(v)) return { c: 1 };
    seen.add(v);
    let out;
    if (Array.isArray(v)) out = { a: v.map(x => canon(x, seen)) };
    else if (v instanceof Map) out = { m: [...v].map(([k, x]) => [canon(k, seen), canon(x, seen)]) };
    else if (v instanceof Set) out = { s: [...v].map(x => canon(x, seen)) };
    else if (v instanceof Date) out = { t: v.getTime() };
    else out = { o: Object.keys(v).sort().map(k => [k, canon(v[k], seen)]) };
    seen.delete(v);
    return out;
  }

  // Error text with a 1-based line number in the learner's own code, when the
  // stack or the error event tells us where it happened.
  function errText(err, line) {
    let text = err instanceof Error ? `${err.name}: ${err.message}` : "Uncaught " + showNested(err);
    // Prefer the first stack frame inside the learner's code: an error thrown
    // by the loop guard *originates* in the prelude, but its caller is theirs.
    if (err && err.stack && G.__jsrCodeUrl) {
      for (const part of err.stack.split(G.__jsrCodeUrl).slice(1)) {
        const hit = part.match(/^:(\d+):\d+/);
        if (hit && Number(hit[1]) - cfg.lineOffset > 0) { line = Number(hit[1]); break; }
      }
    }
    if (line != null && line - cfg.lineOffset > 0) text += ` (line ${line - cfg.lineOffset})`;
    return text;
  }
  G.__jsrErrText = errText;

  // ── console capture ──
  // Output is capped INSIDE the sandbox: an endless loop that logs would
  // otherwise flood the course page with millions of messages (one DOM line
  // each) and freeze it before the loop guard ever trips.
  const MAX_SHOWN = 1000, MAX_KEPT = 10000;
  const logs = [];
  let emitted = 0;
  function emit(level, args) {
    emitted++;
    if (emitted > MAX_KEPT && emitted > MAX_SHOWN + 1) return;
    const text = args.map(show).join(" ");
    if (logs.length < MAX_KEPT) logs.push(text);
    if (emitted <= MAX_SHOWN) post({ type: "log", level, text });
    else if (emitted === MAX_SHOWN + 1) post({ type: "log", level: "warn", text: `… output truncated after ${MAX_SHOWN} lines` });
  }
  const levels = { log: "log", info: "log", debug: "log", warn: "warn", error: "error", table: "log", dir: "log" };
  // Tee: the course page shows the line, and the browser's own DevTools console
  // still gets the original call (lesson 04 teaches students to use it).
  for (const name in levels) {
    const original = console[name] ? console[name].bind(console) : null;
    console[name] = (...args) => { emit(levels[name], args); if (original) original(...args); };
  }
  console.clear = () => post({ type: "clear" });

  // ── loop guard ──
  // Armed at the first guarded iteration of each task (macrotask); a zero-delay
  // timer disarms it, so the budget is per task. A loop that never yields never
  // lets that timer run, so once the budget is spent every further guarded
  // iteration throws (sticky, so a try/catch inside the loop can't swallow it).
  // The clock is read every iteration; a gap of more than PAUSE_MS between two
  // iterations means execution was paused (a debugger breakpoint), and that
  // time is not charged to the loop.
  // performance.now(), not Date.now(): the wall clock can jump (observed under
  // WSL), which made the guard trip early or never.
  const now = () => performance.now();
  const PAUSE_MS = 250;
  let t0 = 0, last = 0, armed = false, tripped = false;
  G.__jsrGuard = function () {
    const t = now();
    if (!armed) {
      armed = true;
      tripped = false;
      t0 = last = t;
      rawSetTimeout(() => { armed = false; }, 0);
    }
    if (t - last > PAUSE_MS) t0 += t - last;
    last = t;
    if (tripped || t - t0 > cfg.loopBudget) {
      tripped = true;
      throw new RangeError(`A loop ran for more than ${cfg.loopBudget / 1000} s without stopping — possible infinite loop`);
    }
  };

  // ── test helpers available to checks (and demos) as `_t` ──
  const el = sel => {
    const e = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (!e) throw new Error(`No element matches ${sel}`);
    return e;
  };
  G._t = {
    $: sel => document.querySelector(sel),
    $$: sel => [...document.querySelectorAll(sel)],
    el,
    text: sel => el(sel).textContent.trim(),
    value: sel => el(sel).value,
    type(sel, value) {
      const e = el(sel);
      e.value = String(value);
      e.dispatchEvent(new Event("input", { bubbles: true }));
      e.dispatchEvent(new Event("change", { bubbles: true }));
    },
    click: sel => el(sel).click(),
    wait: (ms = 0) => new Promise(r => rawSetTimeout(r, ms)),
    logs: () => logs.slice(),
    clearLogs: () => { logs.length = 0; },
    show,
  };

  // ── check harness ──
  // Each check is an async function; its result (or the error it threw) is
  // posted back canonicalized for comparison plus formatted for display.
  G.__jsrRunChecks = async function (fns) {
    for (let i = 0; i < fns.length; i++) {
      try {
        const v = await fns[i]();
        post({ type: "check", i, ok: true, value: canon(v), shown: showNested(v) });
      } catch (err) {
        post({ type: "check", i, ok: false, error: errText(err) });
      }
    }
  };
  G.__jsrLogs = logs;

  // ── platform shims (each opt-in via cfg) ──

  // localStorage: an opaque-origin frame (and a Worker, and Node) has no usable
  // one, so install an in-memory Storage seeded from cfg.storage.init. Every
  // change is posted out so the course page can persist it across runs.
  if (cfg.storage) {
    const data = Object.assign({}, cfg.storage.init || {});
    const sync = () => post({ type: "storage", data: Object.assign({}, data) });
    const storage = {
      getItem: (k) => (Object.prototype.hasOwnProperty.call(data, String(k)) ? data[String(k)] : null),
      setItem: (k, v) => { data[String(k)] = String(v); sync(); },
      removeItem: (k) => { delete data[String(k)]; sync(); },
      clear: () => { for (const k of Object.keys(data)) delete data[k]; sync(); },
      key: (i) => Object.keys(data)[i] ?? null,
      get length() { return Object.keys(data).length; },
    };
    Object.defineProperty(G, "localStorage", { value: storage, configurable: true, writable: true });
    G._t.storage = () => Object.assign({}, data);
  }

  // Mock network: cfg.mockSrc is the SOURCE of a trusted course function
  // (url, { method, body }) => ({ status?, body?, json?, delay?, error? })
  // that answers every fetch / XMLHttpRequest, so runs are deterministic.
  // `error: "network"` makes the request fail as if offline.
  if (cfg.mockSrc) {
    const server = (0, eval)("(" + cfg.mockSrc + ")");
    const answer = (url, opts) => {
      const r = server(String(url), opts) || { status: 404, body: "not found" };
      const body = r.json !== undefined ? JSON.stringify(r.json) : (r.body ?? "");
      return { status: r.status ?? 200, body: String(body), delay: r.delay ?? 50, error: r.error };
    };
    G.fetch = function (url, init = {}) {
      const r = answer(url, { method: (init.method || "GET").toUpperCase(), body: init.body });
      return new Promise((resolve, reject) => setTimeout(() => {
        if (r.error) return reject(new TypeError("Failed to fetch"));
        resolve({
          ok: r.status >= 200 && r.status < 300, status: r.status, url: String(url),
          statusText: r.status === 200 ? "OK" : String(r.status),
          headers: { get: (h) => (String(h).toLowerCase() === "content-type" ? "application/json" : null) },
          text: () => Promise.resolve(r.body),
          json: () => new Promise((res, rej) => { try { res(JSON.parse(r.body)); } catch (e) { rej(e); } }),
        });
      }, r.delay));
    };
    G.XMLHttpRequest = class {
      constructor() {
        this.readyState = 0; this.status = 0; this.responseText = ""; this.response = "";
        this.timeout = 0; this._handlers = {};
      }
      addEventListener(type, fn) { (this._handlers[type] ||= []).push(fn); }
      removeEventListener(type, fn) { this._handlers[type] = (this._handlers[type] || []).filter(f => f !== fn); }
      setRequestHeader() {}
      getResponseHeader(h) { return String(h).toLowerCase() === "content-type" ? "application/json" : null; }
      open(method, url) { this._method = String(method).toUpperCase(); this._url = url; this.readyState = 1; this._fire("readystatechange"); }
      abort() { this._aborted = true; }
      _fire(type) {
        const ev = { type, target: this, currentTarget: this };
        if (typeof this["on" + type] === "function") this["on" + type](ev);
        for (const fn of this._handlers[type] || []) fn.call(this, ev);
      }
      send(body) {
        const r = answer(this._url, { method: this._method, body });
        const timedOut = this.timeout > 0 && r.delay > this.timeout;
        setTimeout(() => {
          if (this._aborted) return;
          if (timedOut) { this.readyState = 4; this._fire("readystatechange"); this._fire("timeout"); this._fire("loadend"); return; }
          if (r.error) { this.readyState = 4; this._fire("readystatechange"); this._fire("error"); this._fire("loadend"); return; }
          this.status = r.status; this.responseText = r.body; this.response = r.body; this.readyState = 4;
          this._fire("readystatechange"); this._fire("load"); this._fire("loadend");
        }, timedOut ? this.timeout : r.delay);
      }
    };
  }

  // Node.js: a tiny `require` with simulated http and url modules. A server's
  // handler is driven by `_t.request(path, { method })` instead of a socket.
  if (cfg.node) {
    let handler = null;
    const http = {
      createServer(fn) {
        handler = fn;
        return {
          listen(port, host, cb) {
            const done = typeof host === "function" ? host : cb;
            if (done) setTimeout(done, 0);
            return this;
          },
          close(cb) { if (cb) cb(); },
        };
      },
    };
    const url = {
      parse(str, parseQuery) {
        const u = new URL(str, "http://localhost");
        const query = parseQuery ? Object.fromEntries(u.searchParams) : u.search.slice(1);
        return { pathname: u.pathname, search: u.search, query, path: u.pathname + u.search, href: u.pathname + u.search };
      },
    };
    const modules = { http, url, "node:http": http, "node:url": url };
    G.require = (name) => {
      if (!(name in modules)) throw new Error(`Cannot find module '${name}' (this page simulates only http and url)`);
      return modules[name];
    };
    G.process = { argv: ["node", "script.js"], env: {}, version: "v20-simulated" };
    G._t.request = (path, { method = "GET", headers = {} } = {}) => new Promise((resolve, reject) => {
      headers = { host: "127.0.0.1:3000", ...headers };
      if (!handler) return reject(new Error("no server: call http.createServer(handler)"));
      const resHeaders = {};
      let body = "";
      const res = {
        statusCode: 200,
        setHeader(k, v) { resHeaders[String(k).toLowerCase()] = v; },
        getHeader(k) { return resHeaders[String(k).toLowerCase()]; },
        writeHead(code, hs = {}) { this.statusCode = code; for (const k in hs) this.setHeader(k, hs[k]); return this; },
        write(chunk) { body += chunk; },
        end(chunk = "") { body += chunk; resolve({ status: this.statusCode, type: resHeaders["content-type"] ?? null, body }); },
      };
      try { handler({ url: path, method, headers }, res); } catch (e) { reject(e); }
    });
  }

  // ── idle tracking ──
  // A Worker run ends when the program goes idle: no pending setTimeout and no
  // request in flight (mocked requests are timers too). Without this, a Worker
  // example would be terminated before its async callbacks ever ran.
  // setInterval is not tracked (an uncleared interval would never be idle).
  let pending = 0;
  let idleWaiters = [];
  const settle = () => {
    if (pending === 0 && idleWaiters.length) {
      rawSetTimeout(() => {
        if (pending !== 0) return;
        const ws = idleWaiters;
        idleWaiters = [];
        ws.forEach(r => r());
      }, 0);
    }
  };
  const rawClearTimeout = G.clearTimeout.bind(G);
  const live = new Set();
  G.setTimeout = function (fn, ms, ...args) {
    pending++;
    const id = rawSetTimeout(() => {
      if (live.delete(id)) pending--;
      try { if (typeof fn === "function") fn(...args); } finally { settle(); }
    }, ms);
    live.add(id);
    return id;
  };
  G.clearTimeout = function (id) {
    if (live.delete(id)) { pending--; settle(); }
    rawClearTimeout(id);
  };
  if (typeof G.fetch === "function") {
    const innerFetch = G.fetch;
    G.fetch = function (...args) {
      pending++;
      const p = innerFetch.apply(this, args);
      p.then(() => {}, () => {}).finally(() => { pending--; settle(); });
      return p;
    };
  }
  if (typeof G.XMLHttpRequest === "function") {
    const Inner = G.XMLHttpRequest;
    G.XMLHttpRequest = class extends Inner {
      send(...args) {
        pending++;
        this.addEventListener("loadend", () => rawSetTimeout(() => { pending--; settle(); }, 0));
        return super.send(...args);
      }
    };
  }
  G.__jsrIdle = () => new Promise(r => { idleWaiters.push(r); settle(); });
}

/**
 * Build the JS source that evaluates `checks` inside a sandbox. A check is
 * `{ expr }` (an expression, e.g. "cToF(100)") or `{ run }` (an async function
 * body ending in `return …`). `_t` helpers are in scope. Checks are trusted
 * course code; they run after the learner's program in the same global scope.
 * @param {Array<{expr?:string, run?:string}>} checks
 * @returns {string}
 */
export function checksSource(checks) {
  const fns = checks.map(c => (c.expr != null
    ? `async () => (${c.expr}\n)`
    : `async () => {${c.run}\n}`));
  return `__jsrRunChecks([${fns.join(",\n")}])`;
}

// ─────────────────────────── RESULT COMPARISON ──────────────────────────────

const REL_EPS = 1e-9;

function numEq(a, b) {
  if (typeof a === "string" || typeof b === "string") return a === b;
  return a === b || Math.abs(a - b) <= REL_EPS * Math.max(1, Math.abs(a), Math.abs(b));
}

/**
 * Structurally compare two canon() trees produced inside a sandbox.
 * Numbers compare with a small relative tolerance; object keys are sorted.
 * @returns {boolean}
 */
export function sameValue(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  const ka = Object.keys(a)[0], kb = Object.keys(b)[0];
  if (ka !== kb) return false;
  const x = a[ka], y = b[kb];
  switch (ka) {
    case "n": return numEq(x, y);
    case "a": case "s": return x.length === y.length && x.every((v, i) => sameValue(v, y[i]));
    case "m": case "o":
      return x.length === y.length && x.every(([k, v], i) =>
        (ka === "o" ? k === y[i][0] : sameValue(k, y[i][0])) && sameValue(v, y[i][1]));
    default: return x === y;
  }
}

// ─────────────────────────── WORKER RUNNER ──────────────────────────────────

function workerScript(cfg) {
  return `(${sandboxPrelude})(${JSON.stringify(cfg)}, m => postMessage(m));
onmessage = async (e) => {
  const { codeUrl, checks } = e.data;
  self.__jsrCodeUrl = codeUrl;
  try { importScripts(codeUrl); }
  catch (err) { postMessage({ type: "error", text: __jsrErrText(err) }); }
  if (self.__jsrMain) {
    try { await self.__jsrMain; }
    catch (err) { postMessage({ type: "error", text: __jsrErrText(err) }); }
  }
  await __jsrIdle();
  postMessage({ type: "ran" });
  if (checks) await (0, eval)(checks);
  postMessage({ type: "done" });
};
self.addEventListener("unhandledrejection", (e) => {
  postMessage({ type: "error", text: __jsrErrText(e.reason) });
});`;
}

function runWorker(code, checksSrc, { timeout, loopBudget, onMessage, platform }) {
  return new Promise((resolve) => {
    const scriptUrl = URL.createObjectURL(new Blob([workerScript({ loopBudget, lineOffset: 0, ...platform })], { type: "text/javascript" }));
    const codeUrl = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
    const worker = new Worker(scriptUrl);
    let done = false;
    const finish = (timedOut) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(scriptUrl);
      URL.revokeObjectURL(codeUrl);
      resolve({ timedOut });
    };
    const timer = setTimeout(() => finish(true), timeout);
    worker.onmessage = (e) => {
      if (e.data.type === "done") finish(false);
      else onMessage(e.data);
    };
    worker.onerror = (e) => {
      e.preventDefault();
      onMessage({ type: "error", text: e.message || "Worker error" });
    };
    worker.postMessage({ codeUrl, checks: checksSrc });
  });
}

// ─────────────────────────── FRAME RUNNER ───────────────────────────────────

const FRAME_CSS = `body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  margin:0;padding:.75rem 1rem;color:#1a1a1a;background:#fff;line-height:1.5;font-size:15px}
input,button,select,textarea{font:inherit;font-size:.95rem}
input,select,textarea{padding:.25rem .4rem;border:1px solid #c5ccd4;border-radius:4px}
button{padding:.3rem .75rem;border:1px solid #b6bdc6;border-radius:5px;background:#f6f8fa;cursor:pointer}
button:hover{background:#eef1f5}`;

// Libraries a frame cell may request with `libs: ["react"]`, loaded before the
// learner's script. Pinned versions; tools/node-runner.js loads the same
// versions from node_modules (React 18 is the last major with UMD builds).
export const LIBS = {
  react: [
    "https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.development.js",
    "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.development.js",
  ],
};

const BABEL_URL = "https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.7/babel.min.js";
let babelPromise = null;

// @babel/standalone is a UMD script that defines a global `Babel`.
function loadBabel() {
  if (!babelPromise) {
    const inNode = typeof window === "undefined" && typeof process !== "undefined";
    babelPromise = inNode
      ? import("@babel/standalone").then(m => m.default || m)
      : new Promise((resolve, reject) => {
        if (globalThis.Babel) return resolve(globalThis.Babel);
        const tag = document.createElement("script");
        tag.src = BABEL_URL;
        tag.onload = () => resolve(globalThis.Babel);
        tag.onerror = () => reject(new Error("could not load Babel (needed for JSX)"));
        document.head.appendChild(tag);
      });
  }
  return babelPromise;
}

/**
 * Turn JSX into plain JavaScript, keeping line numbers (retainLines) so error
 * messages still point at the learner's lines.
 * @param {string} src
 * @returns {Promise<string>}
 */
export async function transformJsx(src) {
  const Babel = await loadBabel();
  try {
    return Babel.transform(src, { presets: ["react"], retainLines: true, sourceType: "script" }).code;
  } catch (err) {
    throw new SyntaxError(err.message.replace(/^unknown: /, ""));
  }
}

/**
 * Translate runCode's platform options into the sandbox prelude's cfg.
 * Exported for tools/node-runner.js so both sides agree.
 */
export function platformConfig({ mock = null, live = false, storage = null, node = false } = {}) {
  const cfg = {};
  if (mock && !live) cfg.mockSrc = typeof mock === "function" ? mock.toString() : String(mock);
  if (storage) cfg.storage = { init: storage === true ? {} : storage };
  if (node) cfg.node = true;
  return cfg;
}

let nonceCounter = 0;

// The frame's document. The learner's program is one inline <script> whose
// first line number we know (lineOffset), so error events map back to the
// editor's line numbers. `</script` inside the program is escaped.
function frameDoc(code, html, cfg, nonce, libs = []) {
  const head =
    `<!doctype html><html><head><meta charset="utf-8"><style>${FRAME_CSS}</style>\n` +
    `<script>(${sandboxPrelude})(${JSON.stringify(cfg)}, m => parent.postMessage(Object.assign({ __jsr: ${JSON.stringify(nonce)} }, m), "*"));\n` +
    `globalThis.__jsrCodeUrl = "about:srcdoc";\n` +
    `addEventListener("error", e => parent.postMessage({ __jsr: ${JSON.stringify(nonce)}, type: "error", text: __jsrErrText(e.error ?? e.message, e.lineno) }, "*"));\n` +
    `addEventListener("unhandledrejection", e => parent.postMessage({ __jsr: ${JSON.stringify(nonce)}, type: "error", text: __jsrErrText(e.reason) }, "*"));\n` +
    `addEventListener("message", async e => {\n` +
    `  if (e.source !== parent || !e.data || e.data.__jsr !== ${JSON.stringify(nonce)}) return;\n` +
    `  await (0, eval)(e.data.checks);\n` +
    `  parent.postMessage({ __jsr: ${JSON.stringify(nonce)}, type: "done" }, "*");\n` +
    `});\n` +
    `addEventListener("DOMContentLoaded", () => new ResizeObserver(() => parent.postMessage({ __jsr: ${JSON.stringify(nonce)}, type: "height", h: Math.ceil(document.body.getBoundingClientRect().bottom) + 2 }, "*")).observe(document.body));\n` +
    `</script>\n` +
    libs.map(name => LIBS[name].map(url => `<script src="${url}"></script>\n`).join("")).join("") +
    `</head><body>\n${html}\n`;
  const lineOffset = head.split("\n").length - 1;
  const doc = head +
    `<script>${code.replace(/<\/script/gi, "<\\/script")}\n</script>\n` +
    `<script>addEventListener("load", async () => {\n` +
    `  if (globalThis.__jsrMain) { try { await globalThis.__jsrMain; } catch (err) { parent.postMessage({ __jsr: ${JSON.stringify(nonce)}, type: "error", text: __jsrErrText(err) }, "*"); } }\n` +
    `  setTimeout(() => parent.postMessage({ __jsr: ${JSON.stringify(nonce)}, type: "ran" }, "*"), 0);\n` +
    `});</script></body></html>`;
  return { doc, lineOffset };
}

function runFrame(code, checksSrc, { html, timeout, loopBudget, onMessage, mount, keep, height, platform, libs }) {
  return new Promise((resolve) => {
    const nonce = `jsr-${Date.now()}-${++nonceCounter}`;
    // lineOffset is computed after the head is built; the prelude reads it from
    // cfg, so build once to measure, then again with the measured offset.
    const probe = frameDoc(code, html, { loopBudget, lineOffset: 0, ...platform }, nonce, libs);
    const { doc } = frameDoc(code, html, { loopBudget, lineOffset: probe.lineOffset, ...platform }, nonce, libs);
    const frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-scripts");
    frame.className = "jsr-frame";
    frame.title = "Program output page";
    if (height) frame.style.height = height + "px";
    const hidden = !mount;
    if (hidden) frame.style.cssText = "position:absolute;left:-9999px;top:0;width:600px;height:400px;";
    let done = false, ranSeen = false;
    const finish = (timedOut) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (timedOut || !keep) window.removeEventListener("message", listener);
      if (timedOut || !keep) {
        if (timedOut && keep) frame.replaceWith(Object.assign(document.createElement("div"),
          { className: "err", textContent: "The page was stopped because it stopped responding." }));
        else frame.remove();
      }
      resolve({ timedOut, frame: keep && !timedOut ? frame : null });
    };
    const listener = (e) => {
      const m = e.data;
      if (e.source !== frame.contentWindow || !m || m.__jsr !== nonce) return;
      if (m.type === "height") {
        if (!height) frame.style.height = Math.min(Math.max(m.h, 60), 900) + "px";
      } else if (m.type === "ran") {
        if (ranSeen) return;
        ranSeen = true;
        if (checksSrc) frame.contentWindow.postMessage({ __jsr: nonce, checks: checksSrc }, "*");
        else finish(false);
      } else if (m.type === "done") {
        finish(false);
      } else {
        onMessage(m);
      }
    };
    window.addEventListener("message", listener);
    const timer = setTimeout(() => finish(true), timeout);
    // Insert first, then load: a frame given its document before it's in the
    // page parses with no layout (innerWidth 0, innerText == textContent).
    // A hidden (grading) frame is appended so concurrent runs don't evict each
    // other; a visible one replaces whatever was in its slot.
    if (hidden) document.body.appendChild(frame);
    else mount.replaceChildren(frame);
    frame.srcdoc = doc;
    // A kept frame keeps its listener so logs from later clicks still arrive;
    // disposeFrame() removes both.
    frame._jsrListener = listener;
  });
}

/**
 * Remove a kept frame and stop listening for its messages.
 * @param {HTMLIFrameElement|null} frame
 */
export function disposeFrame(frame) {
  if (!frame) return;
  if (frame._jsrListener) window.removeEventListener("message", frame._jsrListener);
  frame.remove();
}

// ─────────────────────────── MAIN API ───────────────────────────────────────

/**
 * Run a program and (optionally) evaluate checks against it.
 *
 * Errors are soft: syntax errors, thrown errors and runaway loops are reported
 * in the result, never thrown, and logs captured before a failure are kept.
 *
 * @param {string} src                              the program source
 * @param {Object} [opts]
 * @param {"worker"|"frame"} [opts.runner="worker"]
 * @param {string}   [opts.html=""]                 frame only: body HTML the program works on
 * @param {Array}    [opts.checks=[]]               see checksSource()
 * @param {number}   [opts.timeout=4000]            ms before the run is abandoned
 * @param {number}   [opts.loopBudget=1500]         ms one task's loops may run
 * @param {Element}  [opts.mount]                   frame only: where the visible frame goes
 * @param {boolean}  [opts.keep=false]              frame only: leave it live afterwards
 * @param {number}   [opts.height]                  frame only: fixed height (px)
 * @param {Function|string} [opts.mock]          course mock server for fetch/XHR (see sandboxPrelude)
 * @param {boolean}  [opts.live=false]           ignore `mock` and use the real network
 * @param {Object|boolean} [opts.storage]        install a localStorage shim seeded with this object
 * @param {(data:Object) => void} [opts.onStorage] called with the shim's contents after each change
 * @param {boolean}  [opts.node=false]           worker only: simulated require("http"/"url") + _t.request
 * @param {boolean}  [opts.jsx=false]            transpile JSX with Babel first
 * @param {string[]} [opts.libs=[]]              frame only: libraries from LIBS, e.g. ["react"]
 * @param {(entry:{level:string,text:string}) => void} [opts.onLog]  streamed console lines;
 *   level is "log" | "warn" | "error" (console calls), "exception" (thrown
 *   errors, syntax errors, guard trips, timeouts), or "clear"
 * @returns {Promise<{logs:Array, errors:string[], checks:Array, timedOut:boolean, frame:HTMLIFrameElement|null}>}
 */
export async function runCode(src, {
  runner = "worker", html = "", checks = [], timeout = 4000, loopBudget = 1500,
  mount = null, keep = false, height = null, onLog = () => {},
  mock = null, live = false, storage = null, onStorage = () => {}, node = false, jsx = false, libs = [],
} = {}) {
  const result = { logs: [], errors: [], checks: checks.map(() => null), timedOut: false, frame: null };
  let prepared;
  try {
    prepared = await prepare(jsx ? await transformJsx(src) : src);
  } catch (err) {
    const text = `SyntaxError: ${err.message}`;
    result.errors.push(text);
    onLog({ level: "exception", text });
    return result;
  }
  const onMessage = (m) => {
    if (m.type === "log") {
      const entry = { level: m.level, text: m.text };
      result.logs.push(entry);
      onLog(entry);
    } else if (m.type === "clear") {
      onLog({ level: "clear", text: "" });
    } else if (m.type === "error") {
      result.errors.push(m.text);
      onLog({ level: "exception", text: m.text });
    } else if (m.type === "storage") {
      onStorage(m.data);
    } else if (m.type === "check") {
      result.checks[m.i] = m.ok ? { ok: true, value: m.value, shown: m.shown } : { ok: false, error: m.error };
    }
  };
  const checksSrc = checks.length ? checksSource(checks) : null;
  const platform = platformConfig({ mock, live, storage, node });
  const opts = { html, timeout, loopBudget, onMessage, mount, keep, height, platform, libs };
  const { timedOut, frame } = runner === "frame"
    ? await runFrame(prepared.code, checksSrc, opts)
    : await runWorker(prepared.code, checksSrc, opts);
  result.timedOut = timedOut;
  result.frame = frame || null;
  if (timedOut) {
    const msg = `Stopped after ${timeout / 1000} s — the program never finished (possible infinite loop)`;
    result.errors.push(msg);
    onLog({ level: "exception", text: msg });
  }
  return result;
}

/**
 * Grade a learner's run against a reference run, check by check.
 * A check may carry `expect` (a canon() tree is built here from a plain JSON
 * value) instead of relying on the solution. `logs: true` on the grading call
 * additionally requires the console output to match the solution's.
 *
 * @param {Object} mine     runCode() result for the learner
 * @param {Object|null} ref runCode() result for the solution (may be null)
 * @param {Array} checks
 * @param {{logs?:boolean}} [opts]
 * @returns {{passed:boolean, items:Array<{label:string, ok:boolean, got:string, want:string}>}}
 */
export function grade(mine, ref, checks, { logs = false } = {}) {
  const items = checks.map((c, i) => {
    const got = mine.checks[i];
    const want = ref ? ref.checks[i] : null;
    const label = c.label || c.expr || `check ${i + 1}`;
    const gotText = !got ? "(did not run)" : got.ok ? got.shown : got.error;
    const wantText = !want ? "" : want.ok ? want.shown : want.error;
    let ok = false;
    if (got && got.ok && want && want.ok) ok = sameValue(got.value, want.value);
    else if (got && !got.ok && want && !want.ok && c.expectError) ok = true;
    return { label, ok, got: gotText, want: wantText };
  });
  if (logs) {
    const g = mine.logs.map(l => l.text).join("\n");
    const w = ref ? ref.logs.map(l => l.text).join("\n") : "";
    items.push({ label: "console output", ok: g === w, got: g || "(nothing)", want: w || "(nothing)" });
  }
  const passed = items.length > 0 && items.every(i => i.ok) && !mine.timedOut;
  return { passed, items };
}

// ─────────────────────────── SOLUTION SEALING ───────────────────────────────
// Light reversible cipher so a lab page can embed its solution without shipping
// readable plaintext. OBFUSCATION, not security: the grade of record is the
// teacher's CLI re-grade (tools/grade.js). Same scheme as stanfordkarel.js.

const SOLUTION_KEY = "csc227-js-sealed-v1";

function bytesToB64(bytes) {
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function b64ToBytes(b64) {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(b64, "base64"));
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function xorBytes(bytes, key) {
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key.charCodeAt(i % key.length);
  return out;
}

/**
 * Reversibly obfuscate solution source. NOT encryption — see the section note.
 * @param {string} src
 * @returns {string} base64 ciphertext
 */
export function sealSolution(src) {
  return bytesToB64(xorBytes(new TextEncoder().encode(src), SOLUTION_KEY));
}

/**
 * Recover solution source sealed by sealSolution.
 * @param {string} cipher
 * @returns {string}
 */
export function unsealSolution(cipher) {
  return new TextDecoder().decode(xorBytes(b64ToBytes(cipher), SOLUTION_KEY));
}
