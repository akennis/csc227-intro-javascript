#!/usr/bin/env node
/**
 * grade.js — teacher-side batch grader for the CSC 227 labs (grade of record).
 *
 * Reads a roster of students and their repositories, clones/pulls each repo,
 * and grades every submissions/lab-NN.js against that lab's sealed solutions
 * with the same checks the browser runs (tools/node-runner.js → jsrunner
 * grade()). Each problem runs in its own worker_threads Worker that is killed
 * after --timeout ms, so an infinite loop can't hang the run. Writes a JSON
 * gradebook and prints a table.
 *
 * Usage:
 *   node tools/grade.js --roster roster.json
 *   node tools/grade.js --roster r.json --cache .grade-cache --out gradebook.json --timeout 8000
 *   node tools/grade.js --roster r.json --no-pull      # use existing clones as-is
 *   node tools/grade.js --roster r.json --verbose      # every test of every problem
 *   node tools/grade.js --file submissions/lab-02.js [--id lab-02]   # one file, no roster
 *   node tools/grade.js --file https://github.com/u/repo/blob/main/submissions/lab-02.js
 *
 * Roster (JSON array; repoUrl may be a local path, used in place):
 *   [ { "name": "Ada Lovelace", "github": "ada", "repoUrl": "https://github.com/ada/csc227.git" } ]
 *
 * Submission format (written by the lab page's Copy submission — see
 * labs/lab.js buildSubmission): a `// lab: <id>` header line, then each
 * problem between `// ===== problem N: key =====` and `// ===== end problem N =====`.
 * Points: a problem earns its points only when every one of its tests passes.
 */
import { Worker } from "node:worker_threads";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { labs, getLab } from "../labs/index.js";
import { unsealSolution } from "../jsrunner.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const WORKER = join(HERE, "grade-worker.js");

function parseArgs(argv) {
  const opts = { roster: null, cache: ".grade-cache", out: "gradebook.json", timeout: 8000, pull: true, file: null, id: null, verbose: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--roster") opts.roster = argv[++i];
    else if (a === "--cache") opts.cache = argv[++i];
    else if (a === "--out") opts.out = argv[++i];
    else if (a === "--timeout") opts.timeout = Number(argv[++i]);
    else if (a === "--no-pull") opts.pull = false;
    else if (a === "--file") opts.file = argv[++i];
    else if (a === "--id") opts.id = argv[++i];
    else if (a === "--verbose") opts.verbose = true;
    else if (a === "--help" || a === "-h") { printHelp(); process.exit(0); }
    else { console.error(`Unknown argument: ${a}`); printHelp(); process.exit(1); }
  }
  return opts;
}

function printHelp() {
  console.log("Usage: node tools/grade.js --roster <file> [--cache <dir>] [--out <file>] [--timeout <ms>] [--no-pull] [--verbose]");
  console.log("       node tools/grade.js --file <path|url> [--id <lab-id>] [--timeout <ms>]");
}

/**
 * Split a submission into its problems. Returns { id, codes: Map<n, code> }.
 * @param {string} source
 */
export function parseSubmission(source) {
  const id = (source.match(/^\/\/ lab:\s*(\S+)/m) || [])[1] || null;
  const codes = new Map();
  const re = /^\/\/ ===== problem (\d+)[^\n]*\n([\s\S]*?)^\/\/ ===== end problem \1 =====/gm;
  for (const m of source.matchAll(re)) codes.set(Number(m[1]), m[2]);
  return { id, codes };
}

function gradeProblem(problem, code, timeout) {
  return new Promise((resolveP) => {
    const worker = new Worker(WORKER, { workerData: { problem, code, solution: unsealSolution(problem.solution) } });
    // The clock starts at the worker's { ready } message, so loading jsdom
    // (slow on some disks) never counts as the submission's run time.
    let timer = null;
    worker.on("message", (r) => {
      if (r.ready) {
        timer = setTimeout(() => {
          worker.terminate();
          resolveP({ passed: false, items: [], errors: [`timed out after ${timeout} ms (possible infinite loop)`] });
        }, timeout);
        return;
      }
      clearTimeout(timer);
      worker.terminate();
      resolveP(r);
    });
    worker.once("error", (err) => { clearTimeout(timer); resolveP({ passed: false, items: [], errors: [String(err.message || err)] }); });
  });
}

