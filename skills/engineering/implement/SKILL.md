---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Read `docs/agents/project-lifecycle.md` if present. Use the **Project development stage** as context when implementation choices have trade-offs (simplicity vs extension, invariants vs defensive handling, deletion vs compatibility), not as a decision rule.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.
