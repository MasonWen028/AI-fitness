# M0 Remediation Plan — Classification & R1–R5 DAG

| Field | Value |
|-------|-------|
| Plan type | Remediation planning only (no code changes) |
| Date | 2026-08-10 |
| Source review | `docs/reviews/M0-FINAL-ARCHITECTURE-EVIDENCE-REVIEW.md` |
| SRS gate definition | SRS §54.1, M0-GATE-001 (line 1959) |
| Current gate decision | REQUEST CHANGES |
| Items classified | 23 (from review §12, M1 Carry-Over Items) |

> **Scope constraint:** This document classifies and sequences remediation work. No code is changed in this phase. Each R-phase is a planning unit; implementation requires a separate work order.

> **Reconciliation:** This plan is governed by `docs/reviews/M0-R0-REQUIREMENT-RECONCILIATION.md`. Per that review (C1–C5 approved and applied 2026-08-10), FR-POSE-007 and FR-POSE-009 are split (FR-POSE-007a/FR-POSE-009a = M0; FR-POSE-007b/FR-POSE-009b = M1) and FR-AIFC-001–009 are confirmed mandatory M0. Items #11, #12, #13 are **REQUIRED_M0**. Category names and the R0–R5 DAG follow that review.

---

## 1. Classification Criteria

| Category | Definition | SRS Basis |
|----------|------------|-----------|
| **GATE_BLOCKER** | SRS M0-GATE-001 explicit precondition not met. Gate cannot pass under any interpretation until resolved. | M0-GATE-001: "ADR-005/ADR-012/ADR-016 have accepted decisions... M0-ENG-001 through M0-ENG-008 pass" |
| **REQUIRED_M0** | SRS M0-tagged mandatory requirement (or architectural-credibility item directly serving it) that must be complete for M0 FULL PASS. M0-GATE-001 requires *all mandatory M0 requirements* complete. | SRS milestone mapping table (FR-POSE, FR-AIFC, FR-TRANSPORT, NFR-PERF tagged M0); FR-POSE-007a/FR-POSE-009a and FR-AIFC-001–009 are M0 (FR-POSE-007b/FR-POSE-009b M1), per M0-R0 reconciliation C1–C3. |
| **M1_CARRY_OVER** | Genuinely forward-looking. Not SRS-M0-mandatory; can be deferred to M1 without undermining M0's proof-of-architecture objective. A lower-priority planning doc MUST NOT silently reclassify an SRS-M0-tagged requirement. | SRS §54.2 M1 scope; review §12 carry-over recommendation |
| **CLEANUP** | Tooling, documentation, or housekeeping defect. Does not affect gate outcome or architecture viability. | N/A — engineering hygiene |

---

## 2. Classification of All 23 Items

### 2.1 GATE_BLOCKER (6 items)

These map to the 5 CRITICAL findings (F-CR-01 through F-CR-05) in the review. The SRS M0-GATE-001 definition explicitly requires each as a precondition.

| # | Item | Finding | SRS Precondition | Why Blocking |
|---|------|---------|------------------|--------------|
| 1 | Accept ADR-005, ADR-012, ADR-016 | F-CR-01 | "ADR-005/ADR-012/ADR-016 have accepted decisions supported by measurements" | All three are `PROPOSED`. Gate definition uses unqualified "accepted." |
| 2 | iOS device testing | F-CR-02, F-CR-04 | M0-ENG-006: "iOS **and** Android"; M0-ENG-008: "cross-platform" | Only Huawei/Android tested. No iOS = no cross-platform conformance. |
| 4 | Sustained device tests | F-CR-02 | M0-ENG-006: "sustained tests without crash, runaway memory, unrecoverable camera state" | No sustained tests were run. Single-session spot checks only. |
| 5 | Thermal/battery/background measurement | F-CR-03 | M0-ENG-007: "thermal trend SHALL meet pre-approved ADR-016 targets"; SRS exit: "Failing... thermal... requires architecture revision" | Thermal is `not-measured` placeholder. SRS exit criterion explicitly names thermal. |
| 6 | ADR-016 candidate comparison | F-CR-05 | FR-TRANSPORT-001: "benchmark option A plus every viable B–D candidate" | Only Option A used. No alternatives evaluated. ADR-016 cannot be accepted without this. |
| 7 | Define pre-approved ADR-016 benchmark targets | F-CR-03 | M0-ENG-007: "pre-approved ADR-016 benchmark targets" | No targets exist (ADR-016 is PROPOSED). Cannot measure against undefined targets. SRS §54.1: "targets SHALL be approved... before measurement." |

