// Lab 17 — Functions as Data, Recursion & Arrows. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-17",
  title: "Functional Toolkit",
  lesson: "17-functional",
  lessonTitle: "Functions as Data, Recursion & Arrow Functions",
  intro: `<p>Pass functions around, compose them, and solve problems recursively. Where a prompt says
    <em>recursively</em>, the function must call itself instead of using a loop.</p>`,
  problems: [
    {
      key: "simple",
      title: "Pipelines",
      points: 10,
      prompt: `Write <code>pipeline(...fns)</code>: it returns a new function that passes its argument through each function
        in turn, <strong>left to right</strong>. <code>pipeline(x =&gt; x + 1, x =&gt; x * 10)(2)</code> is 30. With no functions,
        it returns its argument unchanged. (<code>...fns</code> collects all the arguments into an array.)`,
      starter: `
        function pipeline(...fns) {

        }
      `,
      solution: `
        function pipeline(...fns) {
          return x => fns.reduce((value, f) => f(value), x);
        }
      `,
      checks: [
        { expr: "pipeline(x => x + 1, x => x * 10)(2)" }, { expr: "pipeline(x => x * 10, x => x + 1)(2)" },
        { expr: "pipeline()(7)" }, { expr: `pipeline(s => s.trim(), s => s.toUpperCase(), s => s + "!")("  hi ")` },
      ],
    },
    {
      key: "moderate",
      title: "Binary search",
      points: 10,
      prompt: `Write <code>binarySearch(sorted, target, lo = 0, hi = sorted.length - 1)</code> <strong>recursively</strong>.
        It returns an index where <code>target</code> appears in the ascending array <code>sorted</code>, or <code>-1</code>.
        Look at the middle element <code>mid = Math.floor((lo + hi) / 2)</code>: if it's the target, return
        <code>mid</code>; if the target is smaller, search the left half; otherwise the right half. The base case is an empty
        range (<code>lo &gt; hi</code>). Also write <code>countCalls(sorted, target)</code>, returning how many times
        <code>binarySearch</code> is called in total for one search (hint: wrap it, or count in a variable outside).`,
      starter: `
        function binarySearch(sorted, target, lo = 0, hi = sorted.length - 1) {

        }

        function countCalls(sorted, target) {

        }
      `,
      solution: `
        let calls = 0;

        function binarySearch(sorted, target, lo = 0, hi = sorted.length - 1) {
          calls++;
          if (lo > hi) {
            return -1;
          }
          const mid = Math.floor((lo + hi) / 2);
          if (sorted[mid] === target) {
            return mid;
          }
          if (target < sorted[mid]) {
            return binarySearch(sorted, target, lo, mid - 1);
          }
          return binarySearch(sorted, target, mid + 1, hi);
        }

        function countCalls(sorted, target) {
          calls = 0;
          binarySearch(sorted, target);
          return calls;
        }
      `,
      checks: [
        { expr: "binarySearch([1, 3, 5, 7, 9, 11], 7)" }, { expr: "binarySearch([1, 3, 5, 7, 9, 11], 1)" }, { expr: "binarySearch([1, 3, 5, 7, 9, 11], 4)" },
        { expr: "binarySearch([], 4)" },
        { label: "found in 1000 sorted numbers", run: "const a = Array.from({ length: 1000 }, (_, i) => i * 2); return binarySearch(a, 1234);" },
        { label: "calls for 1000 numbers, missing value", run: "const a = Array.from({ length: 1000 }, (_, i) => i * 2); return countCalls(a, 1235);" },
        { expr: "countCalls([1, 3, 5, 7, 9, 11], 5)" },
      ],
    },
    {
      key: "complex",
      title: "Expression evaluator",
      points: 10,
      prompt: `Extend the lesson's evaluator.
        <ul>
          <li><code>OPS</code> — an object mapping <code>"+"</code>, <code>"-"</code>, <code>"*"</code>, <code>"/"</code> and
          <code>"**"</code> to arrow functions.</li>
          <li><code>tokenize(text)</code> — split <code>"1 + 2 * 3"</code> on spaces into <code>[1, "+", 2, "*", 3]</code>, turning
          the numbers (every other token) into numbers.</li>
          <li><code>evaluate(tokens)</code> — <strong>recursively</strong> combine the first three tokens
          (<em>number, operator, number</em>) into one number and evaluate the shorter array, strictly left to right; a single
          number is the base case. If an operator isn't in <code>OPS</code>, throw <code>new Error("unknown operator OP")</code>.</li>
          <li><code>calculate(text)</code> — tokenize and evaluate, returning the number, or the string <code>"error: MESSAGE"</code>
          if evaluation threw.</li>
        </ul>`,
      starter: `
        const OPS = {

        };

        function tokenize(text) {

        }

        function evaluate(tokens) {

        }

        function calculate(text) {

        }
      `,
      solution: `
        const OPS = {
          "+": (a, b) => a + b,
          "-": (a, b) => a - b,
          "*": (a, b) => a * b,
          "/": (a, b) => a / b,
          "**": (a, b) => a ** b,
        };

        function tokenize(text) {
          return text.trim().split(" ").map((t, i) => (i % 2 === 0 ? Number(t) : t));
        }

        function evaluate(tokens) {
          if (tokens.length === 1) {
            return tokens[0];
          }
          const [a, op, b, ...rest] = tokens;
          const f = OPS[op];
          if (!f) {
            throw new Error("unknown operator " + op);
          }
          return evaluate([f(a, b), ...rest]);
        }

        function calculate(text) {
          try {
            return evaluate(tokenize(text));
          } catch (e) {
            return "error: " + e.message;
          }
        }
      `,
      checks: [
        { expr: `OPS["**"](2, 5)` }, { expr: `tokenize("1 + 2 * 3")` }, { expr: `tokenize("42")` },
        { expr: `evaluate([1, "+", 2, "*", 3, "+", 4])` }, { expr: `evaluate([7])` },
        { label: "evaluate throws on an unknown operator", run: `try { evaluate([1, "%", 2]); return "no error"; } catch (e) { return e.message; }` },
        { expr: `calculate("1 + 2 * 3 + 4")` }, { expr: `calculate("2 ** 3 - 1")` }, { expr: `calculate("10 / 4")` }, { expr: `calculate("5 x 2")` },
      ],
    },
  ],
};
