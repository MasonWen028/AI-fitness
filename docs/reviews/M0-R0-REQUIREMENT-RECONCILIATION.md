# M0-R0 — Scope & Requirement Reconciliation Review

| Field | Value |
|-------|-------|
| Review type | Requirements-governance reconciliation (independent) |
| Phase | M0-R0 (precedes R1–R5) |
| Date | 2026-08-10 |
| Reviewer | Independent (requirements governance) |
| Source documents | SRS v0.2.0 (priority 1), Architecture docs (2), ADRs (3), M0-GATE-001 definition (4), M0 Final Architecture & Evidence Review (5), M0 Remediation Plan (6) |
| Mode | Planning / governance only — **no code, SRS, ADR, test, or evidence changes applied** |
| Default gate target | **M0 FULL PASS** (conditional-pass track removed) |

> This review performs scope and requirement reconciliation only. It does not modify the SRS, ADRs, production code, tests, or evidence. All proposed changes in §5 are **proposed** and await explicit approval. The lower-priority remediation plan (priority 6) MUST NOT silently override the SRS (priority 1).

---

## 1. Governance Finding (the trigger)

The M0 Remediation Plan (`docs/planning/m0/m0-remediation-plan.md`, §2.3 and §7) classified these SRS-**M0-tagged** requirements as **Legitimate M1 Carry-over**:

- **FR-POSE-007** — "A provider replacement SHALL pass the canonical conformance fixture suite before release." (SRS milestone map: `FR-POSE-001–009 | M0`)
- **FR-POSE-009** — "Model files SHALL be integrity checked, versioned and compatible with the signed application/profile manifest." (SRS milestone map: `FR-POSE-001–009 | M0`)
- **FR-AIFC-001 through FR-AIFC-009** — lifecycle state machine (SRS milestone map: `FR-AIFC-001–009 | M0`)

The SRS milestone mapping table tags all three ranges as **M0**. A priority-6 planning document reclassifying priority-1 SRS requirements to M1 **without an SRS amendment** is a silent override of the authoritative source. This violates the stated source-priority hierarchy and the instruction *"A lower-priority planning document MUST NOT silently override the SRS."*

**Conclusion:** Until the SRS is amended, these requirements remain **M0**. The remediation plan's M1 classification for items #11, #12, #13 is invalid and is corrected in §6.

---

## 2. Authoritative Source Priority Applied

1. **SRS** (v0.2.0) — normative requirements, milestone mapping, M0-GATE-001.
2. **Architecture documents** (`docs/architecture/*`) — boundary intent, lifecycle definition.
3. **ADRs** (`docs/architecture/adr/*`) — accepted/required decisions.
4. **M0-GATE-001 definition** (SRS §54.1, line 1959).
5. **M0 Final Architecture & Evidence Review** (forensic gate review).
6. **M0 Remediation Plan** (priority 6 — lowest; must not override 1–5).
7. **Existing implementation/evidence** — only to understand requirement *intent*.

When a lower-priority source conflicts with a higher-priority source, the higher-priority source wins. The remediation plan (6) cannot override the SRS (1).

---

## 3. Disputed Requirements — Independent Determination

### 3.1 FR-POSE-007

| Field | Value |
|-------|-------|
| **Requirement ID** | FR-POSE-007 |
| **Current SRS wording** | "A provider replacement SHALL pass the canonical conformance fixture suite before release." |
| **Current milestone** | M0 (SRS milestone map: `FR-POSE-001–009 \| M0 \| ADR-005, ADR-012, ADR-016`) |
| **Original architectural intent** | The SRS mandates a provider-neutral `PoseObservation` boundary (FR-POSE-002). The canonical conformance fixture suite is the evidence that a provider's output maps correctly to canonical semantics. ADR-005 states the provider "must not silently change portable exercise semantics" and lists FR-POSE-007 as a related requirement. The suite is the M0 technical-validation evidence (provider-mapping.md: "M0-D adds contract validation and conformance testing"). |
| **Necessary to prove M0 architecture?** | **Partially.** The canonical conformance fixture *suite* must exist and the *active M0 provider* (MediaPipe) must pass it — that is M0 technical validation. The phrase "provider **replacement**" and "before **release**" describe a future event: M0 uses a single provider and is not a public release. The M0-testable core (active provider passes suite) is necessary; the provider-replacement-before-release aspect is not. |
| **Dependency on M0-GATE-001** | Tagged M0 → presumed mandatory *unless* its own text contains a deferral qualifier. "Before release" is a qualifier, but M0 is technical validation, not a release. Ambiguous as written. |
| **Risk of deferral** | Low for M0 architecture proof (single provider; suite is M0-D scope). High if the *active provider* is not validated against the suite (would leave the provider boundary unverified). |
| **Architecture impact** | None on current M0 architecture. The provider boundary and suite already exist. |
| **Gate impact** | Strict reading blocks the gate until the active provider passes the conformance suite (which is M0-D scope and should be done). |
| **Recommended classification** | **CLARIFY** → split: FR-POSE-007a **KEEP_M0** (suite exists + active provider passes it in M0); FR-POSE-007b **MOVE_TO_M1** (any future provider replacement passes before production release). |
| **SRS amendment required?** | **Yes** — split the requirement. |
| **ADR amendment required?** | ADR-005 (PROPOSED) references FR-POSE-007; clarify on acceptance. No standalone ADR change needed if ADR-005 is accepted with the split wording. |

