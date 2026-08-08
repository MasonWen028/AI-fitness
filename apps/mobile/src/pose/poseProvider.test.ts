import { describe, expect, it } from 'vitest';

import { getUnavailablePoseProviderStatus } from './poseProviderStatus';

describe('poseProvider', () => {
  it('returns a stable unavailable status when the native provider is missing', () => {
    expect(getUnavailablePoseProviderStatus('ios')).toEqual({
      isAvailable: false,
      providerName: 'mediapipe',
      modelVersion: 'pose_landmarker_lite.task',
      delegate: 'UNKNOWN',
      isRunning: false,
      lastError: 'M0-C pose provider is Android-only in this branch.',
      health: {
        providerLoadAttempts: 0,
        providerLoadFailures: 0,
        framesReceived: 0,
        framesSubmitted: 0,
        framesDropped: 0,
        observationsProduced: 0,
        observationsWithLandmarks: 0,
        observationsWithoutLandmarks: 0,
        providerErrors: 0,
        trackingLossCount: 0,
        lastSequence: 0,
        lastFrameId: 0,
        lastTimestampMs: 0,
        lastInferenceMs: 0,
      },
    });
  });
});
