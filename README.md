# CSC 227 · Introduction to JavaScript

A notebook-style introduction to JavaScript that runs entirely in the browser
and is served from GitHub Pages. Twenty-two lessons, each with editable
examples and inline challenges, plus a graded lab per lesson submitted by pull
request.

- **Lessons** (`lessons/`) — explanations, live examples you can edit and run,
  and challenges checked automatically against hidden tests.
- **Labs** (`labs/`) — three or four graded problems per lesson; copy your submission
  into your own repository (see `student-template/`) and open a pull request.
- **Safe to experiment** — learner code runs in a Web Worker or a sandboxed
  iframe; infinite loops are stopped instead of freezing the page.

## Run locally

```bash
npx serve .          # then open http://localhost:3000/
```

ES modules need `http://` — opening the files directly (`file://`) won't work.

## For instructors

```bash
npm install                        # teacher tools only (the site has no dependencies)
node tools/smoke.mjs               # check every page and challenge headlessly
node tools/gen-labs.js             # regenerate labs/lab-NN.js from plaintext solutions
node tools/grade.js --roster roster.json   # grade student submissions
```

Optional per-problem LLM code-quality review (advisory — never changes points):

```bash
# Provider 1 — any OpenAI-compatible chat endpoint (Ollama, a gateway):
node tools/grade.js --file submissions/lab-02.js \
  --llm-endpoint http://localhost:11434 --llm-model gemma2:12b   # optional --llm-token <bearer>
# Provider 2 — the Anthropic API (key read from the ANTHROPIC_API_KEY_CSC227 env var):
export ANTHROPIC_API_KEY_CSC227=sk-ant-…
node tools/grade.js --roster roster.json --llm-provider anthropic   # --llm-model defaults to claude-sonnet-5
# Either provider: --llm-timeout <ms> per review (default 60000)
```

For every submitted problem, the problem statement, page HTML, golden solution,
student code and test verdict go to the model, and a prose critique (decomposition,
naming, repetition, modern JS style) is printed to stdout, ready to paste into a
gradebook. Endpoint failures are logged to stderr and skipped.

See `CLAUDE.md` for architecture and authoring conventions.

## License

MIT — see `LICENSE`.
