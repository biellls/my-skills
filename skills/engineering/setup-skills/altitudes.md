# Altitudes

Planning work descends through four **altitudes**. Each altitude answers a different question, and mixing them is what produces fake user stories and muddy plans. The skills read this file so they agree on where each altitude's line sits and which artifact carries it.

An altitude is a property of the work as it's described — not a separate document per altitude. One Issue starts at **intent** and is deepened in place; a **spec** and its **Sub-issues** attach as the work descends to the technical and slice altitudes.

## The four altitudes

### 1. Intent — _what is this and why does it exist?_

The one- to three-sentence reason the work exists. Enough for a reader weeks later to grasp the point without conversation context. **No** functional depth, **no** technical how.

- **Belongs here:** the problem or opportunity, who it's for, why now, the `Not:` boundary that stops it colliding with adjacent work.
- **Does _not_ belong here:** user stories, acceptance criteria, seams, schemas, file names.

See [intent.md](./intent.md) (`docs/agents/intent.md` once scaffolded) for the intent house shape — the Candidate Issue fields, dispositions, and the cold-read rule that keeps this altitude clean.

### 2. Functional — _what does the system do, from the user's perspective?_

The observable behaviour. What a user can do and what they get back, described without committing to how it's built.

- **Belongs here:** user stories (`As an <actor>, I want <feature>, so that <benefit>`), acceptance criteria, scope and out-of-scope, the user-visible edge cases.
- **Does _not_ belong here:** modules, interfaces, seams, schemas, API contracts. A "user story" that only a developer could want (`As a developer, I want a repository interface…`) is a technical decision wearing a functional costume — move it down an altitude.

See [functional-issues.md](./functional-issues.md) (`docs/agents/functional-issues.md` once scaffolded) for the functional house shape — the section layout, stable US-/AC- IDs, and the rules that keep this altitude clean.

### 3. Technical — _how is it built and how is it tested?_

The implementation decisions a competent agent needs before writing code. The artifact is the **spec**.

- **Belongs here:** the seams the feature is tested at (prefer existing seams; the fewest possible, ideally one), modules and interfaces touched, schema changes, API contracts, and the testing strategy (what makes a good test here, which modules get tested, prior art).
- **Does _not_ belong here:** specific file paths or code snippets — they go stale fast. (Exception: a snippet from a `/prototype` that encodes a decision more precisely than prose — a state machine, reducer, schema, or type shape — trimmed to the decision-rich part.)

See [technical.md](./technical.md) (`docs/agents/technical.md` once scaffolded) for the spec house shape.

### 4. Implementation slices — _what are the independently buildable pieces?_

The spec broken into **Sub-issues**: tracer-bullet vertical slices of the Issue, each sized to one fresh context window and declaring the slices that block it.

- **Belongs here:** vertical slices (a complete path through every layer), blocking edges between them, expand–contract sequencing for wide refactors.
- **Does _not_ belong here:** horizontal one-layer slices, or restating the spec's decisions — a slice references the spec, it doesn't repeat it.

See [implementation-slices.md](./implementation-slices.md) (`docs/agents/implementation-slices.md` once scaffolded) for the slice house shape.

## Which artifact carries which altitude

Shaping and publishing are separate acts. `/shape-work` **shapes** (aligns) at every altitude but never writes to the tracker; `/to-tickets` **publishes** whatever `/shape-work` aligned, at the altitude it was taken to.

| Altitude              | Carried by                                     | Shaped by                        | Published by (`/to-tickets`)              |
| --------------------- | ---------------------------------------------- | -------------------------------- | ----------------------------------------- |
| Intent                | an **Issue** (title + intent)                  | `/shape-work` — breadth          | one or more intent-altitude Issues        |
| Functional            | the **Issue**'s functional description         | `/shape-work` — depth, functional| one functional Issue                      |
| Technical             | a **spec** attached to the Issue               | `/shape-work` — depth, technical | an Issue + its spec                       |
| Implementation slices | **Sub-issues** (vertical slices) of the Issue  | `/shape-work` — depth, slices    | Sub-issues wired with blocking edges      |

Each artifact appears only from its altitude down: the **spec** exists only once work reaches technical, **Sub-issues** only once it reaches slices. A repo that prefers to settle functional questions before technical ones just stops `/shape-work`'s depth pass at functional and publishes there, deepening later.

## Consumer rules

- **Never smear an altitude downward.** Don't write technical decisions into an Issue's intent, and don't write seams into an Issue's functional description. When you catch yourself doing it, that content belongs one altitude lower — move it, don't duplicate it.
- **Deepen in place, don't restate.** Work deepened to a lower altitude is the same work; the spec doesn't re-litigate the intent, a Sub-issue doesn't repeat the spec — each assumes the altitude above it.
- **A missing lower altitude is fine.** Plenty of work is shaped at intent and never needs a spec before it's small enough to build. Don't manufacture functional, technical, or slice detail to fill a template.
