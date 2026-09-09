# Sketchpad prototype

A local-only exploratory workspace: flexible HTML is the idea artifact, while the diagram is stored as an Excalidraw-compatible `.excalidraw` scene. Humans edit in the browser and the active Claude Code session receives durable events through a small CLI queue.

## Quickstart

Requires Node.js 18+ and a browser. From the repository root:

```bash
npm ci
npm run build
DATA="$(mktemp -d)"
node skills/in-progress/sketchpad/scripts/collab.js serve --data "$DATA" --open
# visit the printed http://127.0.0.1:4317 URL (Ctrl-C stops the server)
```

The default demo is copied into `DATA`. It uses a small optional artifact stylesheet for typography, readable line length, spacing, accessible colors, callouts, and a comparison; agent-authored HTML can freely compose, extend, or override it. There are no required sections or density rules. In the browser, select a phrase and click **Comment on selection**, send a message, edit the native Excalidraw scene, and click **Save scene + PNG preview**. The server's URL and `DATA` path are printed on start.

In another terminal, receive and act without another model backend:

```bash
node scripts/collab.js wait --data "$DATA" --timeout 30000
node scripts/collab.js reply EVENT_ID --data "$DATA" --message "**Proposal:** keep the small example. Reason: it preserves focus."
node scripts/collab.js scene-context --data "$DATA"
```

`wait` is deliberately acknowledgement-based: run `ack EVENT_ID` after the existing agent has inspected and acted. A crash before acknowledgement leaves the event available on the next wait.

## Commands

- `serve [--data DIR] [--port N] [--open]` starts the localhost server.
- `send --message TEXT`, `comment --anchor-id ID --quote TEXT --message TEXT`, `propose --suggestion TEXT --reason TEXT` create agent-authored events (add `--author human` for simulation).
- `wait [--after N] [--timeout MS]` receives pending events; `ack ID` acknowledges one.
- `reply ID --message TEXT` creates a reply to an event; `scene-context [--preview FILE]` returns compact scene structure and can save the official PNG preview; `/api/scene/preview.png` serves it (after the browser has saved a scene).
- `artifact FILE --base-revision N` atomically replaces the HTML artifact; `save-scene FILE --base-revision N` saves a native scene JSON file.

## Test

```bash
npm test
```

This tests queue retry/persistence, both authors and anchors, artifact serving boundaries, atomic revision checks, and scene stale-write rejection. It is simulated CLI/API coverage, not live Claude dogfooding. HTTP `curl` checks are API/server smoke checks, not browser smoke tests. For an actual browser screenshot/smoke run, install Playwright separately and use the Chrome app executable: `npm --prefix /tmp/sketchpad-playwright install playwright`, then `SKETCHPAD_URL=http://127.0.0.1:4317 SKETCHPAD_SCREENSHOT=/tmp/sketchpad.png node skills/in-progress/sketchpad/scripts/browser-smoke.js` after starting the server. This mounts, comments, posts a simulated agent proposal, draws, saves, reloads, verifies the official PNG, and captures a screenshot; no live-Claude round trip is claimed.

See [REFERENCES.md](REFERENCES.md) for official Excalidraw documentation and inspiration/licensing boundaries.

## Known limitations

This prototype embeds the real `@excalidraw/excalidraw` editor. It stores the official Excalidraw JSON shape, preserves element IDs, labels, bindings, and files, and uses Excalidraw's `exportToBlob` utility for an official PNG preview. Complex collaboration features (live multiplayer, CRDT) are intentionally absent. There is one local workspace, no auth, no hosted sharing, no CRDT, and no process that can wake a stopped Claude session. Terminal permission prompts still apply. `DATA` is operational state; it is not a goals, decisions, or shared-context database.

## Dogfood script

1. Start the demo as above.
2. In the browser comment on `idea-question`, then send: “Should the diagram be authoritative?”
3. In the existing Claude Code session, run `wait`, inspect `scene-context`, and reply with a concrete **proposal** anchored to `idea-question`; only then edit the artifact or scene.
4. Drag the “Human sketch” node in the native Excalidraw editor, save it, and run `scene-context --preview /tmp/sketchpad-scene.png` again. Try saving an old exported scene with its old revision: the server must reject it rather than erase the human edit.
