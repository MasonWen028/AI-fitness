# M0 Final Architecture & Evidence Review

| Field | Value |
|-------|-------|
| Review type | Forensic gate review (independent) |
| Date | 2026-08-10 |
| Reviewer | Independent (not the implementer) |
| Repository HEAD | `0cb92e4` on `master` / `origin/main` |
| Tests | 227 pass, 15 files |
| Lint | Clean |
| Typecheck | Clean |
| Source documents | SRS v0.2.0, Architecture docs, ADRs, M0 planning docs, evidence files M0-A through M0-Q |

> This review independently verifies every material claim in the existing M0 Gate Report. It does not trust the gate report's conclusions. Every PASS or VERIFIED claim is traced through: requirement → architecture decision → implementation → test → evidence → commit/current repository state.

---

## 1. Executive Assessment

The M0 implementation demonstrates a technically viable deterministic exercise analysis pipeline for Bodyweight Squat. The analysis engine (normalization → metrics → phase FSM → rep detection → fault detection → feedback selection) is well-structured, fully tested with 227 passing tests, and correctly enforces determinism, NaN safety, and fail-closed behavior. Privacy verification at the code-structure level is sound. The fixture and replay system provides deterministic reproducibility.

However, the SRS M0-GATE-001 definition contains explicit preconditions that are **not met**:

1. **ADR-005, ADR-012, and ADR-016 are all `PROPOSED`, not `ACCEPTED`.** The SRS requires "ADR-005/ADR-012/ADR-016 have accepted decisions supported by measurements."
2. **M0-ENG-006 is not met.** The SRS requires "The approved M0 representative iOS **and Android** physical devices SHALL complete sustained tests without crash, runaway memory, unrecoverable camera state or unacceptable OS thermal condition." Only Huawei/Android was tested. No iOS. No sustained tests. No thermal condition verification.
3. **M0-ENG-007 is not met.** The SRS requires "Effective observation rate, p95 end-to-end latency, JS responsiveness, overlay smoothness and **thermal trend** SHALL meet the pre-approved ADR-016 benchmark targets." Thermal is a placeholder. No pre-approved ADR-016 targets exist because ADR-016 is `PROPOSED`.
4. **M0-ENG-008 is not met.** The SRS requires "The selected runtime SHALL pass **cross-platform profile conformance**." No iOS testing means no cross-platform conformance.
5. **FR-TRANSPORT-001 is not met.** The SRS requires "M0 SHALL perform a documented feasibility evaluation of options A–D and benchmark option A plus every viable B–D candidate." Only Option A (standard bridge) was used. No alternatives were evaluated.

Additionally, the camera-to-analysis pipeline is **not wired up** in the actual application code. `CameraPreviewScreen.tsx` receives native observations but does not route them through `poseEventAdapters`, `poseValidation`, or the analysis pipeline. The analysis engine is proven only through synthetic test data and replay, not through live camera input.

The existing M0 Gate Report's CONDITIONAL PASS classification does not satisfy the SRS's explicit preconditions. Per the review instructions: "A documented caveat is still a defect if the authoritative Gate/SRS requires it before exit." The SRS requires ADR acceptance and M0-ENG-006/007/008 to pass before the gate can pass.

**Final Decision: REQUEST CHANGES**

---

## 2. Gate Criteria Audit

### 2.1 Gate Definition Source Hierarchy

| Priority | Source | Key Content |
|----------|--------|-------------|
| 1 | SRS §54.1, M0-GATE-001 definition | "ADR-005/ADR-012/ADR-016 have accepted decisions supported by measurements, M0-ENG-001 through M0-ENG-008 pass, basic privacy verification passes, and the Squat fixture/replay/physical-device evidence is reviewed." |
| 2 | SRS §54.1 exit criterion | "Failing accuracy, latency, thermal, reliability or maintainability evidence requires architecture revision, not exercise expansion." |
| 3 | `m0-gate-checklist.md` | Defines Pass / Conditional Pass / Fail states |
| 4 | `acceptance-criteria.md` | Per-package acceptance criteria |

### 2.2 Gate Checklist Evaluation (Independent)

| Gate Checklist Pass Criterion | Independent Status | Evidence |
|-------------------------------|-------------------|----------|
| M0 technical shell works | **PASS** | pnpm workspace, Expo shell, TypeScript, build/lint/test pass |
| Camera path with permission/lifecycle | **PASS (code)** | cameraState.ts deterministic reducer, 13 tests. Physical device NOT VERIFIED per M0-B evidence |
| Pose provider candidate works on representative devices | **PARTIAL** | Huawei/Android only. No iOS. Stage 3 first result had no landmarks |
| PoseObservation is stable | **PASS** | Contract frozen, 43 tests, provider mapping documented |
| Deterministic metrics/phase/rep/faults/feedback | **PASS** | 149 analysis tests, all deterministic, no NaN propagation in tested paths |
| Fixtures and replay complete | **PASS** | 12 tests, round-trip determinism verified |
| Benchmark evidence complete | **FAIL** | Harness exists but thermal/battery/background are placeholders. No real-device measurements. No candidate comparison |
| Privacy verification complete | **PASS (code-level)** | M0-P audit passes for repository-owned module. Not whole-app. No runtime forensics |
| No extra AI exercise started | **PASS** | Squat-only across all packages |
| Required evidence artefacts exist and linked | **PASS** | 16 evidence files + 4 gate evidence link files |

### 2.3 Gate Checklist Fail Criteria Evaluation (Independent)

| Fail Criterion | Triggered? | Analysis |
|----------------|-------------|----------|
| Privacy evidence fails | **NO** | Code-level audit passes. Limitation: scoped to repository-owned module, not whole-app |
| Benchmark evidence fails | **YES** | The SRS M0-ENG-007 requires thermal trend measurement. The benchmark evidence has thermal as `not-measured` placeholder. The testing-validation doc states: "Passing tests alone is insufficient if thermal, latency, maintainability, or privacy constraints fail." Placeholder thermal is not "passing" — it is "not measured." |
| Replay or fixture determinism fails | **NO** | Verified through 12 tests and cross-instance replay |
| Runtime path not technically viable | **NO** | Pipeline works on Huawei. Viable for proof-of-architecture |
| Selected candidate violates boundary model | **NO** | All boundaries maintained |
| M0 scope expands beyond Squat | **NO** | Squat-only |
| Required evidence artifacts missing | **NO** | All 16 evidence files present |

