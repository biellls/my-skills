---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Read `docs/agents/project-lifecycle.md` if present. Use the **Project development stage** as context when implementation choices have trade-offs (simplicity vs extension, invariants vs defensive handling, deletion vs compatibility), not as a decision rule.

## Issue lifecycle

When the work comes from tracked tickets, read `docs/agents/issue-tracker.md`, fetch the parent Issue and its implementation-slice Sub-issues, and follow the tracker's configured workflow. As the first implementation action—before changing code or dispatching agents—move the parent Issue to **In progress**. Change the parent, not every Sub-issue; use the tracker's native status, label, or status field as documented.

Tie every delegated slice to its exact Sub-issue in the agent brief. As each agent finishes a slice, verify that its changes and slice-level checks are complete, record any completion context the tracker requires, and close that Sub-issue immediately. Do not defer all Sub-issue closures until the parent is finished, and do not close a Sub-issue for failed, partial, or unaccepted work. Closing the parent Issue remains a separate workflow step; do not close it merely because implementation ended.

## Worktree and starting branch

Work in a dedicated git worktree, never directly in the primary checkout. Before creating it, fetch `origin` and identify the repository's remote default branch (`origin/main` when that is the default); do not rely on a stale local default branch.

If the tickets reference a pushed shaping branch containing `CONTEXT.md` or ADR changes, create the implementation branch and worktree from that remote branch, then bring it up to date with the latest `origin/<default-branch>` before changing code. Otherwise create them directly from the latest `origin/<default-branch>`. Preserve the shaping commits and follow the repository's merge or rebase convention when integrating the current default branch.

If implementing multiple tickets, orchestrate sub-agents in the background to preserve your context window. When briefing the agents do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review in a background sub-agent to review the work. Align with the user how many rounds of review he wants. If he gives no preference, default to at most five rounds. Stop when reaching the agreed limit, or earlier when the review comes up with only nitpicks.

A review finding is a claim to be evaluated, not an instruction. Whenever you dispatch a sub-agent to act on findings, tell it explicitly to fix what it agrees with and to push back with its reasoning on what it does not — you want its judgement, not compliance. Reviewers are wrong often enough that silent compliance turns a mistaken finding into a real defect, and the agent that wrote the code usually knows why it made a choice. Hold yourself to the same rule when you act on findings directly, and when you disagree with a finding, say so to the user rather than quietly dropping it.

Commit your work to the current branch.
