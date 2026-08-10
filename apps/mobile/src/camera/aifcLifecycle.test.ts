import { describe, expect, it } from 'vitest';

import {
  deriveInitialCameraState,
  reduceCameraScreenState,
  type CameraScreenState,
} from './cameraState';
import {
  shouldAdvanceAnalysis,
  shouldKeepNativeCameraActive,
} from './cameraRuntime';

function withLifecycle(
  lifecycle: CameraScreenState['lifecycle'],
): CameraScreenState {
  return {
    permission: 'granted',
    lifecycle,
    cause: 'supported_profile_available',
    canShowPreview: false,
    canRequestPermission: false,
    shouldShowManualFallback: true,
    statusMessage: '',
  };
}

describe('AIFC lifecycle', () => {
  it('COUNTDOWN cannot count reps because analysis advancement is disabled', () => {
    expect(shouldAdvanceAnalysis('COUNTDOWN')).toBe(false);
  });

  it('non-ACTIVE states cannot advance phase or rep engines', () => {
    for (const lifecycle of [
      'UNAVAILABLE',
      'READY_TO_SETUP',
      'REQUESTING_PERMISSION',
      'POSITIONING',
      'CALIBRATING',
      'READY',
      'COUNTDOWN',
      'TRACKING_LOST',
      'PAUSED',
      'SET_COMPLETE',
      'ERROR',
      'MANUAL_FALLBACK',
    ] as const) {
      expect(shouldAdvanceAnalysis(lifecycle)).toBe(false);
    }
    expect(shouldAdvanceAnalysis('ACTIVE')).toBe(true);
  });

  it('terminal states release native camera activity', () => {
    expect(shouldKeepNativeCameraActive('SET_COMPLETE')).toBe(false);
    expect(shouldKeepNativeCameraActive('MANUAL_FALLBACK')).toBe(false);
    expect(shouldKeepNativeCameraActive('ERROR')).toBe(false);
  });

  it('supports TRACKING_LOST recovery only through the permitted transition', () => {
    const active = withLifecycle('ACTIVE');
    const lost = reduceCameraScreenState(active, { type: 'tracking_lost' });
    const recovered = reduceCameraScreenState(lost, {
      type: 'tracking_reacquired',
    });

    expect(lost.lifecycle).toBe('TRACKING_LOST');
    expect(recovered.lifecycle).toBe('ACTIVE');
  });

  it('rejects unspecified transitions such as TRACKING_LOST -> READY', () => {
    const lost = withLifecycle('TRACKING_LOST');
    expect(
      reduceCameraScreenState(lost, { type: 'calibration_passed' }),
    ).toEqual(lost);
  });

  it('routes permission denial to manual fallback without losing the lifecycle model', () => {
    const requesting = reduceCameraScreenState(deriveInitialCameraState(), {
      type: 'permission_snapshot',
      snapshot: {
        isLoading: false,
        granted: true,
        canAskAgain: false,
      },
    });
    const started = reduceCameraScreenState(requesting, {
      type: 'request_permission_started',
    });
    const denied = reduceCameraScreenState(started, {
      type: 'permission_snapshot',
      snapshot: {
        isLoading: false,
        granted: false,
        canAskAgain: false,
      },
    });

    expect(denied.lifecycle).toBe('MANUAL_FALLBACK');
    expect(denied.cause).toBe('permission_denied');
  });
});
