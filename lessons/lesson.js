import { runCode, grade, disposeFrame } from "../jsrunner.js";
import { backupCode, registerSlot, installRecoveryTools, pageSlug } from "../code-backup.js";

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const KEYWORDS = /\b(function|for|while|do|if|else|let|const|var|return|true|false|null|undefined|new|typeof|instanceof|in|of|class|this|try|catch|finally|throw|async|await|break|continue|switch|case|default|delete|import|export|from)\b/g;

/**
 * Lightweight JavaScript highlighter: comments and strings first (so keywords
 * inside them stay plain), then keywords and numbers in the remaining code.
 * @param {string} src
 * @returns {string} HTML
 */
export function highlight(src) {
  return src.split(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:\\[\s\S]|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/g).map((p, i) => {
    if (i % 2 === 1) return `<span class="${p.startsWith("/") ? "cm" : "st"}">${esc(p)}</span>`;
    let h = esc(p);
    h = h.replace(KEYWORDS, '<span class="kw">$1</span>');
    h = h.replace(/\b(\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b/gi, '<span class="nm">$1</span>');
    return h;
  }).join("");
}

export function dedent(s) {
  const lines = s.replace(/^\n+/, "").replace(/\s+$/, "").split("\n");
  const widths = lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length);
  const min = widths.length ? Math.min(...widths) : 0;
  return lines.map(l => l.slice(min)).join("\n");
}

/**
 * Highlight HTML source: tags, attribute names, and quoted attribute values.
 * @param {string} src
 * @returns {string} HTML
 */
export function highlightHtml(src) {
  return src.split(/(<!--[\s\S]*?-->|<[^>]*>)/g).map((p, i) => {
    if (i % 2 === 0) return esc(p);
    if (p.startsWith("<!--")) return `<span class="cm">${esc(p)}</span>`;
    const m = p.match(/^<(\/?)([\w-]*)([\s\S]*?)(\/?)>$/);
    if (!m) return esc(p);
    const attrs = esc(m[3]).replace(/([\w-]+)(=)(&quot;[^&]*?&quot;|"[^"]*"|'[^']*'|[^\s]+)?/g,
      (_, name, eq, val = "") => `<span class="at">${name}</span>${eq}<span class="av">${val}</span>`);
    return `<span class="tg">&lt;${m[1]}${m[2]}</span>${attrs}<span class="tg">${m[4]}&gt;</span>`;
  }).join("");
}

// The read-only "Page HTML" panel shown above the JavaScript editor of any
// cell that runs in a frame, so the ids and onclick="…" attributes the code
// relies on are visible next to it.
function htmlView(html) {
  return `<div class="panel-label">Page HTML</div>` +
    `<pre class="code html-view"><code>${highlightHtml(dedent(html))}</code></pre>`;
}

// ─────────────────────────── EDITOR ─────────────────────────────────────────
// A textarea layered exactly over a highlighted <pre>: the textarea's text is
// transparent (only its caret and selection show), the <pre> underneath shows
// the colors. Both share font metrics, padding, and horizontal scroll.

function spliceText(ta, from, to, text, caret = from + text.length) {
  ta.setSelectionRange(from, to);
  let ok = false;
  try {
    ok = text === "" ? document.execCommand("delete") : document.execCommand("insertText", false, text);
  } catch { ok = false; }
  if (!ok) {
    ta.value = ta.value.slice(0, from) + text + ta.value.slice(to);
    ta.dispatchEvent(new Event("input"));
  }
  ta.setSelectionRange(caret, caret);
}

