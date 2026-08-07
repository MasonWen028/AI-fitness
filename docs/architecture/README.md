# Architecture Baseline

## Purpose

This directory defines the technical architecture baseline for the AI Fitness Coaching Platform against `docs/SRS.md` version `0.2.0 — Draft — Implementation Planning Review`.

The SRS remains the normative requirements source of truth. These documents explain how the system is structured, which technical boundaries are mandatory, which decisions are already fixed, which are still proposals, and which items require ADR resolution before dependent implementation starts.

This package is architecture only. It does **not** authorize product implementation beyond the documented milestone scope.

## Relationship to the SRS

The decision hierarchy for this project is:

`SRS → Architecture → ADR → Development Plan → Implementation → Tests → Validation`

- **SRS** defines requirements, scope, constraints, and milestone gates.
- **Architecture** explains the implementation structure and boundary model that satisfy those requirements.
- **ADRs** explain why important technical decisions were made or deferred.
- **Development plans** break approved architecture into execution order.
- **Implementation** builds only the current milestone scope.
- **Tests** prove runtime, boundary, and contract behavior.
- **Validation** proves device, ruleset, privacy, and milestone gate evidence.

If an architecture document appears to conflict with the SRS, the SRS wins and the architecture document must be corrected.

## Current Status

- **Architecture status:** baseline for review
- **Active milestone:** `M0 — AI Technical Validation`
- **Primary M0 exercise:** `Bodyweight Squat`
- **M0 gate:** `M0-GATE-001`
- **Implementation status:** architecture only; no product runtime or backend implementation is authorized by this package

## Architecture Scope Model

This baseline explicitly preserves the SRS boundary:

`Exercise Content != Pose Detection != Exercise Analysis != AI Coach`

It also preserves the required runtime flow:

`Camera → Pose Provider → PoseObservation → Normalization → Metric Engine → Exercise Phase Engine → Rep Engine → Rule Engine → Feedback → Structured Exercise Result → Local Persistence → Backend Sync → History / Progress → optional AI Coach`

The architecture does **not** merge these responsibilities.

## Document Hierarchy

- `system-overview.md` — cross-milestone system structure and milestone boundaries
- `technology-stack.md` — technology register with decision state, risks, and revisit triggers
- `mobile-architecture.md` — React Native, native boundary, lifecycle, and M0 runtime ownership
- `pose-engine.md` — provider boundary, `PoseObservation`, and pose-runtime constraints
- `exercise-engine.md` — deterministic analysis pipeline, module inputs/outputs, and result aggregation
- `exercise-pose-profile.md` — proprietary profile asset, schema ownership, lifecycle, and versioning
- `backend-architecture.md` — early M1 modular monolith boundaries
- `web-architecture.md` — M1 public/authenticated web structure
- `data-architecture.md` — PostgreSQL scope, persistence ownership, provenance, and idempotency
- `security-privacy.md` — privacy-by-default, trust boundaries, and integrity controls
- `testing-validation.md` — fixture, replay, benchmark, and validation evidence architecture
- `deployment.md` — milestone-aware deployment topology and environment strategy
- `m0-technical-plan.md` — execution-ready M0 work units and dependency order
- `context-index.md` — compact routing index for future AI sessions
- `architecture-review.md` — completion report for this baseline package
- `adr/` — architecture decision records

## Decision Hierarchy

Architecture documents may:

- explain implementation structure,
- recommend a direction for `PROPOSED` choices,
- define evaluation criteria for `TBD / ADR REQUIRED` choices,
- constrain future implementation to the current milestone,
- identify what does **not** exist yet.

Architecture documents may **not**:

- silently promote `PROPOSED` to `DECIDED`,
- invent `TBD / ADR REQUIRED` values,
- copy `NON-NORMATIVE EXAMPLE` thresholds into production defaults,
- broaden milestone scope.

## ADR Process

Important technical decisions are recorded under `docs/architecture/adr/`.

Each ADR must include:

- status,
- date,
- milestone,
- decision owners,
- context,
- SRS constraints,
- decision,
- alternatives,
- trade-offs,
- risks,
- validation/evidence,
- consequences,
- revisit trigger,
- related requirements.

An ADR becomes implementation-authoritative only after the required evidence and review are complete.

## Approval Model

Architecture changes are approved through review of:

1. the SRS requirement impact,
2. the affected architecture document,
3. any affected ADR,
4. milestone scope and gate impact,
5. validation/test implications.

Changes affecting analysis semantics also require versioning of the relevant profile, ruleset, scoring, model, or engine artifact.

## Current Review Intent

This package is intended to let product, architecture, mobile, backend, AI/CV, privacy, and QA reviewers decide whether the project is ready to begin M0 implementation planning without prematurely creating M1/M2/V1 infrastructure.
