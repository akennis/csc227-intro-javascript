// Lab 07 — JavaScript in the Page. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-07",
  title: "Forms and Buttons",
  lesson: "07-js-in-the-page",
  lessonTitle: "JavaScript in the Page",
  intro: `
    <p>Each problem gives you a small page (its HTML is shown above the editor). Your JavaScript reads the inputs when a
    button is clicked and writes results back. The tests type into the inputs and click the buttons for you; use the
    ids and function names exactly as given.</p>`,
  problems: [
    {
      key: "simple",
      title: "Add numbers",
      points: 10,
      prompt: `The button calls <code>addNumbersOnClickHandler()</code>. Write it, plus a pure helper
        <code>addNumbers(x, y)</code>, so that clicking puts the sum of <code>#arg1</code> and <code>#arg2</code> into
        <code>#res</code>.`,
      html: `
        <input id="arg1" type="text" placeholder="arg1"><br>
        <input id="arg2" type="text" placeholder="arg2"><br>
        <button onclick="addNumbersOnClickHandler()">Add numbers</button><br>
        <input id="res" type="text">`,
      starter: `
        function addNumbers(x, y) {

        }

        function addNumbersOnClickHandler() {

        }
      `,
      solution: `
        function addNumbers(x, y) {
          return x + y;
        }

        function addNumbersOnClickHandler() {
          const arg1 = Number(document.getElementById("arg1").value);
          const arg2 = Number(document.getElementById("arg2").value);
          document.getElementById("res").value = addNumbers(arg1, arg2);
        }
      `,
      checks: [
        { expr: "addNumbers(2, 3)" },
        { label: "2 + 3 in the page", run: `_t.type("#arg1", 2); _t.type("#arg2", 3); _t.click("button"); return _t.value("#res");` },
        { label: "1.5 + -4 in the page", run: `_t.type("#arg1", 1.5); _t.type("#arg2", -4); _t.click("button"); return _t.value("#res");` },
      ],
    },
    {
      key: "moderate",
      title: "Average of what was entered",
      points: 10,
      prompt: `The page has inputs <code>#in1</code> … <code>#in10</code>. Write <code>average()</code> (the button calls
        it) to show, in <code>#avg</code>, the average of only the inputs the user actually filled in, with 2 decimal
        places (<code>toFixed(2)</code>). Ignore boxes containing only spaces. If nothing was entered, show
        <code>no values</code>.`,
      html: `
        <input id="in1"> <input id="in2"> <input id="in3"> <input id="in4"> <input id="in5"><br>
        <input id="in6"> <input id="in7"> <input id="in8"> <input id="in9"> <input id="in10"><br>
        <button onclick="average()">Average</button>
        <p id="avg"></p>`,
      starter: `
        function average() {

        }
      `,
      solution: `
        function average() {
          let total = 0;
          let count = 0;
          for (let i = 1; i <= 10; i++) {
            const text = document.getElementById("in" + i).value.trim();
            if (text !== "") {
              total += Number(text);
              count++;
            }
          }
          document.getElementById("avg").textContent = count === 0 ? "no values" : (total / count).toFixed(2);
        }
      `,
      checks: [
        { label: "1, 2 and 4 in boxes 1, 5, 10", run: `_t.type("#in1", 1); _t.type("#in5", 2); _t.type("#in10", 4); _t.click("button"); return _t.text("#avg");` },
        { label: "spaces only", run: `for (let i = 1; i <= 10; i++) _t.type("#in" + i, " "); _t.click("button"); return _t.text("#avg");` },
        { label: "all ten: 1..10", run: `for (let i = 1; i <= 10; i++) _t.type("#in" + i, i); _t.click("button"); return _t.text("#avg");` },
      ],
    },
    {
      key: "complex",
      title: "Unit converter",
      points: 10,
      prompt: `Write <code>convert()</code> (the button calls it). Read a length from <code>#amount</code>, the unit it's in
        from <code>#from</code>, and the unit wanted from <code>#to</code>. Show the answer in <code>#out</code> as
        <code>AMOUNT FROM = RESULT TO</code> with the result to 3 decimal places — for example
        <code>5 km = 3.107 mi</code>. If the amount is empty or not a number, show <code>Enter a number</code>.
        Use an object mapping each unit to its size in metres: m = 1, km = 1000, ft = 0.3048, mi = 1609.344.`,
      html: `
        <input id="amount" value="5">
        <select id="from"><option>m</option><option selected>km</option><option>ft</option><option>mi</option></select>
        to
        <select id="to"><option>m</option><option>km</option><option>ft</option><option selected>mi</option></select>
        <button onclick="convert()">Convert</button>
        <p id="out"></p>`,
      hint: `Convert to metres first (multiply by the "from" size), then to the target unit (divide by the "to" size).`,
      starter: `
        const METRES = { m: 1, km: 1000, ft: 0.3048, mi: 1609.344 };

        function convert() {

        }
      `,
      solution: `
        const METRES = { m: 1, km: 1000, ft: 0.3048, mi: 1609.344 };

        function convert() {
          const text = document.getElementById("amount").value.trim();
          const amount = Number(text);
          const out = document.getElementById("out");
          if (text === "" || Number.isNaN(amount)) {
            out.textContent = "Enter a number";
            return;
          }
          const from = document.getElementById("from").value;
          const to = document.getElementById("to").value;
          const result = amount * METRES[from] / METRES[to];
          out.textContent = amount + " " + from + " = " + result.toFixed(3) + " " + to;
        }
      `,
      checks: [
        { label: "5 km to mi", run: `_t.click("button"); return _t.text("#out");` },
        { label: "100 ft to m", run: `_t.type("#amount", 100); _t.el("#from").value = "ft"; _t.el("#to").value = "m"; _t.click("button"); return _t.text("#out");` },
        { label: "1 mi to km", run: `_t.type("#amount", 1); _t.el("#from").value = "mi"; _t.el("#to").value = "km"; _t.click("button"); return _t.text("#out");` },
        { label: "abc", run: `_t.type("#amount", "abc"); _t.click("button"); return _t.text("#out");` },
        { label: "empty", run: `_t.type("#amount", ""); _t.click("button"); return _t.text("#out");` },
      ],
    },
  ],
};