// Tab inserts two spaces (Shift+Tab removes them), Enter carries the current
// indent (two deeper after an opening bracket), `}` on a blank line dedents,
// and Ctrl/Cmd+Enter runs.
function handleEditorKeys(e, run) {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    run();
    return;
  }
  if (e.key !== "Tab" && e.key !== "Enter" && e.key !== "}") return;
  const ta = e.target;
  const start = ta.selectionStart, end = ta.selectionEnd;
  const lineStart = ta.value.lastIndexOf("\n", start - 1) + 1;
  const indent = ta.value.slice(lineStart, start).match(/^[ \t]*/)[0];

  if (e.key === "Tab") {
    e.preventDefault();
    if (!e.shiftKey) return spliceText(ta, start, end, "  ");
    const lead = ta.value.slice(lineStart).match(/^ {1,2}/);
    if (lead) spliceText(ta, lineStart, lineStart + lead[0].length, "", Math.max(lineStart, start - lead[0].length));
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    const opens = /[{([]$/.test(ta.value.slice(lineStart, start).trimEnd());
    const inner = indent + (opens ? "  " : "");
    if (opens && /^[ \t]*[}\])]/.test(ta.value.slice(end))) {
      spliceText(ta, start, end, "\n" + inner + "\n" + indent, start + 1 + inner.length);
    } else {
      spliceText(ta, start, end, "\n" + inner);
    }
    return;
  }
  if (start === end && /^ +$/.test(indent) && indent.length === start - lineStart && indent.length >= 2) {
    e.preventDefault();
    spliceText(ta, start - 2, end, "}");
  }
}

/**
 * Create a highlighted code editor.
 * @param {string} initial
 * @param {{onRun?:Function, onChange?:Function, label?:string}} [opts]
 * @returns {{root:HTMLElement, textarea:HTMLTextAreaElement, get:()=>string, set:(s:string)=>void}}
 */
export function makeEditor(initial, { onRun = () => {}, onChange = () => {}, label = "Code editor" } = {}) {
  const root = document.createElement("div");
  root.className = "ed";
  root.innerHTML =
    `<pre class="ed-hl" aria-hidden="true"><code></code></pre>` +
    `<textarea class="ed-ta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off"></textarea>`;
  const pre = root.querySelector(".ed-hl");
  const code = pre.querySelector("code");
  const ta = root.querySelector(".ed-ta");
  ta.setAttribute("aria-label", label);
  const paint = () => {
    // A trailing newline needs a visible character or the <pre> collapses it.
    code.innerHTML = highlight(ta.value) + (ta.value.endsWith("\n") || !ta.value ? " " : "");
  };
  ta.value = initial;
  paint();
  ta.addEventListener("input", () => { paint(); onChange(ta.value); });
  ta.addEventListener("scroll", () => { pre.scrollLeft = ta.scrollLeft; pre.scrollTop = ta.scrollTop; });
  ta.addEventListener("keydown", e => handleEditorKeys(e, onRun));
  return {
    root, textarea: ta,
    get: () => ta.value,
    set: (s) => { ta.value = s; paint(); onChange(s); },
  };
}

// ─────────────────────────── OUTPUT PANELS ──────────────────────────────────

function makeConsole() {
  const box = document.createElement("div");
  box.className = "console";
  box.setAttribute("role", "log");
  let empty = true;
  const placeholder = () => {
    box.innerHTML = `<div class="con-empty">(no console output)</div>`;
    empty = true;
  };
  placeholder();
  return {
    root: box,
    reset: () => { box.innerHTML = `<div class="con-empty">Running…</div>`; empty = true; },
    finish: () => { if (empty) placeholder(); },
    add({ level, text }) {
      if (level === "clear") { box.replaceChildren(); return; }
      if (empty) { box.replaceChildren(); empty = false; }
      const line = document.createElement("div");
      line.className = "con-line con-" + level;
      line.textContent = text;
      box.appendChild(line);
      box.scrollTop = box.scrollHeight;
    },
  };
}

// ─────────────────────────── PERSISTENCE ────────────────────────────────────
// Editors autosave (`js227-lesson:<slug>:ex<n>|ch<n>`, `js227-lab:<id>:<key>`) so a reload doesn't lose work. The
// Reset/Restore buttons additionally snapshot to code-backup.js before erasing.