### 2.4 Conditional Pass Legality

The gate checklist defines Conditional Pass as allowed only if:
- The architecture goal is technically viable: **YES**
- The selected runtime path is acceptable for M0 with documented caveats: **DEBATABLE** — the SRS requires iOS+Android, which is not met
- The remaining issues are not blockers: **DEBATABLE** — the SRS explicitly requires M0-ENG-006/007/008 to "pass"
- Every caveat is tied to SRS/architecture/ADR/test/evidence references: **YES**

**Critical observation**: The SRS M0-GATE-001 definition says "M0-ENG-001 through M0-ENG-008 **pass**." It does not say "pass or conditionally pass." The gate checklist (lower-priority document) introduces Conditional Pass as a concept, but the SRS's use of "pass" is unqualified. Per the SRS source-of-truth hierarchy (§1.5), the SRS takes precedence over planning documents.

### 2.5 SRS Exit Criterion

SRS §54.1: "Failing accuracy, latency, **thermal**, reliability or maintainability evidence requires architecture revision, not exercise expansion."

Thermal evidence is `not-measured` — this is not "passing" evidence. Whether "not measured" constitutes "failing" is debatable, but the SRS explicitly lists thermal as a category that, if failing, requires architecture revision. The absence of thermal evidence cannot be construed as passing.

---

## 3. SRS Traceability Audit

### 3.1 M0-ENG Engineering Spike Targets

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| M0-ENG-001 | Unbounded queue count = zero | **PASS (code)** | `STRATEGY_KEEP_ONLY_LATEST` in native code. Not device-verified (M0-C evidence: "still not device-verified") |
| M0-ENG-002 | Zero raw camera-frame bytes leaving device | **PASS (code)** | M0-P code audit. Not runtime-forensics-verified |
| M0-ENG-003 | Identical outputs for same fixture | **PASS** | 227 deterministic tests, fixture round-trip, cross-instance replay |
| M0-ENG-004 | Controlled squat sequences: 1 rep, noise, incomplete, tracking loss | **PASS** | Phase machine + rep detection tests verify all four scenarios |
| M0-ENG-005 | Tracking reacquisition without false rep | **PASS** | Phase machine PAUSED→active and TRACKING_LOST→READY tested |
| M0-ENG-006 | iOS **and** Android devices complete sustained tests without crash/memory/thermal | **NOT MET** | Only Huawei/Android tested. No iOS. No sustained tests. No thermal condition verification |
| M0-ENG-007 | Observation rate, p95 latency, JS responsiveness, overlay smoothness, **thermal trend** meet ADR-016 targets | **NOT MET** | No device measurements. Thermal is placeholder. No ADR-016 targets exist (ADR-016 is PROPOSED) |
| M0-ENG-008 | **Cross-platform** profile conformance + maintainability assessment | **NOT MET** | No iOS = no cross-platform. No formal maintainability assessment documented |

### 3.2 FR-TRANSPORT Requirements

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| FR-TRANSPORT-001 | Documented feasibility evaluation of options A–D, benchmark A plus viable B–D candidates on iOS/Android matrix | **NOT MET** | Only Option A used. No alternatives evaluated. No iOS. No documented feasibility evaluation |
| FR-TRANSPORT-002 | Same canonical fixtures, semantically equivalent outputs across candidates | **NOT MET** | Only one candidate (Option A / MediaPipe / CPU / Android). No cross-candidate comparison |
| FR-TRANSPORT-003 | Instrument queue depth, drops, FPS, p50/p95 latency, JS responsiveness, GC, overlay, thermal | **NOT MET** | Harness exists but uses synchronous JS timing. Thermal is placeholder. No real-device instrumentation |
| FR-TRANSPORT-004 | No unbounded queue | **PASS (code)** | `STRATEGY_KEEP_ONLY_LATEST` |
| FR-TRANSPORT-005 | One versioned profile schema + one conformance suite | **PARTIAL** | Profile schema exists as types. No conformance suite implemented |
| FR-TRANSPORT-006 | ADR-016 documents measured evidence, rejected alternatives, maintenance/cross-platform consequences | **NOT MET** | ADR-016 is PROPOSED with "Evidence pending M0 spike" |

### 3.3 NFR-PERF Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| NFR-PERF-004 | Measure and meet observation-rate target on each representative device | **NOT MET** — no device measurements |
| NFR-PERF-005 | Measure p50/p95 latency by candidate runtime and device | **NOT MET** — synchronous JS timing only, one candidate, one device |
| NFR-PERF-006 | Meet p95 observation-to-display latency target | **NOT MET** — no measurement |
| NFR-PERF-007 | No unbounded frame/observation queue | **PASS (code)** — KEEP_ONLY_LATEST |
| NFR-PERF-008 | Model/profile load meets target with deterministic fallback | **NOT MET** — no measurement |

### 3.4 FR-POSE Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| FR-POSE-001 | Single user pose estimation on device | **PASS (device)** — Huawei Stage 3 |
| FR-POSE-002 | Provider exposes all required landmarks through canonical enum | **PASS (code)** — 33-landmark mapping documented |
| FR-POSE-003 | Every observation includes monotonic timestamp, orientation/mirror, confidence, model version | **PASS** — contract enforces this |
| FR-POSE-004 | Inference off UI/JS main thread, bounded latest-frame | **PARTIAL** — code shows MediaPipe on native thread + KEEP_ONLY_LATEST. Not device-verified |
| FR-POSE-005 | Low-confidence beyond grace period → TRACKING_LOST | **PASS** — phase machine tests |
| FR-POSE-006 | Health counters for frames/drops/latency/tracking/load-failure | **PARTIAL** — counters defined in code. M0-C evidence: "still not device-verified" |
| FR-POSE-007 | Provider replacement passes canonical conformance fixture suite | **NOT MET** — no conformance fixture suite exists |
| FR-POSE-008 | Device-validated model tier selection | **PARTIAL** — `pose_landmarker_lite.task` used. No formal device validation |
| FR-POSE-009 | Model files integrity-checked, versioned, compatible with signed manifest | **NOT MET** — no integrity checking, no signed manifest |

