# Intent

How this repo shapes and stores work at the **intent** altitude of [altitudes.md](./altitudes.md) — what a piece of work is and why it exists, before any functional or technical definition.

Intent-altitude work is captured as **Candidate Issues**: one- to three-sentence statements of what and why, shaped breadth-first (many at once) and not yet deepened. A Candidate Issue is a *proposal* — it becomes a real Issue only when published.

## Storage

Where a Candidate Issue lives before it's published.

**Default:** conversation only, or a work-shaping draft under `.scratch/work-shaping/<slug>.md` when a durable artifact is wanted.

**This repo uses:** _(record the choice if different.)_

## Default house shape

Capture these fields for each Candidate Issue. Use the shape unless the repo records a deliberate override below.

```md
### <Candidate title>

- **Source:** new | existing <tracker ref>
- **Intent:** 1–3 sentences — what it is and why it exists. Must pass the cold-read test: a reader weeks later grasps the intent with no conversation context and no functional description.
- **Not:** <optional one-line boundary — only when confusion with adjacent work is likely>
- **Category:** bug | enhancement
- **Priority:** low | medium | high
- **Complexity:** 1 | 2 | 3 | 5 | 8 | 13 — provisional, structural decomposition pressure (not effort)
- **Uncertainty:** 1 | 2 | 3 | 5 | 8 | 13 — provisional, definition/learning pressure
- **Complexity / Uncertainty rationale:** why these scores fit at intent altitude
- **Depends on:** blocked-by Issue references, or "None"
- **Disposition:** now | backlog | later | needs-info | reject | wontfix | merge-with-existing <ref> | pull-existing <ref>
```

## Dispositions

Where each Candidate Issue should go once shaped:

- **`now`** — worth publishing as an Issue now.
- **`backlog`** — worth keeping, not published now.
- **`later`** — plausible but deliberately deferred.
- **`needs-info`** — cannot be safely shaped yet.
- **`reject` / `wontfix`** — should not be actioned.
- **`merge-with-existing <ref>`** — duplicate/sibling of an existing Issue; name the target.
- **`pull-existing <ref>`** — an existing Issue that belongs in this plan.

## Rules

- **Hold intent altitude.** State what and why; stop before functional depth (user stories, acceptance) and technical how (seams, schemas). Those are lower altitudes.
- **Pass the cold-read test.** If the intent only makes sense to someone who was in the conversation, it isn't done.
- **Don't deepen to score.** Never expand a candidate into functional or technical detail just to sharpen its Complexity / Uncertainty numbers — they stay provisional here.
- **Check for overlap first.** Search existing Issues before inventing new ones; prefer `merge-with-existing` or `pull-existing` over a duplicate.
- **Write in `CONTEXT.md` terms.** Use the canonical glossary; a concept missing from it is a signal for `/domain-modeling`, not a licence to coin a synonym.
- **Shaping never publishes.** Producing Candidate Issues is alignment, not commitment — publishing to the tracker is `/to-tickets`' job.

## Repo-specific overrides

_(Record any house-shape or disposition overrides here. Leave blank to use the default.)_