const SAVE_PREFIX = "js227-";
function loadSaved(key) {
  try { return localStorage.getItem(SAVE_PREFIX + key); } catch { return null; }
}
function saveLater(key) {
  let t = null;
  return (value) => {
    clearTimeout(t);
    t = setTimeout(() => { try { localStorage.setItem(SAVE_PREFIX + key, value); } catch { /* storage off */ } }, 300);
  };
}

// Inline "this will erase your code" confirmation (Karel course pattern).
function resetConfirm(wrap, btn, onConfirm, what = "Resetting replaces everything in the editor with the starter code.") {
  const box = document.createElement("div");
  box.className = "reset-confirm";
  box.setAttribute("role", "alertdialog");
  box.hidden = true;
  box.innerHTML =
    `<p class="reset-warn"><strong>⚠ This will erase your code.</strong> ${what} This cannot be undone.</p>` +
    `<div class="reset-actions"><button type="button" class="reset-yes">Erase my code</button>` +
    `<button type="button" class="reset-no">Cancel</button></div>`;
  const close = () => { box.hidden = true; btn.setAttribute("aria-expanded", "false"); };
  btn.setAttribute("aria-expanded", "false");
  btn.addEventListener("click", () => {
    if (box.hidden) {
      box.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      box.querySelector(".reset-no").focus();
    } else close();
  });
  box.querySelector(".reset-no").addEventListener("click", close);
  box.querySelector(".reset-yes").addEventListener("click", () => { close(); onConfirm(); });
  wrap.appendChild(box);
  return box;
}

// ─────────────────────────── CHALLENGE CARD ─────────────────────────────────

const RUN_DEFAULTS = { timeout: 4000, loopBudget: 1500 };

function runnerFor(cell) {
  return cell.runner || (cell.html != null ? "frame" : "worker");
}

function frameOpts(cell) {
  return { runner: runnerFor(cell), html: cell.html || "", height: cell.height,
    timeout: cell.timeout || RUN_DEFAULTS.timeout, loopBudget: cell.loopBudget || RUN_DEFAULTS.loopBudget,
    mock: cell.mock || null, storage: cell.storage || null, node: !!cell.node, jsx: !!cell.jsx, libs: cell.libs || [] };
}

// Simulated Node requests an example lists in `requests` (paths, or
// { path, method }), run after the program and printed to its console.
function requestChecks(cell) {
  return (cell.requests || []).map(r => {
    const { path, method = "GET" } = typeof r === "string" ? { path: r } : r;
    return { label: method + " " + path,
      run: `const r = await _t.request(${JSON.stringify(path)}, { method: ${JSON.stringify(method)} });` +
        "return r.status + (r.type ? ' ' + r.type : '') + '\\n' + r.body;" };
  });
}

/**
 * Build one challenge card (used by lessons and by labs/lab.js) and append it
 * to `mount`. `cell` is the challenge shape documented on renderNotebook, with
 * `solution` as plaintext source. Returns the editor so a lab can collect code.
 * @param {Object} cell
 * @param {{mount:HTMLElement, badge:string, saveKey:string, scope:string, label:string,
 *          onGraded?:(passed:boolean, result:Object)=>void}} opts
 * @returns {{root:HTMLElement, editor:Object, run:Function}}
 */
