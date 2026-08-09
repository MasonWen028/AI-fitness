# M0-J / M0-K Evidence — Candidate Faults

## VERIFIED

### Work Package
M0-J — Candidate Fault 1: INSUFFICIENT_DEPTH
M0-K — Candidate Fault 2: EXCESSIVE_FORWARD_LEAN

### SRS Requirements
- FR-RULE-002: Deterministic for identical inputs
- FR-RULE-003: Each emitted fault includes code, severity, confidence, phase/rep, evidence metric IDs, rule version
- FR-RULE-004: Fail closed — invalid/missing evidence produces no form assertion
- FR-FAULT-001: Fault codes are stable machine identifiers
- FR-FAULT-002: No fault stated when required evidence is missing or below confidence
- FR-FAULT-003: Every fault type documents supported exercise, view, phase, evidence, confounders, validation status
- FR-FAULT-005: No force, pain, injury, muscle activation or clinical alignment claims

### Implementation

#### Files
- `apps/mobile/src/analysis/faults.ts` (implementation)
- `apps/mobile/src/analysis/faults.test.ts` (tests)

### Fault types

#### M0-J: INSUFFICIENT_DEPTH
- **Code:** `INSUFFICIENT_DEPTH`
- **Evaluation trigger:** Phase = BOTTOM
- **Evidence metrics:** `knee_angle_left`, `knee_angle_right` (effective = average of valid sides)
- **Threshold:** Knee angle > 140° at BOTTOM (M0 default, `<VALIDATION_REQUIRED>` for production)
- **Logic:** Higher knee angle = less flexion = shallower squat. Fires when knee angle exceeds threshold.
- **Fail closed:** Returns `NOT_OBSERVABLE` when knee angle invalid or confidence < 0.5

#### M0-K: EXCESSIVE_FORWARD_LEAN
- **Code:** `EXCESSIVE_FORWARD_LEAN`
- **Evaluation trigger:** Phase in {DESCENDING, BOTTOM, ASCENDING}
- **Evidence metrics:** `torso_inclination`
- **Threshold:** Torso inclination > 45° during active movement (M0 default, `<VALIDATION_REQUIRED>`)
- **Logic:** 0° = upright, increasing as person leans forward. Fires when inclination exceeds threshold.
- **Fail closed:** Returns `NOT_OBSERVABLE` when torso inclination invalid or confidence < 0.5

### FaultResult type (FR-RULE-003)
```typescript
type FaultResult = {
  code: SquatFaultCode;           // FR-FAULT-001: stable machine identifier
  status: 'DETECTED' | 'NOT_OBSERVABLE';  // FR-FAULT-002
  severity: 'INFO' | 'IMPORTANT' | 'CRITICAL';
  confidence: number;             // min confidence of contributing evidence
  phase: SquatPhase;              // phase when evaluated
  repIndex: number | null;        // rep being evaluated
  evidenceMetricIds: SquatMetricId[];  // evidence metric IDs
  ruleVersion: string;            // rule version
  timestampMs: number;            // when evaluated
  value: number;                  // metric value
  threshold: number;              // threshold compared against
};
```

### Fault catalog (FR-FAULT-003)
`FAULT_CATALOG` documents both faults with:
- Supported exercise (Bodyweight Squat)
- Evidence metrics
- Evaluation phases
- Known confounders
- Validation status (M0 candidate — not clinically validated)

### Automated verification

#### PASS
`pnpm --filter @exercise/mobile test`

Result: 11 test files, 208 tests total (42 new for M0-J/K).

Test coverage:
- Phase gating: returns null for non-applicable phases
- Detection logic: fires when threshold exceeded, doesn't fire when below
- Boundary conditions: exact threshold (not >), just above threshold
- Effective knee angle: averages left/right, uses single valid side
- Fail closed: invalid metrics → NOT_OBSERVABLE, low confidence → NOT_OBSERVABLE
- Result fields: all FR-RULE-003 fields present and correct
- Rep index: null when no attempt, correct index when attempt active
- Custom config: custom thresholds and minConfidence
- Combined evaluation: both faults evaluated together
- Fault catalog: documentation completeness
- Determinism: identical inputs produce identical results

#### PASS
`pnpm --filter @exercise/mobile typecheck` — No type errors.

#### PASS
`pnpm --filter @exercise/mobile lint` — No lint errors.

### Acceptance Criteria
- [x] Each candidate fault fires only on approved evidence conditions
- [x] Low-confidence and noisy inputs fail closed

## NOT VERIFIED
- Device-side fault accuracy against real squat footage
- Threshold calibration with domain expert validation
- Multi-view fault detection (side view only in M0)

## Findings

| Severity | Finding | Status |
|----------|---------|--------|
| LOW | All numeric thresholds are M0 technical-validation defaults. Production values require `<VALIDATION_REQUIRED>` profile validation. | Recorded |
| LOW | Knee valgus fault not implemented in M0 (requires front view, deferred per SRS). | Recorded |
| LOW | Fault evaluation is per-frame, not windowed. Temporal aggregation (median over window) is deferred to M1. | Recorded |
