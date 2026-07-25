# Skills

A personal collection of agent skills (slash commands and behaviours) loaded by Claude Code and other Agent-Skills-standard harnesses. Skills are organised into buckets under `skills/`; the engineering skills speak a shared planning-and-delivery vocabulary and are consumed per-repo via the config that `/setup-skills` emits.

## Language

### The collection

**Skill**:
A single unit of agent capability — a folder containing a `SKILL.md` plus any reference docs, scripts, or templates it owns.

**Bucket**:
A top-level folder under `skills/` grouping related **Skills** (`engineering/`, `productivity/`, …).

**User-invoked skill**:
A **Skill** reachable only when the human types its name (`disable-model-invocation: true`). Its `description` is human-facing.

**Model-invoked skill**:
A **Skill** reachable by the model or the user. Its `description` carries rich trigger phrasing so auto-invocation can fire.

### Project lifecycle

**Project lifecycle**:
The broad progression of a project over time, made up of **Project development stages**.
_Avoid_: project status.

**Project development stage**:
The current stage of a repo within the **Project lifecycle** — e.g. `prototype`, `beta`, or `stable`. The stage contextualises engineering tradeoffs; it is not a decision rule.
_Avoid_: project posture, engineering mode, project development phase.

### Planning & delivery workflow

The shared language the engineering skills speak. Work is shaped to an **Altitude** by `/shape-work` and then published to the **Issue tracker** by `/to-tickets`. Once published, an **Issue** carries a lifecycle **State**, gaining definition until it is **ready** to implement.

**Altitude**:
The depth to which a piece of work has been shaped — one of **intent** (a **Candidate Issue**), **functional** (a **Functional description**), **technical** (a **Spec**), or **implementation slices** (**Sub-issues**). Altitude is a property of the work, deepened in place; a lower altitude is added only when the work needs it, and a consumer never smears one altitude's concerns onto another.
_Avoid_: level, phase, stage (that is a **Project development stage**).

**Work shaping**:
The activity of turning a goal, idea pile, roadmap area, bug cluster, or messy request into shaped work — by **breadth** (many **Candidate Issues** at the intent altitude) or by **depth** (grilling one idea down through the functional, technical, and implementation-slice altitudes, building domain docs as it goes). It aligns work; it does not publish it.
_Avoid_: sprint planning (too narrow), PRD planning (wrong altitude).

**Candidate Issue**:
A shaped-but-not-yet-published future **Issue** at the intent altitude. It has an **Intent statement**, Category, Priority, provisional **Complexity** / **Uncertainty**, dependencies, and a recommended disposition such as `now`, `backlog`, `later`, `needs-info`, `reject`, `wontfix`, `merge-with-existing`, or `pull-existing`.
_Avoid_: task, ticket, story.

**Issue**:
The functional unit of work — the parent item that carries a lifecycle **State** and hosts a **User story**. Often born from a **Candidate Issue** as an **Intent statement**; classified by one **Category**.
_Avoid_: story, ticket, feature. Never write bare "issue" for a tracker row or for an implementation slice.

**Intent statement**:
The 1–3 sentence description an **Issue** is born with — _what it is_ and _why it exists_ — written to pass the **cold-read test**: a reader weeks later grasps it without the **Functional description**. Stops short of product depth.
_Avoid_: title, one-liner, summary.

**Functional description**:
The artifact defining an **Issue**'s _what & why_ at the functional altitude (**User stories**, scope, acceptance) with no technical detail. Clears `needs-functional-definition`. Deliberately shallower than a **Spec**.
_Avoid_: product definition, spec (that is the technical artifact).

**Spec**:
The artifact defining an **Issue**'s _how_ at the technical altitude — a testable **Requirements** contract plus the seams, implementation decisions, and testing decisions that satisfy it, written in prose. Clears `needs-technical-definition` and is attached to the **Issue**. Carries **Requirements**, not **User stories**.
_Avoid_: PRD, technical spec (just "spec"), design doc.

**Requirement**:
A testable, stable-ID statement in a **Spec**, each suitable as the basis for one or more acceptance/TDD tests. Grouped by kind — functional (`FR-*`), authorization/access-control (`AR-*`), technical/system (`TR-*`), integration (`IR-*`), or non-functional (`NFR-*`) — and traceable to the **Functional description** IDs (`US-*`, `AC-*`) it derives from. Requirements must not masquerade as **User stories** with technical actors.
_Avoid_: fake user story, "as an orchestrator" story.

**Sub-issue**:
A technical child of an **Issue** at the implementation-slices altitude — a tracer-bullet vertical slice produced by `/shape-work` depth and published by `/to-tickets`.
_Avoid_: task, slice, issue.

**User story**:
The functional framing of an **Issue**, with a _real_ actor: "As a `<real user>`, I want `<goal>`, so that `<benefit>`." Lives in the **Functional description** only — never at **Spec** or **Sub-issue** level, where the "user" degrades into a technical component.
_Avoid_: using it for technical-actor requirements — those are just technical decisions.

**Interface checkpoint**:
A pause, before a material new or changed **Module** interface hardens, to make that interface visible as a design artifact — what callers must know, the obligations they take on, which adjacent modules are affected, and which implementation details stay hidden — and get the human's agreement. Offered during technical-altitude shaping; the plain-text formats live in the `/codebase-design` skill.
_Avoid_: API review, code review (it happens before implementation, not after).

