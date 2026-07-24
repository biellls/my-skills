---
name: setup-skills
description: Configure this repo for the engineering skills — set up its issue tracker, triage label vocabulary, project lifecycle, and domain doc layout. Run once before first use of the other engineering skills.
disable-model-invocation: true
---

# Setup Matt Pocock's Skills

Scaffold the per-repo configuration that the engineering skills assume:

- **Issue tracker** — where issues live (GitHub by default; local markdown is also supported out of the box)
- **Triage labels** — the strings used for the five canonical triage roles
- **Project lifecycle** — the repo's Project development stage (`prototype`, `beta`, or `stable`) for engineering trade-off context
- **Domain docs** — where `CONTEXT.md` and ADRs live, and the consumer rules for reading them
- **Altitudes** — the three planning altitudes (intent / functional / technical) the shaping and spec skills descend through

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, confirm with the user, then write.

## Process

### 1. Explore

Look at the current repo to understand its starting state. Read whatever exists; don't assume:

- `git remote -v` and `.git/config` — is this a GitHub repo? Which one?
- `AGENTS.md` and `CLAUDE.md` at the repo root — does either exist? Is there already an `## Agent skills` section in either?
- `CONTEXT.md` and `CONTEXT-MAP.md` at the repo root
- `docs/adr/` and any `src/*/docs/adr/` directories
- `docs/agents/` — does this skill's prior output already exist? Check for `docs/agents/project-lifecycle.md` too.
- `.scratch/` — sign that a local-markdown issue tracker convention is already in use
- Is the `triage` skill installed? (a `triage` skill folder alongside this one, or `triage` in your available skills.) This decides whether Section B runs at all.
- Monorepo signals — a `pnpm-workspace.yaml`, a `workspaces` field in `package.json`, or a populated `packages/*` with its own `src/`. Present only in a genuinely large multi-package repo; their absence means single-context, which is almost every repo.

### 2. Present findings and ask

Summarise what's present and what's missing. Then take the sections in order — one section, one answer, then the next.

Lead each section with the recommended answer so the user can accept it in a word. Give a one-line explainer only when the choice genuinely branches; skip the section entirely when exploration already settled it (Section B when `triage` isn't installed, Section C when there's no monorepo).

**Section A — Issue tracker.**

> Explainer: The "issue tracker" is where issues live for this repo. Skills like `to-tickets` and `triage` read from and write to it — they need to know whether to call `gh issue create`, write a markdown file under `.scratch/`, or follow some other workflow you describe. Pick the place you actually track work for this repo.

Default posture: these skills were designed for GitHub. If a `git remote` points at GitHub, propose that. If a `git remote` points at GitLab (`gitlab.com` or a self-hosted host), propose GitLab. Otherwise (or if the user prefers), offer:

- **GitHub** — issues live in the repo's GitHub Issues (uses the `gh` CLI)
- **GitLab** — issues live in the repo's GitLab Issues (uses the [`glab`](https://gitlab.com/gitlab-org/cli) CLI)
- **Local markdown** — issues live as files under `.scratch/<feature>/` in this repo (good for solo projects or repos without a remote)
- **Other** (Jira, Linear, etc.) — ask the user to describe the workflow in one paragraph; the skill will record it as freeform prose

Record the choice in `docs/agents/issue-tracker.md`. The GitHub and GitLab templates carry a "PRs as a request surface" flag, defaulted **off** — leave it off and don't raise it; a user who wants external PRs in the triage queue can flip the flag in the file later.

**Section B — Triage label vocabulary.** Skip this section entirely if the `triage` skill isn't installed (exploration told you) — an uninstalled skill needs no labels.

If it is installed, ask exactly one question:

> Do you want to keep the default triage labels? (recommended: **yes**)

The defaults are the five canonical roles, each label string equal to its name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. On **yes**, write them as-is. Only if the user says no — usually because their tracker already uses other names (e.g. `bug:triage` for `needs-triage`) — collect the overrides so `triage` applies existing labels instead of creating duplicates.

**Section C — Domain docs.** Default to **single-context** — one `CONTEXT.md` + `docs/adr/` at the repo root. This fits almost every repo; write it without asking.

Offer **multi-context** — a root `CONTEXT-MAP.md` pointing to per-context `CONTEXT.md` files — only when exploration found monorepo signals. Then confirm which layout they want.

**Section D — Altitudes.** No question. The four planning altitudes are universal, so write `docs/agents/altitudes.md` and its per-altitude house shapes `docs/agents/intent.md`, `docs/agents/functional-issues.md`, `docs/agents/technical.md`, and `docs/agents/implementation-slices.md` from the seeds as-is. Mention them in passing so the user knows they're there and can edit them later.

