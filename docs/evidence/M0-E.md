# M0-E Evidence

## VERIFIED

### Skeleton overlay component

- `apps/mobile/src/ui/SkeletonOverlay.tsx` renders a bounded overlay from the frozen `PoseObservation` stream using only the allowed Phase 2 UI surface.
- `apps/mobile/src/ui/skeletonOverlayGeometry.ts` converts normalized landmark coordinates into overlay coordinates and builds a fixed squat-oriented segment set.
- `apps/mobile/src/camera/CameraPreviewScreen.tsx` integrates the overlay without touching frozen pose/provider files or WorkBuddy-owned analysis files.

### Overlay behavior

#### PASS

`apps/mobile/src/ui/SkeletonOverlay.tsx`

Implemented behavior:

- overlay visibility is independently toggleable in `CameraPreviewScreen.tsx`
- overlay consumes the latest `PoseObservation | null`
- overlay renders only bounded squat skeleton connections
- overlay skips missing connections gracefully when either endpoint is unavailable
- overlay renders no segments when the observation is unavailable or the preview bounds are invalid

### Geometry mapping

#### PASS

`apps/mobile/src/ui/skeletonOverlayGeometry.ts`

Implemented geometry helpers:

- `clampNormalizedCoordinate()` clamps normalized landmark values into `[0, 1]`
- `projectLandmarkToOverlay()` maps normalized coordinates into bounded overlay positions
- `buildSkeletonSegments()` creates shoulder/hip/knee/ankle connections for squat feedback
- `buildSkeletonJoints()` extracts overlay joint points only for visible skeleton endpoints

### Camera screen integration

#### PASS

`apps/mobile/src/camera/CameraPreviewScreen.tsx`

Integration details:

- local `overlayEnabled` state controls skeleton visibility independently from preview lifecycle
- the overlay sits above the preview inside the existing preview shell
- preview fallback overlay still appears when preview is inactive
- the native `PoseCameraView` remains the source of observations; M0-E adds presentation only

### Automated verification

#### PASS

`pnpm --filter @exercise/mobile test`

Result:
All Phase 2 mobile Vitest suites passed in the isolated worktree. Total passing tests at the end of Phase 2 validation: `161`.

Relevant new coverage:

- `apps/mobile/src/ui/SkeletonOverlay.test.ts`
- `apps/mobile/src/camera/CameraPreviewScreen.test.ts`

Covered cases:

- coordinate clamping
- normalized overlay projection
- bounded squat skeleton segment construction
- graceful skipping of missing endpoints
- no overlay segments for unavailable observations
- bounded overlay behavior against the frozen `PoseObservation` contract

#### PASS

`pnpm --filter @exercise/mobile lint`

Result:
Lint passed in the Phase 2 worktree after M0-E implementation.

#### PASS

`pnpm --filter @exercise/mobile typecheck`

Result:
TypeScript typecheck passed in the Phase 2 worktree after M0-E implementation.

## NOT VERIFIED

### Real-device overlay rendering quality

- M0-E does not yet include physical-device screenshots or user-study validation of overlay readability.
- The current evidence verifies deterministic rendering behavior in code/tests, not ergonomic quality on hardware.

## Findings

| Severity | Finding | Status |
| --- | --- | --- |
| LOW | The overlay uses bounded fixed dimensions in `CameraPreviewScreen.tsx` for the current technical shell, so future layout work may be needed to tie overlay bounds to exact runtime preview measurements on all devices. | Recorded |
| LOW | Missing landmark handling is intentionally permissive: connections are skipped instead of failing the overlay, which keeps rendering stable under dropped observations. | Recorded |

## Scope verification

Verified:

- overlay follows the observation stream through the latest emitted `PoseObservation`
- overlay can be toggled independently
- overlay remains bounded under dropped or partial observations
- work stays inside the allowed Phase 2 UI/camera boundary

Not verified:

- production-tuned overlay ergonomics on representative devices
- exact runtime pixel-perfect alignment across all preview aspect ratios
