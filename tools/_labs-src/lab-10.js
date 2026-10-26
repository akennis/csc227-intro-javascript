// Lab 10 — Objects as Maps. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-10",
  title: "Objects as Maps",
  lesson: "10-objects-maps",
  lessonTitle: "Objects as Maps",
  intro: `<p>Counting, looking up, and summarising with key/value maps.</p>`,
  problems: [
    {
      key: "simple",
      title: "Word count",
      points: 10,
      prompt: `Write <code>wordCount(text)</code> returning an object that maps each word (lower-cased) to the number of
        times it appears. Words are separated by spaces; skip empty strings caused by extra spaces.
        <code>wordCount("The cat the  hat")</code> is <code>{the: 2, cat: 1, hat: 1}</code>.`,
      starter: `
        function wordCount(text) {

        }
      `,
      solution: `
        function wordCount(text) {
          const counts = {};
          for (const w of text.toLowerCase().split(" ")) {
            if (w !== "") {
              counts[w] = (counts[w] ?? 0) + 1;
            }
          }
          return counts;
        }
      `,
      checks: [{ expr: `wordCount("The cat the  hat")` }, { expr: `wordCount("")` }, { expr: `wordCount("a A a")` }],
    },
    {
      key: "moderate",
      title: "Most frequent and a histogram",
      points: 10,
      prompt: `Write <code>mostFrequent(items)</code>, returning the item that occurs most often in the array (the one seen
        first if there's a tie; <code>undefined</code> for an empty array), and <code>histogram(items)</code>, returning a
        string with one line per distinct item, sorted alphabetically, like <code>"a: ***"</code> — the item, a colon, a
        space, and one <code>*</code> per occurrence — lines joined with <code>"\\n"</code>.`,
      starter: `
        function mostFrequent(items) {

        }

        function histogram(items) {

        }
      `,
      solution: `
        function countAll(items) {
          const counts = {};
          for (const it of items) {
            counts[it] = (counts[it] ?? 0) + 1;
          }
          return counts;
        }

        function mostFrequent(items) {
          const counts = countAll(items);
          let best;
          for (const it of items) {
            if (best === undefined || counts[it] > counts[best]) {
              best = it;
            }
          }
          return best;
        }

        function histogram(items) {
          const counts = countAll(items);
          return Object.keys(counts).sort().map(k => k + ": " + "*".repeat(counts[k])).join("\\n");
        }
      `,
      checks: [
        { expr: `mostFrequent(["b", "a", "b", "c", "a", "b"])` }, { expr: `mostFrequent(["x", "y"])` }, { expr: `mostFrequent([])` },
        { expr: `histogram(["b", "a", "b", "c", "a", "b"])` }, { expr: `histogram(["solo"])` },
      ],
    },
    {
      key: "complex",
      title: "Gradebook",
      points: 10,
      prompt: `A gradebook is an object mapping student names to arrays of scores, e.g.
        <code>{ Ada: [90, 95], Alan: [70] }</code>. Write:
        <ul>
          <li><code>addGrade(book, name, score)</code> — changes <code>book</code>, creating the student's array if needed.</li>
          <li><code>averages(book)</code> — a new object mapping each name to their average, rounded to 1 decimal place
          (<code>Math.round(x * 10) / 10</code>). A student with no scores averages 0.</li>
          <li><code>honorRoll(book, min)</code> — an array of names whose average is at least <code>min</code>, sorted
          alphabetically.</li>
        </ul>`,
      starter: `
        function addGrade(book, name, score) {

        }

        function averages(book) {

        }

        function honorRoll(book, min) {

        }
      `,
      solution: `
        function addGrade(book, name, score) {
          if (!(name in book)) {
            book[name] = [];
          }
          book[name].push(score);
        }

        function averages(book) {
          const result = {};
          for (const [name, scores] of Object.entries(book)) {
            const avg = scores.length === 0 ? 0 : scores.reduce((s, x) => s + x, 0) / scores.length;
            result[name] = Math.round(avg * 10) / 10;
          }
          return result;
        }

        function honorRoll(book, min) {
          const avgs = averages(book);
          return Object.keys(avgs).filter(name => avgs[name] >= min).sort();
        }
      `,
      checks: [
        { label: "addGrade builds the book", run: `const b = {}; addGrade(b, "Ada", 90); addGrade(b, "Ada", 95); addGrade(b, "Alan", 70); return b;` },
        { expr: `averages({ Ada: [90, 95], Alan: [70, 71, 73], Grace: [] })` },
        { expr: `honorRoll({ Zoe: [88, 92], Ada: [90, 95], Alan: [70] }, 90)` },
        { expr: `honorRoll({ Alan: [70] }, 90)` },
      ],
    },
  ],
};
