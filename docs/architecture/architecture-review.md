# Architecture Review

## 1. SRS version used

- `docs/SRS.md`
- Version: `0.2.0 — Draft — Implementation Planning Review`

## 2. Active milestone

- `M0 — AI Technical Validation`
- Current M0 exercise scope: `Bodyweight Squat` only

## 3. Architecture documents created

- `docs/architecture/README.md`
- `docs/architecture/system-overview.md`
- `docs/architecture/technology-stack.md`
- `docs/architecture/mobile-architecture.md`
- `docs/architecture/pose-engine.md`
- `docs/architecture/exercise-engine.md`
- `docs/architecture/exercise-pose-profile.md`
- `docs/architecture/backend-architecture.md`
- `docs/architecture/web-architecture.md`
- `docs/architecture/data-architecture.md`
- `docs/architecture/security-privacy.md`
- `docs/architecture/testing-validation.md`
- `docs/architecture/deployment.md`
- `docs/architecture/m0-technical-plan.md`
- `docs/architecture/context-index.md`
- `docs/architecture/architecture-review.md`
- `docs/architecture/adr/ADR-001-monorepo-and-web-boundary.md`
- `docs/architecture/adr/ADR-002-backend-framework-and-api-style.md`
- `docs/architecture/adr/ADR-003-postgresql-access-orm.md`
- `docs/architecture/adr/ADR-004-authentication-provider.md`
- `docs/architecture/adr/ADR-005-pose-provider-model.md`
- `docs/architecture/adr/ADR-006-on-device-inference.md`
- `docs/architecture/adr/ADR-007-exerciseposeprofile-and-rules-format.md`
- `docs/architecture/adr/ADR-008-raw-video-landmark-storage.md`
- `docs/architecture/adr/ADR-009-observability-analytics.md`
- `docs/architecture/adr/ADR-010-generative-ai-provider.md`
- `docs/architecture/adr/ADR-011-cloud-deployment.md`
- `docs/architecture/adr/ADR-012-react-native-build-camera-integration.md`
- `docs/architecture/adr/ADR-013-local-persistence-offline-evolution.md`
- `docs/architecture/adr/ADR-014-supported-devices-users.md`
- `docs/architecture/adr/ADR-015-form-score-version-comparability.md`
- `docs/architecture/adr/ADR-016-pose-observation-transport-runtime.md`
- `.kiro/steering/project-architecture.md`
- `.kiro/steering/README.md`

## 4. DECIDED technologies

- React Native
- TypeScript
- on-device live inference
- React
- Node.js
- PostgreSQL
- managed identity provider approach

## 5. PROPOSED technologies

- Expo Development Builds / local Expo Module as the leading M0 mobile workflow direction
- bare React Native as fallback if Expo blocks runtime needs
- MediaPipe Pose Landmarker as M0 pose provider candidate
- Next.js as the leading M1 public + authenticated web direction
- plain Fastify as the leading M1 backend framework direction
- NestJS + Fastify as alternative
- Drizzle as the leading M1 PostgreSQL access-layer direction
- Prisma as alternative
- minimal SQL/query layer as fallback alternative
- SQLite-compatible local mobile persistence for M1 checkpoint/retry state
- Supabase Auth as the leading auth vendor candidate
- pnpm workspaces and Turborepo as monorepo tooling candidates

## 6. Unresolved ADRs

- `ADR-001` — still `PROPOSED`
- `ADR-002` — still `PROPOSED`
- `ADR-003` — still `PROPOSED`
- `ADR-004` — still `PROPOSED`
- `ADR-005` — still `PROPOSED`
- `ADR-012` — still `PROPOSED`
- `ADR-013` — still `PROPOSED`
- `ADR-016` — still `PROPOSED — EXPERIMENT REQUIRED`

## 7. Deferred ADRs

- `ADR-008`
- `ADR-009`
- `ADR-010`
- `ADR-011`
- `ADR-014`
- `ADR-015`

## 8. M0 blockers

No architecture contradiction blocks creation of the M0 implementation plan.

M0 implementation itself remains gated by evidence, not by missing architecture documents. The main pre-implementation blockers are:

- final acceptance of the M0 architecture package
- benchmark evidence required by `ADR-005`, `ADR-012`, and especially `ADR-016`
- provisional representative device choices for M0 benchmarking

## 9. M0 implementation dependencies

- React Native technical shell
- camera integration path
- native pose provider candidate integration
- canonical `PoseObservation`
- deterministic Squat profile/runtime semantics
- fixture format and replay path
- simulator
- privacy verification
- physical-device benchmark plan and execution