### 3.2 FR-POSE-009

| Field | Value |
|-------|-------|
| **Requirement ID** | FR-POSE-009 |
| **Current SRS wording** | "Model files SHALL be integrity checked, versioned and compatible with the signed application/profile manifest." |
| **Current milestone** | M0 (SRS milestone map: `FR-POSE-001–009 \| M0`) |
| **Original architectural intent** | Model artifacts must be integrity-checked and versioned, compatible with the signed app/profile manifest. This is production supply-chain security. security-privacy.md §M0 Focus lists *"artifact integrity path design"* (design, not full enforcement) as M0; full enforcement is M1/V1. |
| **Necessary to prove M0 architecture?** | **Yes for the versioning + integrity-check aspects** — but those are *already* M0 via other requirements: FR-VERSION-001 (M0: "Every persisted AI analysis SHALL contain the exact versions required to reproduce its logic") and NFR-SEC-007 (M0: "Profile/model manifests SHALL be integrity checked and SHALL fail safely when signature/hash or compatibility is invalid"). Only *"compatible with the signed application manifest"* (app-store signing) is a release concern. |
| **Dependency on M0-GATE-001** | Tagged M0. Its M0-testable parts (versioning, integrity check) are *already mandatory M0* via FR-VERSION-001 and NFR-SEC-007. |
| **Risk of deferral** | Low. Integrity-check *path* is designed in M0; enforcement against the *signed app manifest* is M1/V1. No M0 architecture risk. |
| **Architecture impact** | None on M0 architecture. |
| **Gate impact** | Strict reading blocks the gate, but the blocking parts (versioning, integrity) are already satisfied by FR-VERSION-001 / NFR-SEC-007. |
| **Recommended classification** | **CLARIFY** → split: FR-POSE-009a **KEEP_M0** (model files versioned + integrity-checked against profile manifest, fail-safe to manual); FR-POSE-009b **MOVE_TO_M1** (verified against signed application manifest at release). |
| **SRS amendment required?** | **Yes** — clarify/split to remove overlap with FR-VERSION-001 / NFR-SEC-007 and isolate the release-signing aspect. |
| **ADR amendment required?** | ADR-005 (PROPOSED) references FR-POSE-009; clarify on acceptance. No standalone change needed. |

### 3.3 FR-AIFC-001 through FR-AIFC-009