export function createChallenge(cell, { mount, badge, saveKey, scope, label, onGraded = () => {} }) {
  const stub = cell.starter != null ? dedent(cell.starter) + "\n" : "// your code here\n";
  const checks = cell.checks || [];
  const isFrame = runnerFor(cell) === "frame";
  const wrap = document.createElement("div");
  wrap.className = "challenge";
  wrap.innerHTML =
    `<div class="chal-head"><span class="chal-badge">${badge}</span>` +
    `<div class="chal-prompt">${cell.title ? `<strong>${cell.title}.</strong> ` : ""}${cell.prompt || ""}</div></div>` +
    `<div class="chal-body">` +
      (cell.hint ? `<details class="hint"><summary>Hint</summary><div>${cell.hint}</div></details>` : "") +
      (isFrame && cell.html ? htmlView(cell.html) + `<div class="panel-label">Your JavaScript</div>` : `<div class="panel-label">Your code</div>`) +
        `<div class="ed-slot"></div>` +
      `<div class="controls"><button type="button" class="run-btn">▶ Run &amp; check</button>` +
      `<button type="button" class="reset-btn" title="Restore the starter code">Reset</button>` +
      `<span class="verdict"></span></div>` +
      `<div class="chal-out">` +
        `<div><div class="panel-label">Console</div><div class="con-slot"></div>` +
        (isFrame ? `<div class="panel-label">Page</div><div class="page-slot"></div>` : "") +
        `</div>` +
        `<div><div class="panel-label">Tests</div><ul class="tests"></ul></div>` +
      `</div>` +
    `</div>`;
  mount.appendChild(wrap);

  const con = makeConsole();
  wrap.querySelector(".con-slot").replaceWith(con.root);
  const pageSlot = wrap.querySelector(".page-slot");
  const runBtn = wrap.querySelector(".run-btn");
  const verdict = wrap.querySelector(".verdict");
  const tests = wrap.querySelector(".tests");
  const save = saveLater(saveKey);
  const editor = makeEditor(loadSaved(saveKey) ?? stub, { onRun: () => run(), onChange: save, label: `${badge} code` });
  wrap.querySelector(".ed-slot").replaceWith(editor.root);
  const controls = wrap.querySelector(".controls");
  resetConfirm(controls.parentNode, wrap.querySelector(".reset-btn"), () => {
    backupCode(scope, editor.get(), { stub, label });
    editor.set(stub);
    editor.textarea.focus();
  });
  controls.after(controls.parentNode.querySelector(".reset-confirm"));
  registerSlot(scope, { label, editor: editor.textarea, save: () => editor.set(editor.textarea.value) });

  const testLabels = checks.map((c, i) => c.label || c.expr || `test ${i + 1}`);
  if (cell.logs) testLabels.push("console output matches");
  const paintTests = (items) => {
    tests.innerHTML = testLabels.map((lbl, i) => {
      const it = items && items[i];
      const mark = !it ? "○" : it.ok ? "✓" : "✗";
      const cls = !it ? "" : it.ok ? "ok" : "no";
      const detail = it && !it.ok
        ? `<div class="t-detail"><span>got</span> <code>${esc(it.got)}</code><br><span>expected</span> <code>${esc(it.want)}</code></div>`
        : "";
      return `<li class="${cls}"><span class="t-mark">${mark}</span><code>${esc(lbl)}</code>${detail}</li>`;
    }).join("") || `<li class="muted">No automatic tests — compare your output with the prompt.</li>`;
  };
  paintTests(null);

  // The reference run never changes, so compute it once on first use.
  let refPromise = null;
  const reference = () => refPromise ||= runCode(cell.solution, { ...frameOpts(cell), checks });

  // Show the page the challenge works on before any code has run.
  let frame = null;
  if (isFrame) runCode("", { ...frameOpts(cell), mount: pageSlot, keep: true }).then(r => { frame = r.frame; });

  async function run() {
    runBtn.disabled = true;
    verdict.className = "verdict";
    verdict.textContent = "Checking…";
    con.reset();
    disposeFrame(frame);
    const src = editor.get();
    // Visible run (console + live page the reader can interact with), then a
    // separate hidden run that the checks poke at, so tests never disturb
    // what the reader sees.
    const shown = await runCode(src, { ...frameOpts(cell), mount: pageSlot, keep: isFrame, onLog: con.add });
    frame = shown.frame;
    con.finish();
    const [mine, ref] = await Promise.all([runCode(src, { ...frameOpts(cell), checks }), reference()]);
    const g = grade(mine, ref, checks, { logs: !!cell.logs });
    paintTests(g.items);
    if (ref.errors.length) console.warn(`[lesson] solution for ${label} reported errors:`, ref.errors);
    verdict.className = "verdict " + (g.passed ? "ok" : "no");
    verdict.textContent = g.passed ? "✓ All tests pass!" :
      shown.errors.length ? "✗ Your code hit an error — see the console." : "✗ Not yet — see the tests below.";
    runBtn.disabled = false;
    onGraded(g.passed, g);
  }
  runBtn.addEventListener("click", run);
  // Test hook for tools/smoke.mjs: it loads each solution into the editor and
  // expects a pass. Not shown anywhere on the page.
  wrap._jsrSolve = () => { editor.set(cell.solution); return run(); };
  return { root: wrap, editor, run };
}

