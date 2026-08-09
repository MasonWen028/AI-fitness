# M0-H Evidence — Squat Phase FSM

## Work Package
M0-H — Squat Phase State Machine

## SRS Requirements
- FR-PHASE-001: Explicit initial, movement, completion, paused, tracking-lost behaviour
- FR-PHASE-002: Transitions require minimum confidence and dwell time; hysteresis on chattering thresholds
- FR-PHASE-003: Reject illegal transitions with diagnostic code
- FR-PHASE-004: Tracking-loss beyond grace period invalidates/pauses the open rep
- FR-PHASE-005: Phase output includes state, entered timestamp, transition reason, confidence, profile version

## Implementation

### Files
- `apps/mobile/src/analysis/phaseMachine.ts` (implementation)
- `apps/mobile/src/analysis/phaseMachine.test.ts` (tests)

### Phase states (FR-PHASE-001)
| State | Description |
|-------|-------------|
| READY | Initial state, standing upright |
| DESCENDING | Moving down into squat |
| BOTTOM | At the bottom of the squat |
| ASCENDING | Moving back up |
| PAUSED | Tracking lost, within grace period |
| TRACKING_LOST | Tracking lost, beyond grace period |

### Legal transitions
```
READY → DESCENDING, PAUSED
DESCENDING → BOTTOM, ASCENDING, PAUSED
BOTTOM → ASCENDING, PAUSED
ASCENDING → READY, BOTTOM, PAUSED
PAUSED → READY, DESCENDING, BOTTOM, ASCENDING, TRACKING_LOST
TRACKING_LOST → READY
```

### Hysteresis thresholds (FR-PHASE-002)
| Threshold | Default | Purpose |
|-----------|---------|---------|
| descentKneeAngle | 155° | Below → start descending from READY |
| bottomKneeAngle | 110° | Below → reached BOTTOM |
| ascentKneeAngle | 125° | Above → start ASCENDING (> bottomKneeAngle for hysteresis) |
| standingKneeAngle | 165° | Above → back to READY (> descentKneeAngle for hysteresis) |

### Dwell time (FR-PHASE-002)
- Default: 50ms
- Transition condition must persist for >= dwellMs before executing
- When dwellMs = 0, transition executes immediately on first qualifying frame
- Dwell timer resets if condition changes before elapsing

### Tracking loss (FR-PHASE-004)
- When metrics become invalid or low-confidence → enter PAUSED
- If tracking not restored within `trackingGraceMs` (default 500ms) → TRACKING_LOST
- From PAUSED: tracking restored → resume to phase matching current metrics
- From TRACKING_LOST: tracking restored → reset to READY (rep invalidated)

### PhaseState output (FR-PHASE-005)
```typescript
type PhaseState = {
  phase: SquatPhase;
  enteredTimestampMs: number;
  transitionReason: TransitionReason;
  confidence: number;
  profileVersion: string;
};
```

## Verification

### Test results
```
Test Files: 9 passed
Tests: 142 passed (17 new for M0-H)
```

### Test coverage
- Initialization: starts READY, init reason, profile version
- Complete sequence: READY → DESCENDING → BOTTOM → ASCENDING → READY
- Hysteresis: no chatter at descent threshold (155 vs 165), no chatter at bottom threshold (110 vs 125)
- Dwell time: no transition before dwell, transition after dwell, reset on condition change
- Tracking loss: enters PAUSED, restores from PAUSED within grace, TRACKING_LOST on grace exceeded, resets to READY from TRACKING_LOST
- Illegal transitions: READY → BOTTOM is rejected (goes to DESCENDING instead)
- PhaseState output: all fields present, enteredTimestampMs updates on transition
- Low confidence: treated as tracking loss

### Typecheck
```
tsc --noEmit — passed
```

### Lint
```
eslint — passed
```

## Acceptance Criteria
- [x] State transitions are deterministic and legal
- [x] Tracking-loss pauses advancement
- [x] Jitter does not create illegal transitions

## Commit
`f6d807f` — feat(m0-h): implement deterministic squat phase state machine
