---
name: codebase-design
description: Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary.
---

# Codebase Design

Design **deep modules**: a lot of behaviour behind a small interface, placed at a clean seam, testable through that interface. Use this language and these principles wherever code is being designed or restructured. The aim is leverage for callers, locality for maintainers, and testability for everyone.

Read `docs/agents/project-lifecycle.md` if present. Use the **Project development stage** as context when evaluating design trade-offs — for example, whether a seam is justified now, whether an invariant should be documented or enforced, or whether compatibility concerns belong in the interface. The stage is not a decision rule.

## Glossary

Use these terms exactly — don't substitute "component," "service," "API," or "boundary." Consistent language is the whole point.

**Module** — anything with an interface and an implementation. Deliberately scale-agnostic: a function, class, package, or tier-spanning slice. _Avoid_: unit, component, service.

**Interface** — everything a caller must know to use the module correctly: the type signature, but also invariants, ordering constraints, error modes, required configuration, and performance characteristics. _Avoid_: API, signature (too narrow — they refer only to the type-level surface).

**Implementation** — what's inside a module, its body of code. Distinct from **Adapter**: a thing can be a small adapter with a large implementation (a Postgres repo) or a large adapter with a small implementation (an in-memory fake). Reach for "adapter" when the seam is the topic; "implementation" otherwise.

**Depth** — leverage at the interface: the amount of behaviour a caller (or test) can exercise per unit of interface they have to learn. A module is **deep** when a large amount of behaviour sits behind a small interface, **shallow** when the interface is nearly as complex as the implementation.

**Seam** _(Michael Feathers)_ — a place where you can alter behaviour without editing in that place; the *location* at which a module's interface lives. Where to put the seam is its own design decision, distinct from what goes behind it. _Avoid_: boundary (overloaded with DDD's bounded context).

**Adapter** — a concrete thing that satisfies an interface at a seam. Describes *role* (what slot it fills), not substance (what's inside).

**Leverage** — what callers get from depth: more capability per unit of interface they learn. One implementation pays back across N call sites and M tests.

**Locality** — what maintainers get from depth: change, bugs, knowledge, and verification concentrate in one place rather than spreading across callers. Fix once, fixed everywhere.

## Deep vs shallow

**Deep module** = small interface + lots of implementation:

```
┌─────────────────────┐
│   Small Interface   │  ← Few methods, simple params
├─────────────────────┤
│                     │
│  Deep Implementation│  ← Complex logic hidden
│                     │
└─────────────────────┘
```

**Shallow module** = large interface + little implementation (avoid):

```
┌─────────────────────────────────┐
│       Large Interface           │  ← Many methods, complex params
├─────────────────────────────────┤
│  Thin Implementation            │  ← Just passes through
└─────────────────────────────────┘
```

When designing an interface, ask:

- Can I reduce the number of methods?
- Can I simplify the parameters?
- Can I hide more complexity inside?

## Principles

- **Depth is a property of the interface, not the implementation.** A deep module can be internally composed of small, mockable, swappable parts — they just aren't part of the interface. A module can have **internal seams** (private to its implementation, used by its own tests) as well as the **external seam** at its interface.
- **The deletion test.** Imagine deleting the module. If complexity vanishes, it was a pass-through. If complexity reappears across N callers, it was earning its keep.
- **The interface is the test surface.** Callers and tests cross the same seam. If you want to test *past* the interface, the module is probably the wrong shape.
- **One adapter means a hypothetical seam. Two adapters means a real one.** Don't introduce a seam unless something actually varies across it.

## Interface checkpoints

Before implementing a material new or changed Module interface, show an **Interface checkpoint** when the human is reachable. Make the Interface visible as a design artifact: what callers know, what obligations they take on, which adjacent modules are affected, and which implementation details stay hidden.

Use [INTERFACE-CHECKPOINTS.md](INTERFACE-CHECKPOINTS.md) for the plain-text checkpoint formats. For new interfaces, orient with the Module neighborhood first. For updates to existing interfaces, lead with **Change at a glance** before showing compact signature/result diffs and caller impact.

## Designing for testability

Good interfaces make testing natural:

1. **Accept dependencies, don't create them.**

   ```python
   from typing import Protocol


   class PaymentGateway(Protocol):
       """Authorizes payment without exposing provider-specific details."""

       def authorize(self, order: Order) -> PaymentAuthorization: ...


   # Testable
   def process_order(order: Order, payment_gateway: PaymentGateway) -> PaymentAuthorization:
       return payment_gateway.authorize(order)


   # Hard to test
   def process_order_with_hidden_gateway(order: Order) -> PaymentAuthorization:
       gateway = StripeGateway()
       return gateway.authorize(order)
   ```

2. **Return results, don't produce side effects.**

   ```python
   # Testable
   def calculate_discount(cart: Cart) -> Discount:
       ...


   # Hard to test
   def apply_discount(cart: Cart) -> None:
       cart.total -= calculate_discount(cart).amount
   ```

3. **Small surface area.** Fewer methods = fewer tests needed. Fewer params = simpler test setup.

For Python examples, use `Protocol` for Module interfaces, seams, dependency contracts, and policy/business-rule variation points; a callable `Protocol` can let plain functions satisfy the interface without forcing class-shaped implementations. Use `dataclass` for simple internal data/config, `pydantic.BaseModel` at validation or serialization boundaries, and `TypedDict` for plain JSON-like dict shapes when validation is not the point. Important Python interfaces should live in typed code with docstrings close to the seam, written so they can be rendered by MKDocs/mkdocstrings where practical.

## Relationships

- A **Module** has exactly one **Interface** (the surface it presents to callers and tests).
- **Depth** is a property of a **Module**, measured against its **Interface**.
- A **Seam** is where a **Module**'s **Interface** lives.
- An **Adapter** sits at a **Seam** and satisfies the **Interface**.
- **Depth** produces **Leverage** for callers and **Locality** for maintainers.

## Rejected framings

- **Depth as ratio of implementation-lines to interface-lines** (Ousterhout): rewards padding the implementation. We use depth-as-leverage instead.
- **"Interface" as a language keyword, a `Protocol`, or a class's public methods**: too narrow — interface here includes every fact a caller must know.
- **"Boundary"**: overloaded with DDD's bounded context. Say **seam** or **interface**.

## Going deeper

- **Interface checkpoints** — see [INTERFACE-CHECKPOINTS.md](INTERFACE-CHECKPOINTS.md): plain-text formats for aligning new interfaces and existing-interface updates before implementation.
- **Deepening a cluster given its dependencies** — see [DEEPENING.md](DEEPENING.md): dependency categories, seam discipline, and replace-don't-layer testing.
- **Exploring alternative interfaces** — see [DESIGN-IT-TWICE.md](DESIGN-IT-TWICE.md): spin up parallel sub-agents to design the interface several radically different ways, then compare on depth, locality, and seam placement.