**State**:
The single lifecycle label an **Issue** carries at a time — one of `needs-triage`, `needs-info`, `needs-functional-definition`, `needs-technical-definition`, `ready-for-agent`, `ready-for-human`, `wontfix`. `ready-for-agent` means definition is complete and AFK work can proceed, either directly or through implementation **Sub-issues**. Applies to **Issues**, not **Sub-issues**.
_Avoid_: triage role, state role, status.

**Category**:
How an **Issue** is classified by nature — `bug` or `enhancement`. Orthogonal to **State**.
_Avoid_: category role, type.

**Priority**:
An **Issue**'s importance — `low` / `medium` / `high`. Recommended from value and dependency position; defaults to `medium` when unsure and unspecified.
_Avoid_: severity.

**Complexity**:
An **Issue**'s decomposition pressure from the structure of the work, assuming the desired outcome is understood — breadth, intertwining, change difficulty, invariant load, regression risk, and novelty. Scored as a lightweight Fibonacci judgment (`1`, `2`, `3`, `5`, `8`, `13`), not as time, effort, capacity, or velocity.
_Avoid_: story points, estimate, size, effort.

**Uncertainty**:
An **Issue**'s definition pressure from unknowns about desired behaviour, constraints, domain rules, or implementation path. Scored on the same lightweight Fibonacci scale as **Complexity**, but answers a different question: how much must be learned or decided before the Issue is safely actionable?
_Avoid_: confidence, risk.

**Complexity / Uncertainty assessment**:
The current recommended **Complexity** and **Uncertainty** for an **Issue**, with a short rationale recorded somewhere durable on the **Issue**. Assessments are mutable and become better-informed as an **Issue** deepens in altitude from **Intent statement** to **Functional description** to **Spec**. Tracker labels or fields represent the current scores; if a score changes materially, leave a lightweight comment explaining the change. Scores surface recommendations and risks to the user; they do not authorize decomposition, deferral, or state changes without user visibility and approval.
_Avoid_: hidden estimate, automatic split trigger.

**Issue dependency**:
A `blocked-by` relation between two **Issues** — functional, work-level sequencing set while shaping or publishing.
_Avoid_: conflating with a **Sub-issue dependency**.

**Sub-issue dependency**:
A `blocked-by` relation between **Sub-issues** within a single **Issue**'s implementation — technical sequencing set by `/shape-work` depth and wired by `/to-tickets`.
_Avoid_: conflating with an **Issue dependency**.

**Triage**:
The activity of assessing an incoming _external_ **Issue** (or PR) and injecting it into the **State** machine. An activity, not a family of labels.
_Avoid_: "triage role" as a name for a **State**.

**Issue tracker**:
The external tool of record where **Issues** and **Sub-issues** are stored as rows (GitHub Issues, GitLab Issues, a local `.scratch/` markdown convention, …). Which tool — and how **Issues**, **Sub-issues**, **States**, **Priority**, **Complexity** / **Uncertainty**, and dependencies map onto it — is per-repo config emitted by `/setup-skills`.
_Avoid_: backlog, board.

### Wayfinding

The vocabulary `/wayfinder` speaks, above the planning-and-delivery altitudes. Bare "ticket" belongs to wayfinding alone — everywhere else the units of work are **Issues** and **Sub-issues**.

**Map**:
The canonical artifact of one wayfinding effort — a single tracker item holding the effort's destination, its notes, and an index of the decisions made so far, with **Decision tickets** as its children. An index, not a store: each decision lives in its ticket, and the map only gists and links it.
_Avoid_: epic, plan, roadmap.

**Decision ticket**:
A child of a **Map** posing one question whose resolution is a decision, sized to a single agent session and typed `research` / `prototype` / `grilling` / `task`. Resolved by a comment and closed, never built from — it produces a decision, not a deliverable, so it is not an **Issue** or a **Sub-issue**.
_Avoid_: Issue, Sub-issue, task; bare "ticket" outside wayfinding.

## Relationships

- A **Bucket** holds many **Skills**; each **Skill** is exactly one of **User-invoked** or **Model-invoked**.
- A repo has one current **Project development stage** within the **Project lifecycle**.
- A **Map** holds many **Decision tickets**; once every one is resolved the map is cleared, and it then enters **Work shaping** as settled input rather than becoming **Issues** directly.
- **Work shaping** produces work at an **Altitude**: breadth yields **Candidate Issues** at intent altitude; depth deepens one idea through the functional, technical, and implementation-slice altitudes. `/shape-work` aligns; `/to-tickets` publishes.
- An **Issue** carries exactly one **State** and one **Category** at a time, one **Priority**, and current **Complexity** / **Uncertainty** assessments.
- An **Issue** is usually born from a **Candidate Issue** as an **Intent statement** with provisional **Complexity** / **Uncertainty**, defined by a **Functional description**, then (only if technical) a **Spec**, and finally broken into many **Sub-issues** at implementation time.
- If functional definition or the **Spec** reveals that an **Issue** is really multiple functional outcomes, create replacement sibling **Issues** and close/archive the original with trace links; do not use **Sub-issues** for functional decomposition.
- A **User story** lives on an **Issue**, authored in its **Functional description**.
- A **Spec** captures the **Requirements** and technical decisions for an **Issue**; an **Interface checkpoint** aligns any material **Module** interface the Spec introduces before implementation hardens around it.
- A **Requirement** lives in a **Spec**, derives from the **Issue**'s **User stories** / acceptance criteria where applicable, and maps to one or more tests or implementation constraints.
- **Issue dependencies** link **Issues** to **Issues**; **Sub-issue dependencies** link **Sub-issues** within one **Issue**. The two never cross levels.
- The **Issue tracker** stores **Issues** and **Sub-issues**; the mapping is representation owned by `/setup-skills`.
