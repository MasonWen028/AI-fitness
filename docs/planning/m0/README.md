# M0 Implementation Plan

## Purpose

This plan turns the approved architecture baseline for `M0 — AI Technical Validation` into an execution-ready work sequence.

It does **not** redesign architecture, rewrite ADRs, create application code, or expand scope beyond `Bodyweight Squat`.

## Scope

### In scope

- React Native technical shell
- camera pipeline and native pose provider candidate
- canonical `PoseObservation`
- skeleton overlay
- normalization
- squat metrics
- squat phase FSM
- rep detection
- two candidate squat faults
- feedback selector
- fixture format, replay simulator, benchmark harness
- privacy verification
- `M0-GATE-001` evidence package

### Out of scope

- production backend
- production auth
- website
- catalogue import
- product database
- AI Coach
- subscriptions
- notifications
- additional exercises
- M1/M2/V1 product infrastructure

## Authoritative Inputs

- `docs/SRS.md`
- `docs/architecture/README.md`
- `docs/architecture/system-overview.md`
- `docs/architecture/mobile-architecture.md`
- `docs/architecture/pose-engine.md`
- `docs/architecture/exercise-engine.md`
- `docs/architecture/exercise-pose-profile.md`
- `docs/architecture/testing-validation.md`
- `docs/architecture/m0-technical-plan.md`
- `docs/architecture/security-privacy.md`
- `docs/architecture/adr/ADR-005-pose-provider-model.md`
- `docs/architecture/adr/ADR-012-react-native-build-camera-integration.md`
- `docs/architecture/adr/ADR-016-pose-observation-transport-runtime.md`
- `docs/architecture/adr/ADR-007-exerciseposeprofile-and-rules-format.md`

## Planning Outputs

- `implementation-order.md`
- `work-breakdown.md`
- `dependencies.md`
- `acceptance-criteria.md`
- `risk-register.md`
- `definition-of-done.md`
- `test-strategy.md`
- `benchmark-plan.md`
- `privacy-verification-plan.md`
- `m0-gate-checklist.md`

## Planning Rule

The plan is evidence-driven and benchmark-driven, but it does not invent numeric targets. Any unresolved metric target must use `<VALIDATION_REQUIRED>`.
