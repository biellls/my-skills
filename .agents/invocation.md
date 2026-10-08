# Model-invoked vs user-invoked

Every `SKILL.md` in this repo is a skill. The one axis that splits them is **invocation** — who can reach it:

- **User-invoked** — reachable **only by the human typing its name**. Set `disable-model-invocation: true` in the frontmatter. The `description` is **human-facing**: a one-line summary read by a person browsing slash-commands. Strip trigger lists ("Use when the user says…").
- **Model-invoked** — reachable by **model or user**. The default: omit `disable-model-invocation`. The `description` is **model-facing** and keeps rich trigger phrasing ("Use when the user wants…, mentions…, asks for…") so auto-invocation fires. The test for whether a skill should stay model-invoked: _could the model usefully reach for this autonomously?_ (Reuse is the reason to extract a skill, not the test.)

Because a user-invoked skill has no description, nothing but the human can reach it — no other skill can fire it. So a user-invoked skill may invoke model-invoked skills, but it can never reach another user-invoked skill.

Bucket `README.md`s and the top-level `README.md` group entries into **User-invoked** and **Model-invoked**.

## Dependencies between them

When a skill needs another skill, tell the agent to **load** it: "Load the `grilling` skill." Every step that needs the skill says to load it, even if an earlier step already did; don't assume an earlier load happened. A `/grilling` mention in passing reads as a label, and agents often skip it. Don't name a harness mechanism (Skill tool, `/skill:name`, file paths): each harness knows how to load skills its own way.

A user-invoked skill can't be loaded by another skill. Tell the user to run it instead: "recommend the user run `/improve-codebase-architecture`". Mentions that just name another skill without asking the agent to run it (hand-off notes, READMEs) keep `/name` as a plain label.

Don't use deep `../other-skill/FILE.md` cross-references either. Shared reference docs live inside the skill that owns them; other skills reach that material by loading the skill, not by linking across folders.

## Passive vs active domain work

Merely _reading_ `CONTEXT.md` for vocabulary is a one-line prose pointer, not the `domain-modeling` skill. Only the active build/sharpen discipline (challenge terms, edge-case scenarios, write ADRs, update `CONTEXT.md` inline) is `domain-modeling`.
