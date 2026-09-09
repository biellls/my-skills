---
name: sketchpad
description: Run a local browser workspace for exploratory human/agent alignment using flexible HTML, Excalidraw-compatible scenes, anchored comments, and a durable CLI wait/reply loop. Use when a user wants to explore a product idea visually, annotate a prototype, discuss a diagram, or collaborate with the active Claude Code session without another LLM backend.
---

# Sketchpad

Use this when a blank-page conversation would be worse than a concrete example. The human stays in the browser; your reasoning stays in this Claude Code conversation. The workspace is a scratch artifact, not a second memory or decision system.

## Start

```bash
npm ci && npm run build
ROOT="$HOME/.sketchpad/demo"
node /path/to/my-skills/skills/in-progress/sketchpad/scripts/collab.js serve --data "$ROOT" --open
# open http://127.0.0.1:4317 (or the URL printed by the command)
```

The bundled demo explains this loop. Use a copied workspace for real work; do not serve a repository root. See [README.md](README.md) for setup, API examples, tests, and limitations.

## Agent loop

1. Start the local server and tell the human what question the artifact makes concrete.
2. Run `collab.js wait --data "$ROOT" --timeout 30000` when ready. It long-polls; it cannot wake a stopped session.
3. Read the event and its anchor/quote. Inspect the referenced artifact or compact `scene-context`; do not dump an entire scene unless needed.
4. Challenge the proposal enough to surface a material consequence or uncertainty. Offer a concrete alternative or example, not a questionnaire.
5. Make only agreed artifact edits with `artifact` or scene edits with `save-scene`; both require the current revision. Direct human scene edits are authoritative and must not be overwritten by stale data.
6. Reply with `reply EVENT_ID --message ...`; label suggestions as **proposal**, include the reason, and anchor them when useful. A proposal is not silently applied.
7. Repeat wait → receive → inspect → act → reply. Keep the terminal recovery path visible.

## Artifact principles

Give the initial HTML enough typography, readable line length, spacing, accessible contrast, and small callouts/comparisons to make a calm thinking space. The defaults are optional: an agent may compose freely and extend/override them. Do not impose sections, density, a diagram, or a schema; after a human has bearings, revise with restraint.

## Collaboration rules

- A selection anchor identifies an HTML element plus quoted text; a diagram anchor identifies an Excalidraw element ID/label. If a target disappeared, preserve the quote and say it is unresolved—never silently retarget.
- Separate layout polish from semantic change; ask when meaning is ambiguous. Update the relevant part, not the whole page after every message.
- Human sketches and agent suggestions are hypotheses. Check both against goals and constraints in the live conversation.
- Keep the smallest honest explanation visible: question, example, and any caveat that could change the decision.

The runtime is localhost-only and has no LLM, shell bridge, approvals subsystem, multiplayer, CRDT, or shared reasoning store. Browser input is operational state; Claude Code remains the authority for reasoning and file changes. Never request unsafe permission bypasses.
