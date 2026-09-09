# Sketchpad visual review

Screenshots are kept in `/tmp` so generated evidence does not add binary weight to the skill.

## Critique and rounds

- **Before:** [`/tmp/sketchpad-before-1440.png`](file:///tmp/sketchpad-before-1440.png) showed a dashboard grid: the artifact was trapped in a short iframe, conversation was below the fold, comments duplicated conversation, raw `**markdown**`/anchor IDs were visible, and selection actions used native prompt dialogs.
- **Round 1:** [`/tmp/round1-clean-1440.png`](file:///tmp/round1-clean-1440.png), [`/tmp/round1-clean-1100.png`](file:///tmp/round1-clean-1100.png), and [`/tmp/round1-clean-narrow.png`](file:///tmp/round1-clean-narrow.png) moved the artifact and conversation into a readable two-column thinking space, made the composer persistent, and made the diagram progressive disclosure. Inspection found the artifact's lower caveat still clipped by the iframe height.
- **Round 2:** [`/tmp/sketchpad-round2-reply.png`](file:///tmp/sketchpad-round2-reply.png) increased the artifact viewport, removed the clipping, rendered basic emphasis/line breaks, integrated comments/proposals/replies into one thread, and exposed the optional native diagram editor only when opened. The final populated state shows an anchored human comment, an agent proposal, a human reply, and a saved diagram without duplication or raw IDs.

## Coverage

- Clean initial state: 1440×900, 1100×800, and 390×844 screenshots above.
- Populated conversation + anchored selection + agent proposal + human reply + edited/saved Excalidraw scene: `/tmp/sketchpad-round2-reply.png` (1440×1000 full page).
- Final narrow populated inspection: [`/tmp/sketchpad-final-narrow-populated.png`](file:///tmp/sketchpad-final-narrow-populated.png) confirms the long-form artifact and both anchored thread states remain readable at 390px. The smoke run uses no fake live-agent claim: it posts clearly simulated demo data through the local API, then verifies the browser presentation and reload durability.
