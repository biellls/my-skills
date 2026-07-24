---
name: to-tickets
description: Publish work that /shape-work has already aligned to the issue tracker — Issues at intent, a functional ticket, a ticket + spec, or a ticket + spec + Sub-issue slices, depending on the altitude reached. Synthesis only, no interview.
disable-model-invocation: true
---

# To Tickets

Persist work that `/shape-work` has already aligned. This skill **publishes**; it does not shape — do NOT interview or make new decisions.

Read two docs before writing anything:

- `docs/agents/issue-tracker.md` — **how** this repo persists issues: the create commands, the native blocking / sub-issue relationships, and label application.
- `docs/agents/altitudes.md` — **what** each altitude's artifact is, and the per-altitude house shapes it points at.

The aligned work is in the conversation context, or passed as a reference (a draft path, an issue URL) to fetch.

## Publish at the altitude the work reached

Identify the altitude of the aligned work, confirm it with the user in one line, then persist. Each altitude includes the ones above it.

- **Intent** — create one or more **tickets** (Issues) from the Candidate Issues, each with its intent-altitude fields (`docs/agents/intent.md`) and any `blocked-by` edges between them.
- **Functional** — create one **ticket** carrying the functional description (`docs/agents/functional-issues.md`).
- **Technical** — create the ticket and attach its **spec** (`docs/agents/technical.md`), stored where `issue-tracker.md` directs.
- **Implementation slices** — additionally create the **Sub-issues** (`docs/agents/implementation-slices.md`) as children of the ticket, wired with the tracker's native blocking relationship.

## How to persist

The *what* lives in the house-shape docs; the *how* lives in `docs/agents/issue-tracker.md` — follow it. Publish in dependency order (blockers first) so blocking edges can reference real identifiers. Apply the `ready-for-agent` triage label to agent-grabbable work unless told otherwise. Do NOT close or modify any parent issue. Avoid file paths and code snippets in issue bodies (the prototype-snippet exception aside) — they go stale.
