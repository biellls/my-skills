---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Read `docs/agents/project-lifecycle.md` if present. Use the **Project development stage** as context when implementation choices have trade-offs (simplicity vs extension, invariants vs defensive handling, deletion vs compatibility), not as a decision rule.

If implementing multiple tickets, orchestrate sub-agents in the background to preserve your context window. When briefing the agents do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review in a background sub-agent to review the work. Align with the user how many rounds of review he wants, and either stop when reaching this number, or when the review comes up with only nitpicks.

A review finding is a claim to be evaluated, not an instruction. Whenever you dispatch a sub-agent to act on findings, tell it explicitly to fix what it agrees with and to push back with its reasoning on what it does not — you want its judgement, not compliance. Reviewers are wrong often enough that silent compliance turns a mistaken finding into a real defect, and the agent that wrote the code usually knows why it made a choice. Hold yourself to the same rule when you act on findings directly, and when you disagree with a finding, say so to the user rather than quietly dropping it.

Commit your work to the current branch.
