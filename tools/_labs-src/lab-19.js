// Lab 19 — Async / Await & fetch. PLAINTEXT SOURCE (see tools/gen-labs.js).
import { courseApi } from "../../lessons/mock-apis.js";

export default {
  id: "lab-19",
  title: "Async / Await",
  lesson: "19-async-await",
  lessonTitle: "Async / Await, fetch & Promise.all",
  intro: `<p>Rewrite network code with <code>fetch</code> and <code>async</code>/<code>await</code>. The tests
    <code>await</code> your functions; some also check that independent requests run in parallel.</p>`,
  problems: [
    {
      key: "simple",
      title: "Is it done?",
      points: 10,
      mock: courseApi,
      prompt: `Write <code>async function isCompleted(id)</code> returning the <code>completed</code> boolean of to-do
        <code>id</code> from JSONPlaceholder. If the response isn't <code>ok</code>, throw <code>new Error("HTTP " + status)</code>.`,
      starter: `
        async function isCompleted(id) {

        }
      `,
      solution: `
        async function isCompleted(id) {
          const resp = await fetch("https://jsonplaceholder.typicode.com/todos/" + id);
          if (!resp.ok) {
            throw new Error("HTTP " + resp.status);
          }
          const todo = await resp.json();
          return todo.completed;
        }
      `,
      checks: [
        { label: "isCompleted(3)", run: `return await isCompleted(3);` },
        { label: "isCompleted(4)", run: `return await isCompleted(4);` },
        { label: "isCompleted(0) throws", run: `try { await isCompleted(0); return "no error"; } catch (e) { return e.message; }` },
      ],
    },
    {
      key: "moderate",
      title: "Meridian temperatures, in parallel",
      points: 10,
      mock: courseApi,
      prompt: `Write <code>async function meridianTemps(long, step)</code> that gets the last hourly temperature at longitude
        <code>long</code> for latitudes 0, step, 2·step, … up to and including 90, <strong>all in parallel</strong>, returning
        <code>[undefined, temps]</code> — or <code>[message, undefined]</code> with the first failure's message
        (<code>"HTTP 400"</code> for a bad status, or the error's message if <code>fetch</code> rejects). It must never throw.`,
      starter: `
        async function meridianTemps(long, step) {

        }
      `,
      solution: `
        async function getTemp(lat, long) {
          try {
            const resp = await fetch(\`https://api.open-meteo.com/v1/forecast?latitude=\${lat}&longitude=\${long}&hourly=temperature_2m\`);
            if (!resp.ok) {
              return ["HTTP " + resp.status, undefined];
            }
            const data = await resp.json();
            return [undefined, data.hourly.temperature_2m.at(-1)];
          } catch (e) {
            return [e.message, undefined];
          }
        }

        async function meridianTemps(long, step) {
          const requests = [];
          for (let lat = 0; lat <= 90; lat += step) {
            requests.push(getTemp(lat, long));
          }
          const results = await Promise.all(requests);
          const temps = [];
          for (const [error, t] of results) {
            if (error) {
              return [error, undefined];
            }
            temps.push(t);
          }
          return [undefined, temps];
        }
      `,
      checks: [
        { label: "meridianTemps(0, 30)", run: `return await meridianTemps(0, 30);` },
        { label: "meridianTemps(-74, 45)", run: `return await meridianTemps(-74, 45);` },
        { label: "meridianTemps(200, 30)", run: `return await meridianTemps(200, 30);` },
        { label: "parallel: step 10 in under 1 s", run: `const s = performance.now(); await meridianTemps(0, 10); return performance.now() - s < 1000;` },
      ],
    },
    {
      key: "complex",
      title: "Team reports",
      points: 10,
      mock: courseApi,
      prompt: `Using the sports API from the lesson (<code>…/api/teams/TEAM/lineup</code> and <code>…/api/players/ID</code> on
        <code>https://sports.example.com</code>), write:
        <ul>
          <li><code>async function teamReport(team)</code> → <code>{ team, players, totalHr, best }</code>, where
          <code>players</code> is an array of <code>{ name, hr }</code> sorted by <code>hr</code>, highest first; <code>totalHr</code>
          their sum; <code>best</code> the name of the top hitter. Fetch the players in parallel. For an unknown team (404),
          throw <code>new Error("unknown team TEAM")</code>.</li>
          <li><code>async function strongerTeam(a, b)</code> → the name of the team with the larger <code>totalHr</code>, fetching
          both reports in parallel.</li>
        </ul>`,
      starter: `
        const API = "https://sports.example.com/api";

        async function teamReport(team) {

        }

        async function strongerTeam(a, b) {

        }
      `,
      solution: `
        const API = "https://sports.example.com/api";

        async function teamReport(team) {
          const resp = await fetch(\`\${API}/teams/\${team}/lineup\`);
          if (!resp.ok) {
            throw new Error("unknown team " + team);
          }
          const lineup = await resp.json();
          const players = await Promise.all(lineup.map(async id => {
            const p = await (await fetch(\`\${API}/players/\${id}\`)).json();
            return { name: p.name, hr: p.hr };
          }));
          players.sort((x, y) => y.hr - x.hr);
          const totalHr = players.reduce((s, p) => s + p.hr, 0);
          return { team, players, totalHr, best: players[0].name };
        }

        async function strongerTeam(a, b) {
          const [ra, rb] = await Promise.all([teamReport(a), teamReport(b)]);
          return ra.totalHr >= rb.totalHr ? a : b;
        }
      `,
      checks: [
        { label: "teamReport(\"mets\")", run: `return await teamReport("mets");` },
        { label: "teamReport(\"yankees\").best", run: `return (await teamReport("yankees")).best;` },
        { label: "unknown team", run: `try { await teamReport("cubs"); return "no error"; } catch (e) { return e.message; }` },
        { label: "strongerTeam(\"mets\", \"yankees\")", run: `return await strongerTeam("mets", "yankees");` },
      ],
    },
  ],
};
