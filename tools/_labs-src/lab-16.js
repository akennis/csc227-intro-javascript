// Lab 16 — Multiple Returns & Errors. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-16",
  title: "Returns and Errors",
  lesson: "16-errors",
  lessonTitle: "Multiple Returns, Error Values & Exceptions",
  intro: `<p>Return several values with arrays and objects, report errors as values, and throw and catch exceptions. Error
    messages are checked exactly — copy them from the prompts.</p>`,
  problems: [
    {
      key: "simple",
      title: "Division with remainder",
      points: 10,
      prompt: `Write <code>divmod(a, b)</code> returning <code>[quotient, remainder]</code> for whole numbers
        (quotient rounded down), and <code>describeDivision(a, b)</code> that <strong>destructures</strong> the result of
        <code>divmod</code> and returns e.g. <code>"17 / 5 = 3 remainder 2"</code>.`,
      starter: `
        function divmod(a, b) {

        }

        function describeDivision(a, b) {

        }
      `,
      solution: `
        function divmod(a, b) {
          return [Math.floor(a / b), a % b];
        }

        function describeDivision(a, b) {
          const [q, r] = divmod(a, b);
          return a + " / " + b + " = " + q + " remainder " + r;
        }
      `,
      checks: [{ expr: "divmod(17, 5)" }, { expr: "divmod(20, 4)" }, { expr: "describeDivision(17, 5)" }, { expr: "describeDivision(3, 7)" }],
    },
    {
      key: "moderate",
      title: "Parsing dates, errors as values",
      points: 10,
      prompt: `Write <code>parseDate(text)</code> for dates written <code>YYYY-MM-DD</code>, in the errors-as-values style.
        On success return <code>[undefined, { year, month, day }]</code> (numbers). Otherwise return
        <code>[message, undefined]</code> with the <em>first</em> problem found:
        <ul>
          <li><code>"bad format"</code> — not three parts separated by <code>-</code>, or the parts aren't 4, 2 and 2 digits;</li>
          <li><code>"bad month"</code> — month not 1–12;</li>
          <li><code>"bad day"</code> — day not 1–31.</li>
        </ul>
        Then write <code>describeDate(text)</code> that calls it and returns either the error message or
        <code>"day D of month M, YYYY"</code>.`,
      hint: `<code>text.split("-")</code> gives the parts. A part is all digits when
        <code>[...part].every(ch =&gt; "0123456789".includes(ch))</code>.`,
      starter: `
        function parseDate(text) {

        }

        function describeDate(text) {

        }
      `,
      solution: `
        function isDigits(s, length) {
          return s.length === length && [...s].every(ch => "0123456789".includes(ch));
        }

        function parseDate(text) {
          const parts = text.split("-");
          if (parts.length !== 3 || !isDigits(parts[0], 4) || !isDigits(parts[1], 2) || !isDigits(parts[2], 2)) {
            return ["bad format", undefined];
          }
          const [year, month, day] = parts.map(Number);
          if (month < 1 || month > 12) {
            return ["bad month", undefined];
          }
          if (day < 1 || day > 31) {
            return ["bad day", undefined];
          }
          return [undefined, { year, month, day }];
        }

        function describeDate(text) {
          const [err, date] = parseDate(text);
          if (err) {
            return err;
          }
          return "day " + date.day + " of month " + date.month + ", " + date.year;
        }
      `,
      checks: [
        { expr: `parseDate("2024-09-16")` }, { expr: `parseDate("2024-9-16")` }, { expr: `parseDate("2024/09/16")` },
        { expr: `parseDate("2024-13-01")` }, { expr: `parseDate("2024-00-10")` }, { expr: `parseDate("2024-02-32")` }, { expr: `parseDate("20x4-02-03")` },
        { expr: `describeDate("2024-11-04")` }, { expr: `describeDate("2024-11-40")` },
      ],
    },
    {
      key: "complex",
      title: "Processing orders",
      points: 10,
      prompt: `An inventory maps item names to quantities. Write <code>reserve(inventory, item, qty)</code>, which throws
        <code>new Error("unknown item ITEM")</code> if the item isn't in the inventory, throws
        <code>new Error("insufficient ITEM")</code> if there aren't <code>qty</code> left, and otherwise subtracts
        <code>qty</code>. Then write <code>processOrders(orders, inventory)</code> for an array of <code>{ item, qty }</code>:
        try to reserve each one, and return <code>{ filled, failed }</code> — <code>filled</code> an array of the item names
        reserved, <code>failed</code> an array of <code>{ item, reason }</code> where <code>reason</code> is the error's message.
        A failed order must not change the inventory; later orders are still processed.`,
      starter: `
        function reserve(inventory, item, qty) {

        }

        function processOrders(orders, inventory) {

        }
      `,
      solution: `
        function reserve(inventory, item, qty) {
          if (!(item in inventory)) {
            throw new Error("unknown item " + item);
          }
          if (inventory[item] < qty) {
            throw new Error("insufficient " + item);
          }
          inventory[item] -= qty;
        }

        function processOrders(orders, inventory) {
          const filled = [];
          const failed = [];
          for (const { item, qty } of orders) {
            try {
              reserve(inventory, item, qty);
              filled.push(item);
            } catch (e) {
              failed.push({ item, reason: e.message });
            }
          }
          return { filled, failed };
        }
      `,
      checks: [
        { label: "reserve throws for unknown", run: `try { reserve({ a: 1 }, "b", 1); return "no error"; } catch (e) { return e.message; }` },
        { label: "reserve throws for insufficient", run: `const inv = { a: 1 }; try { reserve(inv, "a", 2); return "no error"; } catch (e) { return [e.message, inv]; }` },
        { label: "a mixed batch", run: `const inv = { pens: 10, pads: 1 }; const r = processOrders([{ item: "pens", qty: 3 }, { item: "pads", qty: 2 }, { item: "ink", qty: 1 }, { item: "pads", qty: 1 }, { item: "pens", qty: 7 }], inv); return [r, inv];` },
        { label: "no orders", run: `return processOrders([], {});` },
      ],
    },
  ],
};
