// Lab 05 — Booleans & Decisions. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-05",
  title: "Decisions",
  lesson: "05-decisions",
  lessonTitle: "Booleans & Decisions",
  intro: `
    <p>Practise comparisons, <code>&amp;&amp;</code>/<code>||</code>, and <code>if</code> / <code>else if</code> chains.
    The tests try the edge cases — exactly on a boundary, zero, negative numbers — so think about each one.</p>`,
  problems: [
    {
      key: "simple",
      title: "Teenager",
      points: 10,
      prompt: `Write <code>isTeen(age)</code>: <code>true</code> for ages 13 through 19 inclusive, otherwise
        <code>false</code>. Return the boolean expression directly.`,
      starter: `
        function isTeen(age) {

        }
      `,
      solution: `
        function isTeen(age) {
          return age >= 13 && age <= 19;
        }
      `,
      checks: [
        { expr: "isTeen(12)" }, { expr: "isTeen(13)" }, { expr: "isTeen(16)" },
        { expr: "isTeen(19)" }, { expr: "isTeen(20)" }, { expr: "isTeen(-1)" },
      ],
    },
    {
      key: "moderate",
      title: "Shipping rates",
      points: 10,
      prompt: `Write <code>shippingCost(weightKg, express)</code>. Parcels up to and including 1 kg cost 5; up to and
        including 5 kg cost 10; heavier ones cost 20. If <code>express</code> is <code>true</code>, the cost doubles.
        A weight of zero or less is invalid: return <code>-1</code>.`,
      starter: `
        function shippingCost(weightKg, express) {

        }
      `,
      solution: `
        function shippingCost(weightKg, express) {
          if (weightKg <= 0) {
            return -1;
          }
          let cost;
          if (weightKg <= 1) {
            cost = 5;
          } else if (weightKg <= 5) {
            cost = 10;
          } else {
            cost = 20;
          }
          return express ? cost * 2 : cost;
        }
      `,
      checks: [
        { expr: "shippingCost(0.5, false)" }, { expr: "shippingCost(1, false)" }, { expr: "shippingCost(1.01, false)" },
        { expr: "shippingCost(5, true)" }, { expr: "shippingCost(12, false)" }, { expr: "shippingCost(12, true)" },
        { expr: "shippingCost(0, false)" }, { expr: "shippingCost(-3, true)" },
      ],
    },
    {
      key: "complex",
      title: "Rock, paper, scissors",
      points: 10,
      prompt: `Write <code>rps(a, b)</code> for two players' choices, each <code>"rock"</code>, <code>"paper"</code>,
        or <code>"scissors"</code>. Return <code>"tie"</code>, <code>"a wins"</code>, or <code>"b wins"</code>. If either
        choice is not one of the three words, return <code>"invalid"</code>. (Rock beats scissors, scissors beats
        paper, paper beats rock.) Write a helper <code>isValid(choice)</code> and <code>beats(x, y)</code> (does
        <code>x</code> beat <code>y</code>?) and use them.`,
      starter: `
        function isValid(choice) {

        }

        function beats(x, y) {

        }

        function rps(a, b) {

        }
      `,
      solution: `
        function isValid(choice) {
          return choice === "rock" || choice === "paper" || choice === "scissors";
        }

        function beats(x, y) {
          return (x === "rock" && y === "scissors") ||
            (x === "scissors" && y === "paper") ||
            (x === "paper" && y === "rock");
        }

        function rps(a, b) {
          if (!isValid(a) || !isValid(b)) {
            return "invalid";
          } else if (a === b) {
            return "tie";
          } else if (beats(a, b)) {
            return "a wins";
          } else {
            return "b wins";
          }
        }
      `,
      checks: [
        { expr: `isValid("paper")` }, { expr: `isValid("lizard")` },
        { expr: `beats("rock", "scissors")` }, { expr: `beats("rock", "paper")` },
        { expr: `rps("rock", "rock")` }, { expr: `rps("rock", "scissors")` }, { expr: `rps("paper", "scissors")` },
        { expr: `rps("paper", "rock")` }, { expr: `rps("scissors", "rock")` }, { expr: `rps("rock", "Rock")` },
      ],
    },
  ],
};
