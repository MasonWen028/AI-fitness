import { describe, expect, it } from 'vitest';

import { createSyntheticObservation } from '../pose/poseValidation';
import {
  isTrackableObservation,
  shouldAdvanceAnalysis,
  shouldAttemptTrackingReacquisition,
  shouldEnterManualFallbackFromProviderMessage,
  shouldKeepNativeCameraActive,
} from './cameraRuntime';

describe('cameraRuntime', () => {
  it('keeps the native camera active only for setup and live tracking states', () => {
    expect(shouldKeepNativeCameraActive('READY_TO_SETUP')).toBe(false);
    expect(shouldKeepNativeCameraActive('POSITIONING')).toBe(true);
    expect(shouldKeepNativeCameraActive('CALIBRATING')).toBe(true);
    expect(shouldKeepNativeCameraActive('READY')).toBe(true);
    expect(shouldKeepNativeCameraActive('COUNTDOWN')).toBe(true);
    expect(shouldKeepNativeCameraActive('ACTIVE')).toBe(true);
    expect(shouldKeepNativeCameraActive('TRACKING_LOST')).toBe(true);
    expect(shouldKeepNativeCameraActive('PAUSED')).toBe(false);
    expect(shouldKeepNativeCameraActive('SET_COMPLETE')).toBe(false);
    expect(shouldKeepNativeCameraActive('MANUAL_FALLBACK')).toBe(false);
    expect(shouldKeepNativeCameraActive('ERROR')).toBe(false);
  });

  it('advances phase and reps only while ACTIVE', () => {
    expect(shouldAdvanceAnalysis('COUNTDOWN')).toBe(false);
    expect(shouldAdvanceAnalysis('ACTIVE')).toBe(true);
    expect(shouldAdvanceAnalysis('TRACKING_LOST')).toBe(false);
    expect(shouldAdvanceAnalysis('PAUSED')).toBe(false);
  });

  it('attempts tracking reacquisition only while TRACKING_LOST', () => {
    expect(shouldAttemptTrackingReacquisition('ACTIVE')).toBe(false);
    expect(shouldAttemptTrackingReacquisition('TRACKING_LOST')).toBe(true);
  });

  it('detects manual-fallback provider failures from integrity and manifest errors', () => {
    expect(
      shouldEnterManualFallbackFromProviderMessage(
        'Model integrity mismatch detected',
      ),
    ).toBe(true);
    expect(
      shouldEnterManualFallbackFromProviderMessage(
        'pose model manifest missing',
      ),
    ).toBe(true);
    expect(
      shouldEnterManualFallbackFromProviderMessage(
        'Unsupported rotationDegrees: 45',
      ),
    ).toBe(true);
    expect(
      shouldEnterManualFallbackFromProviderMessage(
        'temporary camera interruption',
      ),
    ).toBe(false);
  });

  it('treats canonical observations with required landmarks as trackable', () => {
    const observation = createSyntheticObservation(1, {
      left_hip: { x: 0.4, y: 0.6, visibility: 0.9 },
      right_hip: { x: 0.6, y: 0.6, visibility: 0.9 },
      left_knee: { x: 0.4, y: 0.75, visibility: 0.9 },
      right_knee: { x: 0.6, y: 0.75, visibility: 0.9 },
      left_ankle: { x: 0.4, y: 0.9, visibility: 0.9 },
      right_ankle: { x: 0.6, y: 0.9, visibility: 0.9 },
      left_shoulder: { x: 0.42, y: 0.35, visibility: 0.9 },
      right_shoulder: { x: 0.58, y: 0.35, visibility: 0.9 },
    });

    expect(isTrackableObservation(observation)).toBe(true);
  });

  it('rejects observations that fail canonical validation or required-quality checks', () => {
    const invalid = createSyntheticObservation(1, {
      left_hip: { x: Number.NaN, y: 0.6, visibility: 0.9 },
      right_hip: { x: 0.6, y: 0.6, visibility: 0.9 },
    });

    expect(isTrackableObservation(invalid)).toBe(false);
  });
});
