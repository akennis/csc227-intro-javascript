// Lab 15 — Events. PLAINTEXT SOURCE (see tools/gen-labs.js).
export default {
  id: "lab-15",
  title: "Events",
  lesson: "15-events",
  lessonTitle: "Events",
  intro: `<p>Wire up the page with <code>addEventListener</code>. The tests click and type for you (including dispatching
    keyboard events), then read the page.</p>`,
  problems: [
    {
      key: "simple",
      title: "Counter buttons",
      points: 10,
      prompt: `Make <code>#inc</code> add 1, <code>#dec</code> subtract 1 (but never below 0), and <code>#reset</code> set the
        count back to 0. Show the count in <code>#count</code>. Disable <code>#dec</code> whenever the count is 0.`,
      html: `
        <button id="dec">−</button>
        <span id="count">0</span>
        <button id="inc">+</button>
        <button id="reset">Reset</button>`,
      starter: `
        let count = 0;

        // your code here
      `,
      solution: `
        let count = 0;

        function render() {
          document.getElementById("count").textContent = count;
          document.getElementById("dec").disabled = count === 0;
        }

        document.getElementById("inc").addEventListener("click", () => { count++; render(); });
        document.getElementById("dec").addEventListener("click", () => { if (count > 0) count--; render(); });
        document.getElementById("reset").addEventListener("click", () => { count = 0; render(); });
        render();
      `,
      checks: [
        { label: "initially", run: `return [_t.text("#count"), _t.el("#dec").disabled];` },
        { label: "+ + + −", run: `_t.click("#inc"); _t.click("#inc"); _t.click("#inc"); _t.click("#dec"); return [_t.text("#count"), _t.el("#dec").disabled];` },
        { label: "reset, then − does nothing", run: `_t.click("#reset"); _t.el("#dec").disabled = false; _t.click("#dec"); return [_t.text("#count"), _t.el("#dec").disabled];` },
      ],
    },
    {
      key: "moderate",
      title: "Star rating",
      points: 10,
      prompt: `<code>#stars</code> holds five <code>span.star</code> elements with <code>data-value</code> 1 to 5. Using
        <strong>one</strong> click listener on <code>#stars</code> (delegation), clicking a star gives the class
        <code>on</code> to that star and every star with a lower value, removes it from the others, and shows
        <code>N / 5</code> in <code>#rating</code>. Clicking the gaps between stars does nothing.`,
      html: `
        <style>.star { font-size: 1.6rem; cursor: pointer; color: #bbb; } .star.on { color: goldenrod; }</style>
        <div id="stars">
          <span class="star" data-value="1">★</span><span class="star" data-value="2">★</span><span class="star" data-value="3">★</span><span class="star" data-value="4">★</span><span class="star" data-value="5">★</span>
        </div>
        <p>Rating: <span id="rating">0 / 5</span></p>`,
      starter: `
        document.getElementById("stars").addEventListener("click", e => {

        });
      `,
      solution: `
        document.getElementById("stars").addEventListener("click", e => {
          const star = e.target.closest(".star");
          if (!star) {
            return;
          }
          const value = Number(star.dataset.value);
          for (const s of document.querySelectorAll("#stars .star")) {
            s.classList.toggle("on", Number(s.dataset.value) <= value);
          }
          document.getElementById("rating").textContent = value + " / 5";
        });
      `,
      checks: [
        { label: "click star 3", run: `_t.$$(".star")[2].click(); return [_t.$$(".star").map(s => s.className), _t.text("#rating")];` },
        { label: "then star 1", run: `_t.$$(".star")[0].click(); return [_t.$$(".star").map(s => s.className), _t.text("#rating")];` },
        { label: "click the container itself", run: `_t.el("#stars").click(); return _t.text("#rating");` },
      ],
    },
    {
      key: "complex",
      title: "Tag input",
      points: 10,
      prompt: `Typing in <code>#tag</code> and pressing <code>Enter</code> or <code>,</code> (comma) adds a tag: the text,
        trimmed and lower-cased, becomes
        <code>&lt;span class="tag"&gt;TEXT &lt;button class="x"&gt;×&lt;/button&gt;&lt;/span&gt;</code> appended to <code>#tags</code>
        (note the space after the text), and the input is cleared. Empty and duplicate tags are not added (but the input is
        still cleared). For the comma key, call <code>e.preventDefault()</code> so no comma is typed. Clicking a tag's
        <code>×</code> removes that tag — use one delegated listener on <code>#tags</code>. Keep <code>#count</code> showing the
        number of tags.`,
      html: `
        <input id="tag" placeholder="Add a tag, press Enter">
        <div id="tags"></div>
        <p><span id="count">0</span> tags</p>`,
      starter: `
        // your code here
      `,
      solution: `
        const tagsEl = document.getElementById("tags");
        const input = document.getElementById("tag");

        function currentTags() {
          return [...tagsEl.querySelectorAll(".tag")].map(t => t.firstChild.textContent.trim());
        }

        function updateCount() {
          document.getElementById("count").textContent = tagsEl.querySelectorAll(".tag").length;
        }

        input.addEventListener("keydown", e => {
          if (e.key !== "Enter" && e.key !== ",") {
            return;
          }
          e.preventDefault();
          const text = input.value.trim().toLowerCase();
          input.value = "";
          if (text === "" || currentTags().includes(text)) {
            return;
          }
          const span = document.createElement("span");
          span.className = "tag";
          span.append(text + " ");
          const x = document.createElement("button");
          x.className = "x";
          x.textContent = "×";
          span.append(x);
          tagsEl.append(span);
          updateCount();
        });

        tagsEl.addEventListener("click", e => {
          if (e.target.classList.contains("x")) {
            e.target.closest(".tag").remove();
            updateCount();
          }
        });
      `,
      checks: [
        { label: "add JavaScript, css, javascript (dup), blank", run: `const box = _t.el("#tag"); const press = (key) => box.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })); box.value = " JavaScript "; press("Enter"); box.value = "css"; press(","); box.value = "javascript"; press("Enter"); box.value = "  "; press("Enter"); return [_t.el("#tags").innerHTML, _t.text("#count"), box.value];` },
        { label: "comma is prevented", run: `const box = _t.el("#tag"); box.value = "html"; const ev = new KeyboardEvent("keydown", { key: ",", bubbles: true, cancelable: true }); box.dispatchEvent(ev); return ev.defaultPrevented;` },
        { label: "remove the first tag", run: `_t.$$("#tags .x")[0].click(); return [_t.el("#tags").innerHTML, _t.text("#count")];` },
        { label: "other keys do nothing", run: `const box = _t.el("#tag"); box.value = "zzz"; box.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true })); return [box.value, _t.text("#count")];` },
      ],
    },
  ],
};