### 3.5 FR-AIFC Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| FR-AIFC-001 | Explicit state model with single current state and machine-readable transition cause | **PARTIAL** — camera lifecycle state machine exists. AIFC lifecycle (COUNTDOWN, ACTIVE, SET_COMPLETE, etc.) not implemented |
| FR-AIFC-002 | Phase/rep advancement only in ACTIVE | **NOT MET** — no ACTIVE state in current implementation. Phase FSM advances independently |
| FR-AIFC-003 | TRACKING_LOST removes stale cues, retains state, requires stable reacquisition | **PARTIAL** — phase machine has TRACKING_LOST. Feedback selector has tracking guidance. No AIFC lifecycle integration |
| FR-AIFC-004 | Permission denial → MANUAL_FALLBACK without losing workout set | **PASS** — cameraState.ts handles this |
| FR-AIFC-005 | COUNTDOWN does not record reps | **NOT MET** — no COUNTDOWN state implemented |
| FR-AIFC-006 | Terminal states release raw frame resources | **PARTIAL** — native code closes ImageProxy. No explicit terminal state in JS |
| FR-AIFC-007 | Recovery persistence limited to session/set IDs, lifecycle, versions | **NOT MET** — no persistence layer |
| FR-AIFC-008 | State analytics use allowlisted codes, no images/landmarks | **NOT MET** — no analytics implemented |
| FR-AIFC-009 | Tests cover every permitted transition and reject unspecified | **PARTIAL** — phase machine tests do this for phase FSM. No AIFC lifecycle tests |

### 3.6 Gate Report Traceability Error

**Finding**: The M0 Gate Report's SRS traceability table references "FR-BENCH-001 through FR-BENCH-004" as SRS requirements. These requirements **do not exist** in the SRS. A grep for "FR-BENCH" in `docs/SRS.md` returns zero matches. The actual SRS requirements are FR-TRANSPORT-001 through FR-TRANSPORT-006 and NFR-PERF-004 through NFR-PERF-008. This is a traceability fabrication in the gate report.

---

## 4. Architecture / ADR Compliance Audit

### 4.1 ADR Status Summary

| ADR | Title | Status | SRS M0-GATE-001 Requirement |
|-----|-------|--------|------------------------------|
| ADR-005 | Pose Provider / Model | `PROPOSED` | Requires "accepted" |
| ADR-012 | React Native Build / Camera Integration | `PROPOSED` | Requires "accepted" |
| ADR-016 | PoseObservation Transport and Exercise Engine Runtime | `PROPOSED — EXPERIMENT REQUIRED` | Requires "accepted" |

**All three ADRs required by M0-GATE-001 are in PROPOSED status.** The SRS explicitly requires "accepted decisions supported by measurements." None have been accepted. None have measurements supporting a final decision.

### 4.2 ADR-016 Compliance

ADR-016 states: "No final runtime option is selected in this ADR. The project will benchmark the viable candidates and decide only after evidence review."

- **Candidate comparison**: NOT DONE. Only Option A (standard bridge) was used. No documented evaluation of Options B, C, or D.
- **Benchmark evidence**: INCOMPLETE. ADR-016 requires "representative iOS and Android physical devices." Only Huawei/Android.
- **ADR-016 revisit trigger**: "benchmark evidence identifies a clear winner" — no benchmark evidence exists to identify a winner.

### 4.3 Architecture Boundary Compliance

| Boundary | Status | Notes |
|----------|--------|-------|
| PoseObservation contract frozen | **MAINTAINED** | No modifications after M0-D freeze |
| Provider-neutral adapter layer | **MAINTAINED (code)** | `poseEventAdapters.ts` exists. BUT not used in CameraPreviewScreen |
| Analysis engine deterministic | **MAINTAINED** | No randomness, no network, no LLM in analysis path |
| Privacy: raw frames local and transient | **MAINTAINED (code)** | M0-P audit passes at code level |
| Scope: Bodyweight Squat only | **MAINTAINED** | No additional exercises |
| Feedback: local, deterministic | **MAINTAINED** | No network/LLM in feedback path |
| Fault: fail closed | **MAINTAINED** | Invalid/low-confidence → NOT_OBSERVABLE |

### 4.4 Camera-to-Analysis Pipeline Gap

**Critical architectural finding**: The `CameraPreviewScreen.tsx` component receives native pose observations via `onPoseObservation` but does **not** route them through:
- `adaptNativePoseObservation()` — the adapter that maps native payloads to canonical PoseObservation
- `validatePoseObservation()` / `assertValidPoseObservation()` — the validation layer
- `normalizeObservation()` — the normalization engine
- `computeSquatMetrics()` — the metrics engine
- `updatePhase()` — the phase FSM
- `processPhaseUpdate()` — the rep detection
- `evaluateInsufficientDepth()` / `evaluateExcessiveForwardLean()` — fault detection
- `selectFeedback()` — feedback selection

The camera component sets state directly from raw native events. The analysis pipeline is proven only through:
1. Unit tests with synthetic data
2. The benchmark harness (M0-O) which replays fixtures through the pipeline

The **live camera → analysis → feedback path is not wired up**. This means the end-to-end architecture viability claimed by the gate report is not demonstrated in running code. The SRS M0 purpose is to "prove that the core on-device computer-vision concept and native-to-engine architecture are technically viable" — the pipeline from camera to feedback is not connected.

---

## 5. Runtime & Device Evidence Audit

### 5.1 Device Coverage

| Platform | Device | Status | Evidence |
|----------|--------|--------|----------|
| Android | Huawei / HarmonyOS | **VERIFIED** | M0-C Stages 1-3: preview streaming, ImageAnalysis frames, MediaPipe result production |
| iOS | (none) | **NOT TESTED** | No iOS device evidence exists anywhere in the evidence package |

### 5.2 M0-C Stage 3 Evidence Analysis

The M0-C Stage 3 evidence shows:
- `Received: 3` — 3 frames received by ImageAnalysis
- `Dropped: 2` — 2 frames dropped
- `Produced: 1` — 1 MediaPipe result produced
- `Inference: 83ms` — inference time
- `Sequence 1 · Landmarks: unavailable · Count: 0` — **the first produced result had NO landmarks**

Interpretation: The pipeline produced a result, proving the runtime path is operational. However, the result contained no landmarks, meaning no actual pose data was processed. The 83ms inference time is from a single result with no landmarks. This is sufficient to prove the runtime path exists but insufficient to prove landmark quality or analysis accuracy on device.

### 5.3 Health Counter Verification

M0-C evidence explicitly states: "These are code-verified and compile-verified, but still **not device-verified**."

