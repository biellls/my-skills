# Interface checkpoints

Use an **Interface checkpoint** before implementing a material new or changed **Module** interface when the human is reachable. The checkpoint is a design artifact: it lets the human align on what callers must know before code hardens around the shape.

Keep checkpoints conceptual first. Code signatures and type shapes are useful, but they support the conversation; they are not the whole interface.

## General rules

- Use the Codebase Design vocabulary: **Module**, **Interface**, **Seam**, **Adapter**, **Implementation**.
- Show what callers must know: operations, meanings, invariants, ordering constraints, error/failure modes, obligations, compatibility impact, and hidden implementation details.
- Use the project's domain glossary vocabulary.
- Optimize for plain-text chat:
  - ASCII diagrams where they clarify relationships
  - compact bullets over wide rendered Markdown tables
  - `diff` blocks for interface changes where chat colorization helps
- If using nested examples in Markdown, avoid nested triple-backtick problems. In actual chat output, either do not wrap the entire checkpoint in a code fence, or use `~~~diff` for diff blocks.
- Keep conceptual shapes explicit but do not force implementation classes or aliases.

Use this type note in checkpoints that show conceptual shapes:

```text
TYPE NOTE
  Types/shapes below are conceptual. They describe meaning, units, and
  constraints. They are not a request to create classes or aliases with these
  exact names unless we explicitly agree on an implementation shape later.
```

Prefer conceptual fields like:

- `amount: integer minor units`
- `currency: ISO 4217 code`
- `authorization_ref: opaque string`

Avoid inventing CamelCase domain types unless the implementation shape is itself being discussed.

## New-interface checkpoint

For a new important interface, orient the human before operations. Start with the module's neighborhood and make the target module visually stand out.

Template:

```text
====================
INTERFACE CHECKPOINT
====================

DECISION REQUESTED
  Confirm this proposed interface before implementation.

MODULE NEIGHBORHOOD
  [ASCII diagram or compact caller/module/resource bullets]

MODULE
  [Module name]

PURPOSE
  [What callers get without knowing implementation details]

TYPE NOTE
  Types/shapes below are conceptual...

CALLER-FACING OPERATIONS
  [Operation summaries: caller provides / module returns]

FAILURE MODES
  - ...

CALLER OBLIGATIONS / INVARIANTS
  - ...

SEAM
  [Where callers cross into the module and what is hidden past the seam]

OUT OF SCOPE / STILL HIDDEN
  - [Implementation details callers must not rely on]

COMPATIBILITY IMPACT
  - [Callers/tests/workflows that will change]

OPEN QUESTIONS / ASSUMPTIONS
  - [Only if any]
```

Example:

```text
====================
INTERFACE CHECKPOINT
====================

DECISION REQUESTED
  Confirm this proposed Payment Authorization interface before implementation.

MODULE NEIGHBORHOOD

                 upstream callers
        +-------------------------------+
        | Checkout                      |
        | Admin refund tool             |
        | Scheduled retry job           |
        +---------------+---------------+
                        |
                        | call payment operations
                        v

        +================================+
        || PAYMENT AUTHORIZATION         ||
        || interface being designed      ||
        +================================+
          ^              |             |
          | reads        | writes      | emits
          |              v             v

+---------+---------+  +---------------+-------+  +------------+
| ORDER RECORDS     |  | PAYMENT RECORDS       |  | AUDIT LOG  |
| order state       |  | authorization results |  | events     |
+-------------------+  +-----------------------+  +------------+

Hidden behind Payment Authorization:
  - provider SDKs
  - provider response shapes
  - retry/backoff policy
  - provider auth/config

MODULE
  Payment Authorization

PURPOSE
  Let checkout and related payment workflows authorize, reverse, or retry
  payments without knowing provider details.

TYPE NOTE
  Types/shapes below are conceptual. They describe meaning, units, and
  constraints. They are not a request to create classes or aliases with these
  exact names unless we explicitly agree on an implementation shape later.

CALLER-FACING OPERATIONS

  Authorize payment
    Caller provides:
      order_id: existing order identifier
      amount: integer minor units
      currency: ISO 4217 code
      idempotency_key: stable retry key
    Module returns:
      authorization_ref: opaque string
      authorized_amount: integer minor units

  Reverse auth
    Caller provides:
      authorization_ref: opaque string
      reason: domain reason code
    Module returns:
      reversal_ref: opaque string
      reversed_at: timestamp

  Retry auth
    Caller provides:
      order_id: existing order identifier
      idempotency_key: original retry key
    Module returns:
      authorization_ref: opaque string
      final_status: authorized/declined/failed

FAILURE MODES
  - Payment declined
  - Provider unavailable
  - Authorization not found
  - Reversal not allowed

CALLER OBLIGATIONS / INVARIANTS
  - Pass money amounts in integer minor units, never floats.
  - Reuse the same idempotency key when retrying the same order.
  - Treat authorization_ref and reversal_ref as opaque.
  - Do not branch on provider-specific decline codes.

SEAM

  Callers
     |
     v
  Payment Authorization interface
     |
     +-- hides provider SDKs and response shapes
     +-- hides retry/backoff policy
     +-- hides provider decline-code mapping
     +-- hides provider auth/config

OUT OF SCOPE / STILL HIDDEN
  - Provider SDK response objects
  - Provider-specific error codes
  - Retry timing
  - Authentication/config shape
  - Which payment provider is used

COMPATIBILITY IMPACT
  - Checkout stops calling Stripe directly.
  - Admin refund tool uses reversal operation instead of provider APIs.
  - Scheduled retry job uses retry operation instead of duplicating auth logic.
  - Tests assert payment workflow behavior, not provider call details.
```

