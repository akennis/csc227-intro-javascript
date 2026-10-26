// Lab 01 — Getting Started. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-01",
  title: "Hello, Pull Request",
  lesson: "01-getting-started",
  lessonTitle: "Getting Started: Git, GitHub & Karel",
  intro: `
    <p>This first lab is mostly about the <strong>workflow</strong>: solve three small printing problems, copy
    your submission, commit it on a branch called <code>lab-01</code> in your own repository, and open a pull
    request with your instructor as reviewer. The tests compare your console output with the expected output
    exactly — spelling, spaces, capitals, and punctuation all count.</p>`,
  problems: [
    {
      key: "simple",
      title: "Hello, world",
      points: 10,
      prompt: `Print exactly <code>Hello, world!</code>`,
      starter: `// your code here`,
      solution: `console.log("Hello, world!");`,
      logs: true,
      checks: [],
    },
    {
      key: "moderate",
      title: "A banner",
      points: 10,
      prompt: `Print this five-line banner exactly (the middle line has one space on each side of the text):
        <pre class="code" data-lang="text">**********
*        *
* CSC227 *
*        *
**********</pre>`,
      starter: `// your code here`,
      solution: `
        console.log("**********");
        console.log("*        *");
        console.log("* CSC227 *");
        console.log("*        *");
        console.log("**********");
      `,
      logs: true,
      checks: [],
    },
    {
      key: "complex",
      title: "The pull-request recipe",
      points: 10,
      prompt: `Print, one per line and in the right order, the seven commands you run to hand in this lab:
        <ol>
          <li>switch to the main branch;</li>
          <li>bring it up to date;</li>
          <li>create and switch to a new branch named <code>lab-01</code>;</li>
          <li>stage every changed file (use <code>.</code>);</li>
          <li>commit with the message <code>"Lab 01"</code> (double quotes);</li>
          <li>push the branch, setting its upstream: <code>git push -u origin lab-01</code>;</li>
          <li>open the pull request with the GitHub CLI, filling the title from the commit: <code>gh pr create --fill</code>.</li>
        </ol>
        Inside a JavaScript string, write the commit message's double quotes by using single quotes around the
        whole string: <code>console.log('git commit -m "Lab 01"');</code>`,
      hint: `The recipe is in the lesson, under <em>The command-line recipe</em>.`,
      starter: `// one console.log per command`,
      solution: `
        console.log("git checkout main");
        console.log("git pull");
        console.log("git checkout -b lab-01");
        console.log("git add .");
        console.log('git commit -m "Lab 01"');
        console.log("git push -u origin lab-01");
        console.log("gh pr create --fill");
      `,
      logs: true,
      checks: [],
    },
  ],
};
