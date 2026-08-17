# Persistent Learning

Persistence prevents the skill from restarting a topic, repeating the same questions, or treating one apparently successful answer as permanent understanding. It preserves evidence of what the learner encountered, when they encountered it, how independently they reasoned about it, where their understanding remained incomplete, and when it should be revisited.

## Storage and tooling

Use the bundled deterministic CLI at `scripts/learning_store.py`. Resolve that path from the skill directory, but run it with the project being studied as the working directory. The CLI uses only the Python standard library, creates or migrates its schema as needed, and emits JSON.

The database always belongs to the current project:

```text
.scratch/learn-with-conversation.sqlite3
```

Do not support a global learning database or generate SQL or ad hoc Python to interact with the store. Do not modify the project's `.gitignore`. If Python, SQLite, or the path is unavailable, briefly tell the learner that the conversation will not be persisted and continue teaching.

Use the CLI's help instead of guessing its interface:

```bash
python3 <skill-dir>/scripts/learning_store.py --help
python3 <skill-dir>/scripts/learning_store.py assess --help
```

## Topics within a project

One project can contain many independent learning topics. A topic has a canonical name and may have aliases.

At the start of an invocation, initialize the store and search using the learner's requested topic:

```bash
python3 <skill-dir>/scripts/learning_store.py init
python3 <skill-dir>/scripts/learning_store.py topic-find "<requested topic>"
```

- Resume the topic when one name or alias clearly matches.
- Create a topic with `topic-create` when none matches.
- If multiple topics could match, briefly ask which one the learner means.
- Never silently merge topics merely because they seem semantically related.
- Keep reviews scoped to the selected topic. A conversation about one topic must not be interrupted by overdue reviews from an unrelated topic.
- When reasoning genuinely supplies evidence for concepts in two related topics, record it for both rather than merging their histories.

No explicit session record is needed. Session boundaries do not affect review priority or learning state, and a session may end without a reliable closing action. Timestamped ledger events provide the durable history.

## What is persisted

### Topics and concepts

A **topic** identifies a subject the learner may return to. A **concept** is an actual teaching target in that topic's understanding tree. Concepts may have a parent concept, an internal descriptive label, and a formal name.

Create a concept only when it becomes a teaching target. Do not create records for every incidental term mentioned in an explanation.

The root insight is a concept. `set-root` appends a root-selection event rather than erasing an earlier root. If later learning reveals that the current root depends on something deeper, select the deeper concept and explain the revision in the event observation.

The root remains the structural anchor of the understanding tree, not a mandatory starting point for every invocation. Revisit it when it is due, when evidence suggests it has become fragile, or when it is needed to reconnect the learner to the current branch. Otherwise continue from the learner's actual frontier.

### Append-only evidence ledger

Understanding changes quickly: a learner may forget something, repair the gap minutes later, or demonstrate stronger understanding from a new angle. Therefore, do not store understanding as a mutable status or mastery Boolean. Append evidence and derive the current state from the history.

The CLI records these event types:

- `introduced` — the learner encountered a concept, either implicitly or by name.
- `formal_name_revealed` — specialist vocabulary was disclosed after the underlying idea was grounded.
- `root_selected` — a concept was selected or revised as the topic's root.
- `question_asked` — the exact question was recorded before it was shown to the learner.
- `assessed` — the learner's response was summarized and evaluated.

Every ledger event requires:

- a UTC timestamp;
- the relevant topic and, where applicable, concept;
- a concise, human-readable `observation` explaining what happened and why the event was recorded.

Never overwrite earlier evidence. A later event may correct, weaken, or supersede an earlier inference, but the history remains available.

### Questions and responses

Record each question with `question` before presenting it. This preserves unanswered questions and helps avoid asking the same thing again after context is lost. On a follow-up, inspect `recent_questions` from `resume` and use `history` if older detail is needed.

After the learner responds, append an assessment containing:

- a concise summary of the response;
- the angle or context explored;
- whether the reasoning was independent or required light or heavy assistance;
- any observed difficulty;
- whether this was a scheduled review;
- the related question event when available;
- an observation explaining the assessment.

Store the exact question, but only a focused summary of the response. Do not store full user or assistant transcripts; they add noise and may preserve unrelated sensitive material.

## Evidence model

Disclosure, understanding, and difficulty are separate dimensions. Do not collapse them into one status.

### Disclosure

- **Implicit** — the idea has been encountered, but its formal name has intentionally not been revealed.
- **Named** — the formal term has been introduced when the learner was ready for it.

Naming is progressive: once a concept is named, later implicit examples do not make it unnamed again.

### Understanding

- **Introduced** — the concept has been encountered but not independently demonstrated.
- **Partial** — the learner has some correct reasoning but still has a gap, requires prompting, or currently holds a conflicting model.
- **Demonstrated** — the learner independently reasoned through the concept in a concrete context without a current difficulty.
- **Mastered** — derived from repeated independent demonstrations across meaningfully different angles and time; never directly asserted as a mutable flag.

