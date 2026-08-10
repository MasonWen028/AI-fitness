# M0-R0 Requirement Reconciliation — Applied Evidence

**Status:** COMPLETE
**Date:** 2026-08-10
**Authoritative source:** `docs/reviews/M0-R0-REQUIREMENT-RECONCILIATION.md` (R0 CLOSED)
**Scope:** Governance / documentation change only. No production code, ADRs, tests, or device evidence modified beyond the approved edits below.

---

## 1. Approved Changes Applied

| Change | Description | Disposition |
|--------|-------------|-------------|
| **C1** | Split FR-POSE-007 into FR-POSE-007a (M0) + FR-POSE-007b (M1) | APPLIED to SRS |
| **C2** | Split FR-POSE-009 into FR-POSE-009a (M0) + FR-POSE-009b (M1) | APPLIED to SRS |
| **C3** | FR-AIFC-001 through FR-AIFC-009 remain mandatory M0; clarification added | APPLIED to SRS + ADRs |
| **C4** | Remove unauthorized CONDITIONAL PASS path from M0 gate checklist | APPLIED; gate now binary FULL PASS / REQUEST CHANGES |
| **C5** | Correct FR-TRANSPORT-001 remediation scope to Option A + every viable B–D candidate | APPLIED to remediation plan + ADR-016 |

**Revised classification (applied across planning docs):**
- GATE_BLOCKER: 1, 2, 4, 5, 6, 7
- REQUIRED_M0: 8, 9, 10, 11, 12, 13, 14, 15, 23
- M1_CARRY_OVER: 3, 16, 20, 22
- CLEANUP: 17, 18, 19, 21

---

## 2. Files Changed

**Modified (tracked):**
- `docs/SRS.md`
- `docs/architecture/adr/ADR-005-pose-provider-model.md`
- `docs/architecture/adr/ADR-012-react-native-build-camera-integration.md`
- `docs/architecture/adr/ADR-016-pose-observation-transport-runtime.md`
- `docs/planning/m0/m0-gate-checklist.md`
- `docs/planning/m0/acceptance-criteria.md`
- `docs/overview.md` (superseded banner added)
- `docs/architecture/evidence/m0/m0-gate-report.md` (superseded banner added)
- `docs/architecture/evidence/m0/runtime-benchmark.md` (superseded banner added)
- `docs/evidence/M0-Q.md` (superseded banner added)

**Created (untracked → added in this commit):**
- `docs/reviews/M0-R0-REQUIREMENT-RECONCILIATION.md`
- `docs/planning/m0/m0-remediation-plan.md`
- `docs/evidence/M0-R0-APPLIED.md` (this file)

---

## 3. Requirement IDs Before / After

| Before | After | Milestone | Rationale |
|--------|-------|-----------|-----------|
| FR-POSE-007 | FR-POSE-007a | **M0** | Active M0 pose provider MUST pass the canonical conformance fixture suite as part of M0 technical validation |
| | FR-POSE-007b | M1 | Provider *replacement* path before release |
| FR-POSE-009 | FR-POSE-009a | **M0** | Model files versioned + integrity-checked against profile manifest, fail-safe to manual mode on mismatch |
| | FR-POSE-009b | M1 | Signed application manifest at release |
| FR-AIFC-001–009 | FR-AIFC-001–009 | **M0** (unchanged) | Confirmed mandatory M0; full lifecycle (incl. COUNTDOWN/ACTIVE/SET_COMPLETE/ERROR) is in scope for M0 core |
| FR-TRANSPORT-001 | FR-TRANSPORT-001 | M0 (scope corrected) | Remediation now scopes to Option A + every viable B–D candidate; exclusions need recorded technical evidence |

---

## 4. Cross-Reference Updates

- **ADR-005** "Related Requirements": FR-POSE-007/009 → FR-POSE-007a/FR-POSE-009a, with explicit note that `-b` variants are M1.
- **ADR-012**: added explicit note that FR-AIFC-001–009 are mandatory M0 (C3).
- **ADR-016**: C5 wording aligned — "excluded candidates require explicit technical reason, not schedule preference" → "excluded candidates require recorded technical evidence demonstrating non-viability"; added notes on FR-POSE-007a/009a (M0) and FR-AIFC-001–009 (M0).
- **m0-remediation-plan.md**: classification 6/9/4/4; R0–R5 DAG; items #11/#12/#13 → REQUIRED_M0; Item 6 scope (C5); removed "Minimum for CONDITIONAL PASS" section; "deferred" notes flipped to "applied".
- **m0-gate-checklist.md**: CONDITIONAL PASS state removed (C4); binary FULL PASS / REQUEST CHANGES.
- **acceptance-criteria.md**: gate-decision language made binary.
- **overview.md / m0-gate-report.md / runtime-benchmark.md / M0-Q.md**: superseded banners (history preserved).

