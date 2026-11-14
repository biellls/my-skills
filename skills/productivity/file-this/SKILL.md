---
name: file-this
description: File information (a research finding, a meeting, a document, a customer file) where this repo's information map says it belongs, linked back to its source.
disable-model-invocation: true
---

Filing puts a piece of information where the people and agents who need it will look for it, and links it back to where it came from. This skill is one **loop** for every kind of information; which kinds exist, where each lives and who approves what are in the repo's **information map** and the **guide** each kind links to. When the map and this skill seem to disagree, the map wins.

## 0. Find the map

Read `docs/agents/filing.md`. It says where the information map is and how to read it. If the file doesn't exist, the repo hasn't set filing up: stop, tell the user, and recommend they run `/setup-skills` and choose the filing section.

Read the map and the general filing rules it links to.

## 1. Gather the items

List what the user asked to file, one line per item with its source (path, branch, URL or issue). For a wayfinder map, the items are the research findings linked from its research tickets. Every item on the list ends filed, deliberately left where it is, or skipped by the user.

## 2. For each item, run the loop

1. **Identify its kind.** Match the item to one row of the map. When two rows could fit, or none does, say so and ask. A kind with no row gets one by the map's rule for adding a kind, and the new row follows the map's approval rule.
2. **Read its row and the guide it links.**
3. **Propose where it goes.** Give the options the guide allows, recommend one, and name the exact destination and what will be written there.
4. **Ask.** File nothing the user hasn't chosen; batch similar items into one proposal.
5. **File.** Follow the guide and the map's rules, including any approval a change needs.
6. **Link back.** The filed piece links to its source.

## 3. Report

End with the list: each item, its kind, where it went (or that it was left in place), and the links written. Name anything skipped, and any change to the map or a guide still awaiting approval.
