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

Once done, use /code-review in a background sub-agent to review the work. Align with the user how many rounds of review he wants, and either stop when reachin this number, or when the review comes up with only nitpicks.

Commit your work to the current branch.
