// Lab 06 — Loops. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-06",
  title: "Loops",
  lesson: "06-loops",
  lessonTitle: "Loops",
  intro: `
    <p>Loops, accumulators, and stopping conditions. If your page says a loop ran too long, look for a condition
    that never becomes false.</p>`,
  problems: [
    {
      key: "simple",
      title: "Sum of odds",
      points: 10,
      prompt: `Write <code>sumOdds(n)</code> returning the sum of all odd numbers from 1 up to and including
        <code>n</code>. <code>sumOdds(7)</code> is 1 + 3 + 5 + 7 = 16; <code>sumOdds(0)</code> is 0.`,
      starter: `
        function sumOdds(n) {

        }
      `,
      solution: `
        function sumOdds(n) {
          let total = 0;
          for (let i = 1; i <= n; i += 2) {
            total += i;
          }
          return total;
        }
      `,
      checks: [{ expr: "sumOdds(7)" }, { expr: "sumOdds(8)" }, { expr: "sumOdds(1)" }, { expr: "sumOdds(0)" }, { expr: "sumOdds(99)" }],
    },
    {
      key: "moderate",
      title: "sleep",
      points: 10,
      prompt: `<code>Date.now()</code> gives the number of milliseconds since 1 January 1970. Write a function
        <code>sleep(t)</code> that logs <code>Timer started</code>, loops until <code>t</code> milliseconds have
        elapsed, then logs <code>Timer done</code>. (This is a <em>busy wait</em>: fine for a fraction of a second, but it
        blocks the page while it runs.) Don't call it yourself — the tests do.`,
      starter: `
        function sleep(t) {

        }
      `,
      solution: `
        function sleep(t) {
          console.log("Timer started");
          const start = Date.now();
          while (Date.now() - start < t) {
            // wait
          }
          console.log("Timer done");
        }
      `,
      logs: true,
      checks: [
        { label: "sleep(300) waits at least 300 ms", run: `const s = Date.now(); sleep(300); return Date.now() - s >= 300;` },
        { label: "sleep(0) still logs both messages", run: `_t.clearLogs(); sleep(0); return _t.logs();` },
      ],
    },
    {
      key: "complex",
      title: "Collatz",
      points: 10,
      prompt: `The Collatz rule: if <code>n</code> is even, halve it; if odd, make it <code>3n + 1</code>. Repeat until
        you reach 1.
        <ul>
          <li><code>nextCollatz(n)</code> returns the next number.</li>
          <li><code>collatzSteps(n)</code> returns how many steps it takes to reach 1 (<code>collatzSteps(1)</code> is 0;
          <code>collatzSteps(6)</code> is 8: 6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1).</li>
          <li><code>collatzPath(n)</code> returns the whole path as a string joined by <code>" → "</code>, e.g.
          <code>"6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1"</code>.</li>
          <li><code>longestUnder(limit)</code> returns the starting number below <code>limit</code> with the most steps
          (the smallest such number if there's a tie).</li>
        </ul>`,
      hint: `<code>collatzSteps</code> and <code>collatzPath</code> are both <code>while (n !== 1)</code> loops calling
        <code>nextCollatz</code>. <code>longestUnder</code> loops over every start and keeps the best so far.`,
      starter: `
        function nextCollatz(n) {

        }

        function collatzSteps(n) {

        }

        function collatzPath(n) {

        }

        function longestUnder(limit) {

        }
      `,
      solution: `
        function nextCollatz(n) {
          return n % 2 === 0 ? n / 2 : 3 * n + 1;
        }

        function collatzSteps(n) {
          let steps = 0;
          while (n !== 1) {
            n = nextCollatz(n);
            steps++;
          }
          return steps;
        }

        function collatzPath(n) {
          let path = String(n);
          while (n !== 1) {
            n = nextCollatz(n);
            path += " → " + n;
          }
          return path;
        }

        function longestUnder(limit) {
          let best = 1;
          for (let start = 1; start < limit; start++) {
            if (collatzSteps(start) > collatzSteps(best)) {
              best = start;
            }
          }
          return best;
        }
      `,
      checks: [
        { expr: "nextCollatz(6)" }, { expr: "nextCollatz(7)" },
        { expr: "collatzSteps(1)" }, { expr: "collatzSteps(6)" }, { expr: "collatzSteps(27)" },
        { expr: "collatzPath(6)" }, { expr: "collatzPath(1)" },
        { expr: "longestUnder(10)" }, { expr: "longestUnder(100)" },
      ],
    },
  ],
};