| Field | Value |
|-------|-------|
| **Requirement ID** | FR-AIFC-001 … FR-AIFC-009 |
| **Current SRS wording** | (1) explicit state model w/ single current state + machine-readable cause; (2) phase/rep/rule advancement only in `ACTIVE`; (3) `TRACKING_LOST` removes stale cues, retains set, requires stable reacquisition; (4) denial/unavailable/recoverable/terminal errors offer `MANUAL_FALLBACK` without losing set; (5) `COUNTDOWN` records no reps, returns to setup/pause on invalidation; (6) `SET_COMPLETE`/`MANUAL_FALLBACK`/terminal `ERROR` release raw frame resources + stop inference; (7) recovery persistence limited to identifiers/state/versions, no raw frames/landmark stream; (8) analytics use allowlisted codes, no image/landmark payloads; (9) tests cover every permitted transition + prove every unspecified transition rejected. |
| **Current milestone** | M0 (SRS milestone map: `FR-AIFC-001–009 \| M0 \| ADR-012, ADR-016`) |
| **Original architectural intent** | The AI Form Check lifecycle state machine **is** the camera/engine boundary — a core M0 architectural component. mobile-architecture.md defines it explicitly (13 states: `UNAVAILABLE` … `MANUAL_FALLBACK`). FR-AIFC-002 (phase/rep only in `ACTIVE`) and FR-AIFC-006/007 (terminal states release frame resources; no raw-frame/landmark persistence) are the M0 **privacy and correctness invariants**. FR-CAMERA-001–009 (also M0) overlaps: "Physical-device lifecycle/privacy tests." |
| **Necessary to prove M0 architecture?** | **Yes — unambiguously.** Without the lifecycle correctly implemented and wired, the camera can be active when it should not be (privacy violation of the "Camera frame → local processing → discard" invariant, security-privacy.md) and phase/rep can advance in wrong states (correctness). This is exactly the M0 proof-of-architecture objective. |
| **Dependency on M0-GATE-001** | Direct. M0-GATE-001 requires "basic privacy verification passes" — satisfied only if FR-AIFC-006/007 hold (frame resources released, no raw persistence). Architecture viability requires FR-AIFC-002 (phase/rep only in `ACTIVE`). |
| **Risk of deferral** | **High.** Deferring AIFC to M1 would leave M0 without its core privacy/correctness boundary. The review's F-LO-03 (LOW, not-blocking) is a *pragmatic under-assessment*; per the SRS it is M0 and mandatory. |
| **Architecture impact** | Core M0 component. Partially implemented (review F-HI-05: `CameraPreviewScreen` keys camera-active off *permission* state, not *lifecycle* state). |
| **Gate impact** | Mandatory M0 prerequisite of M0-GATE-001. Cannot be deferred without an SRS amendment. |
| **Recommended classification** | **KEEP_M0** (all 9). No deferral justified. |
| **SRS amendment required?** | **No** — correctly M0. Optional clarifying note: M0 implementation must cover the full explicit state model; any specific state deferred to M1 must be documented with explicit SRS/ADR rationale. |
| **ADR amendment required?** | ADR-012 (PROPOSED) references FR-AIFC-001–009; when accepted, confirm AIFC lifecycle is in M0 scope. No standalone change needed. |

---

## 4. Governance Questions Resolved

### Q1 — Is every SRS requirement tagged M0 automatically a prerequisite of M0-GATE-001?

**No — not automatically.** M0-GATE-001 (SRS §54.1) requires *"all **mandatory** M0 requirements are complete"* (emphasis added). The word *mandatory* is a deliberate qualifier. An M0-tagged requirement is presumed mandatory **unless its own text contains a conditional qualifier that defers enforcement to a later milestone** (e.g., "before release," "if the approved provider offers multiple model tiers," "M1 primary navigation").

Applied to the disputed requirements:
- **FR-POSE-007** — "before release" qualifier → the *provider-replacement* aspect is deferred to release (M1/V1); the *suite-exists + active-provider-passes* aspect is M0.
- **FR-POSE-009** — no deferral qualifier in text, and its M0-testable parts are already mandated via FR-VERSION-001 / NFR-SEC-007 → mandatory M0.
- **FR-AIFC-001–009** — no deferral qualifier → mandatory M0.

**Determination:** An M0-tagged requirement is a prerequisite of M0-GATE-001 unless its own wording provides a deferral qualifier. The gate's use of "mandatory" (not "all M0-tagged") deliberately permits this.

### Q2 — Does M0-GATE-001 legally permit CONDITIONAL PASS under current SRS wording?

**No.** M0-GATE-001 is binary: *"No additional AI-supported exercise SHALL be implemented until all mandatory M0 requirements are complete… and M0-ENG-001 through M0-ENG-008 pass."* There is no conditional language. A full-text search of the SRS confirms **no "conditional pass" concept exists** (only "conditional update" at §NFR-CICD-004 and "FUTURE conditional"). The SRS §54.1 exit rule states failing evidence *"requires architecture revision, not exercise expansion"* — mandating revision, not a partial pass.

**Determination:** CONDITIONAL PASS is **not authorized** by the current SRS. It exists only in the lower-priority gate checklist (priority 4). Unless the SRS is amended to add a conditional-pass path, M0-GATE-001 is binary: **FULL PASS or REQUEST CHANGES**.

