---
title: Project Architecture Routing
inclusion: always
---

# Project Architecture Routing

- Authoritative requirements source: `docs/SRS.md`
- Current SRS version: `0.2.0 — Draft — Implementation Planning Review`
- Active milestone: `M0 — AI Technical Validation`
- Current M0 exercise scope: `Bodyweight Squat` only
- M0 gate: `M0-GATE-001`

## Always read first

1. Read `.kiro/steering/project-architecture.md`.
2. Read `docs/architecture/context-index.md`.
3. Read only the SRS sections referenced for the current task.
4. Read only the architecture docs and ADRs relevant to that task.
5. Do not reload unrelated milestone documentation.
6. If a requirement conflict is suspected, read the authoritative full SRS section before deciding.
7. Full `docs/SRS.md` remains authoritative.

## Stable project rules

- The SRS is normative; architecture and ADRs must not silently override it.
- Do not invent `TBD / ADR REQUIRED` values.
- Do not promote `PROPOSED` technologies to `DECIDED` without an accepted ADR/SRS change.
- Do not copy `NON-NORMATIVE EXAMPLE` numbers into production configuration.
- Do not implement future milestones early.
- Do not create product code when the task is architecture-only.
- Preserve the boundary: `Exercise Content != Pose Detection != Exercise Analysis != AI Coach`.
- Preserve the runtime flow: `Camera → Pose Provider → PoseObservation → Normalization → Metric Engine → Phase Engine → Rep Engine → Rule Engine → Feedback → Structured Result → Local Persistence → Backend Sync → History / optional AI Coach`.
- No raw-video upload by default.
- No PostgreSQL storage of raw camera frames or per-frame landmark streams.
- External exercise dataset is catalogue/content seed only, never pose validation evidence.
- `ExercisePoseProfile` is a declarative, versioned project asset with no arbitrary executable JavaScript.
- `ADR-016` remains benchmark-driven and unresolved until evidence exists.
- No additional AI-supported exercise starts before `M0-GATE-001` passes.

## Current architecture index

- Overview: `docs/architecture/README.md`
- Topic routing: `docs/architecture/context-index.md`
- System baseline: `docs/architecture/system-overview.md`
- Technology register: `docs/architecture/technology-stack.md`
- Mobile runtime: `docs/architecture/mobile-architecture.md`
- Pose provider/runtime boundary: `docs/architecture/pose-engine.md`
- Exercise analysis runtime: `docs/architecture/exercise-engine.md`
- Exercise profile asset: `docs/architecture/exercise-pose-profile.md`
- Backend modular monolith: `docs/architecture/backend-architecture.md`
- Web/public boundary: `docs/architecture/web-architecture.md`
- Data ownership/persistence: `docs/architecture/data-architecture.md`
- Security/privacy: `docs/architecture/security-privacy.md`
- Testing/validation: `docs/architecture/testing-validation.md`
- Deployment posture: `docs/architecture/deployment.md`
- Execution-ready M0 plan: `docs/architecture/m0-technical-plan.md`
- Architecture review: `docs/architecture/architecture-review.md`

## Current accepted or baseline ADRs

- `ADR-006` — on-device inference
- `ADR-007` — declarative `ExercisePoseProfile` and rules format
- All other ADRs remain proposed, deferred, or experiment-required per their files

## Where to read details

- M0 scope/order/gate: `docs/architecture/m0-technical-plan.md`
- Camera/native boundary: `docs/architecture/mobile-architecture.md`, `docs/architecture/pose-engine.md`, `docs/architecture/adr/ADR-012-react-native-build-camera-integration.md`, `docs/architecture/adr/ADR-016-pose-observation-transport-runtime.md`
- Exercise engine/profile/rules: `docs/architecture/exercise-engine.md`, `docs/architecture/exercise-pose-profile.md`, `docs/architecture/adr/ADR-007-exerciseposeprofile-and-rules-format.md`
- Backend/data/auth/web: `docs/architecture/backend-architecture.md`, `docs/architecture/data-architecture.md`, `docs/architecture/web-architecture.md`, relevant ADRs
