# M0-I Evidence — Rep Detection

## Work Package
M0-I — Rep Detection

## SRS Requirements
- FR-REP-001: Rep counted only after complete phase sequence returns to completion/reset state
- FR-REP-002: Noise or repeated frames in one phase shall not create duplicate reps
- FR-REP-003: Incomplete, paused or interrupted attempts retained as incomplete, not counted
- FR-REP-005: Rep results include start/end, duration, ROM, issues, confidence, versions

## Implementation

### Files
- `apps/mobile/src/analysis/repDetection.ts` (implementation)
- `apps/mobile/src/analysis/repDetection.test.ts` (tests)

### Rep completion logic (FR-REP-001)
A rep is counted as completed when the phase sequence is:
```
READY → DESCENDING → BOTTOM → ASCENDING → READY
```
The attempt must visit BOTTOM to be counted as complete. If the sequence returns to READY without visiting BOTTOM (partial squat), it is recorded as incomplete.

### Duplicate prevention (FR-REP-002)
- An attempt is opened only when transitioning from READY to DESCENDING
- Repeated frames in the same phase do not open new attempts
- Repeated READY frames after a completed rep do not create additional reps

### Incomplete handling (FR-REP-003)
| Scenario | Result |
|----------|--------|
| Partial squat (no BOTTOM reached, returns to READY) | Incomplete rep |
| Tracking loss beyond grace period (→ TRACKING_LOST) | Incomplete rep with `tracking_lost` issue |
| Tracking restored from TRACKING_LOST | Resets to READY, no new attempt opened |

### RepResult (FR-REP-005)
```typescript
type RepResult = {
  status: 'completed' | 'incomplete';
  startTimestampMs: number;    // when DESCENDING started
  endTimestampMs: number;      // when READY reached or tracking lost
  durationMs: number;
  kneeAngleRom: number;        // max - min knee angle during attempt
  minConfidence: number;       // minimum confidence during attempt
  averageConfidence: number;   // average confidence during attempt
  issues: string[];            // e.g. ['tracking_lost']
  engineVersion: string;
  profileVersion: string;
  ruleVersion: string;
};
```

## Verification

### Test results
```
Test Files: 9 passed
Tests: 142 passed (12 new for M0-I)
```

### Test coverage
- Initialization: no completed/incomplete reps, no active attempt
- Complete rep: exactly 1 rep for full sequence, correct start/end/duration/ROM/confidence/versions
- Multiple reps: 3 sequential reps counted correctly
- No duplicates: repeated READY frames, repeated DESCENDING frames
- Incomplete: partial squat (no BOTTOM), tracking loss with `tracking_lost` issue
- Tracking restore: after grace period, resets to READY without counting
- Rep result fields: all FR-REP-005 fields present and correct
- Active attempt: true during DESCENDING, false after completion, false in READY with no prior descent

### Typecheck
```
tsc --noEmit — passed
```

### Lint
```
eslint — passed
```

## Acceptance Criteria
- [x] One valid squat sequence produces exactly one completed rep
- [x] Incomplete attempts are retained as incomplete and not counted as complete

## Commit
`8de923e` — feat(m0-i): implement rep detection with completed/incomplete tracking
