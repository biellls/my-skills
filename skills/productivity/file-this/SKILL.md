---
name: file-this
description: File information (a research finding, a meeting, a document, a customer file) where this repo's information map says it belongs, linked back to its source.
disable-model-invocation: true
---

Filing puts a piece of information where the people and agents who need it will look for it, and links it back to where it came from. This skill is the same **loop** for every kind of information. Everything company-specific — which kinds exist, where each lives, who approves what — is in the repo's **information map** and the **guide** each kind links to, never in this skill. When the map and this skill seem to disagree, the map wins.

## 0. Find the map

Read `docs/agents/filing.md`. It says where the information map is and how to read it. If the file doesn't exist, the repo hasn't set filing up: stop, tell the user, and recommend they run `/setup-skills` and choose the filing section.

Read the information map in full. Then read whatever general filing rules it links to (tiers, approval, naming), once per session.

## 1. Gather the items

Work out what the user asked to file: one item, or a set. A set can be a folder of files, a meeting, or a wayfinder map, whose items are the research findings linked from its research tickets. List the items, one line each, with their source (path, branch, URL or issue). This list is the session's worklist. Every item on it ends filed, deliberately left where it is, or skipped by the user.

## 2. For each item, run the loop

1. **Identify its kind.** Match the item to one row of the map. When two rows could fit, or none does, say so and ask. For a kind with no row, follow the map's rule for adding a new kind. The new row is a change to the map, so it follows the map's approval rule like any other.
2. **Read its row and guide.** The row gives the tier, home and access. The guide, when the row links one, gives the filing options, naming, layout and any trigger that makes a record. Read the guide in full the first time you file that kind in a session.
3. **Propose where it goes.** Give the options the guide allows for this item, recommend one, and say why in a line. Include the exact destination (folder, file name, issue, doc section) and what will be written there. If the guide makes leaving the item where it is the default, that is always one of the options.
4. **Ask.** Wait for the user's choice. For a batch of similar items, propose them together in one table the user can accept or amend at once. Still record a separate decision per item.
5. **File.** Do exactly what was chosen, following the guide's naming and layout. Raw material is copied or moved, never edited. A change to a living doc goes through the map's approval rule: show the plain-language summary and the exact diff, then apply only what is approved.
6. **Link back.** The filed piece names and links its source: the finding's branch and file, the meeting, the original file. Where the source can carry a link forward (an issue comment, a ticket, a note next to the original), add it there too, so either end leads to the other.

## 3. Report

End with the worklist as a table: item, kind, outcome (where it went, or left in place), and the links written. Name anything skipped and why, and any change to the map or a guide that is awaiting approval.