FR-POSE-006 requires the provider to "emit health counters for accepted/dropped frames, inference latency, tracking loss and model load failure." The counters are defined in code but their runtime emission has not been verified on device.

### 5.4 Benchmark Evidence

| Metric | Measured? | Source |
|--------|-----------|--------|
| Total/normalized/dropped frames | Yes (harness) | Replay-based, not device |
| Processing time | Yes (harness) | `performance.now()` synchronous JS timing |
| JS load score | Yes (derived) | From processing time / frame interval |
| Memory footprint | Yes (heuristic) | From landmark data size, not actual memory |
| Tracking recovery | Yes (harness) | PAUSED → active transitions |
| Rep counts | Yes (harness) | `processPhaseUpdate()` |
| **FPS** | **No** | Not measured on device |
| **p50/p95 latency** | **No** | Synchronous JS timing only |
| **Thermal trend** | **No** | `not-measured` placeholder |
| **Battery** | **No** | `not-measured` placeholder |
| **Background behavior** | **No** | `not-measured` placeholder |
| **Overlay smoothness** | **No** | Not measured |
| **Crash/recovery** | **No** | Not measured |
| **Candidate comparison** | **No** | Only Option A used |

### 5.5 Expo Prebuild Reproducibility

M0-C evidence documents an **Open HIGH finding**: "Clean prebuild command remains intermittently blocked by `EBUSY` while deleting `apps/mobile/android`." This is a Windows filesystem lock issue. The evidence states this is "an environment/tooling issue, not proof that the persistent module is lost."

While this is an environment issue, it affects reproducibility. A developer on Windows cannot reliably run `expo prebuild --clean`. This is a tooling defect that should be resolved before M1.

---

## 6. Test & Determinism Audit

### 6.1 Test Results (Independently Verified)

| Metric | Result |
|--------|--------|
| Test files | 15 passed (15) |
| Tests | 227 passed (227) |
| Duration | 1.28s |
| Lint | Clean |
| Typecheck | Clean |

### 6.2 Determinism Verification

The analysis pipeline (normalization → metrics → phase → rep → fault → feedback) is **fully deterministic**:
- No `Math.random()`, no `Date.now()` in analysis code
- No network calls
- No LLM calls
- All functions are pure
- Degenerate inputs produce finite fallback values (0 for angles, 1.0 for scale)
- 149 analysis tests verify deterministic behavior

### 6.3 Test Coverage Gaps

| Gap | Impact |
|-----|--------|
| No integration test connecting camera → analysis → feedback | The end-to-end pipeline is not tested in integration |
| No test verifying `adaptNativePoseObservation` is called in CameraPreviewScreen | Adapter is bypassed in production code |
| No test for `normalizeRotation` with non-standard values | Silent mapping to 0 is untested |
| No test for NaN propagation through `clamp` in normalization | NaN safety gap if validation is bypassed |
| Benchmark harness does not run fault detection or feedback selection | Benchmark pipeline is incomplete |
| No AIFC lifecycle state machine tests | FR-AIFC-009 unmet |

### 6.4 Fixture Determinism

Fixture and replay determinism is **fully verified**:
- `serializeFixture()` → `deserializeFixture()` → `serializeFixture()` produces identical output
- Cross-instance replay produces identical emitted observations
- 12 tests cover round-trip, cloning, validation, monotonic ordering, step/play/accelerate/reset

### 6.5 Replay Simulator Mode Bug

**Finding**: In `replaySimulator.ts`, `play()` sets `mode = 'playing'` but `step()` immediately overwrites the mode to `'idle'` or `'completed'`. The mode is never actually `'playing'` during iteration. This is a correctness bug in mode tracking, though it does not affect determinism of emitted observations.

---

## 7. Privacy Audit

### 7.1 Privacy Verification Results

| Check | Result | Method |
|-------|--------|--------|
| Raw-frame backpressure is transient | **PASS** | `STRATEGY_KEEP_ONLY_LATEST`, explicit `ImageProxy.close()` |
| Frame processing in memory | **PASS** | In-memory `Bitmap`, `detectAsync()`, no disk writes |
| Output is landmarks/scalars, not images | **PASS** | Emitted events contain numeric coordinates only |
| No raw-frame disk persistence | **PASS** | No file/cache/content-resolver writes in audited code |
| No raw-frame network transmission | **PASS** | No HTTP/socket/WebSocket/Retrofit/OkHttp in module |
| Module manifest requests CAMERA only | **PASS** | No INTERNET or ACCESS_NETWORK_STATE in module manifest |

### 7.2 Privacy Scope Limitations

| Limitation | Impact |
|------------|--------|
| Scoped to repository-owned module only | Does not prove whole-app network impossibility |
| Code-structure verification only | No runtime heap forensics, no network packet capture |
| Android-only | No iOS privacy verification |
| No `M0-ENG-002` runtime verification | SRS requires "Instrumented network capture SHALL show zero raw camera-frame/video bytes leaving the device." This was not done at runtime. |

### 7.3 SRS M0 Privacy Scope

The SRS §54.1 says M0 includes "basic verification that raw video does not leave the device." The M0-P code-level audit satisfies "basic verification" at the code-structure level. The SRS M0-ENG-002 requires "Instrumented network capture" which is a stronger requirement that was NOT met.

The privacy-verification-plan.md says: "instrument network paths during the active camera path." This was not done. The verification was code inspection, not network instrumentation.

---

## 8. Evidence Integrity Audit

### 8.1 Evidence File Inventory

| Package | Evidence File | Exists | Committed |
|---------|--------------|--------|-----------|
| M0-A | `docs/evidence/M0-A.md` | YES | YES |
| M0-B | `docs/evidence/M0-B.md` | YES | YES |
| M0-C | `docs/evidence/M0-C.md` | YES | YES |
| M0-D | `docs/evidence/M0-D.md` | YES | YES |
| M0-E | `docs/evidence/M0-E.md` | YES | YES |
| M0-F | `docs/evidence/M0-F.md` | YES | YES |
| M0-G | `docs/evidence/M0-G.md` | YES | YES |
| M0-H | `docs/evidence/M0-H.md` | YES | YES |
| M0-I | `docs/evidence/M0-I.md` | YES | YES |
| M0-J | `docs/evidence/M0-J.md` | YES (covers J+K) | YES |
| M0-K | (combined with M0-J) | N/A | N/A |
| M0-L | `docs/evidence/M0-L.md` | YES | YES |
| M0-M | `docs/evidence/M0-M.md` | YES | YES |
| M0-N | `docs/evidence/M0-N.md` | YES | YES |
| M0-O | `docs/evidence/M0-O.md` | YES | YES |
| M0-P | `docs/evidence/M0-P.md` | YES | YES |
| M0-Q | `docs/evidence/M0-Q.md` | YES | YES |