// ─────────────────────────── NOTEBOOK ───────────────────────────────────────

/**
 * Render a list of notebook cells into `mount`. Each cell is one of:
 *
 *   { md }                          prose HTML. `<pre class="code">` blocks in
 *                                   it are highlighted unless data-lang="html".
 *
 *   { code, html?, runner?,         a runnable, editable example ("Try it").
 *     expectError?, … }
 *                                   `code` runs as-is on load; the reader can
 *                                   edit and re-run it, or Restore it. With
 *                                   `html` (or runner:"frame") it runs in a
 *                                   sandboxed page shown under the console.
 *
 *   { prompt, solution, checks,     an inline challenge. The reader's code and
 *     starter?, html?, runner?,       the (never shown) `solution` each run in a
 *     logs?, hint?, title? }          fresh sandbox, then every check runs
 *                                   against both and results are compared.
 *                                   `logs: true` also compares console output.
 *
 * Shared per-cell options: `timeout`, `loopBudget` (ms), `height` (frame px).
 * A check is `{ expr }` or `{ run }` plus optional `label` (see jsrunner.js).
 *
 * @param {Array<Object>} cells
 * @param {HTMLElement} [mount]
 */
export async function renderNotebook(cells, mount = document.getElementById("notebook")) {
  installRecoveryTools();
  const slug = pageSlug();
  let exampleCount = 0, challengeCount = 0;

  function renderMd(cell) {
    const div = document.createElement("div");
    div.className = "md";
    div.innerHTML = cell.md;
    for (const pre of div.querySelectorAll("pre.code")) {
      if (pre.dataset.lang === "text") continue;
      const target = pre.querySelector("code") || pre;
      const src = dedent(target.textContent);
      target.innerHTML = pre.dataset.lang === "html" ? highlightHtml(src) : highlight(src);
    }
    mount.appendChild(div);
  }

  function renderExample(cell) {
    const n = ++exampleCount;
    const key = `lesson:${slug}:ex${n}`;
    const original = dedent(cell.code) + "\n";
    const wrap = document.createElement("div");
    wrap.className = "cell example";
    wrap.dataset.state = cell.autorun === false ? "done" : "pending";
    // Examples that demonstrate a mistake set expectError; smoke.mjs flags any
    // other example whose console shows an error.
    if (cell.expectError) wrap.dataset.expectError = "1";
    wrap.innerHTML =
      `<div class="cell-head"><span class="cell-badge">Example ${n}</span>` +
      (cell.title ? `<span class="cell-title">${cell.title}</span>` : "") +
      `<span class="sp"></span>` +
      (cell.mock && cell.liveOk ? `<label class="live-toggle"><input type="checkbox" class="live-box"> use the real API</label>` : "") +
      `<span class="cell-hint">editable — Ctrl+Enter runs</span></div>` +
      `<div class="cell-body">` +
      (runnerFor(cell) === "frame" && cell.html ? htmlView(cell.html) + `<div class="panel-label">JavaScript</div>` : "") +
      `<div class="ed-slot"></div>` +
      `<div class="controls"><button type="button" class="run-btn">▶ Run</button>` +
      `<button type="button" class="reset-btn" title="Put the original example back">Restore</button>` +
      (cell.storage ? `<button type="button" class="reset-btn clear-storage" title="Empty this example's localStorage">Clear saved data</button>` : "") +
      `</div>` +
      `<div class="panel-label">Console</div><div class="con-slot"></div>` +
      (runnerFor(cell) === "frame" ? `<div class="panel-label">Page</div><div class="page-slot"></div>` : "") +
      `</div>`;
    mount.appendChild(wrap);
    const con = makeConsole();
    wrap.querySelector(".con-slot").replaceWith(con.root);
    const pageSlot = wrap.querySelector(".page-slot");
    const runBtn = wrap.querySelector(".run-btn");
    const save = saveLater(key);
    const editor = makeEditor(loadSaved(key) ?? original, { onRun: () => run(), onChange: save, label: `Example ${n} code` });
    wrap.querySelector(".ed-slot").replaceWith(editor.root);
    const controls = wrap.querySelector(".controls");
    resetConfirm(controls.parentNode, wrap.querySelector(".reset-btn"), () => {
      backupCode(`lesson:${slug}:ex${n}`, editor.get(), { stub: original, label: `${slug} · example ${n}` });
      editor.set(original);
      run();
    }, "Restoring puts the original example back in the editor.");
    controls.after(controls.parentNode.querySelector(".reset-confirm"));
    registerSlot(`lesson:${slug}:ex${n}`, { label: `${slug} · example ${n}`, editor: editor.textarea, save: () => editor.set(editor.textarea.value) });

    // A storage example keeps its sandbox localStorage between runs (and page
    // reloads) under its own key, so "it survives a reload" can be shown.
    const storeKey = `sandbox-storage:${slug}:ex${n}`;
    const readStore = () => {
      const saved = loadSaved(storeKey);
      try { return saved ? JSON.parse(saved) : (cell.storage === true ? {} : { ...cell.storage }); } catch { return {}; }
    };
    const writeStore = (data) => { try { localStorage.setItem(SAVE_PREFIX + storeKey, JSON.stringify(data)); } catch { /* storage off */ } };
    const clearBtn = wrap.querySelector(".clear-storage");
    if (clearBtn) clearBtn.addEventListener("click", () => {
      try { localStorage.removeItem(SAVE_PREFIX + storeKey); } catch { /* storage off */ }
      run();
    });
    const liveBox = wrap.querySelector(".live-box");
    if (liveBox) liveBox.addEventListener("change", () => run());

    let frame = null;
    async function run() {
      runBtn.disabled = true;
      wrap.dataset.state = "running";
      con.reset();
      disposeFrame(frame);
      const reqs = requestChecks(cell);
      const res = await runCode(editor.get(), {
        ...frameOpts(cell), mount: pageSlot, keep: true, onLog: con.add,
        live: !!(liveBox && liveBox.checked),
        storage: cell.storage ? readStore() : null, onStorage: writeStore,
        checks: reqs,
      });
      frame = res.frame;
      reqs.forEach((r, i) => {
        const c = res.checks[i];
        const [head, ...body] = c && c.ok ? c.value.split("\n") : [c ? c.error : "no response"];
        con.add({ level: "request", text: `→ ${r.label}  ${head}` });
        if (body.join("\n").trim()) con.add({ level: "log", text: body.join("\n") });
      });
      con.finish();
      runBtn.disabled = false;
      wrap.dataset.state = "done";
    }
    runBtn.addEventListener("click", run);
    return run;
  }

  const autoruns = [];
  for (const cell of cells) {
    if (cell.md !== undefined) renderMd(cell);
    else if (cell.solution !== undefined) {
      const n = ++challengeCount;
      createChallenge(cell, { mount, badge: `Challenge ${n}`, saveKey: `lesson:${slug}:ch${n}`,
        scope: `lesson:${slug}:${n}`, label: `${slug} · challenge ${n}` });
    }
    else {
      const run = renderExample(cell);
      if (cell.autorun !== false) autoruns.push(run);
    }
  }
  // Examples run in page order after everything is on screen.
  for (const run of autoruns) await run();
}
