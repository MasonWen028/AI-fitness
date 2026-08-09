# M0-G Evidence — Squat Metrics

## Work Package
M0-G — Squat Metrics

## SRS Requirements
- FR-ANGLE-001: Named metrics from profile definitions
- FR-ANGLE-002: Every metric carries value, timestamp, validity, minConfidence
- FR-ANGLE-003: Clamp floating-point, handle zero-length/missing without NaN
- FR-ANGLE-004: Velocity uses actual elapsed time, rejects non-monotonic/gaps
- FR-ANGLE-006: M0 exposes knee, hip, torso-inclination, ROM, velocity for Squat

## Implementation

### Files
- `apps/mobile/src/analysis/metrics.ts` (implementation)
- `apps/mobile/src/analysis/metrics.test.ts` (tests)

### Metric kinds implemented
| Metric | Kind | Points | Unit |
|--------|------|--------|------|
| Knee angle (L/R) | Three-point angle | hip–knee–ankle | degrees |
| Hip angle (L/R) | Three-point angle | shoulder–hip–knee | degrees |
| Torso inclination | Segment-to-vertical | shoulder midpoint–hip midpoint vs gravity | degrees |
| Hip depth | Normalised distance | hip midpoint to knee midpoint (vertical) | hip-widths |
| Angular velocity | Velocity | (curr - prev) / elapsed time | deg/s |
| Linear velocity | Velocity | (curr - prev) / elapsed time | hip-widths/s |
| ROM | Range over window | max - min over valid metrics | same as metric |

### MetricValue type (FR-ANGLE-002)
```typescript
type MetricValue = {
  value: number;        // metric value
  timestampMs: number;  // observation timestamp
  valid: boolean;       // validity flag
  minConfidence: number; // min visibility of contributing landmarks
};
```

### NaN safety (FR-ANGLE-003)
- All degenerate inputs (missing landmarks, zero-length vectors, coincident points) produce finite fallback values
- `computeAngle3D` returns 0 for zero-length vectors
- Invalid metrics return `value: 180` (angles) or `value: 0` (distances), not NaN
- Test suite includes explicit NaN safety tests with all landmarks at origin

### Velocity (FR-ANGLE-004)
- Uses actual elapsed time: `(curr.value - prev.value) / ((curr.timestampMs - prev.timestampMs) / 1000)`
- Rejects non-monotonic timestamps (elapsed <= 0 → invalid)
- Rejects gaps > `MAX_VELOCITY_TIMESTAMP_GAP_MS` (1000ms)
- Boundary test: exactly 1000ms gap is accepted

## Verification

### Test results
```
Test Files: 9 passed
Tests: 142 passed (36 new for M0-G)
```

### Test coverage
- MetricValue contract: all metrics carry value, timestampMs, valid, minConfidence
- Knee angle: standing pose (>160°), deep squat (< standing), missing landmarks, low visibility, left/right symmetry
- Hip angle: standing pose (>150°), deep squat (< standing), missing shoulder
- Torso inclination: upright (<10°), leaning (> upright), missing landmarks
- Hip depth: standing (>0), deep squat (< standing), missing knees
- Full squat metric set: all 6 metrics valid for good frame, all invalid for empty frame
- Velocity: monotonic timestamps, non-monotonic rejection, equal timestamps, large gap rejection, boundary, invalid metric
- ROM: range computation, <2 valid values, invalid exclusion, empty window
- getMetricById: all 6 IDs retrievable, correct mapping
- NaN safety: valid frame, degenerate frame (zero hip width), all-at-origin frame

### Typecheck
```
tsc --noEmit — passed
```

### Lint
```
eslint — passed
```

## Acceptance Criteria
- [x] Required Squat metrics are computed deterministically
- [x] Invalid geometry does not propagate NaN

## Commit
`bd902d1` — feat(m0-g): implement squat metrics with velocity and ROM
