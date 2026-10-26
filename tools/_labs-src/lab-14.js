// Lab 14 — The DOM II. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-14",
  title: "The DOM II",
  lesson: "14-dom-2",
  lessonTitle: "The DOM II: Building & Navigating the Tree",
  intro: `<p>Four problems on building and restructuring the page: creating elements from data, nesting them, walking the
    tree, and re-rendering when the data changes. Build elements with <code>createElement</code> and <code>textContent</code>
    — data may contain characters like <code>&lt;</code> that must stay text.</p>`,
  problems: [
    {
      key: "simple",
      title: "Add items",
      points: 10,
      prompt: `Write <code>addItems(listId, items)</code> that appends one <code>&lt;li&gt;</code> per string in <code>items</code>
        to the list with id <code>listId</code> (keeping what's already there), and returns how many <code>&lt;li&gt;</code>s the
        list has now.`,
      html: `
        <ul id="groceries"><li>milk</li></ul>
        <ol id="steps"></ol>`,
      starter: `
        function addItems(listId, items) {

        }
      `,
      solution: `
        function addItems(listId, items) {
          const list = document.getElementById(listId);
          for (const text of items) {
            const li = document.createElement("li");
            li.textContent = text;
            list.append(li);
          }
          return list.querySelectorAll("li").length;
        }
      `,
      checks: [
        { label: 'addItems("groceries", ["eggs", "bread"])', run: `return [addItems("groceries", ["eggs", "bread"]), _t.el("#groceries").innerHTML];` },
        { label: 'addItems("steps", ["<preheat>", "mix"])', run: `return [addItems("steps", ["<preheat>", "mix"]), _t.el("#steps").innerHTML];` },
        { label: "nothing to add", run: `return addItems("steps", []);` },
      ],
    },
    {
      key: "moderate",
      title: "Product cards",
      points: 10,
      prompt: `Write <code>renderCards(products)</code> for an array of <code>{ name, price }</code>. Empty
        <code>#grid</code>, then add, for each product,
        <code>&lt;div class="card"&gt;&lt;h3&gt;NAME&lt;/h3&gt;&lt;p class="price"&gt;$PRICE&lt;/p&gt;&lt;/div&gt;</code> with the
        price to 2 decimal places. If the array is empty, add <code>&lt;p class="empty"&gt;No products&lt;/p&gt;</code> instead.`,
      html: `<div id="grid"><p>loading…</p></div>`,
      starter: `
        function renderCards(products) {

        }
      `,
      solution: `
        function renderCards(products) {
          const grid = document.getElementById("grid");
          grid.replaceChildren();
          if (products.length === 0) {
            const p = document.createElement("p");
            p.className = "empty";
            p.textContent = "No products";
            grid.append(p);
            return;
          }
          for (const product of products) {
            const card = document.createElement("div");
            card.className = "card";
            const h3 = document.createElement("h3");
            h3.textContent = product.name;
            const price = document.createElement("p");
            price.className = "price";
            price.textContent = "$" + product.price.toFixed(2);
            card.append(h3, price);
            grid.append(card);
          }
        }
      `,
      checks: [
        { label: "two products", run: `renderCards([{ name: "Pen", price: 1.5 }, { name: "Pad", price: 3 }]); return _t.el("#grid").innerHTML;` },
        { label: "a name with <", run: `renderCards([{ name: "<Deluxe>", price: 10 }]); return _t.el("#grid").innerHTML;` },
        { label: "empty list", run: `renderCards([]); return _t.el("#grid").innerHTML;` },
      ],
    },
    {
      key: "complex",
      title: "Table of contents",
      points: 10,
      prompt: `Write <code>buildToc()</code>. Scan the <code>h2</code> and <code>h3</code> headings inside
        <code>#article</code>, in order, and fill <code>#toc</code> (a <code>&lt;ul&gt;</code>) with one <code>&lt;li&gt;</code> per
        <code>h2</code>, containing the heading's text. Each <code>h3</code> belongs to the <code>h2</code> before it: put it as
        an <code>&lt;li&gt;</code> inside a nested <code>&lt;ul&gt;</code> in that <code>h2</code>'s <code>&lt;li&gt;</code> (only
        create the nested list when there's at least one <code>h3</code>). Ignore <code>h3</code>s that appear before any
        <code>h2</code>. Calling it twice must not duplicate anything. Return the number of headings placed in the TOC.`,
      html: `
        <ul id="toc"></ul>
        <div id="article">
          <h3>Stray heading</h3>
          <h2>Intro</h2><p>…</p>
          <h2>Setup</h2>
          <h3>Install</h3><p>…</p>
          <h3>Configure</h3><p>…</p>
          <h2>Usage</h2><p>…</p>
          <h3>Advanced</h3>
        </div>`,
      hint: `<code>document.querySelectorAll("#article h2, #article h3")</code> returns both kinds in document order. Keep
        track of the current h2's <code>&lt;li&gt;</code> (and its nested <code>&lt;ul&gt;</code>, if any) as you loop.`,
      starter: `
        function buildToc() {

        }
      `,
      solution: `
        function buildToc() {
          const toc = document.getElementById("toc");
          toc.replaceChildren();
          let currentLi = null;
          let currentSub = null;
          let placed = 0;
          for (const h of document.querySelectorAll("#article h2, #article h3")) {
            const li = document.createElement("li");
            li.textContent = h.textContent;
            if (h.tagName === "H2") {
              toc.append(li);
              currentLi = li;
              currentSub = null;
              placed++;
            } else if (currentLi !== null) {
              if (currentSub === null) {
                currentSub = document.createElement("ul");
                currentLi.append(currentSub);
              }
              currentSub.append(li);
              placed++;
            }
          }
          return placed;
        }
      `,
      checks: [
        { label: "return value", run: `return buildToc();` },
        { label: "the TOC", run: `buildToc(); return _t.el("#toc").innerHTML;` },
        { label: "calling twice doesn't duplicate", run: `buildToc(); buildToc(); return _t.$$("#toc li").length;` },
      ],
    },
    {
      key: "challenge",
      title: "Sortable table",
      points: 10,
      prompt: `The table's header cells name the columns with <code>data-key</code>. Using the given <code>data</code> array:
        <ul>
          <li><code>renderRows(rows)</code> — empty the <code>tbody</code> and add one <code>&lt;tr&gt;</code> per row object, with one
          <code>&lt;td&gt;</code> per column <strong>in the order of the header cells</strong> (read the keys from the
          <code>th</code>s' <code>data-key</code>, don't hard-code them).</li>
          <li><code>sortBy(key)</code> — sort <code>data</code> by that column and re-render. Sorting the same column twice in a row
          flips between ascending and descending; a new column starts ascending. Numbers sort numerically, strings with
          <code>localeCompare</code>. The sorted column's <code>th</code> gets the class <code>asc</code> or <code>desc</code>; all
          other <code>th</code>s have neither.</li>
          <li>Clicking a header cell calls <code>sortBy</code> with its key (one listener on the header row is enough). Render the
          rows once at start-up, unsorted.</li>
        </ul>`,
      html: `
        <style>th { cursor: pointer; } th.asc::after { content: " ▲"; } th.desc::after { content: " ▼"; }</style>
        <table id="grades" border="1">
          <thead><tr><th data-key="name">Name</th><th data-key="score">Score</th><th data-key="year">Year</th></tr></thead>
          <tbody></tbody>
        </table>`,
      hint: `Keep the current sort key and direction in variables outside the functions. After sorting, call
        <code>renderRows(data)</code>, then update the classes on every <code>th</code>.`,
      starter: `
        const data = [
          { name: "Grace", score: 88, year: 3 },
          { name: "Ada", score: 95, year: 2 },
          { name: "Alan", score: 72, year: 4 },
          { name: "Edsger", score: 88, year: 1 },
        ];

        function renderRows(rows) {

        }

        function sortBy(key) {

        }
      `,
      solution: `
        const data = [
          { name: "Grace", score: 88, year: 3 },
          { name: "Ada", score: 95, year: 2 },
          { name: "Alan", score: 72, year: 4 },
          { name: "Edsger", score: 88, year: 1 },
        ];

        let sortKey = null;
        let ascending = true;

        function columnKeys() {
          return [...document.querySelectorAll("#grades thead th")].map(th => th.dataset.key);
        }

        function renderRows(rows) {
          const tbody = document.querySelector("#grades tbody");
          tbody.replaceChildren();
          const keys = columnKeys();
          for (const row of rows) {
            const tr = document.createElement("tr");
            for (const key of keys) {
              const td = document.createElement("td");
              td.textContent = row[key];
              tr.append(td);
            }
            tbody.append(tr);
          }
        }

        function sortBy(key) {
          ascending = key === sortKey ? !ascending : true;
          sortKey = key;
          data.sort((a, b) => {
            const x = a[key], y = b[key];
            const cmp = typeof x === "number" ? x - y : String(x).localeCompare(String(y));
            return ascending ? cmp : -cmp;
          });
          renderRows(data);
          for (const th of document.querySelectorAll("#grades thead th")) {
            th.classList.toggle("asc", th.dataset.key === key && ascending);
            th.classList.toggle("desc", th.dataset.key === key && !ascending);
          }
        }

        document.querySelector("#grades thead tr").addEventListener("click", e => {
          const th = e.target.closest("th");
          if (th) {
            sortBy(th.dataset.key);
          }
        });

        renderRows(data);
      `,
      checks: [
        { label: "initial render", run: `return _t.el("#grades tbody").innerHTML;` },
        { label: "click Name", run: `_t.$$("#grades th")[0].click(); return [_t.$$("#grades tbody tr").map(tr => tr.firstElementChild.textContent), _t.$$("#grades th").map(th => th.className)];` },
        { label: "click Score twice", run: `const th = _t.$$("#grades th")[1]; th.click(); const asc = _t.$$("#grades tbody tr td:nth-child(2)").map(td => td.textContent); th.click(); return [asc, _t.$$("#grades tbody tr td:nth-child(2)").map(td => td.textContent), _t.$$("#grades th").map(th => th.className)];` },
        { label: "renderRows uses the header order", run: `const head = _t.el("#grades thead tr"); head.prepend(head.lastElementChild); renderRows([{ name: "Zed", score: 1, year: 9 }]); return _t.el("#grades tbody").innerHTML;` },
      ],
    },
  ],
};
