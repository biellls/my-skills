---
name: github-tools
description: Portable gh-backed helpers for GitHub Issue types, native Priority, lifecycle labels, and Project single-select fields. Use when inspecting or updating these fields, including while publishing or triaging Issues.
---

# GitHub Tools

Read the target repo's `docs/agents/issue-tracker.md` and linked Project/label conventions first. They determine targets and values; ask if missing or ambiguous. This skill supplies mechanics, not workflow decisions.

## Run

Requires `uv` and authenticated `gh` with access to the repo and, for Project edits, permission to write the Project. Resolve `scripts/agent-tools` relative to **this SKILL.md** to an absolute path (`TOOL` below). Keep the working directory in the **target repository**, not this skill's folder.

Repository defaults to `gh repo view`. Check it matches the tracker docs; to override, set **both** `AGENT_GITHUB_OWNER` and `AGENT_GITHUB_REPO` (owner and bare repo name). Project edits additionally require `AGENT_GITHUB_PROJECT_OWNER` and `AGENT_GITHUB_PROJECT_NUMBER`, taken from the docs/Project URL—not inferred from the repo owner. Check inherited overrides before writing. No config file is needed.

```sh
uv run --script "$TOOL" issue show-fields 42
uv run --script "$TOOL" issue set-type 42 enhancement
uv run --script "$TOOL" issue set-priority 42 high
uv run --script "$TOOL" issue transition-state 42 needs-triage ready-for-agent
AGENT_GITHUB_PROJECT_OWNER="owner" AGENT_GITHUB_PROJECT_NUMBER="2" \
  uv run --script "$TOOL" issue set-project-field 42 Scope MVP Complexity 5
```

Replace example targets/values with the repo's actual ones. Use `--help` for command syntax.

## Boundaries

- `set-type` sets native Issue Type (`enhancement` → `Feature`); `set-priority` sets the **native Issue field** named `Priority`, not a Project field or label. Missing types/fields/options are errors; don't create substitutes silently.
- `set-project-field` accepts one or more `FIELD VALUE` pairs, quotes required for names/values with spaces. Only existing **single-select** fields/options are supported, not Sprint iterations. It adds the Issue to the Project if absent. Multiple updates are not transactional; inspect after a failure before retrying.
- `transition-state` swaps only the two supplied labels; read current labels first. It neither enforces the lifecycle nor closes the Issue.
- `show-fields` shows type, labels, native single-select values, and Project titles—not Project field values. Inspect those with `gh` when needed.
- Metadata is cached in the target repo's git common directory for 24 hours. After schema changes, use `set-project-field --refresh`; `AGENT_TOOLS_CACHE_TTL="0"` bypasses all metadata caches.
- Use ordinary `gh` commands for other operations (creation, comments, closing, dependencies, sub-issues, iterations). Report auth/unsupported-field errors rather than changing tracker conventions.
