---
name: to-tickets
description: Publish work that /shape-work has already aligned to the issue tracker — Issues at intent, a functional Issue, an Issue + spec, or an Issue + spec + Sub-issue slices, depending on the altitude reached. Synthesis only, no interview.
disable-model-invocation: true
---

# To Tickets

Persist work that `/shape-work` has already aligned. This skill **publishes**; it does not shape — do NOT interview or make new decisions.

Read two docs before writing anything:

- `docs/agents/issue-tracker.md` — **how** this repo persists issues: the create commands, the native blocking / sub-issue relationships, and label application.
- `docs/agents/altitudes.md` — **what** each altitude's artifact is, and the per-altitude house shapes it points at.

The aligned work is in the conversation context, or passed as a reference (a draft path, an issue URL) to fetch.

## Publish the shaping branch

If `/shape-work` created a branch for `CONTEXT.md` or ADR changes, verify those changes are committed, push the branch to `origin`, and set its upstream before publishing the tickets. Add a **Starting branch** reference to every published Issue and implementation Sub-issue that depends on those changes, naming the remote branch and stating that `/implement` must start from it. This reference is required even when the same branch is already linked from the parent Issue; each agent-grabbable ticket must be self-contained.

If shaping created no branch, omit the reference; implementation will start from the latest remote default branch.

## Publish at the altitude the work reached

Identify the altitude of the aligned work, confirm it with the user in one line, then persist. Each altitude includes the ones above it.

- **Intent** — create one or more **Issues** from the Candidate Issues, each with its intent-altitude fields (`docs/agents/intent.md`) and any `blocked-by` edges between them.
- **Functional** — create one **Issue** carrying the functional description (`docs/agents/functional-issues.md`).
- **Technical** — create the Issue and attach its **spec** (`docs/agents/technical.md`), stored where `issue-tracker.md` directs.
- **Implementation slices** — additionally create the **Sub-issues** (`docs/agents/implementation-slices.md`) as children of the Issue, wired with the tracker's native blocking relationship.

## How to persist

The *what* lives in the house-shape docs; the *how* lives in `docs/agents/issue-tracker.md` — follow it. Publish in dependency order (blockers first) so blocking edges can reference real identifiers. Apply the `ready-for-agent` triage label to agent-grabbable work unless told otherwise. Do NOT close or modify any parent issue. Avoid file paths and code snippets in issue bodies (the prototype-snippet exception aside) — they go stale.
