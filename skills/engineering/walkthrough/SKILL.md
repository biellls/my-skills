---
name: walkthrough
description: Guide a human, live in the conversation, through steps only they can perform, adapting when the real UI differs from the plan and verifying each step with throwaway check scripts. Use when provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-party dashboard, or running a one-off migration or cutover. Don't invoke this for steps the agent can perform itself.
---

# Walkthrough

A **walkthrough** guides the user through a manual procedure one step at a time, in the conversation. You give the URL and say what to do there, the user does it, you check it worked, and then you move on. It might configure third-party services, run a one-off migration, or move the project from one state to another.

You plan before you start, but the plan is only your best guess at a dashboard you can't see. When the user reports something different ("there's no Developers tab"), believe them, adapt, and fix the plan. Don't argue with what's on their screen.

**You never handle secrets.** Passwords, API keys, tokens and private keys never go in the chat, and you never read them from disk. The user puts them where they belong with commands you give them, and you check that they're there and that they work without ever seeing them.

Everything you write lives in `.scratch/walkthrough/<topic>/` and is deleted at the end.

## Process

### 1. Scope the procedure

Work out every manual step the user must take and every value that gets captured along the way. Read the repo first, don't ask cold:

- For setup: `.env.example`, `.env.*` templates, `README`, `docker-compose*`, framework config, and `.github/workflows/*` (every `secrets.*` / `vars.*` reference is a value the walkthrough must produce). Never `cat` or read a real `.env`: list its keys with `grep -o '^[A-Za-z_][A-Za-z0-9_]*=' .env`.
- For a migration or transition: the current state, the target state, and the irreversible actions between them.

**Done when:** every step is named in order, and for each captured value you know (a) where the user gets it, (b) where it's written (`.env`, a GitHub secret or variable, or nowhere: some steps are pure actions), and (c) whether it's secret.

### 2. Write the guide and its checks

Make sure `.scratch/` is gitignored in the project, and add it to `.gitignore` if it isn't. Then write `.scratch/walkthrough/<topic>/guide.md`: a checklist with one entry per step, giving its URL, the click path, the value it produces, where that value lands, and how you'll check it. Mark anything you took from docs or memory rather than seeing it confirmed as *unverified*. The guide is your working plan, and it keeps the walkthrough going if the conversation's context is compacted.

Next to it, write a small check script for each step whose result a machine can confirm, e.g. `check-stripe.sh` or `check_db.py`. A check:

- loads secrets from where they live (`set -a; . ./.env; set +a` in a subshell, or `gh secret list` for names) and never prints them;
- proves the value works, not just that it exists: an authenticated API call, a DB connection, a DNS lookup, a webhook ping;
- prints only `OK <what>` or `FAIL <what>: <reason>`, with error bodies stripped of anything that could echo a credential.

Show the user the ordered steps and confirm. They may add, drop or reorder steps.

**Done when:** the guide lists every step from step 1, and every step that can be machine-checked has a check script.

### 3. Walk it, one step at a time

For each step:

1. Open the URL (`open` on macOS, `xdg-open` on Linux) and say exactly what to do there. Keep the step to one focused task.
2. Say how the value gets where it belongs:
   - **Public values** (IDs, regions, URLs, usernames): the user pastes them in the chat and you write them to `.env` or `gh variable set`.
   - **Secrets**: give the user a command to run **in their own terminal**, not through Claude Code's `!` prefix, which shows the output in the conversation. Examples: `gh secret set STRIPE_SECRET_KEY` (hidden prompt), or copy the key on the dashboard and run `printf 'STRIPE_SECRET_KEY=%s\n' "$(pbpaste)" >> .env`. If the user pastes a secret into the chat anyway, don't use it. Tell them it's now in the transcript and that they should rotate it.
3. Wait for the user to say it's done, then run the step's check. Fix any `FAIL` with the user before moving on.
4. Update the guide: tick the step, and fix the click path, URL or order wherever reality didn't match.

When the user is stuck or the screen doesn't match the guide, ask for a screenshot (in Claude Code: `Ctrl+V` pastes an image from the clipboard, or drag the file in). Remind them never to send a screenshot of a page showing a revealed secret. Check the current docs if you need to, but what the user sees beats what the docs say.

Ask for confirmation before any irreversible action (deleting resources, rotating live keys, cutting over DNS or traffic).

**Done when:** every step is ticked and its check passes.

### 4. Close out

- Run every check once more, together.
- Report what was set up and where each value landed. Name secrets but never show their values.
- If the setup will be repeated (new developers, more environments), offer to turn the corrected guide into a README section or a committed script. Its steps are now ones that actually worked.
- Delete `.scratch/walkthrough/<topic>/`.
