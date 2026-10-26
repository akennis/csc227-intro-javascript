/**
 * lab.js — renders the generic lab page (labs/lab.html?id=lab-NN).
 *
 * Each problem is a challenge card from lessons/lesson.js (createChallenge),
 * graded in the browser exactly like a lesson challenge but against the lab's
 * sealed solution. The instant ✓ is practice; the grade of record is
 * tools/grade.js re-running the copied submission with the same checks.
 *
 * Work autosaves to `js227-lab:<id>:<key>`. "Copy submission" produces the
 * file students commit as submissions/<id>.js — header comment lines, then
 * each problem between `// ===== problem N: key =====` / `// ===== end problem N =====`
 * markers (parsed by tools/grade.js; keep the formats in sync).
 */
import { createChallenge, esc } from "../lessons/lesson.js";
import { unsealSolution } from "../jsrunner.js";
import { labs, getLab } from "./index.js";
import { installRecoveryTools } from "../code-backup.js";
import { setNext } from "../site-nav.js";

/**
 * Build the submission file text for a lab.
 * @param {Object} lab        manifest
 * @param {string[]} codes    one source per problem, in order
 * @param {boolean[]} passed  browser verdicts (informational only)
 * @returns {string}
 */
export function buildSubmission(lab, codes, passed) {
  const lines = [
    `// lab: ${lab.id}`,
    `// title: ${lab.title}`,
    `// Copied from the lab page. Keep these header lines and the ===== markers.`,
    "",
  ];
  lab.problems.forEach((p, i) => {
    lines.push(`// ===== problem ${i + 1}: ${p.key} =====`);
    lines.push(`// ${p.title} (${p.points} pts)${passed[i] ? " — passed in browser" : ""}`);
    lines.push(codes[i].replace(/\s+$/, ""));
    lines.push(`// ===== end problem ${i + 1} =====`, "");
  });
  return lines.join("\n");
}

async function main() {
  installRecoveryTools();
  const id = new URLSearchParams(location.search).get("id") || "";
  const lab = await getLab(id);
  const title = document.getElementById("title");
  if (!lab) {
    title.textContent = "Lab not found";
    document.getElementById("lead").innerHTML = `No lab called <code>${esc(id)}</code>. ` +
      `See the <a href="./index.html">list of labs</a>.`;
    return;
  }
  const n = lab.id.slice(4);
  document.title = `Lab ${n} · ${lab.title} — CSC 227 JS`;
  document.getElementById("crumb").textContent = `CSC 227 · Lab ${n} of ${labs.length} · ${lab.id}`;
  title.textContent = `Lab ${n} · ${lab.title}`;
  document.getElementById("lead").innerHTML =
    `${lab.problems.length} problems · ${lab.points} points · practises ` +
    `<a href="../lessons/${lab.lesson}.html">Lesson ${n}: ${lab.lessonTitle}</a>`;

  const mount = document.getElementById("notebook");
  if (lab.intro) {
    const div = document.createElement("div");
    div.className = "md";
    div.innerHTML = lab.intro;
    mount.appendChild(div);
  }

  const passed = lab.problems.map(() => false);
  const score = document.getElementById("score");
  const paintScore = () => {
    const pts = lab.problems.reduce((s, p, i) => s + (passed[i] ? p.points : 0), 0);
    score.textContent = `Passing in browser: ${passed.filter(Boolean).length} / ${lab.problems.length} problems · ${pts} / ${lab.points} pts`;
  };
  const cards = lab.problems.map((p, i) => {
    const cell = { ...p, solution: unsealSolution(p.solution) };
    const card = createChallenge(cell, {
      mount,
      badge: `Problem ${i + 1} · ${p.key}`,
      saveKey: `lab:${lab.id}:${p.key}`,
      scope: `lab:${lab.id}:${p.key}`,
      label: `${lab.id} · problem ${i + 1} (${p.key})`,
      onGraded: (ok) => { passed[i] = ok; paintScore(); },
    });
    card.root.classList.add("problem");
    card.root.querySelector(".chal-head").insertAdjacentHTML("beforeend",
      `<span class="chal-points">${p.points} pts</span>`);
    return card;
  });
  paintScore();
  document.getElementById("bar").hidden = false;

  const note = document.getElementById("copy-note");
  document.getElementById("copy").addEventListener("click", async () => {
    const text = buildSubmission(lab, cards.map(c => c.editor.get()), passed);
    try {
      await navigator.clipboard.writeText(text);
      note.textContent = `Copied — save it as submissions/${lab.id}.js in your repo.`;
    } catch {
      // Clipboard blocked (permissions / http): fall back to a selectable box.
      const ta = Object.assign(document.createElement("textarea"), { value: text, rows: 12, readOnly: true });
      ta.style.cssText = "width:100%;font-family:ui-monospace,monospace;font-size:.82rem;margin-top:.5rem";
      note.replaceChildren("Copy this text and save it as submissions/" + lab.id + ".js:", ta);
      ta.select();
    }
  });

  const idx = labs.findIndex(l => l.id === lab.id);
  if (idx >= 0 && idx < labs.length - 1) setNext(`./lab.html?id=${labs[idx + 1].id}`, `Lab ${labs[idx + 1].id.slice(4)}`);
}

main();