### 8.2 Gate Evidence Link Files

| File | Exists | Committed |
|------|--------|-----------|
| `docs/architecture/evidence/m0/m0-gate-report.md` | YES | YES |
| `docs/architecture/evidence/m0/runtime-benchmark.md` | YES | YES |
| `docs/architecture/evidence/m0/squat-fixture-report.md` | YES | YES |
| `docs/architecture/evidence/m0/privacy-verification.md` | YES | YES |

### 8.3 Evidence-to-Commit Traceability

| Evidence Claim | Commit | Verified |
|----------------|--------|----------|
| M0-G commit `bd902d1` | `bd902d1` in git log | YES |
| M0-H commit `f6d807f` | `f6d807f` in git log | YES |
| M0-I commit `8de923e` | `8de923e` in git log | YES |
| All evidence files on HEAD `0cb92e4` | Verified | YES |

### 8.4 Evidence Freshness

All evidence files reference the current repository state. Test counts in evidence files match the independently verified count (227 tests). No stale evidence claims detected.

### 8.5 Evidence Accuracy Issues

| Issue | Severity |
|-------|----------|
| Gate report references "FR-BENCH-001 through FR-BENCH-004" — these don't exist in the SRS | HIGH — traceability fabrication |
| M0-C evidence says health counters are "not device-verified" but gate report claims "provider metadata is captured" as PASS | MEDIUM — overstates device evidence |
| Gate report claims benchmark evidence PASS (with caveats) but SRS M0-ENG-007 requires thermal trend measurement which is placeholder | HIGH — misclassification |
| Gate report claims "ADR-005/ADR-012/ADR-016 have accepted decisions" implicitly via PASS status, but all three are PROPOSED | CRITICAL — false claim |

---

## 9. Git / Repository Integrity Audit

### 9.1 Branch State

| Branch | HEAD | Status |
|--------|------|--------|
| `master` (local) | `0cb92e4` | Current, clean working tree (untracked files only) |
| `origin/main` | `0cb92e4` | Matches local master |
| `feature/m0-d-analysis-foundation` | `36ebd41` | Merged to master |
| `feature/m0-jkl-faults-feedback` | `cb533c8` | Merged to master |
| `feature/m0-emno-overlay-replay` | `6a3ca08` | Merged to master |

### 9.2 Merge History

```
0cb92e4 docs(m0-q): M0 gate report — CONDITIONAL PASS
882c94c Merge feature/m0-emno-overlay-replay
fffb512 Merge feature/m0-jkl-faults-feedback
59c621f Merge feature/m0-d-analysis-foundation
```

All three feature branches were merged with `--no-ff` merge commits. The merge history is clean and traceable.

### 9.3 Untracked Files

| File | Concern |
|------|---------|
| `.workbuddy/` | IDE/agent working directory — should be in `.gitignore` |
| `apps/mobile/modules/pose-camera/android/src/main/java/expo/core/` | Unexpected generated directory — should be investigated |
| `logcat.txt` | Device log capture — should be cleaned up |
| `m0c_screen.png` | Screenshot — should be cleaned up |
| `overview.md` | Generated overview — should be cleaned up or tracked |

### 9.4 HEAD Consistency

Local `master` = `origin/main` = `0cb92e4`. **Consistent.**

---

## 10. Contradictions

### 10.1 SRS vs. Gate Checklist

| SRS | Gate Checklist | Contradiction |
|-----|----------------|---------------|
| "M0-ENG-001 through M0-ENG-008 **pass**" | "Conditional Pass allowed if remaining issues are not blockers" | The SRS requires "pass" — the gate checklist introduces "conditional pass" which the SRS does not mention for M0-GATE-001 |
| "ADR-005/ADR-012/ADR-016 have **accepted** decisions" | Gate report grants PASS without ADR acceptance | All three ADRs are PROPOSED |

### 10.2 SRS vs. Implementation

| SRS | Implementation | Contradiction |
|-----|----------------|---------------|
| FR-TRANSPORT-001: "benchmark option A plus every viable B–D candidate" | Only Option A used | No alternatives evaluated |
| M0-ENG-006: "iOS **and** Android" | Huawei/Android only | No iOS testing |
| FR-AIFC-002: "Phase/rep advancement SHALL occur only in ACTIVE" | Phase FSM advances independently of any AIFC ACTIVE state | No AIFC lifecycle implemented |
| M0-ENG-002: "Instrumented network capture SHALL show zero raw camera-frame bytes" | Code inspection only | No network instrumentation |

### 10.3 Gate Report vs. Evidence

| Gate Report Claim | Evidence Reality | Contradiction |
|-------------------|------------------|---------------|
| "FR-BENCH-001 through FR-BENCH-004" | These don't exist in SRS | Fabricated traceability |
| Benchmark evidence "PASS (with caveats)" | Thermal/battery/background are `not-measured` | SRS M0-ENG-007 requires thermal trend to "meet" targets — placeholder is not meeting |
| "ADR-005/ADR-012/ADR-016 have accepted decisions" (implicit in PASS) | All three are PROPOSED | False |

### 10.4 Architecture vs. Implementation

| Architecture Document | Implementation | Contradiction |
|----------------------|----------------|---------------|
| `poseEventAdapters.ts` maps native to canonical | `CameraPreviewScreen.tsx` does not call adapters | Adapter layer bypassed in production code |
| Architecture assumes camera → analysis pipeline | Pipeline not connected in CameraPreviewScreen | Analysis engine runs only in tests/benchmark |

### 10.5 Testing-Validation Doc vs. Gate Report

| Testing-Validation Doc | Gate Report | Contradiction |
|------------------------|-------------|---------------|
| "Passing tests alone is insufficient if thermal, latency, maintainability, or privacy constraints fail" | Grants PASS with thermal as placeholder | Placeholder thermal is not "passing" |

---

## 11. Findings Ordered by Severity

### CRITICAL

