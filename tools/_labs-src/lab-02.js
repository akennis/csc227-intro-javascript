// Lab 02 — Values, Types & Variables. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-02",
  title: "Values, Types & Variables",
  lesson: "02-values-variables",
  lessonTitle: "Values, Types & Variables",
  intro: `
    <p>These problems practise declaring variables with <code>const</code> and <code>let</code>,
    reading their types with <code>typeof</code>, converting text to numbers, and staying inside the
    rules of block scope. The tests read the variables your program leaves behind, so <strong>use
    exactly the variable names given</strong>.</p>`,
  problems: [
    {
      key: "simple",
      title: "Describe a dog",
      points: 10,
      prompt: `
        Declare three variables that describe a dog:
        <ul>
          <li><code>dogName</code> — the string <code>"Rover"</code>; it never changes, so use <code>const</code>.</li>
          <li><code>dogAge</code> — the number <code>8</code>; it will change, so use <code>let</code>.</li>
          <li><code>isGoodDog</code> — the boolean <code>true</code>, declared with <code>const</code>.</li>
        </ul>
        Then it's Rover's birthday: on a new line, <strong>reassign</strong> <code>dogAge</code> so it is one
        more than before (don't just type <code>9</code> — add 1 to the current value). Finally declare
        <code>const ageType = typeof dogAge;</code>.`,
      starter: `
        // Declare dogName, dogAge, and isGoodDog here.

        // Happy birthday, Rover! Add 1 to dogAge.

        // Record the type of dogAge.
      `,
      solution: `
        const dogName = "Rover";
        let dogAge = 8;
        const isGoodDog = true;

        dogAge = dogAge + 1;

        const ageType = typeof dogAge;
      `,
      checks: [
        { expr: "dogName" },
        { expr: "dogAge" },
        { expr: "isGoodDog" },
        { expr: "ageType" },
        { label: "dogName is a const", run: `try { dogName = "Max"; return "it could be reassigned"; } catch (e) { return "const"; }` },
      ],
    },
    {
      key: "moderate",
      title: "Fix the broken total",
      points: 10,
      prompt: `
        This program is supposed to start a running <code>total</code> at 0, add 5, then add a
        <code>bonus</code> of 10, and finally build <code>message</code>, which should be
        <code>"Total: 15"</code>. It has <strong>two</strong> bugs — one about <code>const</code> and one
        about scope. Run it, read the error, fix it, and repeat until the tests pass. Keep the same
        variable names.`,
      starter: `
        const total = 0;
        total = total + 5;
        {
          let bonus = 10;
        }
        total = total + bonus;
        const message = "Total: " + total;
      `,
      solution: `
        let total = 0;
        total = total + 5;
        const bonus = 10;
        total = total + bonus;
        const message = "Total: " + total;
      `,
      checks: [
        { expr: "total" },
        { expr: "typeof total" },
        { expr: "message" },
      ],
    },
    {
      key: "complex",
      title: "Minutes to hours",
      points: 10,
      prompt: `
        A form gave us a duration as <em>text</em>: <code>const minutesText = "750";</code> (keep that line).
        <ol>
          <li>Convert it to a number in <code>totalMinutes</code>.</li>
          <li>Compute whole <code>hours</code> (use <code>Math.floor</code>) and the leftover
          <code>minutes</code> (use the remainder operator <code>%</code>).</li>
          <li>Build <code>report</code> — exactly <code>"750 minutes is 12 hours and 30 minutes"</code>,
          but computed from your variables, not typed in — and <code>console.log</code> it.</li>
        </ol>
        Your code should still be right if someone changes <code>"750"</code> to another number.`,
      hint: `<code>Number("750")</code> gives <code>750</code>. There are 60 minutes in an hour:
        <code>750 / 60</code> is <code>12.5</code>, <code>Math.floor(12.5)</code> is <code>12</code>, and
        <code>750 % 60</code> is <code>30</code>.`,
      starter: `
        const minutesText = "750";

        // your code here
      `,
      solution: `
        const minutesText = "750";

        const totalMinutes = Number(minutesText);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const report = totalMinutes + " minutes is " + hours + " hours and " + minutes + " minutes";
        console.log(report);
      `,
      logs: true,
      checks: [
        { expr: "totalMinutes" },
        { expr: "typeof totalMinutes" },
        { expr: "hours" },
        { expr: "minutes" },
        { label: "hours * 60 + minutes === totalMinutes", expr: "hours * 60 + minutes === totalMinutes" },
        { expr: "report" },
      ],
    },
  ],
};
