# Issues are functional work items; sub-issues are their technical breakdown; one lifecycle defines both

**Context.** The skills previously had a single altitude — `to-prd` and the former `to-issues` both operated at implementation level. So "issue" meant an implementation slice, and PRD "user stories" collapsed into technical actors ("as an orchestrator, I want JSON"). The functional altitude (real users, real intent) had no home.

**Decision.** An **Issue** is the functional unit of work (parent; hosts a real user story); a **Sub-issue** is its technical child (the tracer-bullet slice `/define-sub-issues` produces). An Issue advances through **one** canonical lifecycle — `needs-triage → needs-functional-definition → needs-technical-definition → ready-for-agent | ready-for-human` (plus `needs-info` / `wontfix`) — where each definition skill (**intent shaping → Functional description → PRD**) is a guard-and-transition that produces one artifact and advances the State. **User story** is reserved for the functional altitude with a real actor. PRDs carry testable **Requirements** (`FR-*`, `AR-*`, `TR-*`, `IR-*`, `NFR-*`), not fake technical user stories. An Issue is often born from a shaped **Candidate Issue** at `needs-functional-definition` as an **Intent statement**.

**Considered options.**
- *Two orthogonal label axes (triage-role × definition-state)* — rejected: every Issue would carry two labels kept in sync; the states are mutually exclusive points on one lifecycle.
- *Keep "issue" = implementation slice* — rejected: it's precisely what forced counterfeit user stories and left the functional altitude homeless.
- *"product" vs "functional" for the middle altitude* — chose **functional** as the clean antonym of "technical."

**Consequences.**
- `setup-skills` owns *all* tracker representation (sprint container, Issue↔Sub-issue link, State labels, Priority, Complexity / Uncertainty, and dependencies) — nothing hardcoded in skills.
- The sprint step is realised as two skills — **`plan-sprint`** (align) and **`to-sprint`** (write) — following the `/align-technical-requirements` / `/to-prd` precedent, so goal-gradient pressure to write the sprint can't corrupt the alignment. Sprint planning assigns provisional Complexity / Uncertainty from the information available at intent altitude; those scores surface decomposition/definition risk but do not authorize automatic splits. See ADR 0002 for the later decision that work shaping precedes Sprint commitment, Sprints can pull existing Issues as well as create new ones, and `/plan-sprint` hands off to `/to-sprint` through agreed conversation context by default.
- Functional decomposition creates replacement sibling Issues and closes/archives the original with trace links. Sub-issues remain reserved for technical tracer-bullet slices produced after a PRD.
- The lifecycle skill names now describe their altitude: `/define-functional-issue`, `/align-technical-requirements`, `/to-prd`, and `/define-sub-issues`.
- The lifecycle terminates at `ready-*`; building and closing use the tracker's native open/closed.