#### F-CR-01: ADR-005/012/016 Not Accepted
- **Severity**: CRITICAL
- **Claim**: Gate report grants PASS, implicitly requiring "ADR-005/ADR-012/ADR-016 have accepted decisions"
- **Expected**: All three ADRs in `ACCEPTED` status with supporting measurements
- **Actual**: ADR-005 is `PROPOSED`, ADR-012 is `PROPOSED`, ADR-016 is `PROPOSED — EXPERIMENT REQUIRED`
- **Evidence**: `docs/architecture/adr/ADR-005-pose-provider-model.md` line 5, `ADR-012-react-native-build-camera-integration.md` line 5, `ADR-016-pose-observation-transport-runtime.md` line 5
- **Impact**: M0-GATE-001 definition explicitly requires accepted ADRs. Without acceptance, the gate cannot pass under any interpretation.
- **Required remediation**: Accept ADR-005, ADR-012, and ADR-016 with documented evidence and decision rationale, or obtain an SRS amendment adjusting the gate criteria.
- **Gate blocking**: **YES**

#### F-CR-02: M0-ENG-006 Not Met (iOS + Sustained Tests)
- **Severity**: CRITICAL
- **Claim**: Gate report grants PASS for "pose provider candidate works on representative devices"
- **Expected**: "The approved M0 representative iOS **and Android** physical devices SHALL complete sustained tests without crash, runaway memory, unrecoverable camera state or unacceptable OS thermal condition"
- **Actual**: Only Huawei/Android tested. No iOS. No sustained tests. No thermal condition verification.
- **Evidence**: M0-C evidence, runtime-benchmark.md
- **Impact**: M0-GATE-001 requires M0-ENG-006 to pass. It does not pass.
- **Required remediation**: Test on at least one iOS device and one additional Android device with sustained runs. Verify no crash, no runaway memory, no unrecoverable camera state, and acceptable thermal condition.
- **Gate blocking**: **YES**

#### F-CR-03: M0-ENG-007 Not Met (Thermal Trend)
- **Severity**: CRITICAL
- **Claim**: Gate report grants benchmark evidence as "PASS (with caveats)"
- **Expected**: "Effective observation rate, p95 end-to-end latency, JS responsiveness, overlay smoothness and **thermal trend** SHALL meet the pre-approved ADR-016 benchmark targets"
- **Actual**: No device measurements. Thermal is `not-measured` placeholder. No pre-approved ADR-016 targets exist.
- **Evidence**: M0-O evidence, runtime-benchmark.md
- **Impact**: SRS exit criterion: "Failing accuracy, latency, **thermal**, reliability or maintainability evidence requires architecture revision." Placeholder is not passing evidence.
- **Required remediation**: Define pre-approved ADR-016 benchmark targets. Measure FPS, p50/p95 latency, JS responsiveness, overlay smoothness, and thermal trend on representative devices.
- **Gate blocking**: **YES**

#### F-CR-04: M0-ENG-008 Not Met (Cross-Platform Conformance)
- **Severity**: CRITICAL
- **Claim**: Gate report does not address M0-ENG-008
- **Expected**: "The selected runtime SHALL pass **cross-platform profile conformance** and have an accepted maintainability/diagnosability assessment"
- **Actual**: No iOS testing. No cross-platform conformance. No formal maintainability assessment.
- **Evidence**: No evidence exists for M0-ENG-008
- **Impact**: M0-GATE-001 requires M0-ENG-008 to pass.
- **Required remediation**: Run profile conformance on both iOS and Android. Document maintainability/diagnosability assessment.
- **Gate blocking**: **YES**

#### F-CR-05: FR-TRANSPORT-001 Not Met (Candidate Comparison)
- **Severity**: CRITICAL
- **Claim**: Gate report SRS traceability marks FR-TRANSPORT as PASS
- **Expected**: "M0 SHALL perform a documented feasibility evaluation of options A–D and benchmark option A plus every viable B–D candidate on the provisional M0 iOS/Android physical-device matrix"
- **Actual**: Only Option A (standard bridge) used. No alternatives evaluated. No documented feasibility evaluation. No iOS/Android matrix.
- **Evidence**: ADR-016 states "No final runtime option is selected." No benchmark comparison exists.
- **Impact**: FR-TRANSPORT-001 is an M0 requirement. ADR-016 cannot be accepted without this evidence.
- **Required remediation**: Document feasibility evaluation of Options A-D. Benchmark at least Option A and one viable alternative on iOS and Android.
- **Gate blocking**: **YES**

### HIGH

#### F-HI-01: Camera-to-Analysis Pipeline Not Connected
- **Severity**: HIGH
- **Claim**: Gate report claims architecture is "technically viable"
- **Expected**: Camera → adapter → validation → normalization → metrics → phase → rep → fault → feedback pipeline connected in running code
- **Actual**: `CameraPreviewScreen.tsx` receives native observations but does not route them through adapters, validation, or the analysis pipeline. Observations are displayed raw in the UI.
- **Evidence**: `apps/mobile/src/camera/CameraPreviewScreen.tsx` — `onPoseObservation` sets state directly without calling `adaptNativePoseObservation`, `validatePoseObservation`, or any analysis function
- **Impact**: End-to-end architecture viability is not demonstrated in running code. Only proven through unit tests and benchmark harness.
- **Required remediation**: Wire CameraPreviewScreen through the analysis pipeline: adapter → validation → normalization → metrics → phase → rep → fault → feedback.
- **Gate blocking**: **NO** (pipeline proven through tests/benchmark, but gap must be closed for M1)

#### F-HI-02: FR-BENCH Traceability Fabrication
- **Severity**: HIGH
- **Claim**: Gate report SRS traceability table references "FR-BENCH-001 through FR-BENCH-004"
- **Expected**: References to actual SRS requirements (FR-TRANSPORT-001 through 006, NFR-PERF-004 through 008)
- **Actual**: "FR-BENCH" does not exist in the SRS. Grep returns zero matches.
- **Evidence**: Gate report line 152, SRS grep
- **Impact**: Gate report traceability is unreliable. Cannot trust other traceability claims without independent verification.
- **Required remediation**: Correct all SRS references in the gate report to use actual requirement IDs.
- **Gate blocking**: **NO** (documentation error, but undermines trust)

