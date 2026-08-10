import { describe, expect, it } from 'vitest';

import { adaptNativePoseObservation } from './poseEventAdapters';

describe('poseEventAdapters', () => {
  it('preserves monotonic sequence and no-pose availability without fabricating landmarks', () => {
    const observation = adaptNativePoseObservation({
      sequence: 41,
      timestampMs: 1000,
      landmarksAvailable: false,
      landmarkCount: 0,
      frameId: 9,
      imageSize: { width: 640, height: 480 },
      rotationDegrees: 90,
      mirrored: false,
      people: [
        {
          imageLandmarks: [],
          worldLandmarks: [],
          posePresence: 0,
        },
      ],
      provider: {
        name: 'mediapipe',
        modelVersion: 'mediapipe-pose-landmarker-lite@1.0.0',
        delegate: 'CPU',
        inferenceMs: 8,
      },
    });

    expect(observation.sequence).toBe(41);
    expect(observation.landmarksAvailable).toBe(false);
    expect(observation.landmarkCount).toBe(0);
    expect(observation.people[0].imageLandmarks).toEqual([]);
    expect(observation.rotationDegrees).toBe(90);
  });

  it('rejects invalid canonical rotation values instead of coercing them to portrait', () => {
    expect(() =>
      adaptNativePoseObservation({
        sequence: 1,
        timestampMs: 1000,
        landmarksAvailable: false,
        landmarkCount: 0,
        frameId: 1,
        imageSize: { width: 640, height: 480 },
        rotationDegrees: 45,
        mirrored: false,
        people: [{ imageLandmarks: [], posePresence: 0 }],
        provider: {
          name: 'mediapipe',
          modelVersion: 'mediapipe-pose-landmarker-lite@1.0.0',
          delegate: 'CPU',
          inferenceMs: 5,
        },
      }),
    ).toThrow(/Invalid canonical rotationDegrees/i);
  });
});
