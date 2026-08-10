import { describe, expect, it } from 'vitest';

import { LANDMARK_COUNT, LANDMARK_NAMES } from './poseContract';
import { adaptNativePoseObservation } from './poseEventAdapters';
import { validatePoseObservation } from './poseValidation';

function makeCanonicalLandmarks() {
  return LANDMARK_NAMES.map((name, index) => ({
    name,
    x: 0.1 + index * 0.001,
    y: 0.2 + index * 0.001,
    z: index * 0.01,
    visibility: 0.9,
    presence: 0.95,
  }));
}

describe('MediaPipe canonical provider conformance', () => {
  it('adapts a full canonical landmark set that validates as PoseObservation', () => {
    const observation = adaptNativePoseObservation({
      sequence: 12,
      timestampMs: 1200,
      landmarksAvailable: true,
      landmarkCount: LANDMARK_COUNT,
      frameId: 12,
      imageSize: { width: 1280, height: 720 },
      rotationDegrees: 0,
      mirrored: false,
      people: [
        {
          trackingId: 'person-0',
          imageLandmarks: makeCanonicalLandmarks(),
          worldLandmarks: makeCanonicalLandmarks(),
          posePresence: 0.99,
        },
      ],
      provider: {
        name: 'mediapipe',
        modelVersion: 'mediapipe-pose-landmarker-lite@1.0.0',
        delegate: 'CPU',
        inferenceMs: 6,
      },
    });

    expect(observation.people[0]?.imageLandmarks).toHaveLength(LANDMARK_COUNT);
    expect(
      observation.people[0]?.imageLandmarks.map((landmark) => landmark.name),
    ).toEqual(LANDMARK_NAMES);
    expect(validatePoseObservation(observation)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('fails closed at the validation boundary when landmarkCount metadata mismatches the canonical payload', () => {
    const observation = adaptNativePoseObservation({
      sequence: 13,
      timestampMs: 1300,
      landmarksAvailable: true,
      landmarkCount: LANDMARK_COUNT - 1,
      frameId: 13,
      imageSize: { width: 1280, height: 720 },
      rotationDegrees: 180,
      mirrored: false,
      people: [
        {
          imageLandmarks: makeCanonicalLandmarks(),
          posePresence: 0.99,
        },
      ],
      provider: {
        name: 'mediapipe',
        modelVersion: 'mediapipe-pose-landmarker-lite@1.0.0',
        delegate: 'CPU',
        inferenceMs: 6,
      },
    });

    const validation = validatePoseObservation(observation);
    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) => error.includes('landmarkCount')),
    ).toBe(true);
  });
});