#### F-HI-03: M0-ENG-002 Not Met (Network Instrumentation)
- **Severity**: HIGH
- **Claim**: Gate report grants privacy verification PASS
- **Expected**: "Instrumented network capture SHALL show zero raw camera-frame/video bytes leaving the device during Form Check"
- **Actual**: Code inspection only. No instrumented network capture performed.
- **Evidence**: M0-P evidence, privacy-verification-plan.md says "instrument network paths"
- **Impact**: M0-ENG-002 is an explicit M0 engineering target. Code inspection is weaker than network instrumentation.
- **Required remediation**: Perform instrumented network capture during active camera session to verify zero raw frame bytes leave the device.
- **Gate blocking**: **NO** (code-level privacy is sound, but stronger evidence required by SRS)

#### F-HI-04: NFR-PERF-004/005/006/008 Not Met
- **Severity**: HIGH
- **Claim**: Gate report marks performance as PASS
- **Expected**: Measure and meet observation rate (004), p50/p95 latency (005), p95 observation-to-display (006), model load (008)
- **Actual**: No device measurements for any of these. Only synchronous JS timing in harness.
- **Evidence**: M0-O evidence, runtime-benchmark.md
- **Impact**: Four M0 NFR requirements are unmet.
- **Required remediation**: Measure all four performance metrics on representative devices.
- **Gate blocking**: **NO** (related to M0-ENG-007 which is blocking)

#### F-HI-05: Camera Active State Based on Permission, Not Lifecycle
- **Severity**: HIGH
- **Claim**: Gate report claims camera lifecycle is correct
- **Expected**: Camera active only during `preview_active` lifecycle state
- **Actual**: `PoseCameraView active={state.permission === 'granted'}` — camera is active whenever permission is granted, regardless of lifecycle state. Camera runs during `ready_to_setup` and `manual_fallback`.
- **Evidence**: `apps/mobile/src/camera/CameraPreviewScreen.tsx`
- **Impact**: Violates camera lifecycle state machine. Camera may run when it shouldn't, consuming resources and potentially violating privacy expectations.
- **Required remediation**: Change `active` prop to use lifecycle state: `active={state.lifecycle === 'preview_active'}`
- **Gate blocking**: **NO** (functional but incorrect lifecycle)

### MEDIUM

#### F-MD-01: normalizeRotation Silent Data Corruption
- **Severity**: MEDIUM
- **Claim**: Adapter correctly maps native to canonical
- **Expected**: Non-standard rotations are rejected or logged
- **Actual**: `normalizeRotation` silently maps any non-{0,90,180,270} value to 0
- **Evidence**: `apps/mobile/src/pose/poseEventAdapters.ts`
- **Impact**: A 45-degree rotation becomes 0, potentially corrupting landmark coordinates without any error signal.
- **Required remediation**: Reject non-standard rotations or log a diagnostic.
- **Gate blocking**: **NO**

