/**
 * mock-apis.js — the course's pretend web services, used by the network
 * lessons (17, 18) and their labs as a cell's `mock`.
 *
 * `courseApi` is passed to the sandbox as SOURCE TEXT (jsrunner stringifies it),
 * so it must be completely self-contained: no imports, no outside variables.
 * It answers (url, { method, body }) with { status, json | body, delay } or
 * { error: "network" }, deterministically, so challenges can be graded.
 *
 *   https://api.open-meteo.com/v1/forecast?latitude=…&longitude=…&hourly=temperature_2m
 *       Same shape as the real Open-Meteo API (24 hourly readings). Latitude
 *       outside −90…90 or longitude outside −180…180 → 400 with a reason.
 *       Lessons can offer a "use the real API" toggle for this one.
 *   https://sports.example.com/api/teams/<team>/lineup      → ["p1", …]
 *   https://sports.example.com/api/players/<id>             → { id, name, avg, hr }
 *   https://jsonplaceholder.typicode.com/todos/<n>  (GET)   → { userId, id, title, completed }
 *   https://jsonplaceholder.typicode.com/posts      (POST)  → 201, the body echoed with id 101
 *   https://offline.example.com/…                           → network error
 *   anything else                                           → 404
 */
export function courseApi(url, { method = "GET", body } = {}) {
  const u = new URL(url);
  const path = u.pathname;

  if (u.hostname === "offline.example.com") return { error: "network", delay: 200 };

  if (u.hostname === "api.open-meteo.com" && path === "/v1/forecast") {
    const lat = Number(u.searchParams.get("latitude"));
    const long = Number(u.searchParams.get("longitude"));
    if (!u.searchParams.has("latitude") || Number.isNaN(lat) || lat < -90 || lat > 90) {
      return { status: 400, json: { error: true, reason: "Latitude must be in range of -90 to 90°. Given: " + u.searchParams.get("latitude") + "." }, delay: 150 };
    }
    if (!u.searchParams.has("longitude") || Number.isNaN(long) || long < -180 || long > 180) {
      return { status: 400, json: { error: true, reason: "Longitude must be in range of -180 to 180°. Given: " + u.searchParams.get("longitude") + "." }, delay: 150 };
    }
    // A smooth, made-up climate: warm at the equator, a daily swing, and a
    // small longitude effect. Rounded to 0.1 °C like the real service.
    const base = 28 - Math.abs(lat) * 0.45 + long * 0.01;
    const time = [];
    const temps = [];
    for (let h = 0; h < 24; h++) {
      time.push("2024-11-04T" + String(h).padStart(2, "0") + ":00");
      temps.push(Math.round((base + 4 * Math.sin((h - 9) / 24 * 2 * Math.PI)) * 10) / 10);
    }
    return {
      json: {
        latitude: lat, longitude: long, generationtime_ms: 0.05, utc_offset_seconds: 0, timezone: "GMT",
        hourly_units: { time: "iso8601", temperature_2m: "°C" },
        hourly: { time, temperature_2m: temps },
      },
      delay: 200 + Math.round(Math.abs(lat)),
    };
  }

  if (u.hostname === "sports.example.com") {
    const teams = {
      yankees: ["p1", "p2", "p3"],
      mets: ["p4", "p5"],
    };
    const players = {
      p1: { name: "Mickey Mantle", avg: 0.298, hr: 536 },
      p2: { name: "Yogi Berra", avg: 0.285, hr: 358 },
      p3: { name: "Derek Jeter", avg: 0.310, hr: 260 },
      p4: { name: "Mike Piazza", avg: 0.308, hr: 427 },
      p5: { name: "David Wright", avg: 0.296, hr: 242 },
    };
    let m = path.match(/^\/api\/teams\/([a-z]+)\/lineup$/);
    if (m) return m[1] in teams ? { json: teams[m[1]], delay: 200 } : { status: 404, json: { error: "no such team" }, delay: 100 };
    m = path.match(/^\/api\/players\/(p\d+)$/);
    if (m) return m[1] in players ? { json: { id: m[1], ...players[m[1]] }, delay: 250 } : { status: 404, json: { error: "no such player" }, delay: 100 };
    return { status: 404, json: { error: "not found" }, delay: 100 };
  }

  if (u.hostname === "jsonplaceholder.typicode.com") {
    const m = path.match(/^\/todos\/(\d+)$/);
    if (m && method === "GET") {
      const id = Number(m[1]);
      if (id < 1 || id > 200) return { status: 404, json: {}, delay: 120 };
      return { json: { userId: Math.ceil(id / 20), id, title: "todo number " + id, completed: id % 3 === 0 }, delay: 120 };
    }
    if (path === "/posts" && method === "POST") {
      let data = {};
      try { data = JSON.parse(body || "{}"); } catch { return { status: 400, json: { error: "bad JSON" }, delay: 120 }; }
      return { status: 201, json: { ...data, id: 101 }, delay: 150 };
    }
  }

  return { status: 404, body: "Not Found", delay: 100 };
}
