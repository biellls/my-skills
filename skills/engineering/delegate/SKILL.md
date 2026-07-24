---
name: delegate
description: Delegate worthwhile parallel work to background Pi agents through the Herdr-backed delegate tools, with parent status UI and isolated writer worktrees. Use when the user asks to fan out, run work in the background, or keep working while another agent investigates or implements.
---

# Delegate

Use a child only when parallelism repays the setup cost; do a single quick task directly unless the user explicitly asks to delegate. The parent remains the orchestrator.

This skill supplies policy. The `delegate_*` tools supply execution. If those tools are unavailable, say the Delegate extension is not installed; do not recreate its Herdr choreography with shell commands.

## Preflight

The trusted Git project must have a tracked `.delegate.json`:

```json
{
  "models": {
    "general": "provider/model:thinking"
  },
  "maxConcurrent": 4
}
```

Read the tracked `.delegate.json` before `delegate_start`. When one configured value clearly fits, use that exact provider-qualified string. Never invent, discover, or guess a model during delegation. `delegate_start.model` still allows an exact provider-qualified override even if it is not listed.

## Choose the run

- `capability: "read"` + `workspace.mode: "current"` for investigation. The extension puts current-checkout readers in the unfocused `Delegates` tab. Avoid changing relevant files while they inspect them.
- `capability: "write"` + `workspace.mode: "new-worktree"` for independent implementation.
- `capability: "write"` + `workspace.mode: "named-worktree"` and a readable `workspace.name` for sequential work on one reusable branch.
- Writers never use the parent checkout. A worktree starts from `HEAD`, not parent dirt. Use `dirtyPolicy: "allow"` only after confirming those omitted changes are irrelevant.
- `context: "fresh"` starts without parent conversation but loads normal project context. `context: "fork"` uses the persisted parent Pi session and costs more context.

## Brief and start

Give `delegate_start`:

- a concise readable label,
- the goal and expected final deliverable,
- fixed point/spec and files to inspect,
- scope and explicit non-goals,
- constraints, verification commands, evidence needed, and output budget.

Reference tracked source files, specifications, and documentation by path instead of reproducing their contents. Include only decisions or transient context the child cannot recover from its workspace. A worktree sees committed `HEAD`, not the parent's uncommitted changes.

The extension adds capability, workspace, commit, and final-report instructions. Do not duplicate them unless the task needs a stricter constraint.

## Continue and collect

After starting, keep doing independent work; do not duplicate the child's task merely to fill the wait. If no independent work remains, end the current turn. **Never sleep, wait, or poll for completion.** The extension automatically pushes a new parent turn when the child finishes or becomes blocked and keeps the footer/widget synchronized from Herdr state.

Use `delegate_status` with the label or id to collect the native last assistant message and session reference by default. Pass `lines` only when you explicitly need terminal output or when the session cannot be read. Inspect the full child session only when the report is insufficient.

Use `delegate_steer` for a concrete follow-up or correction. The extension rearms completion monitoring automatically.

## Finish

- Use `delegate_abort` to stop a child while preserving its session, worktree, and branch.
- Use `delegate_cleanup` only after accepting or discarding the result.
- For a one-off writer, verify and integrate the commit before cleanup. Cleanup removes the worktree workspace but never the branch.
- Named worktrees are retained by default; pass `removeWorkspace: true` only when the whole reusable workstream is finished.
- Never force cleanup and never delete a child branch automatically.
