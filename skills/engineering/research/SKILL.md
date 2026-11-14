---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
---

Spin up a **background agent** to do the research, so you keep working while it reads.

Its job:

1. Investigate the question against **primary sources** — official docs, source code, specs, first-party APIs — not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Save it where findings belong. If the repo has set up filing (`docs/agents/filing.md` exists), read the information map it points to and the guide on its research-findings row, and save the findings where they say. Otherwise, save them where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where.

Saving the findings is the end of the job. Filing them anywhere further (a comment, a record, a living doc) is the user's call, made later with `/file-this`.
