# Sketchpad prototype

A local-only exploratory workspace: flexible HTML is the idea artifact, while the diagram is stored as an Excalidraw-compatible `.excalidraw` scene. Humans edit in the browser and the active Claude Code session receives durable events through a small CLI queue. The queue exposes only unacknowledged human-authored actionable events; browser state still shows the full conversation.

## Quickstart

Requires Node.js 18+ and a browser. The compiled runtime and demo ship inside the installed skill, so run it directly:

```bash
SKILL=/absolute/path/to/sketchpad
DATA="$(mktemp -d)"; mkdir -p "$DATA"
node "$SKILL/scripts/collab.js" serve --data "$DATA" >"$DATA/server.log" 2>&1 & SERVER_PID=$!
echo "PID=$SERVER_PID; log=$DATA/server.log; open http://127.0.0.1:4317"
# stop later with: kill "$SERVER_PID"
```

Developers rebuilding from this repository must run `npm ci && npm run build` from the **my-skills repository root**, not from a user's workspace.

The default demo is copied into `DATA`. It uses a small optional artifact stylesheet for typography, readable line length, spacing, accessible colors, callouts, and a comparison; agent-authored HTML can freely compose, extend, or override it. There are no required sections or density rules. In the browser, select a phrase and click **Comment on selected passage**, send a message, open the native Excalidraw editor, and click **Save diagram + preview**. The server's URL and `DATA` path are printed on start.

In another terminal, receive and act without another model backend:

```bash
node "$SKILL/scripts/collab.js" wait --data "$DATA" --timeout 30000
node "$SKILL/scripts/collab.js" reply EVENT_ID --data "$DATA" --message "**Proposal:** keep the small example. Reason: it preserves focus."
node "$SKILL/scripts/collab.js" ack EVENT_ID --data "$DATA"
node "$SKILL/scripts/collab.js" state --data "$DATA"
node "$SKILL/scripts/collab.js" scene-context --data "$DATA" --preview /tmp/sketchpad-scene.png
```

`wait` returns only unacknowledged human-authored actionable events. Agent replies, proposals, artifact changes, and agent scene saves remain visible in `/api/state` but do not re-enter the agent queue. Run `ack EVENT_ID` only after handling each event; keep the same `--after` while any returned event is unacknowledged. A crash or finite timeout is safe: rerun `wait`, and do not advance a cursor to skip work.

## Commands

- `serve [--data DIR] [--port N] [--open]` starts the localhost server.
- `send --message TEXT`, `comment --anchor-id ID --quote TEXT --message TEXT`, `propose --suggestion TEXT --reason TEXT` create agent-authored events (add `--author human` for simulation).
- `wait [--after N] [--timeout MS]` receives actionable human events; finite timeouts require re-polling; `ack ID` acknowledges one.
- `state` prints current revisions and exact data/raw-scene/preview paths.
- `reply ID --message TEXT` creates a reply to an event; `scene-context [--preview FILE]` returns compact scene structure and can save the official PNG preview; `/api/scene/preview.png` serves it (after the browser has saved a scene).
- `artifact FILE --base-revision N` atomically replaces the HTML artifact; `save-scene FILE --base-revision N` saves an agent-authored native scene JSON file. Browser scene saves are human-authored. JSON writes require `application/json`, loopback Host/Origin, and exact nonnegative revisions.

## Test

```bash
npm test
```

This tests queue retry/persistence and batches without self-delivery, both authors and anchors, strict Host/Origin and content-type boundaries, atomic revision checks, PNG invalidation/signature checks, and scene stale-write rejection. It is simulated CLI/API coverage, not live Claude dogfooding. HTTP `curl` checks are API/server smoke checks, not browser smoke tests. For an actual browser screenshot/smoke run, install Playwright separately and use the Chrome app executable: `npm --prefix /tmp/sketchpad-playwright install playwright`, then `SKETCHPAD_URL=http://127.0.0.1:4317 SKETCHPAD_SCREENSHOT=/tmp/sketchpad.png node skills/in-progress/sketchpad/scripts/browser-smoke.js` after starting the server. This mounts, comments, posts a simulated agent proposal, draws, saves, reloads, verifies the official PNG, and captures a screenshot; no live-Claude round trip is claimed.

Run `node skills/in-progress/sketchpad/scripts/browser-regression.js` for a self-contained real-browser check of sandbox isolation, selection in newly authored HTML, draft recovery, unsaved diagram close/reopen, persisted element IDs, and preview-failure recovery. It starts/stops its own temporary server. Set `PLAYWRIGHT_MODULE` and `CHROME_PATH` to override its local Playwright/Chrome paths.

See [REFERENCES.md](REFERENCES.md) for official Excalidraw documentation and inspiration/licensing boundaries.

## Artifact editing and recovery

Give discussion-worthy HTML regions stable `id` attributes. The server injects the selection bridge into its sandboxed preview, not into source files; arbitrary new HTML needs no embedded SDK. Artifact scripts cannot access the privileged shell. The optional stylesheet works inside the sandbox; other external assets/scripts are intentionally restricted in this first prototype.

The `state` command reports the actual server workspace paths (the running server/port selects the workspace). Make a working copy before editing and publish via the revision-checked CLI rather than overwriting operational files directly. Browser chat drafts and their anchors are recovered locally per workspace; diagrams require an explicit save. Closing the editor preserves unsaved edits, and leaving the page warns when diagram edits are unsaved. A browser crash can still lose unsaved drawings. Saves are revision-checked snapshots, not a full version-history/undo system. If an agent change conflicts with an unsaved drawing, export your drawing before reloading and reconcile deliberately.

## Known limitations

This prototype embeds the real `@excalidraw/excalidraw` editor. Its PNG preview is revision-bound: after a later scene save, the old file is unavailable until the new browser export succeeds. It stores the official Excalidraw JSON shape, preserves element IDs, labels, bindings, and files, and uses Excalidraw's `exportToBlob` utility for an official PNG preview. The package may attempt optional remote font URLs; localhost CSP blocks those requests and the editor falls back locally. Complex collaboration features (live multiplayer, CRDT) are intentionally absent. There is one local workspace, no auth, no hosted sharing, no CRDT, and no process that can wake a stopped Claude session. Terminal permission prompts still apply. `DATA` is operational state; it is not a goals, decisions, or shared-context database.

## Dogfood script

1. Start the demo as above.
2. In the browser comment on `idea-question`, then send: “Should the diagram be authoritative?”
3. In the existing Claude Code session, run `wait`, inspect `scene-context`, and reply with a concrete **proposal** anchored to `idea-question`; only then edit the artifact or scene.
4. Drag the “Human sketch” node in the native Excalidraw editor, save it, and run `scene-context --preview /tmp/sketchpad-scene.png` again. Try saving an old exported scene with its old revision: the server must reject it rather than erase the human edit.