## 10. Architecture risks

- transport/runtime option chosen too early without evidence
- pose-provider candidate failing thermal or latency expectations on representative devices
- Expo workflow proving insufficient for native/runtime experiments and requiring fallback
- false confidence from catalogue content being confused with validation evidence
- future teams trying to broaden scope into M1/M2 infrastructure during M0
- cross-version analysis comparability mistakes if provenance discipline is ignored later

## 11. SRS ambiguity discovered

No blocking contradiction was found for the architecture baseline. The main intentionally unresolved areas remain those already marked in the SRS as `PROPOSED` or `TBD / ADR REQUIRED`, especially:

- final mobile runtime placement (`ADR-016`)
- supported device matrix and age policy (`ADR-014`)
- exact vendor selections for auth, deployment, and observability
- production validation thresholds and retention windows

## 12. Architecture decisions that cannot yet be made

- final pose provider acceptance before M0 evidence
- final camera/build path acceptance before M0 evidence
- final runtime transport/hot-path placement before benchmark evidence
- final backend framework acceptance before M1 implementation planning
- final PostgreSQL access-layer acceptance before M1 implementation planning
- final auth vendor selection before M1 implementation planning
- final deployment platform selection before M1 deployment planning

## 13. Whether Ponytail steering is installed

- Yes
- Present at `.kiro/steering/ponytail.md`
- Recorded in `.kiro/steering/README.md`

## 14. Whether project architecture steering is installed

- Yes
- Installed at `.kiro/steering/project-architecture.md`

## 15. Whether context-index is complete

- Yes for the current architecture baseline
- Installed at `docs/architecture/context-index.md`
- It routes M0, early M1, and deferred future topics to authoritative sources without duplicating large SRS content

## 16. Whether application source code was avoided

- Yes
- This package creates architecture documentation and steering only
- No product runtime, backend, database schema, website page, or auth implementation code was added

## 17. Review remediation mapping

The accepted architecture-review findings were addressed by the following documentation changes:

- **ADR-016 runtime ownership ambiguity** → hardened in `docs/architecture/adr/ADR-016-pose-observation-transport-runtime.md` with a per-candidate responsibility matrix and qualitative standard-bridge go/no-go categories.
- **M0 benchmark evidence ownership** → hardened in `docs/architecture/testing-validation.md` and `docs/architecture/m0-technical-plan.md` by making M0 evidence artefacts first-class deliverables under `docs/architecture/evidence/m0/`.
- **Under-specified M1 API contract architecture** → hardened in `docs/architecture/backend-architecture.md` with explicit contract source-of-truth, ownership, versioning, generated/typed client lifecycle, validation, error-envelope governance, idempotency contract, and backward-compatibility rules.
- **Under-specified M1 operational data ownership** → hardened in `docs/architecture/data-architecture.md` with explicit ownership/lifecycle notes for `User`, `UserIdentity`, `UserProfile`, `IdempotencyRecord`, minimum `AuditLog`, and content publication/version records.
- **Exercise Guidance not elevated enough** → hardened in `docs/architecture/system-overview.md`, `docs/architecture/mobile-architecture.md`, and `docs/architecture/web-architecture.md` by making Guidance a first-class M1 capability and clarifying its relationship to Guide-Only versus AI Form Check flows.
- **Metric-kind extensibility under-described** → hardened in `docs/architecture/exercise-engine.md` with a minimal compatibility/versioning rule for new metric kinds.
- **Content/media logical boundary too thin** → hardened in `docs/architecture/data-architecture.md` and `docs/architecture/backend-architecture.md` with the concise M1 boundary `Content metadata → Backend/PostgreSQL`, `Media → Object Storage`, `Publication → Licence/approval gate`, `Delivery → CDN/approved delivery mechanism`.
- **High-impact ADR traceability too broad** → hardened in `docs/architecture/adr/ADR-003-postgresql-access-orm.md`, `docs/architecture/adr/ADR-005-pose-provider-model.md`, `docs/architecture/adr/ADR-007-exerciseposeprofile-and-rules-format.md`, `docs/architecture/adr/ADR-012-react-native-build-camera-integration.md`, `docs/architecture/adr/ADR-013-local-persistence-offline-evolution.md`, and `docs/architecture/adr/ADR-016-pose-observation-transport-runtime.md` with more precise requirement and acceptance-criteria references.

## Review conclusion

`ARCHITECTURE READY FOR M0`
