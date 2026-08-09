# M0-F Evidence — Normalization

## VERIFIED

### Work Package
M0-F — Normalization: canonicalize coordinates and quality diagnostics.

### SRS Requirements
- FR-NORM-001: Orientation, mirror, scale, and translation are normalized deterministically
- FR-NORM-002: Missing anchors produce quality diagnostics

### Implementation

#### Files
- `apps/mobile/src/analysis/normalization.ts` (implementation)
- `apps/mobile/src/analysis/normalization.test.ts` (tests)

### Coordinate canonicalization (FR-NORM-001)

`normalizeObservation(observation, personIndex, minVisibility)` transforms raw `PoseObservation` landmarks into a `NormalizedFrame`:

1. **Mirror correction** — if `mirrored` is true, x is flipped (`x = 1 - x`)
2. **Rotation correction** — applies 0/90/180/270-degree rotation to x/y based on `rotationDegrees`
3. **Clamping** — x and y clamped to [0, 1] after rotation/mirror
4. **Translation** — origin set to hip midpoint (left_hip + right_hip) / 2
5. **Scale normalization** — all coordinates divided by hip width (distance between left_hip and right_hip)
6. **Scale fallback** — if hip width < 1e-6, falls back to shoulder width, then torso length, then 1.0
7. **Z preserved** — z coordinate carried through (relative depth), defaults to 0 when undefined

Output type:
```typescript
type NormalizedFrame = {
  sequence: number;
  timestampMs: number;
  frameId: number;
  landmarks: ReadonlyMap<LandmarkName, NormalizedPoint>;
  origin: { x: number; y: number; z: number };
  scaleFactor: number;
  quality: FrameQuality;
};
```

### Quality diagnostics (FR-NORM-002)

`assessQuality(observation, personIndex, minVisibility)` returns `FrameQuality`:

| Field | Description |
|-------|-------------|
| `hasCriticalLandmarks` | All 8 SQUAT_CRITICAL_LANDMARKS present with visibility >= threshold |
| `minVisibility` | Minimum visibility across all landmarks |
| `averageVisibility` | Mean visibility across all landmarks |
| `missingLandmarks` | Array of critical landmarks not found |
| `lowVisibilityLandmarks` | Critical landmarks below visibility threshold |
| `personDetected` | `posePresence > 0.3` |
| `overallScore` | `criticalScore * avgVis` if person detected, else 0 |

Default visibility threshold: 0.5.

### Angle computation

`computeAngle2D(a, vertex, c)` and `computeAngle3D(a, vertex, c)` compute joint angles using vector dot product:

- Returns degrees (0-180)
- Returns 0 for degenerate inputs (zero-length vectors, coincident points)
- Uses `Point3D` type (not `NormalizedPoint`) to accept arbitrary test points
- Cosine clamped to [-1, 1] to prevent NaN from floating-point drift

### NaN safety
- All degenerate inputs produce finite fallback values (0 for angles, 1.0 for scale)
- No NaN propagation from missing landmarks or zero-length vectors
- `normalizeObservation` returns `null` for missing person (not a frame with NaN)

### Automated verification

#### PASS

`pnpm --filter @exercise/mobile test`

Result:
All mobile Vitest suites passed. 9 test files, 142 tests total (18 new for M0-F).

New test file `src/analysis/normalization.test.ts` covers:
- `normalizeObservation` — missing person (null return), hip midpoint centering, scale factor = hip width, shoulder-width fallback, mirror correction, 90-degree rotation, sequence/frameId preservation, origin centering
- `assessQuality` — no person (zero quality), low-visibility detection, high-quality detection
- `computeAngle2D` — 90 degrees (perpendicular), 180 degrees (opposite), 0 degrees (same direction), degenerate (coincident points → 0)
- `computeAngle3D` — 90 degrees for 3D perpendicular vectors
- `getNormalizedLandmarks` — batch retrieval

#### PASS

`pnpm --filter @exercise/mobile typecheck`

Result: No type errors.

#### PASS

`pnpm --filter @exercise/mobile lint`

Result: No lint errors.

### Acceptance Criteria
- [x] Orientation, mirror, scale, and translation are normalized deterministically
- [x] Missing anchors produce quality diagnostics

## NOT VERIFIED

- Device-side normalization accuracy against real camera frames at different rotations
- iOS rotation handling (M0-C is Android-only)
- Multi-person normalization (only personIndex 0 tested in detail)

## Findings

| Severity | Finding | Status |
|----------|---------|--------|
| LOW | Scale factor falls back to 1.0 when no body-segment distance is available, producing unnormalized coordinates. Downstream metrics should check `quality.overallScore` before using the frame. | Recorded |
| LOW | Z-coordinate is not scale-normalized in the same pass as x/y because hip width is a 2D/3D distance but z is relative depth. This is intentional for M0. | Recorded |

## Scope verification

Verified:
- Work remains within M0-F boundary (normalization + quality diagnostics only)
- No exercise engine / fault detection / UI code was added
- Depends only on M0-D contract types (PoseObservation, Landmark, LandmarkName)
- All pre-existing tests continue to pass