### Q3 — Does the gate checklist's Conditional Pass concept conflict with the higher-priority SRS?

**Yes.** M0-GATE-001 (SRS, priority 1) requires completeness of mandatory M0 requirements. The gate checklist (priority 4, planning doc) permits *"remaining issues"* if *"not blockers for completing the M0 proof-of-architecture objective."* These are incompatible: one requires all mandatory requirements complete; the other permits incompleteness with caveats. Per source priority, the SRS wins.

**Determination:** The gate checklist's Conditional Pass concept **conflicts with and is overridden by** M0-GATE-001. It must be removed or explicitly reconciled via SRS amendment. The remediation plan's *"Minimum for CONDITIONAL PASS"* section (built on this concept) is therefore unauthorized.

### Q4 — Must M0-ENG-001 through M0-ENG-008 all PASS before M0 can close?

**Yes.** M0-GATE-001 explicitly states *"M0-ENG-001 through M0-ENG-008 pass."* All eight must pass. The interpretation of "pass" (code-level vs. instrumented) should be clarified, but the binary requirement stands. Specifically, **M0-ENG-002**'s SHALL — *"Instrumented network capture SHALL show zero raw camera-frame/video bytes"* — requires **instrumented** capture, not merely code-level "basic verification." So M0-ENG-002 must PASS with instrumented evidence (remediation item #10).

**Determination:** All 8 M0-ENG criteria must pass before M0 closes. M0-ENG-002 requires instrumented network capture evidence.

### Q5 — Does FR-TRANSPORT-001 require Option A + every B–D candidate, or Option A + every VIABLE B–D candidate?

**Option A + every VIABLE B–D candidate.** FR-TRANSPORT-001 wording: *"benchmark option A plus every **viable** B–D candidate… Excluding a candidate SHALL require recorded technical evidence, not schedule preference alone."* "Viable" = technically feasible. Exclusion requires recorded technical evidence.

The remediation plan Item 6 ("ADR-016 candidate comparison (Option A + **at least one alternative**)") **understates** the requirement. It must be corrected to *"Option A + every viable B–D candidate, with recorded technical evidence for any exclusion."*

**Determination:** FR-TRANSPORT-001 = Option A + every viable B–D candidate. Remediation Item 6 is corrected accordingly (see C5).

---

## 5. Proposed Requirement Change Set

> All changes below are **proposed**. None are applied in this review. Each requires explicit approval before application.

### C1 — FR-POSE-007 split (SRS amendment)

- **Requirement:** FR-POSE-007
- **Old wording:** "A provider replacement SHALL pass the canonical conformance fixture suite before release."
- **Proposed wording:**
  - **FR-POSE-007a (M0):** "The canonical conformance fixture suite SHALL exist for M0 and the active M0 pose provider SHALL pass it as part of M0 technical validation."
  - **FR-POSE-007b (M1):** "Any provider replacement SHALL pass the canonical conformance fixture suite before production release."
- **Reason:** Requirement conflates an M0 concern (suite exists + active provider passes) with an M1 concern (provider *replacement* before *release*). M0 is technical validation, not a release.
- **Evidence:** SRS FR-POSE-007; provider-mapping.md ("M0-D adds contract validation and conformance testing"); ADR-005 ("provider conformance before release").
- **Architecture consequence:** None. Provider-neutral boundary unchanged.
- **Risk:** Low. Clarifies scope without weakening any invariant.
- **Gate consequence:** FR-POSE-007a becomes a mandatory M0 requirement (KEEP_M0). FR-POSE-007b moves to M1.

### C2 — FR-POSE-009 split/clarify (SRS amendment)

- **Requirement:** FR-POSE-009
- **Old wording:** "Model files SHALL be integrity checked, versioned and compatible with the signed application/profile manifest."
- **Proposed wording:**
  - **FR-POSE-009a (M0):** "Model files SHALL be versioned and integrity-checked against their profile manifest, failing safely to manual mode on mismatch." (aligns with FR-VERSION-001 + NFR-SEC-007)
  - **FR-POSE-009b (M1):** "Model files SHALL be compatible with and verified against the signed application manifest at release."
- **Reason:** "Versioned" and "integrity checked" are already M0 via FR-VERSION-001 and NFR-SEC-007. Only signed-application-manifest compatibility is a release concern.
- **Evidence:** SRS FR-VERSION-001 (M0), NFR-SEC-007 (M0); security-privacy.md M0 Focus ("artifact integrity path design").
- **Architecture consequence:** None.
- **Risk:** Low.
- **Gate consequence:** FR-POSE-009a KEEP_M0. FR-POSE-009b MOVE_TO_M1.

