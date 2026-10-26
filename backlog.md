# Backlog — CSC 227 Intro to JavaScript (GitHub Pages course)

Production plan for turning the lecture notes in `orig/` into a notebook-style,
zero-build GitHub Pages course modeled on `../stanfordkarel-js-notebooks/`.
Work proceeds **group by group**; tick tasks as they land and delete nothing
until the whole group is verified. Each group ends with a verification step.

## Decisions (agreed)

- **Site style/structure mirrors the Karel course**: static HTML, ES modules, no
  build step; `site-nav.js` (`SECTIONS` = single source of page order),
  `lessons/lesson.css`, `lessons/lesson.js` (`renderNotebook(cells)`),
  `code-backup.js` (Reset safety net), `index.html` TOC, relative paths only.
- **Labs = full Karel assignments pipeline**: `labs/lab-NN.js` manifests
  (simple / moderate / complex problems, sealed solutions), generic
  `labs/lab.html?id=`, in-browser ✓, Copy submission, `student-template/` repo,
  teacher CLI grader `tools/grade.js` with per-problem timeout. Manifests are
  **generated** by `tools/gen-labs.js` (plaintext solutions live only there).
- **Odd topics**: Git → prose lesson + PR recipe; Karel weeks → link to the Karel
  course; Node → lesson with an in-page simulated `http`/`url` shim; npm →
  read-only; React → live in iframe via pinned CDN React + Babel standalone.
- **Labs are newly authored** (originals not supplied), one per lesson; Session 9
  exam-review problems are folded into the matching labs.
- **No git** operations in this directory.
- **Lessons are comprehensive, not transcriptions.** The `orig/` notes are the
  syllabus floor: expand every topic with fuller explanations, *several* runnable
  examples per concept (simple → realistic), "common mistake" callouts, and
  related material a first course should cover even if the notes skip it
  (e.g. `%`, `NaN`, `==` vs `===`, truthiness, `for…of`, `map/filter/reduce`,
  spread/destructuring, `Object.keys/entries`, JSON, template literals). Target
  per lesson: ~6–12 demo cells and ~5–8 inline challenges; split a lesson in two
  rather than thin it out. More content with examples beats brevity.

## Architecture: running student code safely

One single-file library, `jsrunner.js` (repo root, like `stanfordkarel.js`):

