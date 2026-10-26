// Lab 21 — Node.js. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-21",
  title: "A Node Server",
  lesson: "21-node",
  lessonTitle: "Node.js",
  intro: `<p>Write Node <code>http</code> servers. The tests send requests to your handler and check each response's status,
    <code>Content-Type</code>, and body — shown as <code>{status, type, body}</code>. This is real Node code: copy it into
    <code>server.js</code> and run <code>node server.js</code> to try it in a browser.</p>`,
  problems: [
    {
      key: "simple",
      title: "Health check",
      points: 10,
      node: true,
      prompt: `<code>GET /health</code> answers 200 with JSON <code>{"status":"ok"}</code> (<code>Content-Type</code>
        <code>application/json</code>); every other path answers 404, <code>text/plain</code>, <code>Not Found</code>. Listen on
        port 3000.`,
      starter: `
        const http = require('http');

      `,
      solution: `
        const http = require('http');

        http.createServer((req, res) => {
          if (req.url === "/health") {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: "ok" }));
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Not Found');
          }
        }).listen(3000);
      `,
      checks: [{ label: "GET /health", run: `return await _t.request("/health");` }, { label: "GET /", run: `return await _t.request("/");` }],
    },
    {
      key: "moderate",
      title: "A to-do API",
      points: 10,
      node: true,
      prompt: `Keep to-dos in an array in memory; ids start at 1. All responses are JSON.
        <ul>
          <li><code>GET /todos</code> → 200, the array.</li>
          <li><code>POST /todos?text=TEXT</code> → 201, the new <code>{ id, text, done: false }</code>; without <code>text</code>
          → 400 <code>{"error":"text is required"}</code>.</li>
          <li><code>GET /todos/ID</code> → 200, that to-do; unknown id → 404 <code>{"error":"not found"}</code>.</li>
          <li>Anything else → 404 <code>{"error":"not found"}</code>.</li>
        </ul>`,
      hint: `<code>new URL(req.url, "http://localhost")</code> gives <code>pathname</code> and <code>searchParams</code>.
        <code>pathname.match(/^\\/todos\\/(\\d+)$/)</code> extracts the id.`,
      starter: `
        const http = require('http');

        const todos = [];

      `,
      solution: `
        const http = require('http');

        const todos = [];

        function sendJson(res, status, data) {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        }

        http.createServer((req, res) => {
          const u = new URL(req.url, "http://localhost");
          if (u.pathname === "/todos" && req.method === "GET") {
            return sendJson(res, 200, todos);
          }
          if (u.pathname === "/todos" && req.method === "POST") {
            const text = u.searchParams.get("text");
            if (!text) {
              return sendJson(res, 400, { error: "text is required" });
            }
            const todo = { id: todos.length + 1, text, done: false };
            todos.push(todo);
            return sendJson(res, 201, todo);
          }
          const m = u.pathname.match(/^\\/todos\\/(\\d+)$/);
          if (m && req.method === "GET") {
            const todo = todos.find(t => t.id === Number(m[1]));
            return todo ? sendJson(res, 200, todo) : sendJson(res, 404, { error: "not found" });
          }
          sendJson(res, 404, { error: "not found" });
        }).listen(3000);
      `,
      checks: [
        { label: "GET /todos (empty)", run: `return await _t.request("/todos");` },
        { label: "POST two, POST without text", run: `return [await _t.request("/todos?text=milk", { method: "POST" }), await _t.request("/todos?text=eggs", { method: "POST" }), await _t.request("/todos", { method: "POST" })];` },
        { label: "GET /todos, /todos/2, /todos/9", run: `return [await _t.request("/todos"), await _t.request("/todos/2"), await _t.request("/todos/9")];` },
        { label: "GET /other", run: `return await _t.request("/other");` },
      ],
    },
    {
      key: "complex",
      title: "Pages, safe templates, and stats",
      points: 10,
      node: true,
      prompt: `Only <code>GET</code> is allowed: any other method gets 405 <code>text/plain</code> <code>Method Not Allowed</code>.
        <ul>
          <li><code>/</code> → 200 <code>text/html</code>:
          <code>&lt;h1&gt;Home&lt;/h1&gt;&lt;a href="/hello/World"&gt;Say hello&lt;/a&gt;</code></li>
          <li><code>/hello/NAME</code> → 200 <code>text/html</code>: <code>&lt;h1&gt;Hello, NAME!&lt;/h1&gt;</code>, where NAME is
          URL-decoded (<code>decodeURIComponent</code>) and then <strong>HTML-escaped</strong> — replace <code>&amp;</code>,
          <code>&lt;</code>, <code>&gt;</code> with <code>&amp;amp;</code>, <code>&amp;lt;</code>, <code>&amp;gt;</code> — so a
          visitor can't inject markup.</li>
          <li><code>/api/stats?nums=1,2,3</code> → 200 JSON <code>{"count":3,"sum":6,"mean":2}</code>; if <code>nums</code> is
          missing or any entry isn't a number → 400 JSON <code>{"error":"nums must be numbers"}</code>.</li>
          <li>anything else → 404 <code>text/plain</code> <code>Not Found</code>.</li>
        </ul>`,
      starter: `
        const http = require('http');

      `,
      solution: `
        const http = require('http');

        function send(res, status, type, body) {
          res.statusCode = status;
          res.setHeader('Content-Type', type);
          res.end(body);
        }

        function escapeHtml(s) {
          return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
        }

        function stats(numsText) {
          if (!numsText) {
            return null;
          }
          const nums = numsText.split(",").map(Number);
          if (nums.some(n => Number.isNaN(n))) {
            return null;
          }
          const sum = nums.reduce((s, n) => s + n, 0);
          return { count: nums.length, sum, mean: sum / nums.length };
        }

        http.createServer((req, res) => {
          if (req.method !== "GET") {
            return send(res, 405, 'text/plain', 'Method Not Allowed');
          }
          const u = new URL(req.url, "http://localhost");
          if (u.pathname === "/") {
            return send(res, 200, 'text/html', '<h1>Home</h1><a href="/hello/World">Say hello</a>');
          }
          if (u.pathname.startsWith("/hello/")) {
            const name = escapeHtml(decodeURIComponent(u.pathname.slice("/hello/".length)));
            return send(res, 200, 'text/html', '<h1>Hello, ' + name + '!</h1>');
          }
          if (u.pathname === "/api/stats") {
            const result = stats(u.searchParams.get("nums"));
            return result
              ? send(res, 200, 'application/json', JSON.stringify(result))
              : send(res, 400, 'application/json', JSON.stringify({ error: "nums must be numbers" }));
          }
          send(res, 404, 'text/plain', 'Not Found');
        }).listen(3000);
      `,
      checks: [
        { label: "GET /", run: `return await _t.request("/");` },
        { label: "GET /hello/Ada%20Lovelace", run: `return await _t.request("/hello/Ada%20Lovelace");` },
        { label: "GET /hello/<b>x</b>", run: `return await _t.request("/hello/%3Cb%3Ex%3C%2Fb%3E%20%26%20co");` },
        { label: "GET /api/stats?nums=1,2,3", run: `return await _t.request("/api/stats?nums=1,2,3");` },
        { label: "GET /api/stats?nums=4,x", run: `return await _t.request("/api/stats?nums=4,x");` },
        { label: "GET /api/stats", run: `return await _t.request("/api/stats");` },
        { label: "POST /", run: `return await _t.request("/", { method: "POST" });` },
        { label: "GET /missing", run: `return await _t.request("/missing");` },
      ],
    },
  ],
};
