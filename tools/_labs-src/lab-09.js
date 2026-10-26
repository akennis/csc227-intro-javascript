// Lab 09 — Arrays. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-09",
  title: "Arrays",
  lesson: "09-arrays",
  lessonTitle: "Arrays",
  intro: `<p>Building, searching, sorting and reshaping arrays. Unless a problem says otherwise, return
    <strong>new</strong> arrays and leave the arrays you're given unchanged — some tests check that.</p>`,
  problems: [
    {
      key: "simple",
      title: "Above average",
      points: 10,
      prompt: `Write <code>average(nums)</code> (0 for an empty array) and <code>aboveAverage(nums)</code>, returning a
        new array of the elements strictly greater than the average, in their original order.`,
      starter: `
        function average(nums) {

        }

        function aboveAverage(nums) {

        }
      `,
      solution: `
        function average(nums) {
          if (nums.length === 0) {
            return 0;
          }
          return nums.reduce((s, n) => s + n, 0) / nums.length;
        }

        function aboveAverage(nums) {
          const avg = average(nums);
          return nums.filter(n => n > avg);
        }
      `,
      checks: [
        { expr: "average([1, 2, 3, 4])" }, { expr: "average([])" },
        { expr: "aboveAverage([1, 2, 3, 4])" }, { expr: "aboveAverage([5, 5, 5])" }, { expr: "aboveAverage([10, -10, 3])" },
      ],
    },
    {
      key: "moderate",
      title: "HighestInForm, extended",
      points: 10,
      prompt: `The page has inputs <code>#input0</code> … <code>#input9</code>. When <code>#go</code> is clicked, collect the
        numbers from the non-empty inputs into an array, then show the highest in <code>#highest</code>, the lowest in
        <code>#lowest</code>, and all of them sorted ascending, joined with <code>", "</code>, in <code>#sorted</code>. If
        no box is filled in, show <code>—</code> (an em dash) in all three.`,
      html: `
        <input id="input0"> <input id="input1"> <input id="input2"> <input id="input3"> <input id="input4"><br>
        <input id="input5"> <input id="input6"> <input id="input7"> <input id="input8"> <input id="input9"><br>
        <button id="go">Analyse</button>
        <p>Highest: <span id="highest"></span> · Lowest: <span id="lowest"></span></p>
        <p>Sorted: <span id="sorted"></span></p>`,
      hint: `Remember: <code>sort()</code> on its own sorts numbers as text. Use <code>(a, b) =&gt; a - b</code>.`,
      starter: `
        document.getElementById("go").addEventListener("click", () => {

        });
      `,
      solution: `
        function readValues() {
          const vals = [];
          for (let i = 0; i < 10; i++) {
            const v = document.getElementById("input" + i).value.trim();
            if (v !== "") {
              vals.push(Number(v));
            }
          }
          return vals;
        }

        document.getElementById("go").addEventListener("click", () => {
          const sorted = readValues().sort((a, b) => a - b);
          const show = (id, text) => { document.getElementById(id).textContent = text; };
          if (sorted.length === 0) {
            show("highest", "—");
            show("lowest", "—");
            show("sorted", "—");
            return;
          }
          show("highest", sorted[sorted.length - 1]);
          show("lowest", sorted[0]);
          show("sorted", sorted.join(", "));
        });
      `,
      checks: [
        { label: "12, 7, 105, 33", run: `_t.type("#input0", 12); _t.type("#input1", 7); _t.type("#input2", 105); _t.type("#input4", 33); _t.click("#go"); return [_t.text("#highest"), _t.text("#lowest"), _t.text("#sorted")];` },
        { label: "-3 and 2.5 only", run: `for (let i = 0; i < 10; i++) _t.type("#input" + i, ""); _t.type("#input9", -3); _t.type("#input3", 2.5); _t.click("#go"); return [_t.text("#highest"), _t.text("#lowest"), _t.text("#sorted")];` },
        { label: "nothing entered", run: `for (let i = 0; i < 10; i++) _t.type("#input" + i, ""); _t.click("#go"); return [_t.text("#highest"), _t.text("#lowest"), _t.text("#sorted")];` },
      ],
    },
    {
      key: "complex",
      title: "Reshaping",
      points: 10,
      prompt: `Write three functions that return new arrays:
        <ul>
          <li><code>chunk(arr, size)</code> — split into groups of <code>size</code>; the last group may be shorter.
          <code>chunk([1, 2, 3, 4, 5], 2)</code> is <code>[[1, 2], [3, 4], [5]]</code>.</li>
          <li><code>flatten(grid)</code> — join an array of arrays into one array.
          <code>flatten([[1, 2], [3], []])</code> is <code>[1, 2, 3]</code>.</li>
          <li><code>transpose(grid)</code> — swap rows and columns of a rectangular grid.
          <code>transpose([[1, 2, 3], [4, 5, 6]])</code> is <code>[[1, 4], [2, 5], [3, 6]]</code>.</li>
        </ul>
        Write the loops yourself (don't use the built-in <code>flat</code>).`,
      starter: `
        function chunk(arr, size) {

        }

        function flatten(grid) {

        }

        function transpose(grid) {

        }
      `,
      solution: `
        function chunk(arr, size) {
          const result = [];
          for (let i = 0; i < arr.length; i += size) {
            result.push(arr.slice(i, i + size));
          }
          return result;
        }

        function flatten(grid) {
          const result = [];
          for (const row of grid) {
            for (const v of row) {
              result.push(v);
            }
          }
          return result;
        }

        function transpose(grid) {
          const result = [];
          if (grid.length === 0) {
            return result;
          }
          for (let c = 0; c < grid[0].length; c++) {
            const column = [];
            for (let r = 0; r < grid.length; r++) {
              column.push(grid[r][c]);
            }
            result.push(column);
          }
          return result;
        }
      `,
      checks: [
        { expr: "chunk([1, 2, 3, 4, 5], 2)" }, { expr: "chunk([1, 2, 3], 3)" }, { expr: "chunk([], 4)" },
        { expr: "flatten([[1, 2], [3], []])" }, { expr: "flatten([])" },
        { expr: "transpose([[1, 2, 3], [4, 5, 6]])" }, { expr: "transpose([[1]])" },
        { label: "chunk leaves its input alone", run: "const a = [1, 2, 3]; chunk(a, 2); return a;" },
      ],
    },
  ],
};
