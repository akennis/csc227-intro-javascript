import { chromium } from "playwright-core";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const ROOT = process.cwd();
const server = http.createServer((q, r) => { const f = path.join(ROOT, new URL(q.url,"http://x").pathname); if (!fs.existsSync(f)) return r.writeHead(404).end(); r.writeHead(200, {"content-type": f.endsWith(".js")?"text/javascript":f.endsWith(".css")?"text/css":"text/html"}); fs.createReadStream(f).pipe(r); });
await new Promise(r => server.listen(8771, r));
const b = await chromium.launch({ executablePath: process.env.CHROME });
const p = await b.newPage({ viewport: { width: 390, height: 800 } });
for (const page of ["index.html", "reference.html", "playground.html", "labs/index.html", "labs/lab.html?id=lab-13", "lessons/01-getting-started.html", "lessons/09-arrays.html", "lessons/20-node.html", "lessons/21-react-npm.html"]) {
  await p.goto("http://127.0.0.1:8771/" + page);
  await p.waitForTimeout(2500);
  const w = await p.evaluate(() => [document.documentElement.scrollWidth, [...document.querySelectorAll("body *")].filter(e => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest("pre, .ed, table, .console")).slice(0, 3).map(e => e.tagName + "." + e.className)]);
  console.log(page, w[0] <= 390 ? "ok" : "OVERFLOW " + w[0], w[1].join(" "));
}
await b.close(); server.close();
