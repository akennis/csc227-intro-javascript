// Lab 03 — Functions. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-03",
  title: "Functions",
  lesson: "03-functions",
  lessonTitle: "Functions",
  intro: `
    <p>Each problem asks for functions with exact names and parameters. The tests call your functions with
    several inputs, so make them <strong>return</strong> their results (don't just log them), and build bigger
    functions out of smaller ones.</p>`,
  problems: [
    {
      key: "simple",
      title: "Kelvin",
      points: 10,
      prompt: `Write <code>cToK(c)</code>, converting Celsius to Kelvin (add 273.15), and <code>kToC(k)</code>,
        the reverse.`,
      starter: `
        function cToK(c) {

        }

        function kToC(k) {

        }
      `,
      solution: `
        function cToK(c) {
          return c + 273.15;
        }

        function kToC(k) {
          return k - 273.15;
        }
      `,
      checks: [
        { expr: "cToK(0)" }, { expr: "cToK(-273.15)" }, { expr: "cToK(100)" },
        { expr: "kToC(0)" }, { expr: "kToC(300)" },
        { label: "kToC(cToK(37)) is 37 again", expr: "kToC(cToK(37))" },
      ],
    },
    {
      key: "moderate",
      title: "Checkout total",
      points: 10,
      prompt: `Write <code>roundCents(amount)</code>, which rounds to 2 decimal places
        (<code>Math.round(amount * 100) / 100</code>), and <code>finalPrice(price, quantity, taxRate = 0.08)</code>,
        which returns price × quantity plus tax at <code>taxRate</code>, rounded with <code>roundCents</code>. The tax
        rate is optional and defaults to 8%.`,
      starter: `
        function roundCents(amount) {

        }

        function finalPrice(price, quantity, taxRate = 0.08) {

        }
      `,
      solution: `
        function roundCents(amount) {
          return Math.round(amount * 100) / 100;
        }

        function finalPrice(price, quantity, taxRate = 0.08) {
          const subtotal = price * quantity;
          return roundCents(subtotal * (1 + taxRate));
        }
      `,
      checks: [
        { expr: "roundCents(3.14159)" }, { expr: "roundCents(2.005 + 0.001)" },
        { expr: "finalPrice(10, 2)" }, { expr: "finalPrice(3.49, 4)" },
        { expr: "finalPrice(19.99, 3, 0)" }, { expr: "finalPrice(5, 5, 0.1)" },
      ],
    },
    {
      key: "complex",
      title: "Running pace",
      points: 10,
      prompt: `Build a race report from small functions:
        <ul>
          <li><code>toSeconds(h, m, s)</code> — total seconds.</li>
          <li><code>twoDigits(n)</code> — <code>"07"</code> for 7, <code>"42"</code> for 42.</li>
          <li><code>formatTime(totalSeconds)</code> — <code>"h:mm:ss"</code>, e.g. 3070 → <code>"0:51:10"</code>.</li>
          <li><code>paceSeconds(distanceKm, totalSeconds)</code> — seconds per km, rounded with <code>Math.round</code>.</li>
          <li><code>formatPace(secondsPerKm)</code> — <code>"m:ss /km"</code>, e.g. 307 → <code>"5:07 /km"</code>.</li>
          <li><code>raceReport(distanceKm, h, m, s)</code> — e.g. <code>raceReport(10, 0, 51, 10)</code> returns
          <code>"10 km in 0:51:10 — pace 5:07 /km"</code> (that's an em dash: copy it from here). It must use the other functions.</li>
        </ul>`,
      hint: `Write and test them in order — each one only needs the ones above it. Minutes are
        <code>Math.floor(x / 60)</code> and leftover seconds are <code>x % 60</code>.`,
      starter: `
        function toSeconds(h, m, s) {

        }

        function twoDigits(n) {

        }

        function formatTime(totalSeconds) {

        }

        function paceSeconds(distanceKm, totalSeconds) {

        }

        function formatPace(secondsPerKm) {

        }

        function raceReport(distanceKm, h, m, s) {

        }
      `,
      solution: `
        function toSeconds(h, m, s) {
          return h * 3600 + m * 60 + s;
        }

        function twoDigits(n) {
          return String(n).padStart(2, "0");
        }

        function formatTime(totalSeconds) {
          const h = Math.floor(totalSeconds / 3600);
          const m = Math.floor((totalSeconds % 3600) / 60);
          const s = totalSeconds % 60;
          return h + ":" + twoDigits(m) + ":" + twoDigits(s);
        }

        function paceSeconds(distanceKm, totalSeconds) {
          return Math.round(totalSeconds / distanceKm);
        }

        function formatPace(secondsPerKm) {
          return Math.floor(secondsPerKm / 60) + ":" + twoDigits(secondsPerKm % 60) + " /km";
        }

        function raceReport(distanceKm, h, m, s) {
          const total = toSeconds(h, m, s);
          return distanceKm + " km in " + formatTime(total) + " — pace " + formatPace(paceSeconds(distanceKm, total));
        }
      `,
      checks: [
        { expr: "toSeconds(1, 2, 3)" }, { expr: "twoDigits(7)" }, { expr: "twoDigits(42)" },
        { expr: "formatTime(3070)" }, { expr: "formatTime(7384)" },
        { expr: "paceSeconds(10, 3070)" }, { expr: "formatPace(307)" }, { expr: "formatPace(600)" },
        { expr: "raceReport(10, 0, 51, 10)" }, { expr: "raceReport(42.195, 3, 30, 0)" },
      ],
    },
  ],
};