### C3 — FR-AIFC-001–009 confirm M0 (no SRS wording change; optional clarifying note)

- **Requirement:** FR-AIFC-001 through FR-AIFC-009
- **Old wording:** (as written — 9 requirements)
- **Proposed wording:** No change to the 9 requirements. Add clarifying note: *"All FR-AIFC-001–009 are M0. The M0 implementation SHALL cover the full explicit lifecycle state model; any specific state deferred to M1 MUST be documented with explicit SRS/ADR rationale."*
- **Reason:** Core M0 architecture/privacy invariants. The remediation plan's M1 classification was a silent SRS override.
- **Evidence:** SRS FR-AIFC-001–009 (M0); mobile-architecture.md lifecycle state machine (13 states); FR-CAMERA-001–009 (M0) overlap; security-privacy.md privacy invariants (FR-AIFC-006/007).
- **Architecture consequence:** None. Confirms M0 scope.
- **Risk:** None (strengthens M0).
- **Gate consequence:** KEEP_M0. All 9 are mandatory M0 prerequisites of M0-GATE-001.

### C4 — Gate checklist Conditional Pass concept (planning-doc correction, not SRS)

- **Requirement:** `docs/planning/m0/m0-gate-checklist.md` — "Conditional Pass" section
- **Old wording:** "Conditional Pass: Allowed only if… the remaining issues are not blockers for completing the M0 proof-of-architecture objective…"
- **Proposed wording:** Remove the "Conditional Pass" state OR explicitly annotate it as *"NOT authorized by M0-GATE-001 (SRS §54.1) until the SRS is amended."* Gate states become binary: **FULL PASS or REQUEST CHANGES**.
- **Reason:** M0-GATE-001 (SRS, priority 1) is binary. The gate checklist (priority 4) invents a third state not authorized by the SRS (Q2/Q3).
- **Evidence:** SRS M0-GATE-001 binary wording; no "conditional pass" in SRS.
- **Architecture consequence:** None.
- **Risk:** Low. Aligns planning with SRS.
- **Gate consequence:** Removes the "Minimum for CONDITIONAL PASS" track. Default target becomes **M0 FULL PASS**.

### C5 — Remediation plan Item 6 correction (planning-doc correction, not SRS)

- **Requirement:** `docs/planning/m0/m0-remediation-plan.md` — Item 6
- **Old wording:** "ADR-016 candidate comparison (Option A + **at least one alternative**)"
- **Proposed wording:** "ADR-016 candidate comparison (**Option A + every viable B–D candidate**, with recorded technical evidence for any exclusion)"
- **Reason:** FR-TRANSPORT-001 requires "every **viable** B–D candidate," not "at least one alternative" (Q5).
- **Evidence:** SRS FR-TRANSPORT-001; ADR-016 §SRS Constraints ("benchmark option A and every viable B–D candidate").
- **Architecture consequence:** None.
- **Risk:** Low.
- **Gate consequence:** Corrects scope of Gate Blocker Item 6.

---

## 6. Revised Classification of All 23 Remediation Items

The SRS is authoritative. Until C1–C3 are approved, FR-POSE-007, FR-POSE-009, and FR-AIFC-001–009 remain **M0**. Items #11, #12, #13 are therefore moved from M1 Carry-over to **REQUIRED_M0**. The "Legitimate M1 Carry-over" category is relabelled **M1_CARRY_OVER** to match the requested nomenclature.