## Existing-interface update checkpoint

For updates, do **not** lead with a static module neighborhood. The human is trying to understand what changes. Lead with before/after caller flows, then show compact diffs and consequences.

Default outline:

````text
===========================
INTERFACE UPDATE CHECKPOINT
===========================

DECISION REQUESTED
  Confirm this interface change before implementation.

CHANGE AT A GLANCE
  Before:
    [caller]
      -> [old interaction]
      <- [old return/observable result, if useful]

  After:
    [caller]
      -> [new interaction]
      <- [new return/observable result, if useful]

WHY THIS MODULE
  [One short explanation of why this interface owns the change]

TYPE NOTE
  Types/shapes below are conceptual...

PROPOSED INTERFACE DIFF
  Operation: ...
  ~~~diff
  ...
  ~~~

WHAT CHANGED
  - [Plain-English translation of the diff]

AFFECTED CALLERS
  Must change:
    - [caller]
      [required call-site/workflow change]

  May change:
    - [caller]
      [optional or newly possible change]

  No change expected:
    - [caller]
      [explicit reason]

CALLER OBLIGATIONS / INVARIANTS
  New:
    - ...
  Changed:
    - ...
  Unchanged:
    - ...

OUT OF SCOPE / STILL HIDDEN
  - [Implementation details hidden behind the interface]

UNCHANGED BEHAVIOUR
  - [Compatibility anchors]

OPEN QUESTIONS / ASSUMPTIONS
  - [Only if any]

MODULE BOUNDARY / NEIGHBORHOOD
  [Optional; include only when the surrounding modules are themselves confusing]
````

Example:

````text
===========================
INTERFACE UPDATE CHECKPOINT
===========================

DECISION REQUESTED
  Confirm this interface change before implementation:
  Payment Authorization will expose capture and return authorization_ref from
  successful retries.

CHANGE AT A GLANCE

  Before:

    Scheduled retry job
      -> retry_authorization(...)
      <- final_status only

    Checkout
      -> provider SDK directly for capture

  After:

    Scheduled retry job
      -> retry_authorization(...)
      <- final_status + authorization_ref when authorized

    Checkout
      -> capture_authorization(...)
      <- capture_ref + captured_amount

WHY THIS MODULE
  Payment Authorization already hides provider SDKs and provider response
  shapes for authorization and reversal. Capture belongs behind the same
  interface so callers do not learn provider-specific capture details.

TYPE NOTE
  Types/shapes below are conceptual. They describe meaning, units, and
  constraints. They are not a request to create classes or aliases with these
  exact names unless we explicitly agree on an implementation shape later.

PROPOSED INTERFACE DIFF

Operation: retry authorization result shape

~~~diff
  RetryAuthResult:
      final_status: "authorized" | "declined" | "failed"
+     authorization_ref: opaque string | None
~~~

Operation: capture authorized payment

~~~diff
+ def capture_authorization(
+     authorization_ref: str,
+     amount_minor_units: int,
+     idempotency_key: str,
+ ) -> CaptureResult
+
+ CaptureResult:
+     capture_ref: opaque string
+     captured_amount: integer minor units
~~~

WHAT CHANGED
  - Retry auth now returns authorization_ref when retry succeeds.
  - Checkout no longer needs to call the provider SDK directly to capture.
  - Capture introduces capture_ref, another opaque reference.
  - Existing authorize and reverse operations are unchanged.

AFFECTED CALLERS

  Must change:
    - Checkout
      Starts calling Payment Authorization for capture instead of the provider SDK.

  May change:
    - Scheduled retry job
      Can read authorization_ref from successful retry results.
      Existing final_status handling remains valid.

  No change expected:
    - Admin refund tool
      Reverse authorization interface is unchanged.

CALLER OBLIGATIONS / INVARIANTS

  New:
    - Capture amount must be integer minor units.
    - Capture attempts need a fresh idempotency_key.
    - capture_ref must be treated as opaque.

  Unchanged:
    - authorization_ref remains opaque.
    - Money amounts remain integer minor units.
    - Callers still must not branch on provider-specific decline codes.

OUT OF SCOPE / STILL HIDDEN
  - Provider SDKs
  - Provider response shapes
  - Provider-specific capture IDs
  - Retry/backoff policy
  - Provider auth/config

UNCHANGED BEHAVIOUR
  - Authorize payment semantics are unchanged.
  - Reverse auth semantics are unchanged.
  - Declines are still normalized into domain failure modes.
````

### Diff guidance

- Put diffs before explanatory bullets, but after enough context for them to make sense.
- Show only changed operations, not the entire interface.
- Do not show a removed and added line when nothing semantically changed.
- For result-shape changes, label the operation as a result-shape diff and show only added/changed/removed fields.
- For 2–4 changed operations, repeat this per operation:
  1. operation name
  2. compact signature/result diff
  3. caller impact
  4. obligations/invariants

## When to skip or compress

Skip the checkpoint for trivial private refactors or changes with no material caller-facing interface impact.

Compress the checkpoint when the human already knows the area:

- Keep **Decision requested**, **Change at a glance**, and **Proposed interface diff**.
- Drop the neighborhood diagram unless it is needed to understand the change.
- Keep unchanged behaviour only when compatibility matters.