async function gradeSubmission(lab, source, opts) {
  const { codes } = parseSubmission(source);
  const perProblem = [];
  for (let i = 0; i < lab.problems.length; i++) {
    const p = lab.problems[i];
    const code = codes.get(i + 1);
    if (code == null) {
      perProblem.push({ key: p.key, points: 0, max: p.points, passed: false, note: "missing from submission" });
      continue;
    }
    const r = await gradeProblem(p, code, opts.timeout);
    const failed = r.items.filter(it => !it.ok);
    perProblem.push({
      key: p.key, points: r.passed ? p.points : 0, max: p.points, passed: r.passed,
      note: r.passed ? "" : [...r.errors, ...failed.map(it => `${it.label}: got ${it.got}, expected ${it.want}`)].join(" | "),
      items: opts.verbose ? r.items : undefined,
    });
  }
  const points = perProblem.reduce((s, p) => s + p.points, 0);
  return { lab: lab.id, points, max: lab.points, perProblem };
}

function toRawUrl(url) {
  const m = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/);
  return m ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}` : url;
}

async function loadSource(target) {
  if (/^https?:\/\//.test(target)) {
    const res = await fetch(toRawUrl(target));
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${target}`);
    return res.text();
  }
  return readFileSync(target, "utf8");
}

function ensureRepo(entry, cacheDir, pull) {
  if (!entry.repoUrl) return { dir: null, note: "no repoUrl in roster" };
  if (existsSync(entry.repoUrl) && statSync(entry.repoUrl).isDirectory()) return { dir: resolve(entry.repoUrl), note: "" };
  const dest = join(cacheDir, entry.github || entry.name.replace(/\W+/g, "_"));
  try {
    if (existsSync(join(dest, ".git"))) {
      if (pull) execFileSync("git", ["-C", dest, "pull", "--ff-only", "--quiet"], { stdio: "pipe" });
    } else {
      mkdirSync(cacheDir, { recursive: true });
      execFileSync("git", ["clone", "--quiet", "--depth", "1", entry.repoUrl, dest], { stdio: "pipe" });
    }
    return { dir: dest, note: "" };
  } catch (err) {
    return { dir: null, note: `git failed: ${String(err.stderr || err.message).trim()}` };
  }
}

function printResult(r, label = "") {
  const head = `${label}${r.lab}: ${r.points}/${r.max}`;
  console.log(head);
  for (const p of r.perProblem) {
    console.log(`   ${p.passed ? "✓" : "✗"} ${p.key.padEnd(9)} ${String(p.points).padStart(3)}/${p.max}${p.note ? "  " + p.note : ""}`);
    if (p.items) for (const it of p.items) console.log(`        ${it.ok ? "✓" : "✗"} ${it.label}${it.ok ? "" : `  got ${it.got}, expected ${it.want}`}`);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.file) {
    const source = await loadSource(opts.file);
    const id = opts.id || parseSubmission(source).id;
    const lab = id && await getLab(id);
    if (!lab) { console.error(`Unknown lab id ${id ?? "(no // lab: header)"} — pass --id.`); process.exit(1); }
    const r = await gradeSubmission(lab, source, opts);
    printResult(r);
    process.exit(r.points === r.max ? 0 : 1);
  }
  if (!opts.roster || !existsSync(opts.roster)) { console.error(`Roster not found: ${opts.roster}`); printHelp(); process.exit(1); }
  const roster = JSON.parse(readFileSync(opts.roster, "utf8"));
  if (!Array.isArray(roster)) { console.error("Roster must be a JSON array."); process.exit(1); }

  const gradebook = [];
  for (const entry of roster) {
    const { dir, note } = ensureRepo(entry, opts.cache, opts.pull);
    const row = { name: entry.name, github: entry.github, note, labs: {} };
    const subDir = dir && join(dir, "submissions");
    if (subDir && existsSync(subDir)) {
      for (const f of readdirSync(subDir).filter(f => /^lab-\d\d\.js$/.test(f)).sort()) {
        const lab = await getLab(f.slice(0, -3));
        if (!lab) continue;
        const r = await gradeSubmission(lab, readFileSync(join(subDir, f), "utf8"), opts);
        row.labs[lab.id] = r;
        if (opts.verbose) printResult(r, `${entry.name} · `);
      }
    } else if (dir) row.note = "no submissions/ folder";
    gradebook.push(row);
  }
  writeFileSync(opts.out, JSON.stringify(gradebook, null, 2));

  const ids = labs.map(l => l.id).filter(id => gradebook.some(r => r.labs[id]));
  console.log(["student".padEnd(22), ...ids.map(id => id.slice(4).padStart(6)), "  total"].join(""));
  for (const r of gradebook) {
    const cells = ids.map(id => (r.labs[id] ? `${r.labs[id].points}/${r.labs[id].max}` : "—").padStart(6));
    const total = Object.values(r.labs).reduce((s, l) => s + l.points, 0);
    console.log([r.name.slice(0, 21).padEnd(22), ...cells, String(total).padStart(7), r.note ? "  " + r.note : ""].join(""));
  }
  console.log(`\nGradebook written to ${opts.out}`);
}

main();
