---
name: file-this
description: File information (a research finding, a meeting, a document, a customer file) where this repo's information map says it belongs, linked back to its source.
disable-model-invocation: true
---

Filing puts a piece of information where the people and agents who need it will look for it, and links it back to where it came from. This skill is one **procedure** for filing any kind of information; which kinds exist, where each lives and who approves what are in the repo's **information map** and the **guide** each kind links to. When the map and this skill seem to disagree, the map wins.

## 0. Find the map

Read `docs/agents/filing.md`. It says where the information map is and how to read it. If the file doesn't exist, the repo hasn't set filing up: stop, tell the user, and recommend they run `/setup-skills` and choose the filing section.

Read the map and the general filing rules it links to.

## 1. Decide what's worth filing

The user points at something: a map, an issue, a document, a folder. Work out what in it is worth filing, and propose that.

## 2. File each item

1. **Find what the map says about it** and read the guide it points to. If the map doesn't cover it, or you can't tell which part applies, say so and ask.
2. **Propose where it goes.** Give the options the guide allows, recommend one, and name the exact destination and what will be written there.
3. **Ask.** File nothing the user hasn't chosen; batch similar items into one proposal.
4. **File.** Follow the guide and the map's rules, including any approval a change needs.
5. **Link back.** The filed piece links to its source.

## 3. Report

Say what was filed where, with the links written, and any change to the map or a guide still awaiting approval.
