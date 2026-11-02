// Lab 14 — The DOM II. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-14",
  title: "The DOM II",
  lesson: "14-dom-2",
  lessonTitle: "The DOM II: Building & Navigating the Tree",
  intro: `<p>Three problems on building the page from data: appending elements to a list, replacing a container's contents
    with nested elements, and walking the tree to build a nested table of contents. Build elements with <code>createElement</code> and <code>textContent</code>
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
  ],
};