Only independent reasoning with no current difficulty may be recorded as demonstrated. If the learner required heavy prompting, do not mark the concept demonstrated merely because they eventually repeated the answer. Record partial understanding and the assistance that was needed.

Mastery requires both:

1. independent demonstrations from at least three meaningfully different angles; and
2. a successful delayed review after an interval of at least seven days.

Use a short, stable description for each angle so the ledger can distinguish them. Examples include mechanism, prediction, comparison, counterexample, transfer to a new case, or application in a different context. Choose angles appropriate to the concept rather than forcing every concept into a universal taxonomy.

Mastery remains revisable. If later evidence is partial, forgotten, or materially mistaken, the derived current state must reflect that evidence even though the historical demonstrations remain in the ledger.

### Difficulties

A partial assessment may identify one or more distinct difficulties:

- **Missing prerequisite** — the learner lacks an earlier concept required to reason further.
- **Gap** — part of the reasoning is sound, but a necessary connection is absent.
- **Conflation** — neighboring concepts are being treated as if they were the same.
- **Misconception** — the learner has a coherent but materially incorrect model.
- **Forgotten** — a previously demonstrated concept cannot currently be retrieved or reconstructed.

These difficulties are evidence, not permanent labels. Later assessments can show that they have been repaired without deleting the earlier observation.

## Spaced review schedule

Only a concept that has been independently demonstrated enters the spaced-review sequence. Schedule its first review one day after that demonstration.

Use these intervals:

```text
1 day → 3 days → 7 days → 14 days → 30 days → 30 days thereafter
```

Derive the next review from assessment events:

- **Independent recall:** advance to the next interval.
- **Partial or heavily prompted recall:** do not advance; revisit after one day.
- **Forgotten or materially misconceived:** reset the sequence to the one-day step.
- **Immediate repair after a gap:** record the new independent demonstration, but still review it again one day after the repair.
- **Thirty-day success:** remain on a recurring thirty-day interval.

A review schedule is not a claim of permanent understanding. It is the next opportunity to gather evidence. The same assessment event must drive both the derived understanding and the schedule: a heavily prompted answer cannot produce mastered understanding while also being treated as a failed review.

## Choosing where to continue

Before responding in a follow-up invocation, run:

```bash
python3 <skill-dir>/scripts/learning_store.py resume <topic-id>
```

The result includes the current root, due concepts, unresolved concepts, and recent questions. Use it to choose the next conversational move in this order:

1. **Finish the concept currently being repaired.** Once a response reveals a gap, continue that natural thread rather than abruptly switching topics.
2. **Review due concepts.** Due evidence takes precedence over advancing into unexplored material.
3. **Resume unresolved concepts.** Continue concepts that were started but never independently demonstrated.
4. **Explore a new adjacent concept.** Advance only when no repair, due review, or unresolved understanding should come first.

An **unresolved concept** is a teaching target whose current evidence is introduced or partial, including a concept currently blocked by a prerequisite, misconceived, or forgotten. It is not an unexplored branch. Unexplored concepts have not yet become teaching targets and need no placeholder ledger event.

There is no per-session quota or deferral boundary. Continue through the ordered work for however many turns the conversation lasts, whether that means a hundred turns in one session or ten turns across ten sessions.

Do not make this ordering feel like database administration or a flashcard queue. Weave a review into the current context, use an old concept as a premise for a new situation, or let reasoning on a new branch demonstrate an older unresolved concept from another angle. When one answer supplies evidence for more than one concept, append an assessment for each relevant concept.

Do not restart from the root merely because a new invocation began, announce that a review is happening, dump a progress report, or repeat an old question verbatim when a fresh context can test the same understanding more naturally.

## Recording workflow

Use the narrow CLI commands rather than manipulating the schema directly:

1. `topic-find`, `topic-create`, and `topic-alias` identify the topic.
2. `concept-create` adds an actual teaching target and its optional parent.
3. `set-root` records the root insight or a later root revision.
4. `introduce` records whether the concept was implicit or already named.
5. `reveal-name` records later disclosure of specialist terminology.
6. `question` records the exact prompt before it is presented.
7. `assess` records evidence after the response.
8. `resume` derives the current learning frontier and review queue.
9. `history` retrieves older ledger detail when the resume summary is insufficient.

For example, record an independent answer with an angle and no assistance:

```bash
python3 <skill-dir>/scripts/learning_store.py assess <topic-id> <concept-id> \
  --understanding demonstrated \
  --assistance none \
  --response-summary "<concise summary>" \
  --angle "<stable angle description>" \
  --question-event-id <event-id> \
  --observation "<why this evidence supports the assessment>"
```

Record gaps honestly rather than promoting apparent understanding:

```bash
python3 <skill-dir>/scripts/learning_store.py assess <topic-id> <concept-id> \
  --understanding partial \
  --assistance heavy \
  --difficulty gap \
  --response-summary "<what was sound and what remained missing>" \
  --question-event-id <event-id> \
  --observation "<specific evidence for the gap>"
```

Use `--review` only when the response is evaluating a scheduled review. The CLI validates contradictory assessments, such as claiming demonstrated understanding while also recording heavy assistance or a current difficulty.
