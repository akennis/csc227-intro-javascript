import { chromium } from "playwright-core";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const ROOT = process.cwd();
const server = http.createServer((q, r) => { const f = path.join(ROOT, new URL(q.url,"http://x").pathname); if (!fs.existsSync(f)) return r.writeHead(404).end(); r.writeHead(200, {"content-type": f.endsWith(".js")?"text/javascript":f.endsWith(".css")?"text/css":"text/html"}); fs.createReadStream(f).pipe(r); });
await new Promise(r => server.listen(8769, r));
const b = await chromium.launch({ executablePath: process.env.CHROME });
const p = await b.newPage({ viewport: { width: Number(process.env.VW || 900), height: 1500 } });
await p.goto("http://127.0.0.1:8769/" + process.argv[2]);
await p.waitForFunction(() => [...document.querySelectorAll(".example")].every(c => c.dataset.state === "done"), null, { timeout: 90000 });
if (process.env.WAIT) await p.waitForTimeout(Number(process.env.WAIT));
if (process.argv[3]?.startsWith(".")) { await p.locator(process.argv[3]).first().screenshot({ path: process.env.OUT }); await b.close(); server.close(); process.exit(0); }
await p.evaluate(y => window.scrollTo(0, Number(y)), process.argv[3] || 0);
await p.screenshot({ path: "/tmp/claude-1000/-mnt-c-Users-albert-kennis-projects-csc227-intro-javascript/eade942c-ec4f-4a5e-aa63-2c18653bcdb5/scratchpad/shot.png" });
await b.close(); server.close();
