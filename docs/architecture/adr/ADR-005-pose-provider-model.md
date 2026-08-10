# ADR-005 — Pose Provider / Model

Status

`PROPOSED`

Date

2026-08-07

Milestone

`M0`

Decision Owners

- Principal Software Architect
- Mobile runtime owner
- AI/CV owner
- Validation owner

## Context

M0 needs a live on-device pose provider candidate to prove Squat technical viability. The SRS proposes MediaPipe Pose Landmarker and explicitly requires on-device inference, provider-neutral observations, and provider conformance before release.

The architecture must support replacing the provider later without changing the semantic meaning of `ExercisePoseProfile` or the exercise engine.

## SRS Constraints

- live inference is on device by default
- raw frames do not go to backend by default
- provider must emit canonical landmark output through `PoseObservation`
- M0 must benchmark real device behavior
- provider change must not silently change portable exercise semantics

## Decision

Use **MediaPipe Pose Landmarker** as the **leading M0 pose provider candidate** for spike and benchmark work.

Do not finalize it as the permanent provider until M0 evidence covers:

- physical-device performance,
- model load behavior,
- thermal behavior,
- landmark stability for the active Squat profile candidate,
- provider conformance through canonical observation mapping,
- acceptable packaging/integration characteristics.

## Alternatives

### Option A — MediaPipe Pose Landmarker

- strong fit for live, on-device body landmarking
- official native Android/iOS support
- asynchronous live-stream callback model
- outputs image and world landmarks

### Option B — ONNX Runtime Mobile

- future custom-model path
- more control but more modeling/tooling burden now

### Option C — platform-native ML/custom model

- potentially useful later
- not justified for M0 without a failure in simpler candidate paths

## Trade-offs

- MediaPipe offers the fastest path to a realistic M0 test, but must still prove device/runtime behavior.
- More custom provider paths could offer future control, but they raise M0 complexity prematurely.

## Risks

- device-tier thermal regression
- provider/model bundle size concerns
- landmark quality variance across devices
- provider-specific semantics leaking into downstream exercise rules if canonical mapping is weak

## Validation / Evidence

Evidence pending M0 spike.

Required evidence includes:

- successful native integration on iOS and Android
- canonical `PoseObservation` conformance
- representative-device benchmark data
- acceptable tracking-loss and model-load behavior

## Consequences

- M0 architecture and testing documents may assume a MediaPipe-first spike path
- `PoseObservation` remains the stable provider-neutral boundary
- provider replacement remains possible later

## Revisit Trigger

Revisit if MediaPipe fails:

- device runtime budgets,
- maintainability,
- packaging constraints,
- conformance or reliability requirements.

## Related Requirements

- FR-POSE-001 through FR-POSE-006, FR-POSE-007a, FR-POSE-008, FR-POSE-009a (M0); FR-POSE-007b, FR-POSE-009b (M1) — *FR-POSE-007/009 split by M0-R0 reconciliation (2026-08-10)*
- FR-TRANSPORT-001 through FR-TRANSPORT-006
- NFR-PERF-004 through NFR-PERF-008
- M0-ENG-001 through M0-ENG-008
- FR-POSE-002
- FR-POSE-003
- FR-POSE-007a (M0) — active M0 provider passes canonical conformance suite; FR-POSE-007b (M1) — provider replacement before production release
- FR-POSE-009a (M0) — versioned + integrity-checked against profile manifest; FR-POSE-009b (M1) — verified against signed application manifest at release
- AC-POSE-001
- AC-PERF-002
