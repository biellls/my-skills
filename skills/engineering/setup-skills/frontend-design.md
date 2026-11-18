# Frontend design

Rules for UI in this repo.

- **Builders** (`prototype`, `implement`) read this doc before writing UI.
- **Reviewers** (the Design axis of `code-review`, which `prototype` also runs) check UI against it and report findings.

**[check]** rules are findings when violated. **[judgement]** rules are suggestions, and the reviewer labels them as such. Where the project's design system contradicts a rule, the design system wins.

## Project context

- **Design system:** <where components, tokens, and design docs live, e.g. "shadcn/ui in `components/ui`, tokens in `tailwind.config.ts`"; or "Not chosen yet. The first builder that picks a component library or token source records it here.">
- **Deliberate choices:** <how the design system marks choices made on purpose, e.g. "**Deliberate.** marks in `DESIGN.md`"; or "none">. A deliberate choice is never a finding, even when a rule below flags it.
- **Checked elsewhere:** <rules another review already checks, e.g. "colours, icons, and voice: the Guía de estilo in `docs/agents/standards.md`, checked by the Standards axis"; or "none">. The Design review doesn't repeat them.

### Surfaces

One row per UI surface. "The primary user" and density in the rules below mean the row of the surface being built or reviewed.

| Surface | Path | Primary user and task | Density |
|---|---|---|---|
| <name> | <path> | <who uses it, for what task, e.g. "operations staff reconciling invoices daily"> | <dense (data tool: tight spacing, many rows) or spacious (generous spacing, one task per screen)> |

## Principles

1. **Attention is a budget.** Every visible element spends the user's attention. Spend it on the screen's primary task.
2. **Show only what the primary user needs on this screen for this task.** Everything else is removed or moved behind disclosure.
3. **Progressive disclosure.** The common path is visible. The rest is one deliberate step away: a help toggletip, an expander, a detail view, or a secondary settings page.
4. **Show, don't tell.** State and behaviour carry the meaning, not prose. A "Saved" indicator, not a banner saying changes save automatically. An empty state with one action, not a paragraph.

**Counter-rule: everything the task needs stays on the screen.** If completing the primary task would make the user switch screens, or open the same disclosure on most uses, that information belongs visible on the screen. Disclosure is for what the task needs only in some cases. When the UI can tell that a case applies (the invoice is disputed, the field has an error), it shows that case's information without a click.

### The delete test

Apply to every helper line, description, banner, badge, and label:

1. Would removing it make anything worse? If not, delete it.
2. Otherwise, put it behind disclosure: a help icon that opens a toggletip on click, tap, and keyboard focus (never hover-only), an expander, or a detail view.

Keep explanation inline only in these two cases:

- **Irreversible consequences, at the moment of action.** "This permanently deletes 12 invoices" goes in the confirmation.
- **Constraints, once relevant.** Format or password rules appear on focus or on error.

## Spacing and alignment

Sources: Gestalt proximity; Williams' CRAP (Contrast, Repetition, Alignment, Proximity); Material, Carbon, and *Refactoring UI* spacing scales; Bringhurst on measure; NN/g F-pattern eye-tracking; Apple HIG, Material, and WCAG 2.5.8 on target size.

- **On-scale spacing [check].** Every margin, padding, and gap comes from the project's spacing scale. Arbitrary values (`p-[13px]`, `mt-[22px]`) and raw px in inline styles are findings.
- **Proximity [check].** Space within a group is at most half the space between groups. A label is closer to its own input than to the field above.
- **Few alignment lines [check].** Each section has at most three left edges.
- **Edges, not middle [check].** Content and labels align to the left edge; actions and secondary info to the right edge. Nothing sits partway across a row. Centre only a single short item (an empty-state message, a hero headline); never multi-line body text or forms.
- **Repetition [check].** Elements of the same kind have the same spacing everywhere.
- **Measure [check].** Body text lines are at most about 75 characters (`max-width: 65ch` / `max-w-prose`).
- **Tables [check].** Numbers right-aligned with tabular figures; text left-aligned; each header aligned like its column.
- **Target size [check].** Interactive elements are at least 44px on touch layouts and never below 24×24px.
- **Overflow [check].** At 375px wide with very long content (names, emails, numbers): no horizontal scroll, no clipped or overlapping text.
- **Space follows importance [judgement].** The primary content has the most surrounding space; secondary elements sit tighter.