| Runner | Used for | Hang protection |
|---|---|---|
| `runInWorker(src, opts)` | pure logic (values, functions, strings, arrays, objects, errors, recursion, Node shim) | module Worker + wall-clock `timeout` → `terminate()` (Karel pattern). Hard kill. |
| `runInFrame(src, { html, … })` | anything touching the DOM, events, storage, XHR/fetch, React | `<iframe sandbox="allow-scripts" srcdoc>` (opaque origin, can't touch the course page) **plus** AST loop-guard instrumentation (`protectLoops`, acorn pinned via jsDelivr, lazy-loaded): every `for`/`while`/`do`/`for-of`/`for-in` checks a per-task time budget and throws `"possible infinite loop"`. Runaway recursion → RangeError, caught. Parent also enforces a timeout and tears down the frame. |

- Console capture: `console.log/warn/error` + uncaught errors/rejections forwarded
  (Worker: `postMessage`; frame: `parent.postMessage` with a per-run nonce).
  Values are serialized with a small inspector (arrays, objects, strings quoted).
- **Grading model** (mirrors Karel: "compare to the never-shown solution"): a
  challenge lists `checks` — JS snippets (sync or async) run *after* the code in
  the same sandbox (e.g. `cToF(100)`, or "type 3 and 4 into the inputs, click,
  read #res"). The student's check results (and optionally `logs`) are deep-
  compared to the solution's. Explicit `expect` values are allowed when no
  solution run is needed. Per-check pass/fail is shown (✓ / ✗ with got vs. expected).
- Frame sandbox shims: in-memory `localStorage` (opaque origins throw), optional
  mock `fetch`/`XMLHttpRequest` with canned responses (deterministic grading;
  a "live" toggle hits open-meteo), `require('http'|'url')` shim for Node.
- CLI grader: logic problems in Node `worker_threads` + `vm` with timeout; DOM
  problems via **jsdom (devDependency of the grader only — the site stays
  zero-dependency)**, same loop-guard instrumentation, same `checks`.

## Lesson map (orig → lesson)

| # | Lesson | Source | Runner |
|---|---|---|---|
| 01 | Getting started: Git, GitHub & Karel | week-1, S3 | prose (+ link to Karel course) |
| 02 | Values, types & variables | S4, S5 recap | worker |
| 03 | Functions | S4, S5 | worker |
| 04 | The console & the debugger | S4 | worker + frame (`debugger;`) |
| 05 | Booleans & decisions | S5 | worker |
| 06 | Loops (while, for, nested) & local vs. global | S5, S6 | worker |
| 07 | JavaScript in the page: scripts, inputs, buttons | S6 | frame |
| 08 | Strings | S7 | worker + frame |
| 09 | Arrays | S8 | worker + frame (HighestInForm) |
| 10 | Objects as maps | S9 | worker |
| 11 | Modeling systems with data | S10 | worker |
| 12 | Closures: objects with behavior | S11 | worker |
| 13 | The DOM I: from HTML to a live document | S12 (+ expanded) | frame |
| 14 | The DOM II: building & navigating the tree | S12, S13 (+ expanded) | frame |
| 15 | Events & event targets | S14, S23 (callbacks) | frame |
| 16 | Multiple returns, error values & exceptions | S17 | worker |
| 17 | Functions as data, recursion & arrow functions | S23 | worker |
| 18 | Ajax with XMLHttpRequest | S15 | frame (mock + live) |
| 19 | Async / await, fetch & Promise.all | wk14 S24 | frame (mock + live) |
| 20 | localStorage | S28 | frame (shim) |
| 21 | Node.js & a tiny web server | S16 | worker (http/url shim) + read-only |
| 22 | React & npm | S21, S24 | frame (React + Babel) + read-only |

Note: order follows the original sessions except errors (S17) and functions-as-
data (S23) move ahead of Ajax so labs can use arrows and try/catch.

---

## Group 1 — Foundation & runtime  ✅

- [x] Scaffold: `index.html` (full 21-lesson TOC), `site-nav.js` (SECTIONS:
      lessons, labs, reference, tools), `lessons/lesson.css`, `code-backup.js`
      (`js227-backup:`), `serve.json`, `package.json` (dev tools), `LICENSE`, `.gitignore`.
- [x] `jsrunner.js`: `runCode` (worker + frame), `prepare`/loop guard, console
      tee + inspector, `grade`/`sameValue`, seal/unseal.
- [x] `lessons/lesson.js`: md / editable example / challenge cells, highlighted
      overlay editor, autosave, Reset/Restore with backup, per-test verdicts,
      DOM challenges show their page before the first run.
- [x] `lessons/sandbox-test.html`: all misbehaviour cases pass (loops guarded with
      line numbers, recursion, syntax/runtime errors, TLA, click-handler hang).
- [x] `tools/smoke.mjs` (static server + cached Chromium; `_jsrSolve` hook).
- [x] `CLAUDE.md`, `README.md`.

Learned: `Date.now()` jumps under WSL — guard uses `performance.now()`.

## Group 2 — Lab pipeline  ✅

- [x] `labs/lab.html` + `labs/lab.js` (`?id=`, problem cards via
      `createChallenge`, autosave `js227-lab:`, score bar, Copy submission with
      textarea fallback, Next lab via `setNext`).
- [x] `labs/index.js` + `labs/index.html` (both generated).
- [x] `tools/seal.js`, `tools/gen-labs.js` (sources in `tools/_labs-src/`).
- [x] `tools/node-runner.js`, `tools/grade.js`, `tools/grade-worker.js`, `tools/roster.example.json`.
- [x] `student-template/` (README with the S3 branch → PR → review → squash recipe).
- [x] Pilot lab-02 (written for real): browser ✓ → Copy → CLI 30/30; bad repo 0/30, no hang.

## Group 3 — Lessons & labs 01–06 (fundamentals)  ✅

- [x] L01 Git/GitHub/Karel (4 ch) + Lab 01 (print / banner / PR-recipe commands)
- [x] L02 Values/types/variables (8 ch) + Lab 02
- [x] L03 Functions (7 ch) + Lab 03 (Kelvin / checkout / race pace)
- [x] L04 Console & debugger (7 ch, `debugger;` demo in a frame) + Lab 04 (fix-the-bugs)
- [x] L05 Booleans & decisions (7 ch) + Lab 05 (teen / shipping / rock-paper-scissors)
- [x] L06 Loops (8 ch) + Lab 06 (sum odds / S9 sleep / Collatz)
- [x] SECTIONS wired for 01–06; full smoke green (12 pages, 41 + 18 challenges).

Learned: an endless loop that logs floods the page → output now capped inside the
sandbox. `Date.now()` jumps ±15 s here: never write time-sensitive checks that
compare against a threshold the student's clock didn't also measure.

## Group 4 — Lessons & labs 07–12 (page I/O & data)  ✅

- [x] L07 JS in the page (6 ch) + Lab 07 (add numbers / S9 average of 10 inputs / unit converter)
- [x] L08 Strings (8 ch) + Lab 08 (reverse words / email validation / phone formatting)
- [x] L09 Arrays (8 ch) + Lab 09 (above average / HighestInForm extended / chunk-flatten-transpose)
- [x] L10 Objects as maps (7 ch) + Lab 10 (word count / most frequent + histogram / gradebook)
- [x] L11 Modeling systems (6 ch) + Lab 11 (blackjack / inventory / elevator sim)
- [x] L12 Closures (6 ch) + Lab 12 (greeter factory / private queue / to-do list)
- [x] SECTIONS wired; smoke green (13 pages).

Feedback applied: every frame cell (example, challenge, lab problem) now shows its
`html` in a read-only highlighted "Page HTML" panel above the JS editor, so the
markup ↔ code connection (ids, onclick) is visible. Markup must always live in `html`.

## Group 5 — Lessons & labs 13–16 (DOM, events, errors, functions)  ✅

- [x] L13 DOM (6 ch, traversal tool) + Lab 13 (status / product cards / nested TOC)
- [x] L14 Events (6 ch) + Lab 14 (counter / delegated stars / tag input with keys)
- [x] L15 Multiple returns & errors (6 ch) + Lab 15 (divmod / parseDate as values / order processing with exceptions)
- [x] L16 Functions as data / recursion / arrows (7 ch) + Lab 16 (pipeline / recursive binary search / evaluator)
- [x] SECTIONS wired; smoke green.

## Group 6 — Lessons & labs 17–21 (network, storage, platforms)  ✅

- [x] Runtime: mock fetch/XHR from a course mock server (`lessons/mock-apis.js`,
      stringified into the sandbox) with a per-example "use the real API" toggle;
      localStorage shim (examples persist it across runs/reloads, with Clear);
      Node `require("http"/"url")` shim + `_t.request` and example `requests`;
      JSX via @babel/standalone (retainLines) + React 18 UMD (`libs: ["react"]`);
      idle tracking so Worker runs wait for pending timers/requests; Node runner
      deadline for never-settling async. Node side: react/react-dom/@babel/standalone devDeps.
- [x] L17 XMLHttpRequest (6 ch) + Lab 17 (userId / ordered parallel titles / full weather page)
- [x] L18 Async/await & Promise.all (6 ch) + Lab 18 (completed / parallel meridian / team reports)
- [x] L19 localStorage (5 ch) + Lab 19 (drafts / contact book / persistent cart)
- [x] L20 Node.js (5 ch) + Lab 20 (health / to-do API / safe templates + stats)
- [x] L21 React & npm (6 ch) + Lab 21 (badges / to-do app / tic-tac-toe with winner)
- [x] SECTIONS wired; smoke green; CLI grader 30/30 on solutions, 0/30 on a bad file.

Learned: Worker runs were terminated before async callbacks fired (fixed by idle
tracking); sequential mock requests came within 100 ms of the 4 s timeout (mock
sped up, those examples given longer timeouts).

## Change — DOM split into two lessons (2026-10-26)  ✅

Requested: split the DOM lesson across two lecture days, deeper coverage of the
DOM's relationship to HTML, JavaScript and the browser, a separate 4-problem lab each.
- [x] L13 DOM I (parse→DOM→render pipeline, source vs DOM repair, node types,
      window/document, load timing, element types, selectors, live vs static,
      content views, XSS, attributes vs properties, dataset, classes/computed
      style, forms; 7 ch) + Lab 13 (status / highlighter / order form / price table).
- [x] L14 DOM II (insertion positions, text nodes, move vs clone, template,
      CRUD, render pattern, innerHTML pitfalls, fragments & layout thrash,
      measuring, rAF, MutationObserver, traversal, recursive outline, traversal
      tool; 7 ch) + Lab 14 (add items / cards / nested TOC / sortable table).
- [x] Renumbered old 14–21 → 15–22 (files, lab ids, crumbs, links, prose refs).

## Group 7 — Polish  ☐

- [x] `playground.html` (JS editor + optional HTML pane; mock API / storage / React / Node toggles; autosave).
- [x] `reference.html` (one-page cheat sheet, sections linked to lessons).
- [ ] Full-site smoke run; mobile-width check; README + CLAUDE.md final pass.
- [ ] Optional: port Karel's advisory LLM code review (`tools/llm-review.js`).
