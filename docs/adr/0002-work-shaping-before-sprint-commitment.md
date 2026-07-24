# Work shaping precedes Sprint commitment

**Context.** ADR 0001 established that Issues are functional work items and Sub-issues are technical implementation slices. The first Sprint workflow treated a Sprint as the main place where intent-level Issues were born: `/plan-sprint` enumerated every Issue for the Sprint, and `/to-sprint` created one new Issue per draft item. That works when the user is already committing a Sprint, but it makes Sprint planning carry a broader job: discovering all possible work around a goal or idea pile. In practice, some discovered work belongs in the current Sprint, some belongs in backlog, some should be deferred, and some duplicates existing shaped Issues.

**Decision.** Introduce **Work shaping** as the general breadth-first activity before commitment. `/shape-work` turns a goal, idea pile, roadmap area, bug cluster, or messy request into **Candidate Issues** at intent altitude, each with a recommended disposition (`commit-to-sprint`, `backlog`, `later`, `needs-info`, `reject`/`wontfix`, `merge-with-existing`, or `pull-existing`). A **Sprint** is a commitment container: `/plan-sprint` uses `/shape-work` under a Sprint goal and also inventories existing shaped Issues, then selects the committed Sprint set. The handoff from `/plan-sprint` to `/to-sprint` is the agreed **Sprint publication context** in the conversation by default, not a required draft file. `/to-sprint` publishes that committed set by creating new committed Candidate Issues and attaching existing Issues without regressing their State.

**Considered options.**

- *Keep Sprint as the entry point* — rejected: it forces backlog discovery, duplicate detection, and later-work parking into a Sprint-shaped artifact.
- *Make `/shape-work` and `/plan-sprint` fully separate* — rejected as the only model: Sprint planning needs the same breadth-first shaping discipline, so duplicating it would drift.
- *Make `/shape-work` the shared discipline and `/plan-sprint` the Sprint-specific wrapper* — chosen. It mirrors `/grilling`: a reusable model-invoked discipline that user-invoked planning skills can constrain.

**Consequences.**

- A **Candidate Issue** is not necessarily a tracker row. It is shaped work that may later become an Issue, merge with an existing Issue, or remain only in a draft.
- `/shape-work` is model-invoked so `/plan-sprint` can depend on it and so the model can reach for it when the user asks to plan work broadly.
- `/plan-sprint` no longer assumes every shaped item belongs in the Sprint. It presents committed items separately from backlog/later/needs-info/rejected notes as shared conversation context.
- `/to-sprint` no longer assumes every committed item is new. It creates new Issues only for `Source: new` items and attaches `Source: existing <ref>` items to the Sprint container.
- `setup-skills` owns optional work-shaping artifact locations, along with tracker representation for Sprint containers, Priority, Complexity / Uncertainty, dependencies, and Issue↔Sub-issue links. Sprint draft files are optional handoff artifacts, not the normal `/plan-sprint` → `/to-sprint` contract.
