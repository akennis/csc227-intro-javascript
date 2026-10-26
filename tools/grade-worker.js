/**
 * grade-worker.js — runs ONE lab problem inside a worker_threads Worker so
 * tools/grade.js can terminate() it if the submission hangs (the Node runner
 * has no hard timeout of its own). Receives { problem, code, solution } and
 * posts back the graded result from jsrunner's grade(), the same comparison
 * the browser lab page uses. Posts { ready } once its modules are loaded; the
 * parent's timeout starts then.
 */
import { parentPort, workerData } from "node:worker_threads";
import { runInNode, loadJsdom } from "./node-runner.js";
import { grade } from "../jsrunner.js";

const { problem, code, solution } = workerData;
const opts = {
  runner: problem.runner || (problem.html != null ? "frame" : "worker"),
  html: problem.html || "",
  checks: problem.checks || [],
  loopBudget: problem.loopBudget || 1500,
  mock: problem.mock || null,
  storage: problem.storage || null,
  node: !!problem.node,
  jsx: !!problem.jsx,
  libs: problem.libs || [],
};
// Load everything first, then tell the parent to start the clock: module
// loading (jsdom especially) must not count against the submission's time.
if (opts.runner === "frame") await loadJsdom();
await runInNode("", { runner: opts.runner });
parentPort.postMessage({ ready: true });
try {
  const [mine, ref] = [await runInNode(code, opts), await runInNode(solution, opts)];
  const g = grade(mine, ref, opts.checks, { logs: !!problem.logs });
  parentPort.postMessage({ passed: g.passed, items: g.items, errors: mine.errors, logs: mine.logs.length });
} catch (err) {
  parentPort.postMessage({ passed: false, items: [], errors: ["grader error: " + (err.message || err)], logs: 0 });
}