#### F-MD-02: NaN Propagation Through clamp
- **Severity**: MEDIUM
- **Claim**: M0-F evidence claims NaN safety
- **Expected**: `clamp(NaN, 0, 1)` returns a finite value
- **Actual**: `Math.max(NaN, 0)` returns `NaN`, so `clamp(NaN, 0, 1)` returns `NaN`
- **Evidence**: `apps/mobile/src/analysis/normalization.ts`
- **Impact**: If NaN slips past validation (which it can since adapters don't validate), it propagates through normalization.
- **Required remediation**: Add `Number.isFinite` check in clamp or enforce validation at adapter boundary.
- **Gate blocking**: **NO**

#### F-MD-03: Replay Simulator Mode Bug
- **Severity**: MEDIUM
- **Claim**: M0-N evidence claims simulator works correctly
- **Expected**: `play()` mode persists as `'playing'` during iteration
- **Actual**: `step()` immediately overwrites mode to `'idle'` or `'completed'`
- **Evidence**: `apps/mobile/src/replay/replaySimulator.ts`
- **Impact**: Mode tracking is incorrect. Does not affect determinism of emitted observations.
- **Required remediation**: Fix mode lifecycle in replay simulator.
- **Gate blocking**: **NO**

#### F-MD-04: M0-C Stage 3 No Landmarks Produced
- **Severity**: MEDIUM
- **Claim**: Gate report claims pose provider works on device
- **Expected**: MediaPipe produces landmarks on device
- **Actual**: First (and only) Stage 3 result had "Landmarks: unavailable · Count: 0"
- **Evidence**: M0-C evidence Stage 3
- **Impact**: Runtime path is proven but landmark production is not. No actual pose data was processed on device.
- **Required remediation**: Run Stage 3 with a person in frame to produce actual landmarks.
- **Gate blocking**: **NO** (pipeline proven, landmark production needs re-verification)

#### F-MD-05: EBUSY Prebuild Instability
- **Severity**: MEDIUM
- **Claim**: Gate report lists as caveat
- **Expected**: `expo prebuild --clean` works reliably
- **Actual**: Intermittently fails with `EBUSY: resource busy or locked, rmdir 'apps/mobile/android'`
- **Evidence**: M0-C evidence, Finding HIGH (Open)
- **Impact**: Windows developers cannot reliably regenerate native projects. Affects reproducibility.
- **Required remediation**: Fix Windows filesystem lock issue or document workaround.
- **Gate blocking**: **NO**

#### F-MD-06: Format Gate Fails on Generated Artifacts
- **Severity**: MEDIUM
- **Claim**: Gate report lists as caveat
- **Expected**: `pnpm format` passes
- **Actual**: Fails because Prettier scans generated Android/build artifacts
- **Evidence**: M0-C evidence, Finding HIGH (Open)
- **Impact**: CI format gate would fail. Generated artifacts should be excluded from formatting scope.
- **Required remediation**: Configure Prettier/ESLint ignore patterns to exclude `apps/mobile/android/` and `apps/mobile/modules/*/android/build/`.
- **Gate blocking**: **NO**

### LOW

#### F-LO-01: getEffectiveKneeAngle Duplicated 3 Times
- **Severity**: LOW
- **Claim**: N/A
- **Expected**: Single shared utility
- **Actual**: Duplicated in `phaseMachine.ts`, `repDetection.ts`, and `faults.ts`
- **Impact**: DRY violation. Maintenance burden.
- **Required remediation**: Extract to shared utility.
- **Gate blocking**: **NO**

#### F-LO-02: FR-POSE-007/009 Not Met
- **Severity**: LOW
- **Claim**: Gate report marks FR-POSE as PASS
- **Expected**: Conformance fixture suite (007), model integrity checking (009)
- **Actual**: No conformance suite. No model integrity checking.
- **Impact**: Provider replacement path is untested. Model files are not integrity-checked.
- **Required remediation**: Implement conformance fixture suite and model integrity checking for M1.
- **Gate blocking**: **NO**

#### F-LO-03: FR-AIFC Lifecycle Not Implemented
- **Severity**: LOW
- **Claim**: Gate report marks FR-AIFC as PASS
- **Expected**: Full AIFC lifecycle state machine (COUNTDOWN, ACTIVE, SET_COMPLETE, ERROR, etc.)
- **Actual**: Only camera lifecycle state machine exists. No AIFC lifecycle.
- **Impact**: AIFC lifecycle is an M0 requirement but was not implemented. Phase FSM advances independently.
- **Required remediation**: Implement AIFC lifecycle state machine for M1.
- **Gate blocking**: **NO** (arguable — FR-AIFC is tagged M0 in SRS appendix)

#### F-LO-04: Benchmark Pipeline Incomplete
- **Severity**: LOW
- **Claim**: M0-O evidence claims full pipeline benchmark
- **Expected**: Benchmark runs through fault detection and feedback selection
- **Actual**: Benchmark stops at rep detection. Does not run fault detection or feedback selection.
- **Impact**: Benchmark does not measure the full analysis pipeline.
- **Required remediation**: Extend benchmark to include fault detection and feedback selection.
- **Gate blocking**: **NO**

---

## 12. M1 Carry-Over Items

1. **Accept ADR-005, ADR-012, ADR-016** with documented evidence and decision rationale
2. **iOS device testing**: Run full pipeline on at least one iOS device
3. **Secondary Android device testing**: Verify on a non-Huawei Android device
4. **Sustained device tests**: Run sustained sessions to verify no crash, no runaway memory, no thermal issues
5. **Thermal/battery/background measurement**: Collect real-device thermal trend, battery trend, and background behavior data
6. **ADR-016 candidate comparison**: Document feasibility evaluation of Options A-D; benchmark at least Option A and one viable alternative
7. **Define pre-approved ADR-016 benchmark targets**: Numerical targets for FPS, p95 latency, JS responsiveness, overlay smoothness, thermal
8. **Wire camera-to-analysis pipeline**: Connect CameraPreviewScreen through adapters → validation → normalization → metrics → phase → rep → fault → feedback
9. **Fix camera active state**: Use lifecycle state, not permission state, to control camera activation
10. **Network instrumentation**: Perform instrumented network capture during active camera session (M0-ENG-002)
11. **FR-POSE-007 conformance suite**: Implement canonical conformance fixture suite
12. **FR-POSE-009 model integrity**: Implement model file integrity checking
13. **FR-AIFC lifecycle**: Implement full AIFC state machine (COUNTDOWN, ACTIVE, SET_COMPLETE, ERROR)
14. **Fix normalizeRotation**: Reject or log non-standard rotations
15. **Fix clamp NaN safety**: Add `Number.isFinite` guard
16. **Fix replay simulator mode bug**: Correct mode lifecycle
17. **Fix EBUSY prebuild issue**: Resolve Windows filesystem lock
18. **Fix format gate**: Exclude generated artifacts from Prettier scope
19. **Correct gate report traceability**: Replace FR-BENCH references with actual SRS requirement IDs
20. **Extend benchmark pipeline**: Include fault detection and feedback selection
21. **Extract getEffectiveKneeAngle**: Deduplicate shared utility
22. **Device-side fixture capture workflow**: Implement on-device fixture recording/export
23. **M0-C Stage 3 re-verification**: Run with person in frame to produce actual landmarks

---

## 13. Final Decision

### REQUEST CHANGES

The M0 implementation has made substantial and commendable progress. The deterministic analysis engine is excellent — 227 tests pass, the pipeline is NaN-safe in tested paths, determinism is rigorously enforced, and the fail-closed principle is correctly implemented. Privacy is verified at the code-structure level. The fixture and replay system is well-designed and deterministic.

However, the SRS M0-GATE-001 definition contains **five explicit preconditions** that are **not met**:

1. **ADR-005/012/016 must be ACCEPTED** — all three are PROPOSED
2. **M0-ENG-006 must pass** — requires iOS AND Android; only Huawei/Android tested
3. **M0-ENG-007 must pass** — requires thermal trend measurement; thermal is placeholder
4. **M0-ENG-008 must pass** — requires cross-platform conformance; no iOS
5. **FR-TRANSPORT-001 must be met** — requires candidate comparison; only Option A used

Per the review instructions: "A documented caveat is still a defect if the authoritative Gate/SRS requires it before exit." The SRS explicitly requires these conditions before M0-GATE-001 can pass. The gate report's CONDITIONAL PASS does not satisfy these preconditions.

**REQUEST CHANGES** rather than **FAIL** because:
- The architecture IS technically viable (demonstrated through 227 tests and Huawei device evidence)
- Privacy IS verified at code level
- The deterministic engine IS correct and well-tested
- The remaining issues have clear, achievable resolution paths
- No privacy violation, boundary violation, or scope expansion occurred

**REQUEST CHANGES** rather than **CONDITIONAL PASS** because:
- The SRS M0-GATE-001 definition explicitly requires "ADR-005/ADR-012/ADR-016 have **accepted** decisions" and "M0-ENG-001 through M0-ENG-008 **pass**"
- These are mandatory preconditions, not optional caveats
- Three ADRs are PROPOSED (not accepted) and three M0-ENG targets are not met
- The SRS takes precedence over the gate checklist per the source-of-truth hierarchy
- The SRS exit criterion explicitly states: "Failing accuracy, latency, **thermal**, reliability or maintainability evidence requires architecture revision"

### What is needed to achieve CONDITIONAL PASS:
- Accept ADR-005 and ADR-012 (these have sufficient evidence for acceptance)
- Define pre-approved ADR-016 benchmark targets (even if measurements are deferred)
- Document a formal ADR-016 decision accepting Option A as the M0 runtime with a revisit trigger
- Wire the camera-to-analysis pipeline in running code
- Fix the camera active state lifecycle bug

### What is needed to achieve full PASS:
- All of the above, PLUS:
- iOS device testing with sustained runs
- Real-device thermal/battery/background measurement
- FR-TRANSPORT-001 candidate comparison
- Network instrumentation (M0-ENG-002)
- Cross-platform profile conformance (M0-ENG-008)

### Do not start M1.