---

## 5. Historical Documents Intentionally Preserved

The following retain their original (now-obsolete) conclusions, annotated with a superseded banner rather than rewritten:

- `docs/overview.md` — original gate "CONDITIONAL PASS" conclusion preserved.
- `docs/architecture/evidence/m0/m0-gate-report.md` — original "CONDITIONAL PASS" gate decision + `FR-BENCH-001–004` traceability table preserved.
- `docs/architecture/evidence/m0/runtime-benchmark.md` — pre-R1 benchmark claims + `SRS: FR-BENCH-001 through FR-BENCH-004` line preserved.
- `docs/evidence/M0-Q.md` — original "CONDITIONAL PASS" gate decision preserved.
- `docs/reviews/M0-FINAL-ARCHITECTURE-EVIDENCE-REVIEW.md` — the forensic review that found the issues; preserved as source of record.

**Rationale:** rewriting these would falsify the historical record of what was originally claimed/assessed. Newer governance (R0) is referenced via banners; the FR-BENCH traceability correction is an explicit R1 objective (#19), not a silent rewrite of history.

---

## 6. Search Results for Obsolete References

Repository-wide grep (`docs/` + `apps/`), per-occurrence disposition:

| Term | Occurrences | Disposition |
|------|-------------|-------------|
| FR-POSE-007 | SRS (now -007a/-007b), ADR-005, m0-remediation-plan #11, M0-R0-RECONCILIATION | Reconciled (C1) |
| FR-POSE-009 | SRS (now -009a/-009b), ADR-005, m0-remediation-plan #12, M0-R0-RECONCILIATION | Reconciled (C2) |
| FR-AIFC | SRS, ADR-012, ADR-016, m0-remediation-plan #13, M0-R0-RECONCILIATION | Confirmed M0 (C3) |
| CONDITIONAL PASS / Conditional Pass | m0-gate-checklist (removed), m0-remediation-plan (removed), overview.md, m0-gate-report.md, M0-Q.md, M0-FINAL-…REVIEW.md | Removed from live planning (C4); preserved in historical docs with banner |
| FR-BENCH | m0-gate-report.md:156, runtime-benchmark.md:52 (historical, preserved); M0-FINAL-…REVIEW.md (review, preserved); m0-remediation-plan #19 (R1 traceability correction) | Preserved historically; corrected in R1 |
| FR-TRANSPORT-001 | SRS, ADR-016, m0-remediation-plan #6 | Scope corrected (C5) |

No `apps/` source code references any of these IDs — change is documentation-only.

---

## 7. Validation Command Results (non-device)

Run from `apps/mobile` by invoking `node_modules` binaries directly (the `pnpm` shim is broken in this environment — global install path is mangled to `E:\c\Users…`):

| Command | Result |
|---------|--------|
| `tsc --noEmit` (typecheck) | **PASS** — 0 errors |
| `eslint .` (lint) | **PASS** — 0 errors |
| `vitest run` (tests) | **PASS** — 227/227 tests, 15 files |

No source files were modified by R0; these confirm no regression was introduced by the documentation changes.

---

## 8. Git Diff Summary

Tracked modifications: **9 files, +37 / −23 lines**.
- `docs/SRS.md`: +11 −3 (C1/C2/C3 splits + milestone mapping)
- `ADR-005`: +6 −3 · `ADR-012`: +2 −1 · `ADR-016`: +6 −3
- `m0-gate-checklist.md`: +19 −12 (C4)
- `acceptance-criteria.md`: +4 −1
- `overview.md`, `m0-gate-report.md`, `runtime-benchmark.md`, `M0-Q.md`: +4 each (superseded banner)

New/untracked added in this commit:
- `docs/reviews/M0-R0-REQUIREMENT-RECONCILIATION.md`
- `docs/planning/m0/m0-remediation-plan.md`
- `docs/evidence/M0-R0-APPLIED.md`

**Deliberately excluded from this commit** (unrelated untracked): `logcat.txt`, `m0c_screen.png`, `.workbuddy/`, `apps/mobile/modules/pose-camera/android/src/main/java/expo/core/`.

---

## 9. Remaining R0 Issues

**None.** All approved C1–C5 applied; classification and DAG reconciled; historical docs preserved with annotations; validation green.

Forward note (not an R0 defect): the `FR-BENCH-001–004` traceability fabrication in the original gate report is preserved historically and corrected via **R1 objective #19** (live gate traceability), per the "do not silently rewrite history" instruction.

---

## 10. R0 Status: COMPLETE

M0-R0 Requirement Reconciliation is **CLOSED**. SRS, ADRs, and planning docs are consistent with the binary `M0-GATE-001` (FULL PASS / REQUEST CHANGES). R1–R5 remain gated behind their respective go-aheads; this commit does **not** start R1.