**Note on Item 1:** This splits into two sub-tasks:
- **1a — Accept ADR-005 and ADR-012:** The review states these have sufficient evidence for acceptance. This is a documentation/decision task, not a measurement task.
- **1b — Accept ADR-016:** Requires candidate comparison evidence (Item 6), benchmark targets (Item 7), and device measurements (Items 2, 4, 5). Cannot be completed until R4.

### 2.2 REQUIRED_M0 (9 items)

These are SRS M0-tagged mandatory requirements (or architectural-credibility items directly serving them) that must be complete for **M0 FULL PASS**. Per M0-GATE-001, *all mandatory M0 requirements* must be complete. Per M0-R0 reconciliation (C1–C3 applied), FR-POSE-007a, FR-POSE-009a, and FR-AIFC-001–009 are M0 (FR-POSE-007b, FR-POSE-009b are M1) and are included here (items #11, #12, #13) — they are **not** deferred to M1.

| # | Item | Finding | SRS Requirement | Why REQUIRED_M0 |
|---|------|---------|-----------------|-----------------|
| 8 | Wire camera-to-analysis pipeline | F-HI-01 | SRS §54.1 M0 purpose: "prove that the core on-device computer-vision concept and native-to-engine architecture are technically viable" | Live camera → analysis → feedback path not connected. Required to prove the M0 architecture. |
| 9 | Fix camera active state (lifecycle, not permission) | F-HI-05 | Camera lifecycle state machine; SRS architecture boundary | Camera active whenever permission granted, not when lifecycle = `preview_active`. Violates state machine. |
| 10 | Network instrumentation (M0-ENG-002) | F-HI-03 | M0-ENG-002: "Instrumented network capture SHALL show zero raw camera-frame/video bytes" | SRS requires **instrumented** capture; code-level "basic verification" is insufficient. |
| 11 | FR-POSE-007a conformance suite (FR-POSE-007b → M1) | F-LO-02 | FR-POSE-007 split by C1: FR-POSE-007a (M0) requires the active M0 provider to pass the canonical conformance suite; FR-POSE-007b (M1) covers provider replacement before production release. | SRS tags FR-POSE-007a M0; active M0 provider (MediaPipe) must pass the canonical conformance suite as M0 technical validation. (C1 split applied 2026-08-10.) |
| 12 | FR-POSE-009a model integrity (FR-POSE-009b → M1) | F-LO-02 | FR-POSE-009 split by C2: FR-POSE-009a (M0) versioned + integrity-checked against profile manifest; FR-POSE-009b (M1) verified against signed application manifest at release. | SRS tags FR-POSE-009a M0; already covered by FR-VERSION-001 / NFR-SEC-007. (C2 split applied 2026-08-10.) |
| 13 | FR-AIFC lifecycle state machine | F-LO-03 | FR-AIFC-001–009 (M0) | Core M0 privacy/correctness invariant. Lifecycle state machine is the camera/engine boundary. Deferral is not justified. |
| 14 | Fix normalizeRotation silent data corruption | F-MD-01 | FR-POSE-002 (provider maps to canonical); adapter correctness | Non-standard rotations silently mapped to 0. Once pipeline is wired (Item 8), raw camera data flows through this path. Must fix before live data. |
| 15 | Fix clamp NaN propagation | F-MD-02 | M0-F evidence claims NaN safety; normalization correctness | `clamp(NaN, 0, 1)` returns NaN. Once pipeline is wired (Item 8), unvalidated data could reach normalization. Must fix before live data. |
| 23 | M0-C Stage 3 re-verification (person in frame) | F-MD-04 | M0-ENG-006 device evidence; SRS §54.1 "physical-device evidence is reviewed" | First (and only) Stage 3 result had zero landmarks. Device evidence is incomplete without actual pose data. |

### 2.3 M1_CARRY_OVER (4 items)

These are genuinely forward-looking, non-SRS-M0-mandatory items that can be deferred to M1 without undermining the M0 proof-of-architecture objective. NOTE: per M0-R0 reconciliation, no SRS-M0-tagged requirement is deferred here — items #11, #12, #13 (FR-POSE-007, FR-POSE-009, FR-AIFC-001–009) are REQUIRED_M0 (§2.2).

| # | Item | Finding | SRS Tag | Why Deferrable |
|---|------|---------|---------|----------------|
| 3 | Secondary Android device testing | F-CR-02 (related) | M0-ENG-006 "representative... devices" | SRS requires iOS + Android (one each). A second Android is robustness, not a gate precondition. |
| 16 | Fix replay simulator mode bug | F-MD-03 | N/A (tooling) | Mode tracking incorrect but does not affect determinism of emitted observations. Non-critical. |
| 20 | Extend benchmark pipeline (fault + feedback) | F-LO-04 | N/A (evidence quality) | Benchmark stops at rep detection. Extending to fault/feedback improves coverage but pipeline correctness is proven through unit tests. |
| 22 | Device-side fixture capture workflow | N/A (new) | N/A | On-device fixture recording/export. New capability, not an M0 requirement. |

### 2.4 CLEANUP (4 items)

| # | Item | Finding | Nature |
|---|------|---------|--------|
| 17 | Fix EBUSY prebuild instability | F-MD-05 | Windows filesystem lock on `expo prebuild --clean`. Tooling defect. |
| 18 | Fix format gate on generated artifacts | F-MD-06 | Prettier scans `android/build` artifacts. CI hygiene. |
| 19 | Correct gate report traceability | F-HI-02 | "FR-BENCH-001 through 004" don't exist in SRS. Documentation fabrication. — **R1-corrected**: all live planning/traceability now references the real SRS IDs (FR-TRANSPORT-001–006, NFR-PERF-004–008). The historical gate report's FR-BENCH references are preserved with a superseded banner, not rewritten. |
| 21 | Extract getEffectiveKneeAngle | F-LO-01 | Duplicated 3× in phaseMachine, repDetection, faults. DRY violation. |

---

## 3. R1–R5 Remediation DAG

### 3.1 DAG Overview

```
R0: Requirement Reconciliation ──> R1: Decision Foundation ──┐
  (governance, no code)                                       │
                                                              ├──> R3: Device Evidence Collection ──> R4: ADR-016 Acceptance ──> R5: Gate Re-evaluation
R0: Requirement Reconciliation ──> R2: Pipeline & Code ──────┘     (measurement)          (evidence)              (FULL PASS / REQUEST CHANGES)
  (governance, no code)                                       │
                                                              │
```

R0 must complete before R1–R5. R1 and R2 run in **parallel** (both depend only on R0). R3 depends on R1 + R2. R4 depends on R3. R5 depends on R4. **Target: M0 FULL PASS** (no conditional-pass track — see §6 and `docs/reviews/M0-R0-REQUIREMENT-RECONCILIATION.md` §4 Q2/Q3).

### 3.2 Phase Details

#### R0: Requirement Reconciliation (governance)

| Attribute | Value |
|-----------|-------|
| Items | M0-R0 review approval; classification (§2) + R0–R5 DAG settled; planning-doc corrections C4/C5 applied |
| Classification | Governance |
| Device required | No |
| Code changes | No |
| Dependencies | None — starting point |
| Unblocks | R1–R5 (authoritative requirement baseline must be settled before implementation) |

> **Status (2026-08-10):** R0 fully approved — C1–C5 applied. C4 (gate-checklist binary FULL PASS/REQUEST CHANGES) and C5 (Item 6 scope = Option A + every viable B–D candidate, with recorded technical evidence for any exclusion) applied. SRS split FR-POSE-007/009 (FR-POSE-007a/FR-POSE-009a M0; FR-POSE-007b/FR-POSE-009b M1); FR-AIFC-001–009 confirmed M0. Revised 6/9/4/4 classification and R0–R5 DAG adopted.

#### R1: Decision Foundation & Documentation

| Attribute | Value |
|-----------|-------|
| Items | 7, 1a (ADR-005), 1b (ADR-012), 19 |
| Classification | GATE_BLOCKER (7, 1a, 1b), CLEANUP (19) |
| Device required | No |
| Code changes | No |
| Dependencies | R0 (reconciliation approved) |
| Unblocks | R3 (targets must exist before measurement), R4 (ADR-005/012 must be accepted) |

**Work items:**

1. **Define pre-approved ADR-016 benchmark targets** (Item 7, GATE_BLOCKER)
   - Numerical thresholds for: effective observation rate, p95 end-to-end latency, JS responsiveness, overlay smoothness, thermal trend
   - Must be approved BEFORE measurement (SRS: "targets SHALL be approved... before measurement; implementation agents SHALL NOT choose them after seeing results")
   - Output: Updated ADR-016 with target table

2. **Accept ADR-005** (Item 1a, GATE_BLOCKER)
   - Review states: "Accept ADR-005 and ADR-012 (these have sufficient evidence for acceptance)"
   - Change status from `PROPOSED` to `ACCEPTED` with decision rationale and evidence references
   - Output: ADR-005 status change

3. **Accept ADR-012** (Item 1b, GATE_BLOCKER)
   - Same as ADR-005 — sufficient evidence exists
   - Output: ADR-012 status change

4. **Correct gate report traceability** (Item 19, CLEANUP)
   - Replace "FR-BENCH-001 through FR-BENCH-004" with actual SRS requirement IDs (FR-TRANSPORT-001–006, NFR-PERF-004–008)
   - Output: Corrected `m0-gate-report.md`

---

#### R2: Pipeline Integration & Code Safety

| Attribute | Value |
|-----------|-------|
| Items | 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21 |
| Classification | REQUIRED_M0 (8, 9, 11, 12, 13, 14, 15), M1_CARRY_OVER (16, 20), CLEANUP (17, 18, 21) |
| Device required | No |
| Code changes | Yes |
| Dependencies | R0 (requirements settled) |
| Unblocks | R3 (pipeline must be wired before device testing is meaningful; EBUSY must be fixed for reliable builds) |

> **Note:** Items 11/12/13 (FR-POSE-007 conformance, FR-POSE-009 integrity/versioning, FR-AIFC lifecycle) were wrongly deferred to M1 in the prior plan. They are now implemented in R2 as REQUIRED_M0.

**Work items (ordered by internal dependency):**

1. **Fix clamp NaN safety** (Item 15, REQUIRED_M0) — add `Number.isFinite` guard in `normalization.ts`
2. **Fix normalizeRotation** (Item 14, REQUIRED_M0) — reject or log non-standard rotations in `poseEventAdapters.ts`
3. **Wire camera-to-analysis pipeline** (Item 8, REQUIRED_M0) — connect `CameraPreviewScreen.tsx` through: adapter → validation → normalization → metrics → phase → rep → fault → feedback
   - Items 14 and 15 are prerequisites: the pipeline must be safe before live data flows through it
4. **Fix camera active state** (Item 9, REQUIRED_M0) — change `active={state.permission === 'granted'}` to `active={state.lifecycle === 'preview_active'}`
   - Should be done alongside Item 8 since both touch `CameraPreviewScreen.tsx`
5. **FR-AIFC lifecycle state machine** (Item 13, REQUIRED_M0) — implement full explicit lifecycle model (FR-AIFC-001–009): single current state + machine-readable cause; phase/rep advancement only in `ACTIVE`; frame-resource release on terminal states; no raw-frame/landmark persistence
6. **FR-POSE-007 conformance suite** (Item 11, REQUIRED_M0) — ensure canonical conformance fixture suite exists and the active M0 provider (MediaPipe) passes it as M0 technical validation
7. **FR-POSE-009 model integrity/versioning** (Item 12, REQUIRED_M0) — version model files and integrity-check against profile manifest, failing safely to manual mode; align with FR-VERSION-001 / NFR-SEC-007
8. **Fix EBUSY prebuild** (Item 17, CLEANUP) — resolve Windows filesystem lock or document workaround
   - Prerequisite for reliable device builds in R3
9. **Fix format gate** (Item 18, CLEANUP) — configure Prettier/ESLint ignore patterns for `apps/mobile/android/` and `apps/mobile/modules/*/android/build/`
10. **Fix replay simulator mode bug** (Item 16, M1_CARRY_OVER) — fix `play()`/`step()` mode race
11. **Extend benchmark pipeline** (Item 20, M1_CARRY_OVER) — add fault detection + feedback selection to benchmark harness
12. **Extract getEffectiveKneeAngle** (Item 21, CLEANUP) — deduplicate to shared utility

---

#### R3: Device Evidence Collection

| Attribute | Value |
|-----------|-------|
| Items | 2, 4, 5, 6, 10, 23 |
| Classification | GATE_BLOCKER (2, 4, 5, 6), REQUIRED_M0 (10, 23) |
| Device required | Yes — iOS + Android |
| Code changes | No (measurement only; pipeline from R2 is the code under test) |
| Dependencies | R1 (targets defined), R2 (pipeline wired, EBUSY fixed) |
| Unblocks | R4 (evidence needed for ADR-016 acceptance and M0-ENG pass) |

**Work items:**

1. **M0-C Stage 3 re-verification** (Item 23, REQUIRED_M0) — run with person in frame to produce actual landmarks
   - Do this first: it's the fastest device task and validates the pipeline from R2
2. **iOS device testing** (Item 2, GATE_BLOCKER) — run full pipeline on at least one iOS device
   - Requires pipeline from R2 to be wired
3. **Sustained device tests** (Item 4, GATE_BLOCKER) — sustained sessions on iOS + Android
   - Verify: no crash, no runaway memory, no unrecoverable camera state, acceptable thermal
4. **Thermal/battery/background measurement** (Item 5, GATE_BLOCKER) — collect real-device thermal trend, battery trend, background behavior
   - Measure against R1 targets
5. **ADR-016 candidate comparison** (Item 6, GATE_BLOCKER) — benchmark **Option A + every viable B–D candidate**, with recorded technical evidence for any exclusion (Options B/C/D)
   - On iOS/Android matrix
   - FR-TRANSPORT-001 requires Option A plus every viable B–D candidate; excluding any candidate requires recorded technical evidence, not schedule preference.
6. **Network instrumentation** (Item 10, REQUIRED_M0) — instrumented network capture during active camera session
   - M0-ENG-002: verify zero raw camera-frame bytes leave device

---

#### R4: ADR-016 Acceptance & Evidence Assembly

| Attribute | Value |
|-----------|-------|
| Items | 1c (ADR-016 acceptance) + evidence assembly |
| Classification | GATE_BLOCKER |
| Device required | No (documentation, using R3 evidence) |
| Code changes | No |
| Dependencies | R3 (all device evidence collected) |
| Unblocks | R5 (gate re-evaluation needs accepted ADRs + complete evidence) |

**Work items:**

1. **Accept ADR-016** (Item 1c, GATE_BLOCKER)
   - Document measured evidence (from R3)
   - Document rejected alternatives (from R3 candidate comparison)
   - Document maintenance/cross-platform consequences
   - Document revisit trigger
   - Change status from `PROPOSED` to `ACCEPTED`
2. **Assemble M0-ENG-006 evidence** — sustained test results, crash/memory/thermal verification
3. **Assemble M0-ENG-007 evidence** — observation rate, p95 latency, JS responsiveness, overlay smoothness, thermal trend vs. targets
4. **Assemble M0-ENG-008 evidence** — cross-platform profile conformance, maintainability/diagnosability assessment
5. **Assemble FR-TRANSPORT-001/002/003 evidence** — candidate comparison results, semantic conformance, instrumented metrics
6. **Assemble NFR-PERF-004/005/006/008 evidence** — device measurement results

---

#### R5: Gate Re-evaluation & M1_CARRY_OVER Freeze

| Attribute | Value |
|-----------|-------|
| Items | Gate re-evaluation + M1 carry-over freeze |
| Classification | Process |
| Device required | No |
| Code changes | No |
| Dependencies | R4 (all ADRs accepted, all evidence assembled) |
| Unblocks | M1 start (if gate passes) |

**Work items:**

1. **Re-run gate checklist** with corrected evidence and traceability (from R1 Item 19). Gate states are binary (see `m0-gate-checklist.md`): **FULL PASS** or **REQUEST CHANGES**.
2. **Final gate decision** — FULL PASS or REQUEST CHANGES (no conditional pass)
   - FULL PASS if: all mandatory M0 requirements complete (incl. REQUIRED_M0 items 8, 9, 10, 11, 12, 13, 14, 15, 23), ADRs-005/012/016 accepted with measurements, M0-ENG-001–008 pass, basic privacy verification passes, and Squat fixture/replay/physical-device evidence is reviewed.
   - REQUEST CHANGES otherwise (requires architecture revision, not exercise expansion).
3. **Freeze M1 carry-over list (M1_CARRY_OVER):**
   - Item 3: Secondary Android device testing
   - Item 16: Fix replay simulator mode bug
   - Item 20: Extend benchmark pipeline
   - Item 22: Device-side fixture capture workflow
4. **Update M0-GATE-001 evidence files** — `m0-gate-report.md`, `runtime-benchmark.md`, `privacy-verification.md`

---

## 4. Dependency Edges (DAG Adjacency List)

```
R0 ──> R1     (requirements settled before decision foundation)
R0 ──> R2     (requirements settled before code work)

R1 ──> R3     (targets must exist before measurement)
R1 ──> R4     (ADR-005/012 must be accepted before gate re-eval)

R2 ──> R3     (pipeline must be wired; EBUSY fixed for reliable builds)

R3 ──> R4     (device evidence needed for ADR-016 acceptance)

R4 ──> R5     (all ADRs accepted + evidence assembled before gate re-eval)
```

**Parallelism:** R1 ∥ R2 (both depend only on R0).

**Critical path:** R0 → R1 → R3 → R4 → R5 (R2 joins at R3)

**R2 internal ordering:**
```
Item 15 (clamp) ──┐
Item 14 (rotation)┼──> Item 8 (wire pipeline) ──> Item 9 (camera active)
                  │
Item 17 (EBUSY)   ──> (unblocks R3 builds)
Item 18 (format)  ──> (independent)
Item 16 (replay)  ──> (independent)
Item 20 (benchmark)──> (independent)
Item 21 (kneeAngle)──> (independent)
```

**R3 internal ordering:**
```
Item 23 (Stage 3)  ──> (validates R2 pipeline on device, fastest)
Item 2  (iOS)      ──> Item 4 (sustained) ──> Item 5 (thermal)
Item 6  (candidates)──> (can run in parallel with sustained tests)
Item 10 (network)  ──> (can run in parallel)
```

---

## 5. Classification Summary

| Category | Count | Items |
|----------|-------|-------|
| GATE_BLOCKER | 6 | 1, 2, 4, 5, 6, 7 |
| REQUIRED_M0 | 9 | 8, 9, 10, 11, 12, 13, 14, 15, 23 |
| M1_CARRY_OVER | 4 | 3, 16, 20, 22 |
| CLEANUP | 4 | 17, 18, 19, 21 |
| **Total** | **23** | |

| Phase | Items | GATE_BLOCKER | REQUIRED_M0 | M1_CARRY_OVER | CLEANUP |
|-------|-------|-------------|-------------|---------------|---------|
| R0 | governance | — | — | — | — |
| R1 | 4 | 3 | 0 | 0 | 1 |
| R2 | 12 | 0 | 7 | 2 | 3 |
| R3 | 6 | 4 | 2 | 0 | 0 |
| R4 | 1+ | 1 | 0 | 0 | 0 |
| R5 | 0 | 0 | 0 | 0 | 0 |

---

## 6. Path to M0 FULL PASS

> M0-GATE-001 is binary: **FULL PASS** or **REQUEST CHANGES**. There is no conditional-pass track (removed per M0-R0 reconciliation C4/Q2/Q3). The target is M0 FULL PASS.

- R0 complete (reconciliation approved; classification + DAG settled)
- R1 complete (targets defined, ADR-005/012 accepted, traceability corrected)
- R2 complete (items 8, 9, 11, 12, 13, 14, 15 — pipeline wired, camera fixed, FR-AIFC/FR-POSE implemented, safety bugs fixed; plus CLEANUP 17, 18, 21)
- R3 complete (items 2, 4, 5, 6, 10, 23 — iOS tested, sustained tests, thermal measured, every viable B–D candidate compared, network instrumented, Stage 3 re-verified with landmarks)
- R4 complete (ADR-016 accepted with documented evidence + revisit trigger; all M0-ENG/FR-TRANSPORT/NFR-PERF evidence assembled)
- R5 gate re-evaluation → FULL PASS (all mandatory M0 requirements complete, ADRs accepted with measurements, M0-ENG-001–008 pass, basic privacy verification passes, Squat fixture/replay/physical-device evidence reviewed)

---

## 7. SRS-Tagged M0 Requirements — Reconciliation Outcome

Per `docs/reviews/M0-R0-REQUIREMENT-RECONCILIATION.md`, the SRS is authoritative. **No SRS-M0-tagged requirement is deferred.** Items #11, #12, #13 (FR-POSE-007, FR-POSE-009, FR-AIFC-001–009) are classified **REQUIRED_M0** in §2.2.

| Item | SRS Requirement | SRS Tag | Reconciliation outcome |
|------|----------------|---------|------------------------|
| 11 | FR-POSE-007a (conformance suite); FR-POSE-007b (M1) | M0 / M1 | REQUIRED_M0 (FR-POSE-007a). Active M0 provider (MediaPipe) must pass the canonical conformance suite. FR-POSE-007b is M1. (C1 split applied 2026-08-10.) |
| 12 | FR-POSE-009a (model integrity); FR-POSE-009b (M1) | M0 / M1 | REQUIRED_M0 (FR-POSE-009a). Versioning + integrity-check already M0 via FR-VERSION-001 / NFR-SEC-007. (C2 split applied 2026-08-10.) |
| 13 | FR-AIFC-001–009 (lifecycle) | M0 | REQUIRED_M0. Core M0 privacy/correctness invariant; deferral not justified. |

**Note:** SRS amendments C1–C3 (formal requirement splits/clarifications) are **applied** as of 2026-08-10 (R0 fully approved). FR-POSE-007/009 are split (FR-POSE-007a/FR-POSE-009a M0; FR-POSE-007b/FR-POSE-009b M1); FR-AIFC-001–009 remain mandatory M0. See `docs/evidence/M0-R0-APPLIED.md`.
