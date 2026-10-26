// Lab 13 — The DOM I. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-13",
  title: "The DOM I",
  lesson: "13-dom-1",
  lessonTitle: "The DOM I: From HTML to a Live Document",
  intro: `<p>Four problems on finding elements and reading and changing what's already on the page: text, classes,
    attributes, <code>dataset</code>, and form controls. Each page's HTML is shown above its editor; the tests call your
    functions and then inspect the page.</p>`,
  problems: [
    {
      key: "simple",
      title: "Status message",
      points: 10,
      prompt: `Write <code>setStatus(text, ok)</code> that puts <code>text</code> into <code>#status</code> and gives it the
        class <code>ok</code> when <code>ok</code> is true, or <code>error</code> when false — never both (remove the other one).
        Any other classes on the element must be kept.`,
      html: `<p id="status" class="banner">Ready</p>`,
      starter: `
        function setStatus(text, ok) {

        }
      `,
      solution: `
        function setStatus(text, ok) {
          const el = document.getElementById("status");
          el.textContent = text;
          el.classList.toggle("ok", ok);
          el.classList.toggle("error", !ok);
        }
      `,
      checks: [
        { label: "saved, ok", run: `setStatus("Saved", true); return _t.el("#status").outerHTML;` },
        { label: "then failed", run: `setStatus("Failed", false); return _t.el("#status").outerHTML;` },
        { label: "then ok again", run: `setStatus("Saved again", true); return _t.el("#status").outerHTML;` },
      ],
    },
    {
      key: "moderate",
      title: "Highlighter",
      points: 10,
      prompt: `Write <code>highlight(selector, cls)</code>, which adds the class <code>cls</code> to every element matching the CSS
        <code>selector</code> and returns how many elements matched, and <code>clearHighlight(cls)</code>, which removes
        <code>cls</code> from every element that has it and returns how many it was removed from.`,
      html: `
        <style>.mark { background: yellow; } .warn { color: crimson; }</style>
        <ul id="words">
          <li class="noun">dog</li>
          <li class="verb">run</li>
          <li class="noun">cat</li>
          <li class="adj noun">blue</li>
        </ul>
        <p class="note">A note.</p>`,
      starter: `
        function highlight(selector, cls) {

        }

        function clearHighlight(cls) {

        }
      `,
      solution: `
        function highlight(selector, cls) {
          const els = document.querySelectorAll(selector);
          els.forEach(el => el.classList.add(cls));
          return els.length;
        }

        function clearHighlight(cls) {
          const els = document.querySelectorAll("." + cls);
          els.forEach(el => el.classList.remove(cls));
          return els.length;
        }
      `,
      checks: [
        { label: 'highlight(".noun", "mark")', run: `return [highlight(".noun", "mark"), _t.el("#words").innerHTML];` },
        { label: 'highlight("#words > li:first-child, p", "warn")', run: `return [highlight("#words > li:first-child, p", "warn"), _t.$$(".warn").map(e => e.textContent)];` },
        { label: 'clearHighlight("mark")', run: `return [clearHighlight("mark"), _t.$$(".mark").length, _t.el("#words").innerHTML];` },
        { label: "no matches", run: `return [highlight(".missing", "mark"), clearHighlight("nothing")];` },
      ],
    },
    {
      key: "complex",
      title: "Read and validate an order form",
      points: 10,
      prompt: `Write <code>readOrder()</code> returning
        <code>{ name, size, crust, toppings, delivery, address, errors }</code> from the form:
        <ul>
          <li><code>name</code> and <code>address</code> trimmed; <code>size</code> the select's value; <code>crust</code> the checked
          radio's value; <code>toppings</code> an array of the checked toppings' values, in page order; <code>delivery</code> a boolean.</li>
          <li><code>errors</code> an array of messages, in this order: <code>"name is required"</code> if the name is empty;
          <code>"choose at least one topping"</code> if none is checked; <code>"address is required for delivery"</code> if delivery is
          ticked and the address is empty.</li>
        </ul>
        Also show the errors in <code>#errors</code> as one <code>&lt;li&gt;</code> each (empty it first) — you may set its
        <code>innerHTML</code> to <code>""</code> and then add items with <code>insertAdjacentHTML</code> or <code>append</code>.`,
      html: `
        <form id="order">
          <label>Name <input name="name"></label><br>
          <label>Size <select name="size"><option>small</option><option selected>medium</option><option>large</option></select></label><br>
          Crust:
          <label><input type="radio" name="crust" value="thin" checked> thin</label>
          <label><input type="radio" name="crust" value="thick"> thick</label><br>
          Toppings:
          <label><input type="checkbox" name="topping" value="cheese"> cheese</label>
          <label><input type="checkbox" name="topping" value="mushroom"> mushroom</label>
          <label><input type="checkbox" name="topping" value="olive"> olive</label><br>
          <label><input type="checkbox" name="delivery"> delivery</label>
          <label>Address <input name="address"></label>
        </form>
        <ul id="errors"></ul>`,
      hint: `<code>document.getElementById("order").elements</code> gives the controls by name (<code>.name</code>, <code>.size</code>,
        <code>.crust</code>, …). For the toppings, <code>querySelectorAll("input[name=topping]:checked")</code>.`,
      starter: `
        function readOrder() {

        }
      `,
      solution: `
        function readOrder() {
          const f = document.getElementById("order").elements;
          const order = {
            name: f.name.value.trim(),
            size: f.size.value,
            crust: f.crust.value,
            toppings: [...document.querySelectorAll("#order input[name=topping]:checked")].map(c => c.value),
            delivery: f.delivery.checked,
            address: f.address.value.trim(),
            errors: [],
          };
          if (order.name === "") {
            order.errors.push("name is required");
          }
          if (order.toppings.length === 0) {
            order.errors.push("choose at least one topping");
          }
          if (order.delivery && order.address === "") {
            order.errors.push("address is required for delivery");
          }
          const list = document.getElementById("errors");
          list.replaceChildren();
          for (const msg of order.errors) {
            const li = document.createElement("li");
            li.textContent = msg;
            list.append(li);
          }
          return order;
        }
      `,
      checks: [
        { label: "empty form", run: `return [readOrder(), _t.$$("#errors li").map(li => li.textContent)];` },
        { label: "a complete pickup order", run: `const f = _t.el("#order").elements; _t.type(f.name, "  Ada "); f.size.value = "large"; f.crust.value = "thick"; _t.$$("input[name=topping]")[0].checked = true; _t.$$("input[name=topping]")[2].checked = true; return [readOrder(), _t.$$("#errors li").length];` },
        { label: "delivery without an address", run: `const f = _t.el("#order").elements; f.delivery.checked = true; _t.type(f.address, "   "); return [readOrder().errors, _t.$$("#errors li").map(li => li.textContent)];` },
      ],
    },
    {
      key: "challenge",
      title: "Price table from data attributes",
      points: 10,
      prompt: `Each row of <code>#cart tbody</code> has <code>data-price</code> and <code>data-qty</code>. Write
        <code>updateTotals(taxRate)</code> that:
        <ol>
          <li>fills each row's <code>td.line</code> with its line total as <code>$0.00</code>, and stores the number in a
          <code>data-line</code> attribute (also as <code>0.00</code> text, via <code>dataset</code>);</li>
          <li>gives a row the class <code>big</code> when its line total is at least 10, and removes it otherwise;</li>
          <li>writes the subtotal, the tax (subtotal × <code>taxRate</code>) and the total to <code>#subtotal</code>, <code>#tax</code>
          and <code>#total</code>, each as <code>$0.00</code>;</li>
          <li>returns the total, rounded to cents (<code>Math.round(x * 100) / 100</code>).</li>
        </ol>
        The tests change quantities (by editing <code>data-qty</code>) and call it again.`,
      html: `
        <style>tr.big { background: #fff3bf; } td { padding: 2px 8px; }</style>
        <table id="cart">
          <thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Line</th></tr></thead>
          <tbody>
            <tr data-price="1.25" data-qty="4"><td>Pens</td><td>1.25</td><td>4</td><td class="line"></td></tr>
            <tr data-price="3.50" data-qty="3"><td>Notebooks</td><td>3.50</td><td>3</td><td class="line"></td></tr>
            <tr data-price="24.99" data-qty="1"><td>Backpack</td><td>24.99</td><td>1</td><td class="line"></td></tr>
          </tbody>
        </table>
        <p>Subtotal <span id="subtotal"></span> · Tax <span id="tax"></span> · Total <strong id="total"></strong></p>`,
      starter: `
        function updateTotals(taxRate) {

        }
      `,
      solution: `
        const money = n => "$" + n.toFixed(2);

        function updateTotals(taxRate) {
          let subtotal = 0;
          for (const tr of document.querySelectorAll("#cart tbody tr")) {
            const line = Number(tr.dataset.price) * Number(tr.dataset.qty);
            subtotal += line;
            tr.querySelector("td.line").textContent = money(line);
            tr.dataset.line = line.toFixed(2);
            tr.classList.toggle("big", line >= 10);
          }
          const tax = subtotal * taxRate;
          const total = subtotal + tax;
          document.getElementById("subtotal").textContent = money(subtotal);
          document.getElementById("tax").textContent = money(tax);
          document.getElementById("total").textContent = money(total);
          return Math.round(total * 100) / 100;
        }
      `,
      checks: [
        { label: "updateTotals(0.08)", run: `return [updateTotals(0.08), _t.el("#cart tbody").innerHTML, _t.text("#subtotal"), _t.text("#tax"), _t.text("#total")];` },
        { label: "change quantities, no tax", run: `const rows = _t.$$("#cart tbody tr"); rows[0].dataset.qty = "10"; rows[1].dataset.qty = "1"; return [updateTotals(0), rows.map(r => [r.className, r.dataset.line]), _t.text("#total")];` },
      ],
    },
  ],
};
