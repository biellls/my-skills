# Implementation Slices

How this repo shapes work at the **implementation slices** altitude of [altitudes.md](./altitudes.md) — the lowest altitude, where a spec is broken into independently buildable pieces.

The artifact is a set of **Sub-issues**: tracer-bullet vertical slices of the parent Issue, each declaring the Sub-issues that **block** it. A Sub-issue is sized to fit one fresh context window and is demoable or verifiable on its own.

## Storage

Where the Sub-issues live.

**Default:** child issues of the parent Issue on the issue tracker, wired with its native blocking relationship; see `docs/agents/issue-tracker.md` for how this repo persists them.

**This repo uses:** _(record the choice if different.)_

## Vertical slices

Break the work into **tracer bullets**:

- Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests) — vertical, NOT a horizontal slice of one layer.
- A completed slice is demoable or verifiable on its own.
- Each slice is sized to fit a single fresh context window.
- Any prefactoring is done first. "Make the change easy, then make the easy change."

Give each Sub-issue its **blocking edges** — the other Sub-issues that must complete before it can start. One with no blockers can start immediately. The **frontier** is any Sub-issue whose blockers are all done; work it one at a time, blockers first.

## Wide refactors are the exception

A **wide refactor** is one mechanical change — rename a column, retype a shared symbol — whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**:

1. **Expand** — add the new form beside the old so nothing breaks.
2. **Migrate** — move call sites over in batches sized by blast radius (per package, per directory), each batch its own Sub-issue blocked by the expand, keeping CI green batch to batch because the old form still exists.
3. **Contract** — delete the old form once no caller remains, in a Sub-issue blocked by every migrate batch.

When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify Sub-issue — green is promised only there.

## Default house shape

Each Sub-issue, whichever way the tracker stores it:

```md
## What to build

The end-to-end behaviour this Sub-issue makes work, from the user's perspective — not a layer-by-layer implementation list.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Blocked by

Each blocking Sub-issue, or "None — can start immediately".
```

## Rules

- **Vertical, not horizontal.** A slice that only touches one layer isn't a tracer bullet.
- **No file paths or code snippets.** They go stale fast — same prototype-snippet exception as the technical altitude.
- **Blocking edges gate, they don't decorate.** A Sub-issue lists only the Sub-issues that genuinely must land first.
- **Shaping never publishes.** Deciding the slices is alignment — creating the Sub-issues on the tracker is `/to-tickets`' job.

## Repo-specific overrides

_(Record any slicing or storage overrides here. Leave blank to use the default.)_
