---
name: sketchpad
description: Run a local browser workspace for exploratory human/agent alignment using flexible HTML, Excalidraw-compatible scenes, anchored comments, and a durable CLI wait/reply loop. Use when a user wants to explore a product idea visually, annotate a prototype, discuss a diagram, or collaborate with the active Claude Code session without another LLM backend.
---

# Sketchpad

Use this when a blank-page conversation would be worse than a concrete example. The human stays in the browser; your reasoning stays in this Claude Code conversation. The workspace is a scratch artifact, not a second memory or decision system.

## Start

The bundled runtime is already shipped with this skill; it does not need a build in the user's cwd. Start it explicitly in the background so the active session can poll:

```bash
COLLAB=/absolute/path/to/sketchpad/scripts/collab.js
ROOT="$HOME/.sketchpad/demo"
mkdir -p "$ROOT"
node "$COLLAB" serve --data "$ROOT" >"$ROOT/server.log" 2>&1 & SERVER_PID=$!
echo "Sketchpad server PID=$SERVER_PID; log=$ROOT/server.log; http://127.0.0.1:4317"
# stop later with: kill "$SERVER_PID"
```

For a source checkout, developers may run `npm ci && npm run build` **from the my-skills repository root only**. Open the printed localhost URL.

The bundled demo explains this loop. Use a copied workspace for real work; do not serve a repository root. See [README.md](README.md) for setup, API examples, tests, and limitations.

## Agent loop

1. Start the local server and tell the human what question the artifact makes concrete.
2. Run `collab.js wait --data "$ROOT" --timeout 30000` when ready. It returns only unacknowledged human-authored actionable events; your own replies/proposals/artifact updates are conversation history, not new prompts. A finite timeout returns `{events:[]}`—run it again; polling cannot wake a stopped session.
3. Read each event's anchor/quote. Use `state` for exact revisions and raw paths, and compact `scene-context` before inspecting the raw `.excalidraw` file.
4. Challenge the proposal enough to surface a material consequence or uncertainty. Offer a concrete alternative or example, not a questionnaire.
5. Make only agreed artifact edits with `artifact --base-revision N` or agent scene edits with `save-scene --base-revision N`; revision values are required integers. Browser scene saves are human-authored and authoritative. Stale writes fail rather than overwrite.
6. Reply with `reply EVENT_ID --message ...`; label suggestions as **proposal**, include the reason, and anchor them when useful. Then `ack EVENT_ID` only after handling that human event. Keep the same `--after` until all returned events are acknowledged: never advance a cursor to silently skip an unacked event. Crashes before ack safely retry.
7. Repeat wait → receive → inspect → act → reply → ack. Keep the terminal recovery path visible.

## Artifact principles

Give discussion-worthy regions stable HTML `id` attributes; the runtime injects selection support into the sandboxed preview without changing source HTML. Give the initial HTML enough typography, readable line length, spacing, accessible contrast, and small callouts/comparisons to make a calm thinking space. The defaults are optional: an agent may compose freely and extend/override them. Do not impose sections, density, a diagram, or a schema; after a human has bearings, revise with restraint.

## Collaboration rules

- A selection anchor identifies an HTML element plus quoted text; a diagram anchor identifies an Excalidraw element ID/label. If a target disappeared, preserve the quote and say it is unresolved—never silently retarget.
- Separate layout polish from semantic change; ask when meaning is ambiguous. Update the relevant part, not the whole page after every message.
- Human sketches and agent suggestions are hypotheses. Check both against goals and constraints in the live conversation.
- Keep the smallest honest explanation visible: question, example, and any caveat that could change the decision.

The runtime is localhost-only and has no LLM, shell bridge, approvals subsystem, multiplayer, CRDT, or shared reasoning store. Browser input is operational state; Claude Code remains the authority for reasoning and file changes. Never request unsafe permission bypasses.
