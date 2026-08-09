# Provider Mapping — MediaPipe Pose Landmarker → PoseObservation

## Purpose

This document defines how output from the MediaPipe Pose Landmarker (M0 candidate provider) maps to the canonical `PoseObservation` contract. It serves as the provider conformance reference required by ADR-005 and the pose-engine architecture.

## Contract Source of Truth

The canonical contract is defined in `apps/mobile/src/pose/poseContract.ts`. The adapter layer in `apps/mobile/src/pose/poseEventAdapters.ts` performs the runtime conversion from native payload to contract.

## Landmark Mapping

MediaPipe Pose Landmarker outputs 33 body landmarks in a fixed order. The canonical `LandmarkName` type mirrors this order exactly.

| Index | MediaPipe Landmark | Canonical `LandmarkName` |
|-------|--------------------|--------------------------|
| 0 | nose | `nose` |
| 1 | left_eye_inner | `left_eye_inner` |
| 2 | left_eye | `left_eye` |
| 3 | left_eye_outer | `left_eye_outer` |
| 4 | right_eye_inner | `right_eye_inner` |
| 5 | right_eye | `right_eye` |
| 6 | right_eye_outer | `right_eye_outer` |
| 7 | left_ear | `left_ear` |
| 8 | right_ear | `right_ear` |
| 9 | mouth_left | `mouth_left` |
| 10 | mouth_right | `mouth_right` |
| 11 | left_shoulder | `left_shoulder` |
| 12 | right_shoulder | `right_shoulder` |
| 13 | left_elbow | `left_elbow` |
| 14 | right_elbow | `right_elbow` |
| 15 | left_wrist | `left_wrist` |
| 16 | right_wrist | `right_wrist` |
| 17 | left_pinky | `left_pinky` |
| 18 | right_pinky | `right_pinky` |
| 19 | left_index | `left_index` |
| 20 | right_index | `right_index` |
| 21 | left_thumb | `left_thumb` |
| 22 | right_thumb | `right_thumb` |
| 23 | left_hip | `left_hip` |
| 24 | right_hip | `right_hip` |
| 25 | left_knee | `left_knee` |
| 26 | right_knee | `right_knee` |
| 27 | left_ankle | `left_ankle` |
| 28 | right_ankle | `right_ankle` |
| 29 | left_heel | `left_heel` |
| 30 | right_heel | `right_heel` |
| 31 | left_foot_index | `left_foot_index` |
| 32 | right_foot_index | `right_foot_index` |

The native module (`LandmarkNames.kt`) and the TypeScript contract (`LANDMARK_NAMES`) share identical ordering. This 1:1 mapping means no name remapping is needed — the adapter passes landmark names through directly.

## Coordinate Semantics

### Image Landmarks (`imageLandmarks`)

- **Coordinate space**: normalized image coordinates, `[0.0, 1.0]`
- **x**: horizontal, left = 0.0, right = 1.0 (before rotation/mirror adjustment)
- **y**: vertical, top = 0.0, bottom = 1.0
- **z**: depth relative to hip midpoint, smaller = closer to camera
- **visibility**: `[0.0, 1.0]` — probability the landmark is visible (not occluded)
- **presence**: `[0.0, 1.0]` — probability the landmark is present in the image

### World Landmarks (`worldLandmarks`)

- **Coordinate space**: real-world 3D coordinates in meters
- **Origin**: hip midpoint
- **x**: left (negative) / right (positive)
- **y**: up (negative) / down (positive)
- **z**: toward camera (negative) / away (positive)
- These are estimates, not clinical measurements

### Rotation and Mirror

- `rotationDegrees`: the clockwise rotation applied to the image frame before landmark detection. The native module reports the CameraX `imageInfo.rotationDegrees` value. The adapter normalizes this to `0 | 90 | 180 | 270`.
- `mirrored`: whether the image was horizontally flipped before detection. Front camera typically sets `mirrored: true`.

Downstream consumers must account for rotation and mirroring when mapping normalized coordinates to screen-space rendering. The contract carries this metadata so the analysis engine can canonicalize coordinates consistently.

## Provider Identity Fields

| Field | MediaPipe value | Source |
|-------|----------------|--------|
| `provider.name` | `"mediapipe"` | hardcoded in `ExercisePoseCameraView.kt` |
| `provider.modelVersion` | `"pose_landmarker_lite.task"` | matches the model asset filename |
| `provider.delegate` | `"CPU"` (M0 default) | configurable via `PoseProviderConfig.delegate` |
| `provider.inferenceMs` | measured per-frame | reported by MediaPipe `PoseLandmarkerResult` callback |

## Health Counters

The native module tracks bounded scalar counters in `PoseCameraRecords.kt`, emitted as `PoseProviderStatus.health`:

| Counter | Meaning |
|---------|---------|
| `providerLoadAttempts` | number of times the PoseLandmarker model was loaded |
| `providerLoadFailures` | number of failed model loads |
| `framesReceived` | ImageAnalysis frames received from CameraX |
| `framesSubmitted` | frames submitted to MediaPipe for inference |
| `framesDropped` | frames dropped due to KEEP_ONLY_LATEST backpressure |
| `observationsProduced` | total PoseObservation results emitted |
| `observationsWithLandmarks` | observations where `landmarksAvailable === true` |
| `observationsWithoutLandmarks` | observations where `landmarksAvailable === false` |
| `providerErrors` | number of inference errors |
| `trackingLossCount` | transitions from landmarks-available to landmarks-unavailable |
| `lastSequence` | last observation sequence number |
| `lastFrameId` | last CameraX frame ID |
| `lastTimestampMs` | last observation timestamp |
| `lastInferenceMs` | last inference duration in milliseconds |

## Adapter Responsibilities

The adapter (`poseEventAdapters.ts`) performs these conversions:

1. **Rotation normalization**: `normalizeRotation()` maps any numeric rotation to `0 | 90 | 180 | 270` via modular arithmetic
2. **Delegate normalization**: `normalizeDelegate()` maps any string to the `PoseDelegate` enum, defaulting to `UNKNOWN`
3. **Null coalescing**: `visibility` and `presence` from native may be `null`; the adapter converts to `undefined`
4. **Landmark name passthrough**: landmark names are already canonical (matching `LANDMARK_NAMES`), so no remapping is needed
5. **People array**: MediaPipe live-stream mode produces a single-person result; the adapter wraps it in a 1-element `people` array

## Provider Neutrality

The contract is designed so that replacing MediaPipe with another provider (ONNX Runtime, platform-native ML, custom model) requires only:

1. A new adapter that maps the provider's output to `PoseObservation`
2. A new `LandmarkNames` mapping if the provider uses different landmark ordering
3. Updated `provider.name` and `provider.modelVersion` fields

No downstream analysis code (normalization, metrics, phase FSM, rep detection, rules, feedback) needs to change.

## Conformance Requirements

A provider is M0-conformant if:

- [x] It emits all 33 canonical landmarks (or none when tracking is lost)
- [x] It provides monotonic timestamps
- [x] It reports image dimensions and rotation metadata
- [x] It reports inference timing
- [x] It reports delegate identity (CPU/GPU/NPU)
- [x] It exposes health counters for dropped frames and tracking loss
- [x] Raw frames are not stored, logged, or transmitted
- [x] The adapter produces observations that pass `validatePoseObservation()`

## M0 Evidence

- M0-C Stage 3 evidence confirms the end-to-end pipeline: CameraX → ImageAnalysis → MediaPipe → PoseObservation
- M0-D adds contract validation and conformance testing
- M0-P will verify the privacy constraints (frames local and transient)
