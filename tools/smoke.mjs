#!/usr/bin/env node
/**
 * Headless smoke test for the course pages (teacher/dev tool, not published).
 *
 *   node tools/smoke.mjs [page.html …] [--dump] [--chrome <path>]
 *
 * Serves the repo root on a local port, opens each page in headless Chromium
 * (playwright-core; the browser comes from ~/.cache/ms-playwright or --chrome /
 * $CHROME), waits for every example to finish, then loads each challenge's own
 * solution into its editor (the `_jsrSolve` hook in lessons/lesson.js) and
 * expects "All tests pass". Fails on page errors and unexpected console errors.
 * Pages default to index.html, every lessons/NN-*.html, and labs (?id= each).
 * --dump prints every example's console output (useful for sandbox-test.html).
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const dump = args.includes("--dump");
const chromeArg = args.includes("--chrome") ? args[args.indexOf("--chrome") + 1] : null;
let pages = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--chrome");

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };

function serve() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    let file = path.join(ROOT, decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) { res.writeHead(404).end("not found"); return; }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(r => server.listen(0, "127.0.0.1", () => r(server)));
}

function findChrome() {
  if (chromeArg) return chromeArg;
  if (process.env.CHROME) return process.env.CHROME;
  const base = path.join(os.homedir(), ".cache", "ms-playwright");
  const dirs = fs.existsSync(base) ? fs.readdirSync(base).filter(d => /^chromium-\d+$/.test(d)).sort() : [];
  for (const d of dirs.reverse()) {
    const exe = path.join(base, d, "chrome-linux64", "chrome");
    if (fs.existsSync(exe)) return exe;
  }
  return undefined;
}

async function defaultPages() {
  const lessons = fs.readdirSync(path.join(ROOT, "lessons")).filter(f => /^\d\d-.*\.html$/.test(f)).sort()
    .map(f => "lessons/" + f);
  const labs = [];
  const labDir = path.join(ROOT, "labs");
  if (fs.existsSync(path.join(labDir, "lab.html"))) {
    for (const f of fs.readdirSync(labDir).filter(f => /^lab-\d\d\.js$/.test(f)).sort())
      labs.push(`labs/lab.html?id=${f.slice(0, -3)}`);
  }
  return ["index.html", "how-to-use.html", "reference.html", "playground.html", ...lessons, ...labs];
}

async function checkPage(browser, base, page) {
  const tab = await browser.newPage();
  const problems = [];
  tab.on("pageerror", e => problems.push("pageerror: " + e.message));
  tab.on("console", m => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) problems.push("console.error: " + m.text());
  });
  await tab.goto(base + page, { waitUntil: "load" });
  // Examples mark themselves data-state="done" when their (auto)run finishes.
  await tab.waitForFunction(() => document.querySelector("#notebook, main, .wrap")?.children.length > 0, null, { timeout: 15000 }).catch(() => {});
  await tab.waitForFunction(() => [...document.querySelectorAll(".example")].every(c => c.dataset.state === "done"),
    null, { timeout: 60000 }).catch(() => problems.push("examples did not finish within 60 s"));
  if (dump) {
    const out = await tab.$$eval(".example", els => els.map(e =>
      `── ${e.querySelector(".cell-title")?.textContent || e.querySelector(".cell-badge").textContent}\n` +
      [...e.querySelectorAll(".con-line, .con-empty")].map(l => "   " + l.textContent).join("\n")));
    console.log(out.join("\n"));
  }
  // Learner-visible errors (an example demonstrating a mistake) surface as
  // page errors from the sandbox frames; ignore any the page itself displays.
  const shownErrors = await tab.$$eval(".con-error, .con-exception", els => els.map(e => e.textContent));
  for (let i = problems.length - 1; i >= 0; i--) {
    const msg = problems[i].replace(/^(pageerror|console\.error): /, "");
    if (shownErrors.some(t => t.includes(msg) || msg.includes(t.replace(/ \(line \d+\)$/, "")))) problems.splice(i, 1);
  }
  const unexpected = await tab.$$eval(".example:not([data-expect-error]) .con-exception", els =>
    els.map(e => `${e.closest(".example").querySelector(".cell-badge").textContent}: ${e.textContent}`));
  for (const u of unexpected) problems.push("unexpected error in " + u);
  const n = await tab.$$eval(".challenge, .problem", els => els.length);
  let failed = 0;
  for (let i = 0; i < n; i++) {
    const verdict = await tab.evaluate(async (i) => {
      const el = document.querySelectorAll(".challenge, .problem")[i];
      if (!el._jsrSolve) return "no _jsrSolve hook";
      await el._jsrSolve();
      const v = el.querySelector(".verdict");
      if (v.classList.contains("ok")) return "ok";
      const bad = [...el.querySelectorAll(".tests li.no")].map(li => li.textContent.replace(/\s+/g, " ").trim());
      return (v.textContent || "no verdict") + (bad.length ? " — " + bad.join(" | ") : "");
    }, i);
    if (verdict !== "ok") { failed++; problems.push(`challenge ${i + 1}: ${verdict}`); }
  }
  await tab.close();
  return { problems, challenges: n, failed };
}

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}/`;
if (!pages.length) pages = await defaultPages();
const browser = await chromium.launch({ executablePath: findChrome() });
let bad = 0;
for (const page of pages) {
  const { problems, challenges, failed } = await checkPage(browser, base, page);
  const status = problems.length ? "FAIL" : "ok  ";
  console.log(`${status} ${page}  (${challenges - failed}/${challenges} challenges)`);
  for (const p of problems) console.log("       " + p);
  if (problems.length) bad++;
}
await browser.close();
server.close();
process.exit(bad ? 1 : 0);
