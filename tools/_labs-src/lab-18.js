// Lab 18 — Ajax with XMLHttpRequest. PLAINTEXT SOURCE (see tools/gen-labs.js).
import { courseApi } from "../../lessons/mock-apis.js";

export default {
  id: "lab-18",
  title: "Ajax",
  lesson: "18-ajax",
  lessonTitle: "Ajax with XMLHttpRequest",
  intro: `<p>Use <code>XMLHttpRequest</code> against the course's pretend web services (the same URLs as the lesson). Results
    arrive asynchronously, so your functions deliver them through callbacks.</p>`,
  problems: [
    {
      key: "simple",
      title: "Who owns this to-do?",
      points: 10,
      mock: courseApi,
      prompt: `Write <code>getUserId(todoId, callback)</code> that requests
        <code>https://jsonplaceholder.typicode.com/todos/ID</code> and calls <code>callback(userId)</code> with the item's
        <code>userId</code>. If the status is 400 or more, call <code>callback(null)</code>.`,
      starter: `
        function getUserId(todoId, callback) {

        }
      `,
      solution: `
        function getUserId(todoId, callback) {
          const req = new XMLHttpRequest();
          req.addEventListener("load", e => {
            if (e.target.status >= 400) {
              callback(null);
              return;
            }
            callback(JSON.parse(e.target.responseText).userId);
          });
          req.open("GET", "https://jsonplaceholder.typicode.com/todos/" + todoId, true);
          req.send();
        }
      `,
      checks: [
        { label: "to-do 5", run: `return await new Promise(r => getUserId(5, r));` },
        { label: "to-do 45", run: `return await new Promise(r => getUserId(45, r));` },
        { label: "to-do 999", run: `return await new Promise(r => getUserId(999, r));` },
      ],
    },
    {
      key: "moderate",
      title: "Several requests, results in order",
      points: 10,
      mock: courseApi,
      prompt: `Write <code>getTitles(ids, callback)</code> that requests every to-do in the array <code>ids</code> (all at once —
        don't wait for one before starting the next), and when <strong>all</strong> have arrived calls <code>callback(titles)</code>
        with the titles <strong>in the same order as <code>ids</code></strong>, whatever order the responses come back in. For an
        empty array, call <code>callback([])</code>.`,
      hint: `Make the result array first (<code>new Array(ids.length)</code>), store each title at its own index when it
        arrives, and count the responses; when the count reaches <code>ids.length</code>, you're done.`,
      starter: `
        function getTitles(ids, callback) {

        }
      `,
      solution: `
        function getTitles(ids, callback) {
          const titles = new Array(ids.length);
          let received = 0;
          if (ids.length === 0) {
            callback([]);
            return;
          }
          ids.forEach((id, i) => {
            const req = new XMLHttpRequest();
            req.addEventListener("load", e => {
              titles[i] = JSON.parse(e.target.responseText).title;
              received++;
              if (received === ids.length) {
                callback(titles);
              }
            });
            req.open("GET", "https://jsonplaceholder.typicode.com/todos/" + id, true);
            req.send();
          });
        }
      `,
      checks: [
        { label: "[3, 1, 2]", run: `return await new Promise(r => getTitles([3, 1, 2], r));` },
        { label: "[]", run: `return await new Promise(r => getTitles([], r));` },
        { label: "ten at once, quickly", run: `const s = performance.now(); const t = await new Promise(r => getTitles([1,2,3,4,5,6,7,8,9,10], r)); return [t.length, performance.now() - s < 800];` },
      ],
    },
    {
      key: "complex",
      title: "The weather page, complete",
      points: 10,
      mock: courseApi,
      prompt: `Wire up the lecture's weather page. When <code>#getWeatherBtn</code> is clicked, request the Open-Meteo forecast
        for <code>#lat</code> and <code>#long</code> with the timeout (ms) from <code>#timeout</code> (0 = no timeout). Then, in
        <code>#curTemp</code> / <code>#error</code>:
        <ul>
          <li>success → <code>#curTemp</code> = <code>Current temp is T C</code> (last hourly value), <code>#error</code> empty;</li>
          <li>status 400+ → <code>#error</code> = <code>error: status = S</code>, <code>#curTemp</code> empty;</li>
          <li>timeout → <code>#error</code> = <code>timeout</code>; network error → <code>#error</code> = <code>error</code>; <code>#curTemp</code> empty.</li>
        </ul>
        Use <code>textContent</code>. The pretend server answers in about 200–300 ms.`,
      html: `
        <label for="long">Longitude:</label> <input id="long" value="-74.4"><br>
        <label for="lat">Latitude:</label> <input id="lat" value="41.4"><br>
        <label for="timeout">Timeout:</label> <input id="timeout" value="0"><br>
        <button id="getWeatherBtn">Get Weather</button>
        <p id="curTemp"></p>
        <p id="error"></p>`,
      starter: `
        document.getElementById("getWeatherBtn").addEventListener("click", () => {

        });
      `,
      solution: `
        function show(temp, error) {
          document.getElementById("curTemp").textContent = temp;
          document.getElementById("error").textContent = error;
        }

        document.getElementById("getWeatherBtn").addEventListener("click", () => {
          const lat = document.getElementById("lat").value;
          const long = document.getElementById("long").value;
          const req = new XMLHttpRequest();
          req.timeout = Number(document.getElementById("timeout").value);
          req.addEventListener("load", e => {
            if (e.target.status >= 400) {
              show("", "error: status = " + e.target.status);
              return;
            }
            const t = JSON.parse(e.target.responseText).hourly.temperature_2m.at(-1);
            show("Current temp is " + t + " C", "");
          });
          req.addEventListener("timeout", () => show("", "timeout"));
          req.addEventListener("error", () => show("", "error"));
          req.open("GET", \`https://api.open-meteo.com/v1/forecast?latitude=\${lat}&longitude=\${long}&hourly=temperature_2m\`, true);
          req.send();
        });
      `,
      checks: [
        { label: "Middletown, NY", run: `_t.click("#getWeatherBtn"); await _t.wait(600); return [_t.text("#curTemp"), _t.text("#error")];` },
        { label: "latitude 100", run: `_t.type("#lat", 100); _t.click("#getWeatherBtn"); await _t.wait(600); return [_t.text("#curTemp"), _t.text("#error")];` },
        { label: "timeout 50 ms", run: `_t.type("#lat", 10); _t.type("#timeout", 50); _t.click("#getWeatherBtn"); await _t.wait(600); return [_t.text("#curTemp"), _t.text("#error")];` },
        { label: "back to normal", run: `_t.type("#lat", -33.9); _t.type("#long", 151.2); _t.type("#timeout", 0); _t.click("#getWeatherBtn"); await _t.wait(600); return [_t.text("#curTemp"), _t.text("#error")];` },
      ],
    },
  ],
};
