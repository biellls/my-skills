# Technical

How this repo shapes work at the **technical** altitude of [altitudes.md](./altitudes.md) — the implementation decisions a competent agent needs before writing code.

The technical altitude's artifact is the **spec**. Functional value already lives on the Issue (see [functional-issues.md](./functional-issues.md)); the spec adds the technical layer on top — a testable **Requirements** contract plus the seams, decisions, and test strategy that satisfy it. It is requirements and decisions in prose, not code. Aim for the depth a competent builder could implement and test against without reopening the design; a spec that is only seams and a couple of bullets is under-shaped.

## Storage

Where the spec lives.

**Default:** a spec document attached to or linked from the Issue in the issue tracker; see `docs/agents/issue-tracker.md` for how this repo persists it.

**This repo uses:** _(record the choice if different.)_

## Default house shape

Use this shape unless the repo records a deliberate override below:

```md
## Requirements

Grouped, stable-ID, testable requirements — each suitable as the basis for one or more acceptance/TDD tests, and traceable to the functional altitude via `Derived from: US-*, AC-*` where it flows from one. These are the technical contract, not restated user stories. Only include groups that have requirements; omit empty sections.

### Functional requirements

FR-1. Observable product/system behaviour the implementation must exhibit.
Derived from: US-1, AC-1

### Authorization requirements

AR-1. Permission, access-control, privacy, or tenant-boundary behaviour.
Derived from: AC-2

### Technical requirements

TR-1. Internal/system behaviour needed to satisfy the functional contract (state, concurrency, idempotency, data lifecycle…).

### Integration requirements

IR-1. Behaviour at boundaries between modules, services, external systems, or workflows.

### Non-functional requirements

NFR-1. Performance, reliability, observability, compatibility, migration, or regression constraints.

## Seams

The seam(s) the feature is tested at. Prefer existing seams to new ones, and the highest seam possible. The fewer seams across the codebase, the better — the ideal is one. If a new seam is needed, propose it at the highest point you can.

## Implementation Decisions

The decisions a builder needs to satisfy the Requirements, e.g.:

- Modules built or modified, and the interfaces of those modules
- Architectural decisions and technical clarifications
- Invariants and error/failure modes to uphold
- Schema changes
- API contracts
- Specific interactions and sequencing

## Testing Decisions

- The highest useful test seam and why
- Which requirement IDs are covered at which seam
- What makes a good test here (test external behaviour, not implementation details)
- Prior art — similar test styles or behaviours already in the codebase

## Out of Scope

Technical work this spec deliberately does not cover.

## Further Notes

Anything else a builder should know, including the current Complexity / Uncertainty rationale if it isn't recorded elsewhere on the Issue.
```

## Rules

- **Hold technical altitude.** Capture how it's built and tested; the what/why already lives at the functional altitude — don't restate it, assume it. The **Requirements** here are the testable technical contract (`FR`/`AR`/`TR`/`IR`/`NFR`), not user stories with technical actors.
- **Requirements are testable and traceable.** Each requirement must be checkable by one or more acceptance/TDD tests, carry a stable ID, and cite the `US-*`/`AC-*` it derives from when it flows from the functional layer. Group by kind; omit empty groups. Vague prose that can't back a test isn't a requirement.
- **Fewest seams, highest seams.** Prefer existing seams; propose new ones only at the highest point, as few as possible.
- **No file paths or code snippets.** They go stale fast. Exception: a `/prototype` snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape) — inline it, trimmed to the decision-rich part, noting it came from a prototype.
- **Write in `CONTEXT.md` terms.** Use the canonical glossary; a missing concept is a signal for `/domain-modeling`.
- **Respect ADRs.** Cross-check relevant ADRs; don't echo a pattern a later ADR replaced. If a decision contradicts an ADR, surface it.
- **Weight decisions by the project stage.** Read `docs/agents/project-lifecycle.md` if present and use the **Project development stage** as context for how much the spec should invest in defensive handling, error handling, migration/compatibility paths, and test depth — prototype leans toward speed and isolation, stable toward compatibility and regression safety. It is context for trade-offs, not a decision rule.
- **Shaping never publishes.** Producing the spec is alignment — persisting it to the tracker is `/to-tickets`' job.

## Repo-specific overrides

_(Record any house-shape or storage overrides here. Leave blank to use the default.)_
