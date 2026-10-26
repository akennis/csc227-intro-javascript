// Lab 08 — Strings. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-08",
  title: "Strings",
  lesson: "08-strings",
  lessonTitle: "Strings",
  intro: `<p>Searching, slicing, and reshaping text. Each function receives a string and returns a new one (or a
    boolean); none of them should print anything.</p>`,
  problems: [
    {
      key: "simple",
      title: "Reverse the words",
      points: 10,
      prompt: `Write <code>reverseWords(sentence)</code> returning the words in reverse order:
        <code>reverseWords("the dog is funny")</code> is <code>"funny is dog the"</code>. Words are separated by single
        spaces; ignore leading and trailing spaces.`,
      starter: `
        function reverseWords(sentence) {

        }
      `,
      solution: `
        function reverseWords(sentence) {
          return sentence.trim().split(" ").reverse().join(" ");
        }
      `,
      checks: [
        { expr: `reverseWords("the dog is funny")` }, { expr: `reverseWords("  hello world ")` }, { expr: `reverseWords("one")` },
      ],
    },
    {
      key: "moderate",
      title: "Is it an email address?",
      points: 10,
      prompt: `Write <code>isValidEmail(s)</code> using these (simplified) rules. It is valid only if:
        <ul>
          <li>it contains no spaces;</li>
          <li>it contains exactly one <code>@</code>, which is neither the first nor the last character;</li>
          <li>the part after the <code>@</code> contains a <code>.</code> that is not its first or last character.</li>
        </ul>`,
      hint: `<code>s.indexOf("@") === s.lastIndexOf("@")</code> means there's at most one. Split into
        <code>name</code> and <code>domain</code> with <code>slice</code>, then check the domain.`,
      starter: `
        function isValidEmail(s) {

        }
      `,
      solution: `
        function isValidEmail(s) {
          if (s.includes(" ")) {
            return false;
          }
          const at = s.indexOf("@");
          if (at <= 0 || at !== s.lastIndexOf("@") || at === s.length - 1) {
            return false;
          }
          const domain = s.slice(at + 1);
          const dot = domain.indexOf(".");
          return dot > 0 && !domain.endsWith(".");
        }
      `,
      checks: [
        { expr: `isValidEmail("ada@example.com")` }, { expr: `isValidEmail("a.b@x.co.uk")` },
        { expr: `isValidEmail("ada@example")` }, { expr: `isValidEmail("@example.com")` }, { expr: `isValidEmail("ada@")` },
        { expr: `isValidEmail("ada@@example.com")` }, { expr: `isValidEmail("ada@.com")` }, { expr: `isValidEmail("ada@example.")` },
        { expr: `isValidEmail("ada lovelace@example.com")` },
      ],
    },
    {
      key: "complex",
      title: "Phone numbers",
      points: 10,
      prompt: `Write <code>digitsOnly(s)</code>, returning just the digit characters of <code>s</code>, and
        <code>formatPhone(s)</code>, which formats a US phone number typed in any style:
        <ul>
          <li>10 digits → <code>"(845) 555-0123"</code></li>
          <li>11 digits starting with 1 → <code>"+1 (845) 555-0123"</code></li>
          <li>anything else → <code>"invalid"</code></li>
        </ul>
        So <code>formatPhone("845.555.0123")</code>, <code>formatPhone(" (845)5550123")</code> and
        <code>formatPhone("845-555-0123")</code> all give <code>"(845) 555-0123"</code>.`,
      hint: `A character <code>ch</code> is a digit when <code>"0123456789".includes(ch)</code>. Once you have the 10
        digits, <code>slice(0, 3)</code>, <code>slice(3, 6)</code> and <code>slice(6)</code> are the three parts.`,
      starter: `
        function digitsOnly(s) {

        }

        function formatPhone(s) {

        }
      `,
      solution: `
        function digitsOnly(s) {
          let digits = "";
          for (const ch of s) {
            if ("0123456789".includes(ch)) {
              digits += ch;
            }
          }
          return digits;
        }

        function formatTen(d) {
          return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
        }

        function formatPhone(s) {
          const d = digitsOnly(s);
          if (d.length === 10) {
            return formatTen(d);
          }
          if (d.length === 11 && d[0] === "1") {
            return "+1 " + formatTen(d.slice(1));
          }
          return "invalid";
        }
      `,
      checks: [
        { expr: `digitsOnly("a1b2c3")` }, { expr: `digitsOnly("no digits")` },
        { expr: `formatPhone("845.555.0123")` }, { expr: `formatPhone(" (845)5550123")` }, { expr: `formatPhone("845-555-0123")` },
        { expr: `formatPhone("1 845 555 0123")` }, { expr: `formatPhone("2 845 555 0123")` }, { expr: `formatPhone("555-0123")` },
      ],
    },
  ],
};
