# Project lifecycle

Project development stage: beta

## How engineering skills use this

The **Project development stage** contextualises engineering tradeoffs; it is not a decision rule.

Use it to surface stage-relevant trade-offs in planning, implementation, testing, and review. Do not silently choose an option solely because of the stage.

## Stages

### Prototype

Pay special attention to:

- whether the work answers the learning question quickly
- whether the code is expected to be thrown away or promoted later
- whether shortcuts are safe because the prototype is isolated
- whether polishing, abstraction, testing, or edge-case handling would slow learning without reducing meaningful risk
- whether conclusions and limitations should be documented before the prototype is discarded or promoted

### Beta

Pay special attention to:

- whether extra code or features may become future tech debt
- whether complexity can be pushed into explicit invariants
- whether assumptions should be documented near the code
- whether obsolete code can be removed
- whether defensive handling is justified by current reality or is speculative

### Stable

Pay special attention to:

- whether existing public behaviour or interfaces could break
- whether callers/users need a migration or deprecation path
- whether error handling is sufficient for expected real-world failures
- whether compatibility code is justified to preserve trust
- whether test coverage protects existing behaviour, not just new behaviour
- whether debt removal could introduce unacceptable instability