## States and interaction

- **Async views [check].** Each has loading, empty, and error states. Empty data never breaks the layout.
- **Mutations [check].** The trigger is disabled or busy during the request, with a stable label ("Saving…").
- **Destructive actions [check].** Undo, or a confirmation whose button says Verb + Noun ("Delete project"), not "OK" or "Confirm". Prefer undo; use confirmation when the effect can't be undone (an email sent, a payment made).
- **One primary action per region [check].**
- **Forms [check].** Every input has a `<label>` (a placeholder is not a label) and the correct `type`, `autocomplete`, and `inputmode`. Validate on blur; once a field shows an error, re-validate on every input so the error clears as soon as it's fixed. Errors appear inline next to the field, focus moves to the first error, and input survives a failed submit.
- **Keyboard and accessibility [check].** Clickable elements are `<button>` or `<a>`. Icon buttons have an accessible name. An icon without a visible text label is only for universally recognised actions (close, search, menu); everything else keeps its label. Focus is visible (`:focus-visible`; never bare `outline-none`). Nothing is reachable only on hover.
- **Controls [check].** Two or three static options are radios or a segmented control, not a select. Tabs, filters, and pagination are in the URL.

## Copy

- **Headings name the thing [check].** "Invoices", not "Manage Your Invoices Effortlessly".
- **Buttons say what happens [check].** "Send invoice", not "Submit".
- **Errors say what happened and what to do [check].** Not "Something went wrong."
- **No invented content [check].** No fake stats, testimonials, "John Doe", "Acme Corp", or lorem ipsum.
- **No marketing tone on product screens [judgement].** No slogans, value propositions, welcomes, exclamation marks, or cheerleading.

## Visual tells

All **[judgement]**. Each is a finding unless the design system calls for it.

- Gradients that aren't brand tokens.
- Cards nested in cards; cards around content that can't be acted on on its own.
- Emoji as icons; more than one icon set.
- Status dots, glows, or "New"/"Live" pills not bound to real state.
- The same large radius and shadow on every element.
- Coloured side-stripe borders on cards.
- All-caps eyebrow labels on every section; a badge above the H1; a centred hero plus three identical feature cards; 01/02/03 numbering on things that aren't steps.
- Entrance animation on every section; `hover:scale` on every card; `transition: all`; motion without `prefers-reduced-motion` handling.

## Design system and scope

- **Tokens [check].** No hex literals or raw shadows outside the token source.
- **Components [check].** No new component that duplicates an existing one. No `className` overrides of a design-system component's colour, radius, or shadow.
- **Scope [check].** No sections, features, or redesigns the task didn't ask for.

## Reviewing

- Screenshot at desktop width and at 375px, including the empty, loading, and error states. Use Playwright unless the repo already uses another browser-automation tool. If the app can't be run, say the review is code-only.
- If the design system is "Not chosen yet", skip the rules that depend on it (on-scale spacing, tokens, components) and say so in the review.
- Skip what **Checked elsewhere** lists.
- Report each finding with its rule, where it occurs, and a concrete fix.

## What the builder may change, by stage

**Presentation:** spacing, alignment, copy, moving explanation behind disclosure, visual tells. **Content and structure:** which information and features appear, layout, the primary flow.

| Stage | Presentation | Content and structure | States, accessibility, forms, responsive |
|---|---|---|---|
| Prototype | Yes | Yes | Not required; the reviewer doesn't flag them |
| Implement from a prototype decision | Yes, within the chosen variant | No. Report problems to the user | Required |
| Implement without a prototype decision | Yes | Yes, as long as everything the task asks for stays reachable | Required |

- In a prototype, one variant shows only what the primary task needs. Each variant lists what it removed and what it moved behind disclosure, and the recorded decision keeps those lists.
- Implementing without a prototype decision, the handoff lists what was moved behind disclosure, so the user can see what isn't visible by default.
- With a prototype decision, the reviewer flags deviations from the chosen variant and doesn't flag the variant's structure.
