# Technical

How this repo shapes work at the **technical** altitude of [altitudes.md](./altitudes.md) — the implementation decisions a competent agent needs before writing code.

The technical altitude's artifact is the **spec**. Functional value already lives on the Issue (see [functional-issues.md](./functional-issues.md)); the spec adds the technical layer on top — seams, decisions, and test strategy. It is decisions in prose, not code.

## Storage

Where the spec lives.

**Default:** a spec document attached to or linked from the ticket in the issue tracker; see `docs/agents/issue-tracker.md` for how this repo persists it.

**This repo uses:** _(record the choice if different.)_

## Default house shape

Use this shape unless the repo records a deliberate override below:

```md
## Seams

The seam(s) the feature is tested at. Prefer existing seams to new ones, and the highest seam possible. The fewer seams across the codebase, the better — the ideal is one. If a new seam is needed, propose it at the highest point you can.

## Implementation Decisions

The decisions a builder needs, e.g.:

- Modules built or modified, and the interfaces of those modules
- Architectural decisions and technical clarifications
- Schema changes
- API contracts
- Specific interactions

## Testing Decisions

- What makes a good test here (test external behaviour, not implementation details)
- Which modules will be tested
- Prior art — similar tests already in the codebase

## Out of Scope

Technical work this spec deliberately does not cover.

## Further Notes

Anything else a builder should know.
```

## Rules

- **Hold technical altitude.** Capture how it's built and tested; the what/why already lives at the functional altitude — don't restate it, assume it.
- **Fewest seams, highest seams.** Prefer existing seams; propose new ones only at the highest point, as few as possible.
- **No file paths or code snippets.** They go stale fast. Exception: a `/prototype` snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape) — inline it, trimmed to the decision-rich part, noting it came from a prototype.
- **Write in `CONTEXT.md` terms.** Use the canonical glossary; a missing concept is a signal for `/domain-modeling`.
- **Respect ADRs.** Cross-check relevant ADRs; don't echo a pattern a later ADR replaced. If a decision contradicts an ADR, surface it.
- **Weight decisions by the project stage.** Read `docs/agents/project-lifecycle.md` if present and use the **Project development stage** as context for how much the spec should invest in defensive handling, error handling, migration/compatibility paths, and test depth — prototype leans toward speed and isolation, stable toward compatibility and regression safety. It is context for trade-offs, not a decision rule.
- **Shaping never publishes.** Producing the spec is alignment — persisting it to the tracker is `/to-tickets`' job.

## Repo-specific overrides

_(Record any house-shape or storage overrides here. Leave blank to use the default.)_