| # | Item | Old classification | **Revised classification** | Basis |
|---|------|-------------------|---------------------------|-------|
| 1 | Accept ADR-005/012/016 | Gate Blocker | **GATE_BLOCKER** | M0-GATE-001 precondition (F-CR-01) |
| 2 | iOS device testing | Gate Blocker | **GATE_BLOCKER** | M0-ENG-006/008 (F-CR-02/04) |
| 3 | Secondary Android device testing | M1 Carry-over | **M1_CARRY_OVER** | SRS requires iOS + one Android only |
| 4 | Sustained device tests | Gate Blocker | **GATE_BLOCKER** | M0-ENG-006 (F-CR-02) |
| 5 | Thermal/battery/background measurement | Gate Blocker | **GATE_BLOCKER** | M0-ENG-007 (F-CR-03) |
| 6 | ADR-016 candidate comparison | Gate Blocker | **GATE_BLOCKER** | FR-TRANSPORT-001 (F-CR-05); scope corrected to *every viable* B–D |
| 7 | Define pre-approved ADR-016 benchmark targets | Gate Blocker | **GATE_BLOCKER** | M0-ENG-007 (F-CR-03) |
| 8 | Wire camera-to-analysis pipeline | Required M0 | **REQUIRED_M0** | SRS §54.1 M0 purpose; review CONDITIONAL-PASS list |
| 9 | Fix camera active state | Required M0 | **REQUIRED_M0** | Review F-HI-05; lifecycle correctness |
| 10 | Network instrumentation (M0-ENG-002) | Required M0 | **REQUIRED_M0** | M0-ENG-002 SHALL (instrumented capture) |
| 11 | FR-POSE-007 conformance suite | M1 Carry-over | **REQUIRED_M0** | SRS tags M0; C1 splits, M0 part retained |
| 12 | FR-POSE-009 model integrity | M1 Carry-over | **REQUIRED_M0** | SRS tags M0; C2 splits, M0 part (versioning+integrity) retained; already covered by FR-VERSION-001/NFR-SEC-007 |
| 13 | FR-AIFC lifecycle state machine | M1 Carry-over | **REQUIRED_M0** | SRS tags M0; C3 KEEP_M0; core privacy/correctness invariant |
| 14 | Fix normalizeRotation | Required M0 | **REQUIRED_M0** | Review F-MD-01; safety before live data |
| 15 | Fix clamp NaN safety | Required M0 | **REQUIRED_M0** | Review F-MD-02; safety before live data |
| 16 | Fix replay simulator mode bug | M1 Carry-over | **M1_CARRY_OVER** | Review F-MD-03; non-critical |
| 17 | Fix EBUSY prebuild | Cleanup | **CLEANUP** | Review F-MD-05; tooling |
| 18 | Fix format gate | Cleanup | **CLEANUP** | Review F-MD-06; tooling |
| 19 | Correct gate report traceability | Cleanup | **CLEANUP** | Review F-HI-02; documentation |
| 20 | Extend benchmark pipeline | M1 Carry-over | **M1_CARRY_OVER** | Review F-LO-04; coverage improvement |
| 21 | Extract getEffectiveKneeAngle | Cleanup | **CLEANUP** | Review F-LO-01; DRY |
| 22 | Device-side fixture capture workflow | M1 Carry-over | **M1_CARRY_OVER** | New capability; not M0 |
| 23 | M0-C Stage 3 re-verification | Required M0 | **REQUIRED_M0** | Review F-MD-04; device evidence credibility |

### Summary

| Category | Count | Items |
|----------|-------|-------|
| GATE_BLOCKER | 6 | 1, 2, 4, 5, 6, 7 |
| REQUIRED_M0 | 9 | 8, 9, 10, 11, 12, 13, 14, 15, 23 |
| M1_CARRY_OVER | 4 | 3, 16, 20, 22 |
| CLEANUP | 4 | 17, 18, 19, 21 |
| **Total** | **23** | |

**Change vs. prior plan:** items #11, #12, #13 moved M1 Carry-over → REQUIRED_M0 (correcting the silent SRS override). All other items unchanged.

---

## 7. Corrected R0–R5 DAG

### 7.1 Overview

```
R0: Requirement Reconciliation ──> R1: Decision Foundation ──┐
  (governance, no code)                                       │
                                                              ├──> R3: Device Evidence ──> R4: ADR-016 ──> R5: Gate
R0: Requirement Reconciliation ──> R2: Pipeline & Code ──────┘     Collection        Acceptance    Re-evaluation
  (governance, no code)                                       │
                                                              │
```

R0 must complete before R1–R5. R1 and R2 run in parallel (both depend only on R0). R3 depends on R1 + R2. R4 depends on R3. R5 depends on R4. **Target: M0 FULL PASS** (no conditional-pass track).

### 7.2 Phase details

**R0 — Requirement Reconciliation (governance)**
- Items: This review; approval of Change Set C1–C5; SRS/ADR amendments if approved; update remediation plan to revised classification + R0–R5 DAG.
- Device required: No. Code changes: No.
- Dependencies: None — starting point.
- Unblocks: R1–R5 (authoritative requirement baseline must be settled before implementation).
- Gate impact: Establishes that FR-POSE-007/009 (M0 parts) and FR-AIFC-001–009 are mandatory M0; removes unauthorized conditional-pass track.

