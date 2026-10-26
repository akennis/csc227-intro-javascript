// Lab 20 — localStorage. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-20",
  title: "localStorage",
  lesson: "20-localstorage",
  lessonTitle: "localStorage",
  intro: `<p>Persist data with <code>localStorage</code>. Each test run starts with the storage contents given in the
    prompt; the tests then call your code and inspect what's stored.</p>`,
  problems: [
    {
      key: "simple",
      title: "Drafts",
      points: 10,
      storage: { draft: "Dear Professor," },
      prompt: `Write <code>saveDraft(text)</code> (stores it under <code>"draft"</code>), <code>loadDraft()</code> (the stored
        draft, or <code>""</code> if none) and <code>clearDraft()</code> (removes it). Storage starts as
        <code>{ draft: "Dear Professor," }</code>.`,
      starter: `
        function saveDraft(text) {

        }

        function loadDraft() {

        }

        function clearDraft() {

        }
      `,
      solution: `
        function saveDraft(text) {
          localStorage.setItem("draft", text);
        }

        function loadDraft() {
          return localStorage.getItem("draft") ?? "";
        }

        function clearDraft() {
          localStorage.removeItem("draft");
        }
      `,
      checks: [
        { expr: "loadDraft()" },
        { label: "save, then load", run: `saveDraft("Hi there"); return [loadDraft(), _t.storage()];` },
        { label: "clear, then load", run: `clearDraft(); return [loadDraft(), _t.storage()];` },
      ],
    },
    {
      key: "moderate",
      title: "Contact book",
      points: 10,
      storage: { theme: "dark", "contact:ada": '{"first":"Ada","last":"Lovelace","phone":"555-0101"}' },
      prompt: `Contacts are stored as JSON under keys <code>"contact:"</code> + the first name in lower case. Write
        <code>addContact(contact)</code> for an object <code>{ first, last, phone }</code>; <code>findContact(first)</code>
        (case-insensitive) returning the object or <code>null</code>; and <code>listContacts()</code> returning an array of
        <code>"Last, First"</code> strings for every stored contact, sorted alphabetically. Other keys in storage (like
        <code>theme</code>) must be ignored. Storage starts with Ada and a theme.`,
      starter: `
        function addContact(contact) {

        }

        function findContact(first) {

        }

        function listContacts() {

        }
      `,
      solution: `
        const PREFIX = "contact:";

        function addContact(contact) {
          localStorage.setItem(PREFIX + contact.first.toLowerCase(), JSON.stringify(contact));
        }

        function findContact(first) {
          const text = localStorage.getItem(PREFIX + first.trim().toLowerCase());
          return text === null ? null : JSON.parse(text);
        }

        function listContacts() {
          const names = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(PREFIX)) {
              const c = JSON.parse(localStorage.getItem(key));
              names.push(c.last + ", " + c.first);
            }
          }
          return names.sort();
        }
      `,
      checks: [
        { expr: `findContact("ADA")` }, { expr: `findContact("bob")` }, { expr: "listContacts()" },
        { label: "add Alan and Grace", run: `addContact({ first: "Alan", last: "Turing", phone: "555-0102" }); addContact({ first: "Grace", last: "Hopper", phone: "555-0103" }); return [listContacts(), findContact("grace"), Object.keys(_t.storage()).sort()];` },
      ],
    },
    {
      key: "complex",
      title: "A cart that survives reloads",
      points: 10,
      storage: { cart: '{"Pen":2}' },
      prompt: `The cart is stored as JSON under <code>"cart"</code>, mapping item names to quantities. Clicking an
        <code>.add</code> button adds one of its <code>data-item</code> to the cart and saves it. <code>#cart</code> shows one
        <code>&lt;li&gt;</code> per item, sorted by name, as <code>ITEM × QTY</code>; <code>#total</code> shows the total price
        as <code>$0.00</code>, using each button's <code>data-price</code>. <code>#clear</code> empties the cart (and removes it
        from storage). The page must show the stored cart as soon as it loads — storage starts as <code>{"Pen":2}</code>, left
        over from an earlier visit.`,
      html: `
        <button class="add" data-item="Pen" data-price="1.25">Pen $1.25</button>
        <button class="add" data-item="Notebook" data-price="3.50">Notebook $3.50</button>
        <button class="add" data-item="Backpack" data-price="24.99">Backpack $24.99</button>
        <button id="clear">Clear cart</button>
        <ul id="cart"></ul>
        <p>Total: <span id="total"></span></p>`,
      hint: `Build a <code>prices</code> map from the buttons' data attributes once at start-up. Write one
        <code>render()</code> that rebuilds <code>#cart</code> and <code>#total</code> from the cart object, and call it on load
        and after every change.`,
      starter: `
        // your code here
      `,
      solution: `
        const prices = {};
        for (const b of document.querySelectorAll(".add")) {
          prices[b.dataset.item] = Number(b.dataset.price);
        }

        let cart = JSON.parse(localStorage.getItem("cart") ?? "{}");

        function render() {
          const list = document.getElementById("cart");
          list.replaceChildren();
          let total = 0;
          for (const item of Object.keys(cart).sort()) {
            const li = document.createElement("li");
            li.textContent = item + " × " + cart[item];
            list.append(li);
            total += prices[item] * cart[item];
          }
          document.getElementById("total").textContent = "$" + total.toFixed(2);
        }

        for (const b of document.querySelectorAll(".add")) {
          b.addEventListener("click", () => {
            cart[b.dataset.item] = (cart[b.dataset.item] ?? 0) + 1;
            localStorage.setItem("cart", JSON.stringify(cart));
            render();
          });
        }

        document.getElementById("clear").addEventListener("click", () => {
          cart = {};
          localStorage.removeItem("cart");
          render();
        });

        render();
      `,
      checks: [
        { label: "on load", run: `return [_t.$$("#cart li").map(li => li.textContent), _t.text("#total")];` },
        { label: "add Notebook, Pen, Notebook", run: `const [pen, book] = _t.$$(".add"); book.click(); pen.click(); book.click(); return [_t.$$("#cart li").map(li => li.textContent), _t.text("#total"), JSON.parse(_t.storage().cart)];` },
        { label: "clear", run: `_t.click("#clear"); return [_t.$$("#cart li").length, _t.text("#total"), _t.storage()];` },
      ],
    },
  ],
};
