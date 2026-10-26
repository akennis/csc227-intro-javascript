// Lab 11 — Modeling Systems with Data. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-11",
  title: "Modeling Systems",
  lesson: "11-modeling",
  lessonTitle: "Modeling Systems with Data",
  intro: `<p>Model a system as plain objects and arrays, then write the functions that make it evolve. Follow the data
    shapes in each prompt exactly — the tests inspect the objects your functions change.</p>`,
  problems: [
    {
      key: "simple",
      title: "Blackjack hands",
      points: 10,
      prompt: `A card is <code>{ rank, suit }</code> with ranks <code>"A"</code>, <code>"2"</code>…<code>"10"</code>,
        <code>"J"</code>, <code>"Q"</code>, <code>"K"</code>. Write <code>cardName(card)</code> (e.g. <code>"Q♥"</code>),
        <code>cardValue(card)</code> (number cards their number, J/Q/K 10, A 11), and <code>handValue(hand)</code>: the
        total, except that each ace may count as 1 instead of 11 if that keeps the total at 21 or under.`,
      starter: `
        function cardName(card) {

        }

        function cardValue(card) {

        }

        function handValue(hand) {

        }
      `,
      solution: `
        function cardName(card) {
          return card.rank + card.suit;
        }

        function cardValue(card) {
          if (card.rank === "A") {
            return 11;
          }
          if (card.rank === "J" || card.rank === "Q" || card.rank === "K") {
            return 10;
          }
          return Number(card.rank);
        }

        function handValue(hand) {
          let total = 0;
          let aces = 0;
          for (const card of hand) {
            total += cardValue(card);
            if (card.rank === "A") {
              aces++;
            }
          }
          while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
          }
          return total;
        }
      `,
      checks: [
        { expr: `cardName({ rank: "Q", suit: "♥" })` }, { expr: `cardValue({ rank: "7", suit: "♣" })` }, { expr: `cardValue({ rank: "K", suit: "♣" })` },
        { expr: `handValue([{ rank: "K", suit: "♠" }, { rank: "7", suit: "♥" }])` },
        { expr: `handValue([{ rank: "A", suit: "♠" }, { rank: "K", suit: "♥" }])` },
        { expr: `handValue([{ rank: "A", suit: "♠" }, { rank: "A", suit: "♥" }, { rank: "9", suit: "♦" }])` },
        { expr: `handValue([{ rank: "K", suit: "♠" }, { rank: "Q", suit: "♥" }, { rank: "5", suit: "♦" }])` },
      ],
    },
    {
      key: "moderate",
      title: "Inventory",
      points: 10,
      prompt: `An inventory is an object mapping item names to quantities. Write <code>restock(inv, item, n)</code>
        (adds <code>n</code>, creating the item if new), <code>sell(inv, item, n)</code> (removes <code>n</code> and returns
        <code>true</code>, or returns <code>false</code> and changes nothing if there isn't enough), and
        <code>lowStock(inv, threshold)</code> (names with quantity below <code>threshold</code>, sorted alphabetically).`,
      starter: `
        function restock(inv, item, n) {

        }

        function sell(inv, item, n) {

        }

        function lowStock(inv, threshold) {

        }
      `,
      solution: `
        function restock(inv, item, n) {
          inv[item] = (inv[item] ?? 0) + n;
        }

        function sell(inv, item, n) {
          if ((inv[item] ?? 0) < n) {
            return false;
          }
          inv[item] -= n;
          return true;
        }

        function lowStock(inv, threshold) {
          return Object.keys(inv).filter(k => inv[k] < threshold).sort();
        }
      `,
      checks: [
        { label: "restock and sell", run: `const inv = { apples: 5 }; restock(inv, "pears", 3); restock(inv, "apples", 2); const r = [sell(inv, "apples", 6), sell(inv, "pears", 4), sell(inv, "kiwis", 1)]; return [r, inv];` },
        { expr: `lowStock({ milk: 1, eggs: 12, bread: 0, butter: 2 }, 3)` },
      ],
    },
    {
      key: "complex",
      title: "Elevator simulation",
      points: 10,
      prompt: `An elevator is <code>{ floor, direction, queue, log }</code> — starting e.g. as
        <code>{ floor: 1, direction: "idle", queue: [], log: [] }</code>. Write:
        <ul>
          <li><code>request(e, floor)</code> — add <code>floor</code> to the end of the queue, unless it's already the last
          entry.</li>
          <li><code>step(e)</code> — one time step. If the queue is empty, set direction <code>"idle"</code> and stop.
          Otherwise move one floor towards <code>queue[0]</code>, setting direction <code>"up"</code> or <code>"down"</code>
          (don't move if already there). Then, if the elevator is on <code>queue[0]</code>, remove it from the queue and
          push <code>"arrived at N"</code> onto the log.</li>
          <li><code>runUntilIdle(e)</code> — call <code>step</code> until the queue is empty and return how many steps that took.</li>
        </ul>`,
      starter: `
        function request(e, floor) {

        }

        function step(e) {

        }

        function runUntilIdle(e) {

        }
      `,
      solution: `
        function request(e, floor) {
          if (e.queue[e.queue.length - 1] !== floor) {
            e.queue.push(floor);
          }
        }

        function step(e) {
          if (e.queue.length === 0) {
            e.direction = "idle";
            return;
          }
          const target = e.queue[0];
          if (e.floor < target) {
            e.floor++;
            e.direction = "up";
          } else if (e.floor > target) {
            e.floor--;
            e.direction = "down";
          }
          if (e.floor === target) {
            e.queue.shift();
            e.log.push("arrived at " + e.floor);
          }
        }

        function runUntilIdle(e) {
          let steps = 0;
          while (e.queue.length > 0) {
            step(e);
            steps++;
          }
          return steps;
        }
      `,
      checks: [
        { label: "request 4, 4, 2", run: `const e = { floor: 1, direction: "idle", queue: [], log: [] }; request(e, 4); request(e, 4); request(e, 2); return e.queue;` },
        { label: "one step towards 3", run: `const e = { floor: 1, direction: "idle", queue: [3], log: [] }; step(e); return e;` },
        { label: "step on an empty queue", run: `const e = { floor: 5, direction: "up", queue: [], log: [] }; step(e); return e;` },
        { label: "run 1 → 4 → 2 → 2", run: `const e = { floor: 1, direction: "idle", queue: [], log: [] }; request(e, 4); request(e, 2); request(e, 2); const n = runUntilIdle(e); return [n, e];` },
        { label: "already on the requested floor", run: `const e = { floor: 3, direction: "idle", queue: [3], log: [] }; return [runUntilIdle(e), e.log];` },
      ],
    },
  ],
};
