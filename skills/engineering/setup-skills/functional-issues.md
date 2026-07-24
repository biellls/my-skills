# Functional Issues

How this repo authors and stores **Functional descriptions** for **Issues** — the functional altitude of [altitudes.md](./altitudes.md). 

A Functional description captures what the user needs and why, before technical definition. Keep it concise but thorough: state the problem, user value, observable contract, and boundary; stop before mechanism. Lower-level technical definition belongs to the technical altitude, captured by the spec's Implementation Decisions / Testing Decisions.

## Storage

Where the Functional description lives.

**Default:** the parent Issue body/description in the issue tracker.

**This repo uses:** _(record the choice — e.g. "the GitHub issue body"; "the Jira Story description"; "a linked Confluence page with a summary in the Issue body")._

## Default house shape

Use this shape unless the repo records a deliberate override below:

```md
## Why

The problem and its value, in domain language.

## User stories

US-1. As a <real actor>, I want <goal>, so that <benefit>.

## What to build

The capability and its functional contract. Describe observable behaviour, not mechanism.

## Out of scope

Adjacent behaviours this Issue does not own. Name sibling/related Issues where known.

## Acceptance criteria

AC-1. <observable functional criterion, no implementation detail>
AC-2. <observable functional criterion, no implementation detail>

## Depends on

Prerequisite Issues by tracker reference, or "None".

## Open questions for technical definition

Mechanism, seams, testing, architecture, and unresolved terminology questions deliberately left for the technical altitude (see `technical.md`).

## Complexity / Uncertainty

**Complexity:** 1 | 2 | 3 | 5 | 8 | 13 — rationale
**Uncertainty:** 1 | 2 | 3 | 5 | 8 | 13 — rationale
```

## Rules

- **Hold functional altitude.** Capture what/why/scope; park how/seams/testing/mechanism for technical definition.
- **Use real actors in User stories.** Do not write counterfeit technical stories like "As an orchestrator..."; those become technical Requirements instead.
- **Use stable IDs.** User stories use `US-*`; acceptance criteria use `AC-*`.
- **Don't bias open questions.** Naming a specific technology is fine only when the choice is genuinely settled. Otherwise say the how is a technical-definition decision.
- **Write in `CONTEXT.md` terms.** Use the canonical glossary; don't introduce looser synonyms.
- **Check for overlap first.** Search existing Issues before creating. If a new Issue is a sibling or replacement, trace both directions.
- **Respect ADRs.** Cross-check relevant ADRs; don't echo a pattern a later ADR replaced.
- **Functional splits create sibling Issues.** If definition reveals multiple functional outcomes, create replacement sibling Issues and close/archive the original with trace links. Do not create Sub-issues here.

## Repo-specific overrides

_(Record any house-shape or storage overrides here. Leave blank to use the default.)_
