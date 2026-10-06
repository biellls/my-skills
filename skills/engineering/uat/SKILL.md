---
name: uat
description: Bring the app up with the feature just built, ready for you to test by hand.
disable-model-invocation: true
---

Prepare a **UAT** session for the user on the feature just built — the conversation and the branch's changes say what that is. Done means the user can start testing the moment they read your reply, without setting anything up themselves.

Speed beats coverage: the user is waiting to start. Set up the least that lets them test, and let them ask for more.

1. Bring up the application and everything it depends on, with a way past any auth — a seeded user or a bypass, whichever is easier. Start from the database as it is: if it already holds data the main path can use, point the user at it, and seed only what's missing. Never reset or wipe it unless the user asks. Seed only what the main path needs, plus any case the user named; list other cases in the test plan instead of seeding them. Build missing data with what already exists — seed scripts, test fixtures or factories, the app's own API — before writing anything new. Check only that the app is up and the records the test plan points at exist; trying the feature is the user's job. Leave it running in the background until the user says to stop it.
2. Put any files the user will need in `~/Downloads`, named so they are easy to spot.
3. Hand over a short test plan: the links or commands to use, any credentials, which file to use where, and what they should see.