**Section E — Project lifecycle.**

> Explainer: A **Project development stage** is the repo's current stage in the **Project lifecycle**. Engineering skills use it as context for surfacing trade-offs — not as a decision rule. For example, beta makes future tech debt and explicit invariants more salient; stable makes compatibility, error handling, and regression protection more salient.

Choose the repo's current **Project development stage** (recommended: **beta**):

- **Prototype** — learning speed, isolation, and throwaway/promote trade-offs are especially salient.
- **Beta** — disciplined simplicity, future debt, invariants, and deletion trade-offs are especially salient.
- **Stable** — compatibility, reliability, error handling, and regression-safety trade-offs are especially salient.

Record the chosen stage in `docs/agents/project-lifecycle.md` — set the `Project development stage:` line in the seed to the answer.

### 3. Confirm and edit

Show the user a draft of:

- The `## Agent skills` block to add to whichever of `CLAUDE.md` / `AGENTS.md` is being edited (see step 4 for selection rules)
- The contents of `docs/agents/issue-tracker.md`, `docs/agents/project-lifecycle.md`, `docs/agents/domain.md`, `docs/agents/altitudes.md`, `docs/agents/intent.md`, `docs/agents/functional-issues.md`, `docs/agents/technical.md`, `docs/agents/implementation-slices.md`, and `docs/agents/triage-labels.md` (the last only when `triage` is installed)

Let them edit before writing.

### 4. Write

**Pick the file to edit:**

- If `CLAUDE.md` exists, edit it.
- Else if `AGENTS.md` exists, edit it.
- If neither exists, ask the user which one to create — don't pick for them.

Never create `AGENTS.md` when `CLAUDE.md` already exists (or vice versa) — always edit the one that's already there.

If an `## Agent skills` block already exists in the chosen file, update its contents in-place rather than appending a duplicate. Don't overwrite user edits to the surrounding sections.

The block:

```markdown
## Agent skills

### Issue tracker

[one-line summary of where issues are tracked]. See `docs/agents/issue-tracker.md`.

### Triage labels

[one-line summary of the label vocabulary]. See `docs/agents/triage-labels.md`.

### Domain docs

[one-line summary of layout — "single-context" or "multi-context"]. See `docs/agents/domain.md`.

### Project lifecycle

[one-line summary of the Project development stage]. See `docs/agents/project-lifecycle.md`.

### Altitudes

Intent / functional / technical / implementation-slices planning altitudes and which artifact carries each. See `docs/agents/altitudes.md`; the per-altitude house shapes are in `docs/agents/intent.md`, `docs/agents/functional-issues.md`, `docs/agents/technical.md`, and `docs/agents/implementation-slices.md`.
```

Include the `### Triage labels` sub-block, and write `docs/agents/triage-labels.md`, only when `triage` is installed and Section B ran. When it isn't, both are omitted.

Then write the docs files using the seed templates in this skill folder as a starting point:

- [issue-tracker-github.md](./issue-tracker-github.md) — GitHub issue tracker
- [issue-tracker-gitlab.md](./issue-tracker-gitlab.md) — GitLab issue tracker
- [issue-tracker-local.md](./issue-tracker-local.md) — local-markdown issue tracker
- [triage-labels.md](./triage-labels.md) — label mapping (only if `triage` is installed)
- [project-lifecycle.md](./project-lifecycle.md) — Project development stage and stage trade-off lenses
- [domain.md](./domain.md) — domain doc consumer rules + layout
- [altitudes.md](./altitudes.md) — the three planning altitudes and which artifact carries each
- [intent.md](./intent.md) — the intent-altitude house shape (Candidate Issues) and rules
- [functional-issues.md](./functional-issues.md) — the functional-altitude house shape and rules
- [technical.md](./technical.md) — the technical-altitude house shape (the spec) and rules
- [implementation-slices.md](./implementation-slices.md) — the slice-altitude house shape (Sub-issues) and rules

For "other" issue trackers, write `docs/agents/issue-tracker.md` from scratch using the user's description.

### 5. Done

Tell the user the setup is complete and which engineering skills will now read from these files — in particular, the planning, implementation, testing, and review skills read `docs/agents/project-lifecycle.md` for Project development stage context. Mention they can edit `docs/agents/*.md` directly later — re-running this skill is only necessary if they want to switch issue trackers, change the project stage, or restart from scratch.
