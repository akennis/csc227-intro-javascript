// Lab 22 — React & npm. PLAINTEXT SOURCE (see tools/gen-labs.js).
const react = { libs: ["react"], jsx: true, html: `<div id="root"></div>` };
const wait = "await _t.wait(40); ";

export default {
  id: "lab-22",
  title: "React",
  lesson: "22-react-npm",
  lessonTitle: "React & npm",
  intro: `<p>Build React components with JSX. Render into <code>#root</code> exactly as each prompt says; the tests let React
    render, then click and read the page.</p>`,
  problems: [
    {
      key: "simple",
      title: "Badges",
      points: 10,
      ...react,
      prompt: `Write <code>Badge({ label, count })</code> returning <code>&lt;span className="badge"&gt;LABEL: COUNT&lt;/span&gt;</code>,
        with the extra class <code>zero</code> (so <code>className="badge zero"</code>) when <code>count</code> is 0. Render
        <code>&lt;div&gt;&lt;Badge label="Inbox" count={3} /&gt;&lt;Badge label="Spam" count={0} /&gt;&lt;/div&gt;</code>.`,
      starter: `
        function Badge({ label, count }) {

        }

        ReactDOM.createRoot(document.getElementById("root")).render(
          <div><Badge label="Inbox" count={3} /><Badge label="Spam" count={0} /></div>
        );
      `,
      solution: `
        function Badge({ label, count }) {
          return <span className={count === 0 ? "badge zero" : "badge"}>{label}: {count}</span>;
        }

        ReactDOM.createRoot(document.getElementById("root")).render(
          <div><Badge label="Inbox" count={3} /><Badge label="Spam" count={0} /></div>
        );
      `,
      checks: [{ label: "#root", run: wait + `return _t.el("#root").innerHTML;` }],
    },
    {
      key: "moderate",
      title: "To-do app",
      points: 10,
      ...react,
      prompt: `Write <code>TodoApp</code>: a controlled input (id <code>new</code>), an <strong>Add</strong> button (id
        <code>add</code>) that appends the trimmed text as a task (ignoring empty text) and clears the input, a
        <code>&lt;ul&gt;</code> of tasks where clicking an <code>&lt;li&gt;</code> toggles <code>className="done"</code> on it, and
        <code>&lt;p id="left"&gt;N left&lt;/p&gt;</code> counting tasks not done. Keep tasks in state as an array of
        <code>{ id, text, done }</code> and never mutate it. Render <code>&lt;TodoApp /&gt;</code>.`,
      hint: `Update immutably: <code>setTasks([...tasks, newTask])</code> to add, and
        <code>setTasks(tasks.map(t =&gt; t.id === id ? { ...t, done: !t.done } : t))</code> to toggle.`,
      starter: `
        function TodoApp() {

        }

        ReactDOM.createRoot(document.getElementById("root")).render(<TodoApp />);
      `,
      solution: `
        function TodoApp() {
          const [tasks, setTasks] = React.useState([]);
          const [text, setText] = React.useState("");
          const [nextId, setNextId] = React.useState(1);

          function add() {
            if (text.trim() === "") {
              return;
            }
            setTasks([...tasks, { id: nextId, text: text.trim(), done: false }]);
            setNextId(nextId + 1);
            setText("");
          }

          function toggle(id) {
            setTasks(tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
          }

          return (
            <div>
              <input id="new" value={text} onChange={e => setText(e.target.value)} />
              <button id="add" onClick={add}>Add</button>
              <ul>
                {tasks.map(t => (
                  <li key={t.id} className={t.done ? "done" : ""} onClick={() => toggle(t.id)}>{t.text}</li>
                ))}
              </ul>
              <p id="left">{tasks.filter(t => !t.done).length} left</p>
            </div>
          );
        }

        ReactDOM.createRoot(document.getElementById("root")).render(<TodoApp />);
      `,
      checks: [
        { label: "initially", run: wait + `return _t.text("#left");` },
        { label: "add milk, eggs, blank", run: wait + `const box = _t.el("#new"); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; for (const v of ["  milk ", "eggs", "   "]) { set.call(box, v); box.dispatchEvent(new Event("input", { bubbles: true })); await _t.wait(20); _t.click("#add"); await _t.wait(20); } return [_t.$$("#root li").map(li => li.textContent), _t.text("#left"), box.value];` },
        { label: "toggle milk twice, eggs once", run: wait + `_t.$$("#root li")[0].click(); await _t.wait(20); _t.$$("#root li")[0].click(); await _t.wait(20); _t.$$("#root li")[1].click(); await _t.wait(20); return [_t.$$("#root li").map(li => li.className), _t.text("#left")];` },
      ],
    },
    {
      key: "complex",
      title: "Tic-tac-toe with a winner",
      points: 10,
      ...react,
      prompt: `Write a pure function <code>calculateWinner(squares)</code> (an array of 9 values <code>"X"</code>,
        <code>"O"</code> or <code>null</code>) returning <code>"X"</code> or <code>"O"</code> if that player has three in a row
        (rows, columns, diagonals), else <code>null</code>. Then write <code>Game</code>: nine
        <code>&lt;button className="square"&gt;</code>s and <code>&lt;p className="status"&gt;</code> showing <code>Next player: X</code>,
        <code>Winner: X</code>, or <code>Draw</code> when the board is full with no winner. X goes first; clicks on a filled square
        or after the game is over do nothing; a <code>&lt;button id="restart"&gt;Restart&lt;/button&gt;</code> resets everything.
        Render <code>&lt;Game /&gt;</code>.`,
      starter: `
        function calculateWinner(squares) {

        }

        function Game() {

        }

        ReactDOM.createRoot(document.getElementById("root")).render(<Game />);
      `,
      solution: `
        const LINES = [
          [0, 1, 2], [3, 4, 5], [6, 7, 8],
          [0, 3, 6], [1, 4, 7], [2, 5, 8],
          [0, 4, 8], [2, 4, 6],
        ];

        function calculateWinner(squares) {
          for (const [a, b, c] of LINES) {
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
              return squares[a];
            }
          }
          return null;
        }

        function Game() {
          const [squares, setSquares] = React.useState(Array(9).fill(null));
          const [xIsNext, setXIsNext] = React.useState(true);
          const winner = calculateWinner(squares);
          const full = squares.every(s => s !== null);

          function handleClick(i) {
            if (squares[i] || winner) {
              return;
            }
            const next = [...squares];
            next[i] = xIsNext ? "X" : "O";
            setSquares(next);
            setXIsNext(!xIsNext);
          }

          function restart() {
            setSquares(Array(9).fill(null));
            setXIsNext(true);
          }

          const status = winner ? "Winner: " + winner : full ? "Draw" : "Next player: " + (xIsNext ? "X" : "O");
          return (
            <div>
              {squares.map((v, i) => <button key={i} className="square" onClick={() => handleClick(i)}>{v}</button>)}
              <p className="status">{status}</p>
              <button id="restart" onClick={restart}>Restart</button>
            </div>
          );
        }

        ReactDOM.createRoot(document.getElementById("root")).render(<Game />);
      `,
      checks: [
        { expr: `calculateWinner(["X", "X", "X", null, "O", "O", null, null, null])` },
        { expr: `calculateWinner(["O", "X", null, "X", "O", null, null, "X", "O"])` },
        { expr: `calculateWinner(["X", "O", "X", "X", "O", "O", "O", "X", "X"])` },
        { label: "X wins down the left column; then no more moves", run: wait + `const play = async (i) => { _t.$$(".square")[i].click(); await _t.wait(15); }; for (const i of [0, 1, 3, 4, 6, 8]) await play(i); return [_t.$$(".square").map(b => b.textContent), _t.text(".status")];` },
        { label: "restart, then a draw", run: wait + `_t.click("#restart"); await _t.wait(20); const play = async (i) => { _t.$$(".square")[i].click(); await _t.wait(15); }; for (const i of [0, 1, 2, 4, 3, 5, 7, 6, 8]) await play(i); return [_t.$$(".square").map(b => b.textContent), _t.text(".status")];` },
      ],
    },
  ],
};
