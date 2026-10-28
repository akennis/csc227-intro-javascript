# CLAUDE.md

Guidance for working in this repo. Read this (and `backlog.md`, the production
plan) before editing.

## What this is

**CSC 227 · Introduction to JavaScript** — a notebook-style course served from
GitHub Pages (repo root as base), built from the lecture notes in `orig/*.docx`.
Its structure and look deliberately mirror the sibling course
`../stanfordkarel-js-notebooks/` (navbar/pager, lesson cards, challenges, Reset
backups, labs ≈ that repo's assignments). Learners edit and run real JavaScript
on the page; DOM exercises run in a sandboxed page shown under the code.

There is **no build step and no framework.** Pages are static HTML + ES modules
loaded with **relative** paths (a project Pages site lives under `/<repo>/`).
`package.json` devDependencies (acorn, jsdom, playwright-core) are for the
teacher tools only — the site itself must keep working with no `node_modules`.

## Layout

| Path | Purpose |
|---|---|
| `jsrunner.js` | The runtime: `runCode` (worker / frame runners), `prepare` (loop-guard instrumentation), `sandboxPrelude`, `grade`/`sameValue`, `sealSolution`/`unsealSolution`. |
| `lessons/lesson.js` | `renderNotebook(cells)`, the highlighted editor (`makeEditor`), console panel, autosave. |
| `lessons/lesson.css` | All lesson/lab styling (shared by `labs/`). |
| `lessons/NN-*.html` | The 22 lessons (see `backlog.md` lesson map; lessons 13–14 are DOM I / DOM II, each with a 4-problem lab). `sandbox-test.html` is an off-map dev page covering every misbehaviour case. |
| `labs/` | Graded labs: generated `lab-NN.js` manifests, `index.js`, generic `lab.html?id=` + `lab.js`, static `index.html`. |
| `tools/` | `smoke.mjs` (headless check of every page), `gen-labs.js`, `seal.js`, `grade.js` + `grade-worker.js`, `llm-review.js` (optional LLM critique). |
| `how-to-use.html` | Student guide: course structure, examples/challenges, saving, labs, submitting, grading (one live demo example + challenge). Keep it in step with UI labels and lab rules. |
| `site-nav.js` | Navbar + pager; `SECTIONS` is the **single source of page order**. |
| `code-backup.js` | Reset safety net (`js227-backup:` localStorage slots, `?recover=1`, `jsBackups` console helper). |
| `student-template/` | Starter repo students copy for lab submissions. |
| `orig/` | Source lecture notes (.docx). Read-only input. |

## Running learner code (get this right)

Two runners, chosen per cell (`runner`, default: `"frame"` if the cell has `html`, else `"worker"`):

- **worker** — a classic Web Worker. The program is loaded with `importScripts`
  (so top-level `let`/`const`/functions are globals visible to checks). A
  wall-clock `timeout` (default 4 s) `terminate()`s it: hard kill.
- **frame** — `<iframe sandbox="allow-scripts" srcdoc>`: opaque origin, cannot
  reach the course page, no `allow-same-origin` (so real `localStorage` throws —
  shim it; see backlog Group 6). It **cannot be killed**, and in Chrome it may
  share the page's thread, so the hang defence is instrumentation.
- **`prepare(src)`** (acorn, pinned CDN in the browser / `acorn` package in
  Node) rewrites every loop body to start with `__jsrGuard();` and, for code
  with top-level `await`, wraps it in an async IIFE that re-exports top-level
  names to `globalThis`. **Rewrites must never add or remove newlines** — error
  line numbers depend on it. The guard uses `performance.now()` (the wall clock
  jumps under WSL; `Date.now()` made it misfire), is armed per task, and is
  sticky once tripped so a `try/catch` inside the loop can't swallow it.
  Runaway recursion needs no guard (RangeError). Not covered: a single native
  call that never returns (e.g. a 1e10-element `Array.from`) inside a frame.
- **Errors are soft**: syntax/runtime errors, guard trips, and timeouts come
  back in `result.errors` (and stream to the console panel); `runCode` never
  throws. Error text includes `(line N)` in the learner's own numbering.
- `console.*` is captured *and* teed to the real DevTools console. Output is
  capped inside the sandbox (1000 lines shown, 10000 kept for `_t.logs()`): an
  endless loop that logs would otherwise freeze the course page with messages.
- Console levels: `log`/`warn`/`error` come from console calls; `exception` is a
  thrown error, syntax error, guard trip, or timeout. Examples that show an
  exception on purpose need `expectError: true` (smoke.mjs flags the rest).
- The guard ignores gaps over 250 ms between iterations (debugger pauses).

## Cell shapes (`renderNotebook`)

- `{ md }` — prose HTML. `<pre class="code">` blocks inside are auto-highlighted
  as JS (escape `<`/`&` yourself); add `data-lang="html"` or `"text"` to skip.
- `{ code, title?, html?, runner?, height?, timeout?, loopBudget?, autorun? }` —
  an **editable example**. Runs on load (in page order), re-runs on ▶ / Ctrl+Enter,
  Restore puts the original back (with backup). Write `code` flush-left in a
  template literal; it is `dedent`ed. With `html`, the page's HTML is shown
  read-only and highlighted ("Page HTML") above the JavaScript editor, so the ids
  and `onclick="…"` links the code depends on are visible, and the live page
  appears under the console (handlers keep logging). Challenges and lab problems
  with `html` show the same panel. **Every frame cell's markup must be in `html`**
  — never build the page from hidden code.
- `{ prompt, solution, checks, title?, starter?, hint?, logs?, html?, runner? }` —
  a **challenge**. On ▶ the learner's code runs once visibly, then once more
  hidden with the checks; the solution (plaintext in lesson pages, never shown)
  runs hidden with the same checks; results are compared one by one.
  - A check is `{ expr: "cToF(100)" }` or `{ run: "…; return value;" }` (async
    body), optional `label`. Helpers in scope: `_t.type(sel, v)`, `_t.click(sel)`,
    `_t.text(sel)`, `_t.value(sel)`, `_t.$/$$`, `_t.wait(ms)`, `_t.logs()`, `_t.clearLogs()`.
  - Comparison is structural with numeric tolerance 1e-9 and sorted object keys;
    DOM nodes compare by `outerHTML`. `logs: true` also requires identical
    console output. A check where both sides throw passes only with `expectError: true`.
  - Checks run **in order in one sandbox** — state from an earlier check (typed
    inputs, ticked boxes, globals) carries over. Reset what a check depends on.
  - Layout-dependent values (`innerText`, sizes, `getBoundingClientRect`) are
    unavailable while the frame's page is still parsing, and Chrome defers
    layout for off-screen sandboxed frames: read them on `load` or, for sizes,
    on a click.
  - An example's `html` may contain `<script>`, but write it as `<\/script>`
    inside the page's template literal or it ends the lesson's own script.
  - Every challenge must pass with its own solution — `tools/smoke.mjs` enforces it.

### Platform options (any example/challenge/lab problem)

| Option | Effect |
|---|---|
| `mock: courseApi` | `fetch`/`XMLHttpRequest` answered by `lessons/mock-apis.js` (stringified into the sandbox — keep it self-contained). Deterministic; required for graded cells. Examples may add `liveOk: true` for a "use the real API" checkbox. |
| `storage: true \| {…}` | localStorage shim seeded with that object (opaque-origin frames can't use the real one). Examples persist it across runs/reloads (`js227-sandbox-storage:…`) with a **Clear saved data** button; challenges start fresh each run. Checks read it with `_t.storage()`. |
| `node: true` | worker only: `require("http"\|"url")`, `process`; checks call `_t.request(path, { method })` → `{ status, type, body }`. Examples list `requests: ["/", { path, method }]` to print responses. |
| `jsx: true`, `libs: ["react"]` | Babel (pinned CDN / `@babel/standalone` in Node, `retainLines`) then React 18 UMD in the frame. React renders asynchronously — start checks with `await _t.wait(40)`. |

Worker runs end when the program is **idle** (no pending `setTimeout`/request;
`setInterval` is not tracked), so async examples print their callbacks. Every
platform option must behave the same in `tools/node-runner.js` (grade of record).

Lesson editors autosave to `js227-lesson:<slug>:ex<n>|ch<n>` (labs: `js227-lab:<id>:<key>`).

## Labs & grading

- **Two grades, one solution.** The lab page's ✓ is practice; the grade of
  record is `tools/grade.js` re-running the submission with the same checks via
  `tools/node-runner.js` (vm for worker problems, jsdom for frame problems) and
  the same `grade()` comparison. Keep the browser and Node paths equivalent —
  any new sandbox shim must exist in both `sandboxPrelude`/`jsrunner.js` and
  `node-runner.js`.
- **Generated manifests.** Plaintext lab sources live in `tools/_labs-src/lab-NN.js`
  (underscore folder ⇒ not published by GitHub Pages' default Jekyll build; never
  add `.nojekyll` without moving them). `node tools/gen-labs.js` verifies each
  problem (solution passes itself, starter fails), seals solutions, and writes
  `labs/lab-NN.js`, `labs/index.js`, and the list in `labs/index.html` between
  `<!-- GENERATED:labs -->` markers. Never hand-edit those outputs. `--check` verifies only.
- **Lab problems use exact variable/function names** stated in the prompt — the
  checks read the globals the program leaves behind.
- **Submission format** (`labs/lab.js` `buildSubmission` ⇄ `tools/grade.js`
  `parseSubmission`; change together): `// lab: <id>` header, then each problem
  between `// ===== problem N: key =====` and `// ===== end problem N =====`.
  Markers, not function wrappers, because wrapping would break global
  declarations and inline `onclick` handlers.
- **Timeouts.** Each graded problem runs in a `worker_threads` Worker; the clock
  starts at its `{ready}` message (jsdom takes seconds to load from `/mnt/c`).
- **LLM review (advisory).** `grade.js --llm-provider anthropic` (key in
  `ANTHROPIC_API_KEY_CSC227`) or `--llm-endpoint <url> --llm-model <m>` (any
  OpenAI-compatible server) prints a per-problem prose critique to stdout via
  `tools/llm-review.js`; it never changes points, and failures only log to stderr.
  Dependency-free (global `fetch`), mirroring the Karel repo's reviewer. The
  system prompt encodes this course's style rules — update it if they change.
- Pilot-verified: `node tools/grade.js --file <copied submission>` scores 30/30 for
  a browser-solved lab-02; a looping/incorrect submission scores 0 without hanging.

## Content conventions

- **Comprehensive, not a transcription.** `orig/` is the syllabus floor. Expand
  each topic: explanation → several runnable examples (simple → realistic) →
  common-mistake callouts (`<div class="callout warn">`) → challenges. Aim for
  ~6–12 examples and ~5–8 challenges per lesson; split rather than thin out.
- Modern style in examples: `const` by default, `let` when reassigned, never
  `var`; `===`; template literals; 2-space indent; semicolons.
- Lesson page shell: copy an existing lesson; crumb "CSC 227 · Lesson N of 22";
  `.lab-cta` link to `../labs/lab.html?id=lab-NN`; one `site-nav.js` line.
  Register the page in `SECTIONS` (never hand-write nav links); `index.html`
  already lists all 22 lessons. Lessons and labs share numbers (lesson NN ↔ `lab-NN`); inserting a lesson means renumbering everything after it — files, ids, crumbs, `lab-cta`s, SECTIONS, index/reference links, and prose like "lesson 18".

## Verifying (no test runner)

```bash
npm install                                    # once: dev tools only
node tools/smoke.mjs                           # every page: no errors, every challenge solves
node tools/smoke.mjs lessons/08-strings.html --dump   # one page, print example output
npx serve .                                    # browse manually (http://, not file://)
```

The smoke test serves the repo itself and uses Playwright's cached Chromium
(`~/.cache/ms-playwright`, or `--chrome <path>` / `$CHROME`). After runtime
changes also run `lessons/sandbox-test.html` through it.