**R1 — Decision Foundation** (unchanged from prior plan, plus applies approved SRS amendments)
- Items: 7, 1a (ADR-005), 1b (ADR-012), 19.
- Device: No. Code: No.
- Depends on: R0. Unblocks: R3, R4.

**R2 — Pipeline & Code Safety** (expanded: now includes FR-AIFC, FR-POSE-007/009 implementation)
- Items: 8, 9, 11 (FR-POSE-007 conformance), 12 (FR-POSE-009 integrity/versioning), 13 (FR-AIFC lifecycle), 14, 15, 16, 17, 18, 20, 21.
- Device: No. Code: Yes.
- Depends on: R0 (requirements settled). Unblocks: R3.
- Note: Items 11/12/13 were wrongly deferred to M1; they are now explicitly implemented in R2.

**R3 — Device Evidence Collection** (Item 6 scope corrected)
- Items: 2, 4, 5, 6 (Option A + **every viable** B–D candidate), 10, 23.
- Device: Yes (iOS + Android). Code: No (measurement only).
- Depends on: R1 + R2. Unblocks: R4.

**R4 — ADR-016 Acceptance & Evidence Assembly**
- Items: 1c (ADR-016 acceptance), M0-ENG/FR-TRANSPORT/NFR-PERF evidence assembly.
- Device: No. Code: No.
- Depends on: R3. Unblocks: R5.

**R5 — Gate Re-evaluation**
- Items: Re-run gate checklist with corrected evidence; **final decision = FULL PASS or REQUEST CHANGES** (no conditional pass); freeze remaining M1_CARRY_OVER (items 3, 16, 20, 22).
- Depends on: R4. Unblocks: M1 start (if FULL PASS).

### 7.3 Dependency edges (adjacency list)

```
R0 ──> R1     (requirements settled before decision foundation)
R0 ──> R2     (requirements settled before code work)

R1 ──> R3     (ADR-016 targets defined before measurement)
R1 ──> R4     (ADR-005/012 accepted before gate re-eval)

R2 ──> R3     (pipeline wired, FR-AIFC/FR-POSE implemented; EBUSY fixed for builds)

R3 ──> R4     (device evidence for ADR-016 acceptance)

R4 ──> R5     (all ADRs accepted + evidence assembled before gate decision)
```

**Parallelism:** R1 ∥ R2 (both depend only on R0).
**Critical path:** R0 → R1 → R3 → R4 → R5 (R2 joins R3).
**Removed:** The prior plan's "Minimum for CONDITIONAL PASS" track is deleted (Q2/Q3). Default and only gate target is **M0 FULL PASS**.

---

## 8. What Requires Explicit Approval

Before any implementation (R1–R5) proceeds, the following require explicit approval:

1. **C1** — SRS amendment splitting FR-POSE-007 into M0 (FR-POSE-007a) + M1 (FR-POSE-007b).
2. **C2** — SRS amendment splitting/clarifying FR-POSE-009 into M0 (FR-POSE-009a) + M1 (FR-POSE-009b).
3. **C3** — Confirm FR-AIFC-001–009 as M0 (no wording change; optional clarifying note). *Recommended: approve as-is; the SRS already tags them M0.*
4. **C4** — Remove/annotate the gate checklist "Conditional Pass" concept (planning-doc correction).
5. **C5** — Correct remediation plan Item 6 scope to "every viable B–D candidate" (planning-doc correction).
6. **Revised classification** (§6) — accept that items #11, #12, #13 are REQUIRED_M0, not M1 Carry-over.
7. **R0–R5 DAG** (§7) — accept R0 as the reconciliation gate and M0 FULL PASS as the target.

**No SRS, ADR, code, test, or evidence changes have been applied.** This review is the proposed baseline for explicit approval.

---

## 9. Governance Principle Restated

> A lower-priority planning document (priority 6) MUST NOT silently override the SRS (priority 1). Where the remediation plan conflicted with the SRS on FR-POSE-007, FR-POSE-009, and FR-AIFC-001–009, the SRS governs. Those requirements are M0 unless and until the SRS is amended through an explicit, approved change (C1–C3).
