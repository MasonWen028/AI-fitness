# M0-D Evidence

## VERIFIED

### Contract stabilization

- `apps/mobile/src/pose/poseContract.ts` now exports `LANDMARK_NAMES` as a `const` array (33 entries), derived `LandmarkName` type, `LANDMARK_COUNT`, `LANDMARK_INDEX` lookup map, `isLandmarkName()` type guard, `SQUAT_CRITICAL_LANDMARKS` subset, and `VALID_ROTATIONS` / `VALID_DELEGATES` constants.
- The `LandmarkName` type is now derived from the `LANDMARK_NAMES` const array via `(typeof LANDMARK_NAMES)[number]`, ensuring the type and runtime array cannot diverge.
- The native `LandmarkNames.kt` and the TypeScript `LANDMARK_NAMES` share identical ordering (verified by index comparison in tests).

### Validation layer

- `apps/mobile/src/pose/poseValidation.ts` provides:
  - `validatePoseObservation(obs)` — returns `{ valid, errors }` with comprehensive structural validation
  - `assertValidPoseObservation(obs)` — throws on invalid observations
  - `getLandmarkByName(obs, name, personIndex)` — lookup helper
  - `getLandmarksByNames(obs, names, personIndex)` — batch lookup helper
  - `hasCriticalLandmarks(obs, required, personIndex, minVisibility)` — squat readiness check
  - `createEmptyObservation(overrides)` — factory for no-landmark observations
  - `createSyntheticObservation(sequence, landmarks, overrides)` — factory for test fixtures with partial landmark data

### Validation coverage

The validator checks:
- `sequence` — finite, non-negative
- `timestampMs` — finite, non-negative
- `landmarksAvailable` — boolean
- `landmarkCount` — finite, in range 0..33, matches `imageLandmarks` array length when landmarks available
- `frameId` — finite number
- `imageSize.width` / `imageSize.height` — positive numbers
- `rotationDegrees` — one of 0, 90, 180, 270
- `mirrored` — boolean
- `people` — array; each person validated for `trackingId`, `imageLandmarks`, `worldLandmarks`, `posePresence`
- `posePresence` — finite, in range 0..1
- Each landmark: `name` (valid `LandmarkName`), `x` (finite), `y` (finite), `z` (finite or undefined), `visibility` (0..1 or undefined), `presence` (0..1 or undefined)
- `provider.name` — non-empty string
- `provider.modelVersion` — non-empty string
- `provider.delegate` — one of CPU, GPU, NPU, UNKNOWN
- `provider.inferenceMs` — finite, non-negative

### Provider mapping documentation

- `docs/architecture/provider-mapping.md` documents the complete MediaPipe → PoseObservation mapping:
  - 33-landmark name mapping table (1:1, no remapping needed)
  - Image landmark coordinate semantics (normalized 0..1)
  - World landmark coordinate semantics (meters, hip-relative)
  - Rotation and mirror metadata semantics
  - Provider identity fields
  - Health counter definitions
  - Adapter responsibilities
  - Provider neutrality requirements
  - Conformance checklist

### Automated verification

#### PASS

`pnpm --filter @exercise/mobile test`

Result:
All mobile Vitest suites passed. 5 test files, 59 tests total (16 pre-existing + 43 new contract tests).

New test file `src/pose/poseContract.test.ts` covers:
- `LANDMARK_NAMES` — count (33), MediaPipe order verification
- `LANDMARK_INDEX` — correct mapping, unknown name handling
- `isLandmarkName` — valid/invalid name detection
- `SQUAT_CRITICAL_LANDMARKS` — count (8), includes hip/knee/ankle/shoulder
- `validatePoseObservation` — 19 test cases covering valid observations, invalid observations, edge cases, multi-error collection
- `assertValidPoseObservation` — throw/no-throw behavior
- `createEmptyObservation` — validity, override application
- `createSyntheticObservation` — validity, landmark population, count semantics
- `getLandmarkByName` — lookup, missing person index
- `getLandmarksByNames` — batch lookup, zero-value landmark handling
- `hasCriticalLandmarks` — all present, missing landmark, low visibility, undefined visibility

#### PASS

`pnpm --filter @exercise/mobile typecheck`

Result:
Mobile TypeScript typecheck passed. No type errors.

#### PASS

`pnpm --filter @exercise/mobile lint`

Result:
ESLint passed for the mobile package. No lint errors.

#### PASS

`pnpm exec tsc -p tsconfig.base.json --noEmit`

Result:
Root TypeScript verification passed.

### Files created

| File | Purpose |
|------|---------|
| `apps/mobile/src/pose/poseContract.ts` | Modified: added `LANDMARK_NAMES`, `LANDMARK_COUNT`, `LANDMARK_INDEX`, `isLandmarkName`, `SQUAT_CRITICAL_LANDMARKS`, `VALID_ROTATIONS`, `VALID_DELEGATES` |
| `apps/mobile/src/pose/poseValidation.ts` | New: validation, helpers, factories |
| `apps/mobile/src/pose/poseContract.test.ts` | New: 43 contract tests |
| `docs/architecture/provider-mapping.md` | New: provider conformance mapping documentation |
| `docs/planning/m0/parallel-development-rules.md` | New: parallel development collaboration rules |
| `docs/planning/m0/kiro-parallel-prompt.md` | New: Kiro assignment prompt |

### Contract freeze

`poseContract.ts` is now frozen for the remainder of M0. The `PoseObservation` type, `LandmarkName` type, and `Landmark` type are stable. Downstream work packages (M0-F through M0-L) depend on this contract and will not modify it.

If any work package discovers a contract change is needed, the `[CONTRACT-CHANGE]` commit prefix protocol must be followed (see `docs/planning/m0/parallel-development-rules.md`).

## NOT VERIFIED

- Device-side validation of synthetic observation factory against real MediaPipe output (requires M0-C device session)
- World landmark coordinate accuracy (estimated spatial data, not clinical truth)
- iOS provider conformance (M0-C is Android-only in this branch)

## Findings

| Severity | Finding | Status |
|----------|---------|--------|
| LOW | `createSyntheticObservation` fills all 33 landmark slots with zero values for unprovided landmarks, matching real MediaPipe behavior (all-or-nothing). Downstream tests should use `hasCriticalLandmarks()` to check readiness rather than checking array length. | Recorded |
| LOW | `landmarkCount` always equals `imageLandmarks.length` (0 or 33), not the count of "meaningful" landmarks. This matches the native module's behavior. | Recorded |

## Scope verification

Verified:
- work remains within M0-D boundary intent (contract stabilization, not analysis logic)
- no exercise engine / workout / backend / AI feature expansion was added
- `poseContract.ts` type definitions are backward-compatible with M0-C adapter code
- all pre-existing tests continue to pass without modification
- provider mapping documentation covers all ADR-005 conformance requirements
