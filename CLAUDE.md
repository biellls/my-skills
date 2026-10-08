This repo is a personal collection of agent skills (slash commands and behaviours) loaded by Claude Code and other Agent-Skills-standard harnesses.

## Organisation

Skills live in bucket folders under `skills/`:

- `engineering/` — daily code work
- `productivity/` — daily non-code workflow tools

Add more buckets as the collection grows (e.g. `misc/` for kept-but-rarely-used skills, `personal/` for setup-specific ones, `in-progress/` for drafts, `deprecated/` for retired ones). Keep drafts and personal-only skills out of the promoted buckets above.

Each skill is a folder containing a `SKILL.md` plus any reference docs, scripts, or templates it owns.

## Conventions

- Every skill in a bucket has an entry in that bucket's `README.md`, with the skill name linked to its `SKILL.md`. Bucket READMEs group entries into **User-invoked** and **Model-invoked**.
- Every skill also has a reference in the top-level `README.md`, grouped the same way.
- Every `SKILL.md` is either **user-invoked** (`disable-model-invocation: true`, reachable only by the human) or **model-invoked** (model- or user-reachable). See [.agents/invocation.md](./.agents/invocation.md) for how this shapes the `description` field and cross-skill dependencies.
- Cross-skill dependencies are expressed as an instruction to load the skill ("Load the `grilling` skill"), at every step that needs it, not a passing `/grilling` mention or a deep `../other-skill/FILE.md` link. Shared reference material lives inside the skill that owns it.

## Installing into the harness

Skills install from GitHub via the [`skills`](https://skills.sh) CLI: `npx skills@latest add biellls/my-skills` (whole collection) or `npx skills@latest add biellls/my-skills/skills/engineering/<name>` (one skill). Add `--agent claude-code` to target an agent or `-g` for a global install; `npx skills update` pulls later changes. `scripts/list-skills.sh` prints every `SKILL.md` path locally. The projects that use these skills are listed in `projects.local.md` (gitignored); when asked to update the skills in our projects, apply the update to each one listed there.

## Attribution

These skills started from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT) and are being adapted. See `LICENSE`.
