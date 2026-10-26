// Lab 04 — The Console & the Debugger. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-04",
  title: "Find and Fix",
  lesson: "04-console-debugger",
  lessonTitle: "The Console & the Debugger",
  intro: `
    <p>Every starter program here is broken. Use what you learned: run it, read the error type, message, and
    line; log values or set a <code>debugger;</code> breakpoint to find logic errors; and fix one thing at a
    time. Keep the function names. Remove any debugging <code>console.log</code> lines before you submit — some
    tests compare console output.</p>`,
  problems: [
    {
      key: "simple",
      title: "Full name",
      points: 10,
      prompt: `<code>fullName("Ada", "Lovelace")</code> should return <code>"Ada Lovelace"</code>. There are two bugs.`,
      starter: `
        function fullName(first, last) {
          return frist + last;
        }
      `,
      solution: `
        function fullName(first, last) {
          return first + " " + last;
        }
      `,
      checks: [{ expr: `fullName("Ada", "Lovelace")` }, { expr: `fullName("Alan", "Turing")` }],
    },
    {
      key: "moderate",
      title: "Grade average",
      points: 10,
      prompt: `<code>average3(a, b, c)</code> receives three scores <em>typed into a form</em> (strings) and
        should return their numeric average, rounded to one decimal place: <code>average3("80", "91", "100")</code>
        is <code>90.3</code>. Three bugs.`,
      starter: `
        function average3(a, b, c) {
          const total = a + b + c;
          const avg = total / 3
          return Math.round(avg * 10 / 10);
        }
      `,
      solution: `
        function average3(a, b, c) {
          const total = Number(a) + Number(b) + Number(c);
          const avg = total / 3;
          return Math.round(avg * 10) / 10;
        }
      `,
      hint: `Log <code>total</code> first. Then read the last line slowly: where do the parentheses close?`,
      checks: [
        { expr: `average3("80", "91", "100")` }, { expr: `average3("70", "70", "70")` },
        { expr: `average3("0", "50", "100")` }, { expr: `typeof average3("1", "2", "3")` },
      ],
    },
    {
      key: "complex",
      title: "Shipping calculator",
      points: 10,
      prompt: `This program prices a parcel: <code>poundsToKg</code> converts (1 lb = 0.4536 kg), <code>baseCost</code> is
        $4 plus $2.50 per kg, <code>withFuel</code> adds a 10% fuel surcharge, and <code>quote</code> returns the cost
        rounded to cents as a string with a dollar sign. It should finally print exactly <code>Quote: $16.47</code>
        for a 9 lb parcel. There are <strong>four</strong> bugs — some throw errors, some just give wrong answers.`,
      starter: `
        function poundsToKg(lb) {
          return lb / 0.4536;
        }

        function baseCost(kg) {
          const perKg = 2.5;
          perKg = perKg * 1;
          return 4 + perKg * kg;
        }

        function withFuel(cost) {
          const surcharge = cost * 0.10;
          cost + surcharge;
        }

        function quote(lb) {
          const cost = withFuel(baseCost(poundsToKg(lb)));
          return "$" + cost.toFixed(2);
        }

        console.log("Quote: " + Quote(9));
      `,
      solution: `
        function poundsToKg(lb) {
          return lb * 0.4536;
        }

        function baseCost(kg) {
          const perKg = 2.5;
          return 4 + perKg * kg;
        }

        function withFuel(cost) {
          const surcharge = cost * 0.10;
          return cost + surcharge;
        }

        function quote(lb) {
          const cost = withFuel(baseCost(poundsToKg(lb)));
          return "$" + cost.toFixed(2);
        }

        console.log("Quote: " + quote(9));
      `,
      logs: true,
      checks: [
        { expr: "poundsToKg(10)" }, { expr: "baseCost(2)" }, { expr: "withFuel(10)" },
        { expr: "quote(9)" }, { expr: "quote(1)" },
      ],
    },
  ],
};
