// Lab 12 — Closures. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-12",
  title: "Closures",
  lesson: "12-closures",
  lessonTitle: "Closures: Objects with Behavior",
  intro: `<p>Build objects whose data is private — reachable only through the methods you return. Some tests check that
    the internal data is not exposed as a property.</p>`,
  problems: [
    {
      key: "simple",
      title: "Greeter factory",
      points: 10,
      prompt: `Write <code>makeGreeter(greeting)</code> returning a function that takes a name and returns
        <code>"GREETING, NAME!"</code>. <code>makeGreeter("Hello")("Ada")</code> is <code>"Hello, Ada!"</code>.`,
      starter: `
        function makeGreeter(greeting) {

        }
      `,
      solution: `
        function makeGreeter(greeting) {
          return name => greeting + ", " + name + "!";
        }
      `,
      checks: [
        { expr: `makeGreeter("Hello")("Ada")` }, { expr: `makeGreeter("Hi")("Rover")` },
        { label: "two greeters are independent", run: `const a = makeGreeter("Yo"); const b = makeGreeter("Hey"); return [a("x"), b("y")];` },
      ],
    },
    {
      key: "moderate",
      title: "A queue",
      points: 10,
      prompt: `Write <code>Queue()</code> returning an object with <code>enqueue(x)</code> (add to the back),
        <code>dequeue()</code> (remove and return the front, or <code>undefined</code> if empty), <code>peek()</code>,
        <code>size()</code>, and <code>toArray()</code> (a <em>copy</em> of the items, front first). The items must be
        private.`,
      starter: `
        function Queue() {

        }
      `,
      solution: `
        function Queue() {
          const items = [];
          return {
            enqueue(x) { items.push(x); },
            dequeue() { return items.shift(); },
            peek() { return items[0]; },
            size() { return items.length; },
            toArray() { return [...items]; },
          };
        }
      `,
      checks: [
        { label: "enqueue a b c, dequeue", run: `const q = Queue(); q.enqueue("a"); q.enqueue("b"); q.enqueue("c"); return [q.dequeue(), q.peek(), q.size(), q.toArray()];` },
        { label: "empty", run: `const q = Queue(); return [q.dequeue(), q.size()];` },
        { label: "toArray is a copy", run: `const q = Queue(); q.enqueue(1); q.toArray().push(99); return q.toArray();` },
        { label: "only methods are exposed", run: `return Object.keys(Queue()).sort();` },
      ],
    },
    {
      key: "complex",
      title: "To-do list",
      points: 10,
      prompt: `Write <code>TodoList()</code> returning an object with:
        <ul>
          <li><code>add(text)</code> — adds a pending task and returns its id (1, 2, 3, … in order).</li>
          <li><code>complete(id)</code> — marks it done; returns <code>false</code> if there's no such task, else <code>true</code>.</li>
          <li><code>remove(id)</code> — deletes it; returns <code>false</code> if there's no such task, else <code>true</code>.</li>
          <li><code>pending()</code> — the texts of tasks not yet done, in the order added.</li>
          <li><code>summary()</code> — a string like <code>"2 done, 1 pending"</code>.</li>
        </ul>
        Ids are never reused, even after a removal. Keep the tasks private.`,
      starter: `
        function TodoList() {

        }
      `,
      solution: `
        function TodoList() {
          const tasks = [];
          let nextId = 1;

          function find(id) {
            return tasks.find(t => t.id === id);
          }

          return {
            add(text) {
              tasks.push({ id: nextId, text, done: false });
              return nextId++;
            },
            complete(id) {
              const t = find(id);
              if (!t) {
                return false;
              }
              t.done = true;
              return true;
            },
            remove(id) {
              const i = tasks.findIndex(t => t.id === id);
              if (i === -1) {
                return false;
              }
              tasks.splice(i, 1);
              return true;
            },
            pending() {
              return tasks.filter(t => !t.done).map(t => t.text);
            },
            summary() {
              const done = tasks.filter(t => t.done).length;
              return done + " done, " + (tasks.length - done) + " pending";
            },
          };
        }
      `,
      checks: [
        { label: "add three, complete one", run: `const l = TodoList(); const ids = [l.add("a"), l.add("b"), l.add("c")]; l.complete(2); return [ids, l.pending(), l.summary()];` },
        { label: "remove and add again", run: `const l = TodoList(); l.add("a"); l.add("b"); const r = l.remove(1); const id = l.add("c"); return [r, id, l.pending()];` },
        { label: "unknown ids", run: `const l = TodoList(); return [l.complete(7), l.remove(7), l.summary()];` },
        { label: "only methods are exposed", run: `return Object.keys(TodoList()).sort();` },
      ],
    },
  ],
};
