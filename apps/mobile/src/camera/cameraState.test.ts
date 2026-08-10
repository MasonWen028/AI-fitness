import { describe, expect, it } from 'vitest';

import {
  deriveInitialCameraState,
  reduceCameraScreenState,
  type CameraScreenState,
} from './cameraState';

function grantedReadyToSetupState(): CameraScreenState {
  return reduceCameraScreenState(deriveInitialCameraState(), {
    type: 'permission_snapshot',
    snapshot: {
      isLoading: false,
      granted: true,
      canAskAgain: false,
    },
  });
}

describe('cameraState', () => {
  it('keeps the screen unavailable while permission loads', () => {
    expect(
      reduceCameraScreenState(deriveInitialCameraState(), {
        type: 'permission_snapshot',
        snapshot: null,
      }),
    ).toEqual(deriveInitialCameraState());
  });

  it('enables setup once permission is granted', () => {
    expect(grantedReadyToSetupState()).toMatchObject({
      permission: 'granted',
      lifecycle: 'READY_TO_SETUP',
      canShowPreview: false,
      canRequestPermission: false,
      shouldShowManualFallback: true,
      cause: 'supported_profile_available',
    });
  });

  it('does not mount preview merely because permission is granted', () => {
    expect(grantedReadyToSetupState()).toMatchObject({
      lifecycle: 'READY_TO_SETUP',
      canShowPreview: false,
    });
  });

  it('keeps permission request available when access is undetermined', () => {
    expect(
      reduceCameraScreenState(deriveInitialCameraState(), {
        type: 'permission_snapshot',
        snapshot: {
          isLoading: false,
          granted: false,
          canAskAgain: true,
        },
      }),
    ).toMatchObject({
      permission: 'undetermined',
      lifecycle: 'READY_TO_SETUP',
      canRequestPermission: true,
      shouldShowManualFallback: true,
    });
  });

  it('routes denied permission to manual fallback', () => {
    expect(
      reduceCameraScreenState(deriveInitialCameraState(), {
        type: 'permission_snapshot',
        snapshot: {
          isLoading: false,
          granted: false,
          canAskAgain: false,
        },
      }),
    ).toMatchObject({
      permission: 'denied',
      lifecycle: 'MANUAL_FALLBACK',
      shouldShowManualFallback: true,
      cause: 'permission_denied',
    });
  });

  it('accepts every permitted lifecycle transition', () => {
    const transitions = [
      [
        'READY_TO_SETUP',
        { type: 'request_permission_started' },
        'REQUESTING_PERMISSION',
      ],
      ['READY_TO_SETUP', { type: 'start_setup' }, 'POSITIONING'],
      ['POSITIONING', { type: 'setup_quality_eligible' }, 'CALIBRATING'],
      ['CALIBRATING', { type: 'calibration_passed' }, 'READY'],
      [
        'CALIBRATING',
        { type: 'calibration_recoverable_failure' },
        'POSITIONING',
      ],
      ['READY', { type: 'start_countdown' }, 'COUNTDOWN'],
      ['COUNTDOWN', { type: 'countdown_completed' }, 'ACTIVE'],
      ['COUNTDOWN', { type: 'countdown_paused' }, 'PAUSED'],
      ['COUNTDOWN', { type: 'countdown_quality_lost' }, 'POSITIONING'],
      ['ACTIVE', { type: 'tracking_lost' }, 'TRACKING_LOST'],
      ['TRACKING_LOST', { type: 'tracking_reacquired' }, 'ACTIVE'],
      ['ACTIVE', { type: 'pause_requested' }, 'PAUSED'],
      ['TRACKING_LOST', { type: 'pause_requested' }, 'PAUSED'],
      ['PAUSED', { type: 'resume_requested' }, 'COUNTDOWN'],
      ['ACTIVE', { type: 'set_completed' }, 'SET_COMPLETE'],
      ['TRACKING_LOST', { type: 'set_completed' }, 'SET_COMPLETE'],
      ['PAUSED', { type: 'set_completed' }, 'SET_COMPLETE'],
      ['ACTIVE', { type: 'technical_error' }, 'ERROR'],
      ['TRACKING_LOST', { type: 'technical_error' }, 'ERROR'],
      ['ERROR', { type: 'retry_setup' }, 'READY_TO_SETUP'],
    ] as const;

    const seedState = (
      lifecycle: CameraScreenState['lifecycle'],
    ): CameraScreenState => ({
      permission: 'granted',
      lifecycle,
      cause: 'supported_profile_available',
      canShowPreview: false,
      canRequestPermission: false,
      shouldShowManualFallback: true,
      statusMessage: '',
    });

    for (const [from, event, expected] of transitions) {
      const next = reduceCameraScreenState(seedState(from), event as never);
      expect(next.lifecycle).toBe(expected);
    }
  });

  it('rejects unspecified lifecycle transitions', () => {
    const paused = {
      permission: 'granted',
      lifecycle: 'PAUSED',
      cause: 'lifecycle_interruption',
      canShowPreview: false,
      canRequestPermission: false,
      shouldShowManualFallback: true,
      statusMessage: '',
    } satisfies CameraScreenState;

    expect(
      reduceCameraScreenState(paused, { type: 'countdown_completed' }),
    ).toEqual(paused);
  });

  it('returns to setup when active permission is revoked but request remains possible', () => {
    const active = reduceCameraScreenState(
      reduceCameraScreenState(
        reduceCameraScreenState(
          reduceCameraScreenState(grantedReadyToSetupState(), {
            type: 'start_setup',
          }),
          { type: 'setup_quality_eligible' },
        ),
        { type: 'calibration_passed' },
      ),
      { type: 'start_countdown' },
    );
    const counting = reduceCameraScreenState(active, {
      type: 'countdown_completed',
    });

    expect(
      reduceCameraScreenState(counting, {
        type: 'permission_snapshot',
        snapshot: {
          isLoading: false,
          granted: false,
          canAskAgain: true,
        },
      }),
    ).toMatchObject({
      permission: 'undetermined',
      lifecycle: 'READY_TO_SETUP',
      canShowPreview: false,
      canRequestPermission: true,
    });
  });

  it('supports explicit manual fallback from setup states', () => {
    expect(
      reduceCameraScreenState(grantedReadyToSetupState(), {
        type: 'enter_manual_fallback',
      }),
    ).toMatchObject({
      lifecycle: 'MANUAL_FALLBACK',
      canShowPreview: false,
      shouldShowManualFallback: true,
    });
  });
});
