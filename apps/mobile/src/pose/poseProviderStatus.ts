export type PoseProviderHealth = {
  providerLoadAttempts: number;
  providerLoadFailures: number;
  framesReceived: number;
  framesSubmitted: number;
  framesDropped: number;
  observationsProduced: number;
  observationsWithLandmarks: number;
  observationsWithoutLandmarks: number;
  providerErrors: number;
  trackingLossCount: number;
  lastSequence: number;
  lastFrameId: number;
  lastTimestampMs: number;
  lastInferenceMs: number;
};

export type PoseProviderStatus = {
  isAvailable: boolean;
  providerName: string;
  modelVersion: string;
  delegate: 'CPU' | 'GPU' | 'NPU' | 'UNKNOWN';
  isRunning: boolean;
  lastError?: string;
  health: PoseProviderHealth;
};

const EMPTY_HEALTH: PoseProviderHealth = {
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
};

export function getUnavailablePoseProviderStatus(
  platformOs: string,
): PoseProviderStatus {
  return {
    isAvailable: false,
    providerName: 'mediapipe',
    modelVersion: 'mediapipe-pose-landmarker-lite@1.0.0',
    delegate: 'UNKNOWN',
    isRunning: false,
    lastError:
      platformOs === 'android'
        ? 'Native pose provider module is unavailable.'
        : 'M0-C pose provider is Android-only in this branch.',
    health: EMPTY_HEALTH,
  };
}
