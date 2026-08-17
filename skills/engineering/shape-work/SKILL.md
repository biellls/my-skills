---
name: shape-work
description: Grill the user to shape work by breadth or by depth. Breadth turns a goal, idea pile, or roadmap area into a set of Candidate Issues at intent altitude. Depth grills one idea down through the functional, technical, and implementation-slice altitudes, stopping at the agreed depth and building domain docs as it goes. Use when the user wants to plan, discover, or sharpen work before it's published.
disable-model-invocation: true
---

# Shape Work

Grill the user to shape work into agreed form before it's published. This skill **aligns**; it never writes to the tracker. It runs in one of two modes.

Read `docs/agents/altitudes.md` first — it defines the four altitudes (intent, functional, technical, implementation slices) and points at their house shapes (`docs/agents/intent.md`, `docs/agents/functional-issues.md`, `docs/agents/technical.md`, `docs/agents/implementation-slices.md`). Everything below stays inside those altitudes. Also read the domain docs per `docs/agents/domain.md` before shaping, so you use the project's vocabulary.

## Branch domain-document changes

Shape in the conversation unless the work requires modifying `CONTEXT.md` or ADRs. Before the first such edit, fetch `origin`, identify the repository's remote default branch (`origin/main` when that is the default), and create a dedicated branch in a separate git worktree from the latest `origin/<default-branch>`. Do not base it on a stale local branch.

Make all domain-document changes in that worktree and commit them before handoff. Preserve the branch name in the aligned output so `/to-tickets` can push and reference it. Do not create a branch or worktree when shaping produces no file changes.

## Pick the mode

- **Breadth** — the input is a goal, idea pile, roadmap area, bug cluster, or messy request, and the question is *what work is here*. Produce a set of **Candidate Issues at intent altitude**. Many items, shallow — do NOT deepen any one.
- **Depth** — the input is a single idea and the question is *what exactly is this, and how should it work*. Grill it down one altitude at a time. One item, deep.

If the mode isn't obvious from the request, ask which one — one goal split into many items is breadth; one item sharpened is depth.

## Non-negotiable interaction contract

Shaping is an interview by default, not a synthesis task. Unless the user supplies an already-agreed draft and says to use it, run the round-by-round `/grilling` loop before presenting any shaped result. A full candidate list, functional description, or set of technical decisions produced from repo context alone is a failure. Exploration informs each recommended answer; it never replaces user confirmation.

At any point before the shape is confirmed, your next response is one grilling round, with a recommended answer for each question — not a finished plan. Ask the whole current frontier of questions whose prerequisites are settled, then STOP and wait.

**When the input arrives already settled** — an agreed draft, or a body of decisions resolved elsewhere — don't re-derive it: carry those decisions into the house shape, zooming the source for detail instead of asking, and interview only what it genuinely leaves open (commonly the seams). If an open question is big enough that the source should have settled it, the source isn't finished — say so rather than quietly settling it here.

## Breadth mode

Produce a set of **Candidate Issues** at intent altitude, following the house shape in `docs/agents/intent.md`.

1. **Frame it.** State the outcome, problem area, or theme being shaped in one sentence.
2. **Inventory existing work.** Search existing Issues and known drafts for duplicates, siblings, and prerequisites before inventing new work. Prefer `merge-with-existing` / `pull-existing` over a duplicate.
3. **Shape breadth-first with `/grilling`.** Aim the grilling loop at the *breadth* of the set, not depth inside one item. Pressure-test across: **completeness** (what's missing?), **granularity** (which candidates are really several Issues?), **placement** (each candidate's disposition), **overlap** (which duplicate existing Issues?), **sequencing** (which Issue-level dependencies matter now?). Do NOT write functional descriptions, specs, or Sub-issues, and do NOT deepen one candidate to sharpen its Complexity / Uncertainty score.
4. **Capture each candidate's intent-altitude fields** per `docs/agents/intent.md` (title, intent, `Not:`, category, priority, provisional Complexity / Uncertainty, dependencies, disposition).
5. **Present the shaped set** grouped by disposition once the grilling loop has reached shared understanding. Ask for confirmation or edits.

## Depth mode

Grill one idea down through the altitudes, building domain docs as decisions land. This is the stateful, paper-trail-leaving interview — it does everything a plain grilling does *plus* running `/domain-modeling` to keep `CONTEXT.md` and ADRs current.

1. **Confirm the target depth.** Ask the user how deep this session should go — **functional**, **technical**, or all the way to **implementation slices** — and stop there. Recommend based on the work: functional when the *what* is the open question and the *how* is routine; technical when seams, schema, or test strategy are genuinely in doubt; slices when the work is agreed and ready to break into buildable pieces. Each depth includes the ones above it.
2. **Grill to the functional altitude** with `/grilling`, a round of questions at a time, each with a recommended answer, exploring the codebase instead of asking whenever possible. Settle the functional house shape in `docs/agents/functional-issues.md` — the problem, user value, user stories (real actors, `US-*`), scope, acceptance criteria (`AC-*`), boundary. Keep functional altitude: park how/seams/testing under "Open questions for technical definition."
3. **Run `/domain-modeling` throughout.** When a term is fuzzy, overloaded, or new, sharpen it and record it in `CONTEXT.md`; record hard-to-reverse decisions as ADRs. This is what makes depth mode stateful.
4. **If continuing to technical**, grill the parked questions into a **spec** per `docs/agents/technical.md`. The spec is not just seams — it carries a testable **Requirements** contract (`FR`/`AR`/`TR`/`IR`/`NFR`, each traceable to the functional `US-*`/`AC-*` it derives from) plus the seams to test at (prefer existing, fewest possible), modules/interfaces touched, invariants and error modes, schema changes, API contracts, and the testing strategy (which requirement IDs are covered at which seam). Grill to the depth a builder could implement and test against without reopening the design — a spec that is only seams and a couple of bullets is under-shaped. Stay in prose and decisions — no file paths or code snippets (a `/prototype` snippet that pins a decision is the only exception). When a decision touches a material new or changed Module interface, offer an **Interface checkpoint** (the `/codebase-design` skill's `INTERFACE-CHECKPOINTS.md` formats) before treating that interface as agreed.
5. **If continuing to implementation slices**, break the spec into **Sub-issues** per `docs/agents/implementation-slices.md`: tracer-bullet vertical slices, each with its blocking edges (expand–contract for wide refactors). Confirm the breakdown with the user — granularity and blocking edges — before it's considered aligned.
6. **Stop at the agreed depth and hand off.** The aligned work — a functional ticket, a ticket + spec, or a ticket + spec + Sub-issue slices — is ready to publish. Do not publish here; that's `/to-tickets`.
