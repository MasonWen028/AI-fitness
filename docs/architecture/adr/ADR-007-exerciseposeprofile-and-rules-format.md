# ADR-007 — ExercisePoseProfile and Rules Format

Status

`DECIDED`

Date

2026-08-07

Milestone

`M0`

Decision Owners

- Principal Software Architect
- Exercise-analysis owner
- Validation owner
- Domain review owner

## Context

The project needs a stable proprietary configuration asset for exercise analysis that can survive provider and runtime changes. The SRS already decides the core direction: versioned declarative schema, deterministic semantics, and no arbitrary executable code in rule/profile definitions.

## SRS Constraints

- profile/rule semantics are versioned and immutable after publication
- no arbitrary JavaScript in profile definitions
- rules must be deterministic and schema validated
- profile absence means Guide-Only mode
- numerical examples must not become defaults

## Decision

Adopt a **declarative, versioned `ExercisePoseProfile` plus declarative ruleset format** as the architecture baseline.

Characteristics:

- profile and rules are configuration assets, not embedded UI logic
- schema validated
- deterministic for identical inputs
- immutable after publication
- integrity protected
- rollback-capable
- no arbitrary executable JavaScript

## Alternatives

### Option A — Declarative profile and rules

- portable across runtime candidates
- testable with fixtures/replay
- reviewable by domain and engineering stakeholders

### Option B — Hard-coded rules inside app/runtime code

- rejected because semantics would become opaque and harder to version or review

### Option C — Arbitrary scripted rule execution

- rejected for determinism, security, and reviewability reasons

## Trade-offs

- declarative design requires disciplined schema design,
- but gives portability, replayability, and publication governance.

## Risks

- schema could become too generic if overdesigned
- insufficient validation metadata could weaken governance

## Validation / Evidence

Evidence pending M0 spike for the exact initial Squat profile candidate, but the architectural pattern itself is set by the SRS.

## Consequences

- exercise-analysis semantics live outside React components
- profile/rule changes require versioning and review
- replay/simulator infrastructure can target stable declarative inputs

## Revisit Trigger

Revisit only if the declarative model proves unable to express validated exercise semantics without unsafe escape hatches.

## Related Requirements

- FR-PROFILE-001 through FR-PROFILE-005
- FR-RULE-001 through FR-RULE-007
- FR-FAULT-001 through FR-FAULT-005
- FR-VERSION-001 through FR-VERSION-004
- FR-PROFILE-002
- FR-PROFILE-003
- FR-PROFILE-004
- FR-RULE-005
- FR-RULE-006
- AC-THRESHOLD-001
