import { describe, expect, it } from 'vitest';

import {
  deriveInitialCameraState,
  reduceCameraScreenState,
  type CameraScreenState,
} from './cameraState';

function grantedState(): CameraScreenState {
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
    expect(grantedState()).toMatchObject({
      permission: 'granted',
      lifecycle: 'ready_to_setup',
      canShowPreview: false,
      canRequestPermission: false,
      shouldShowManualFallback: false,
    });
  });

  it('does not mount preview merely because permission is granted', () => {
    expect(grantedState()).toMatchObject({
      lifecycle: 'ready_to_setup',
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
      lifecycle: 'ready_to_setup',
      canRequestPermission: true,
      shouldShowManualFallback: false,
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
      lifecycle: 'permission_denied',
      shouldShowManualFallback: true,
    });
  });

  it('requires explicit preview start before preview becomes active', () => {
    const readyToSetup = grantedState();

    expect(readyToSetup).toMatchObject({
      lifecycle: 'ready_to_setup',
      canShowPreview: false,
    });

    expect(
      reduceCameraScreenState(readyToSetup, {
        type: 'start_preview',
      }),
    ).toMatchObject({
      lifecycle: 'preview_active',
      canShowPreview: true,
      shouldShowManualFallback: false,
    });
  });

  it('ignores camera_ready until preview has already been activated', () => {
    const readyToSetup = grantedState();

    expect(
      reduceCameraScreenState(readyToSetup, {
        type: 'camera_ready',
      }),
    ).toEqual(readyToSetup);
  });

  it('preserves manual fallback on repeated granted permission snapshots', () => {
    const manualFallback = reduceCameraScreenState(grantedState(), {
      type: 'enter_manual_fallback',
    });

    expect(
      reduceCameraScreenState(manualFallback, {
        type: 'permission_snapshot',
        snapshot: {
          isLoading: false,
          granted: true,
          canAskAgain: false,
        },
      }),
    ).toMatchObject({
      permission: 'granted',
      lifecycle: 'manual_fallback',
      canShowPreview: false,
      shouldShowManualFallback: true,
    });
  });

  it('preserves preview interruption on repeated granted permission snapshots', () => {
    const interrupted = reduceCameraScreenState(grantedState(), {
      type: 'camera_interrupted',
      reason: 'backgrounded',
    });

    expect(
      reduceCameraScreenState(interrupted, {
        type: 'permission_snapshot',
        snapshot: {
          isLoading: false,
          granted: true,
          canAskAgain: false,
        },
      }),
    ).toMatchObject({
      permission: 'granted',
      lifecycle: 'preview_interrupted',
      canShowPreview: false,
      shouldShowManualFallback: true,
    });
  });

  it('exits active preview safely if permission is revoked but can still be requested', () => {
    const activePreview = reduceCameraScreenState(grantedState(), {
      type: 'start_preview',
    });

    expect(
      reduceCameraScreenState(activePreview, {
        type: 'permission_snapshot',
        snapshot: {
          isLoading: false,
          granted: false,
          canAskAgain: true,
        },
      }),
    ).toMatchObject({
      permission: 'undetermined',
      lifecycle: 'ready_to_setup',
      canShowPreview: false,
      canRequestPermission: true,
    });
  });

  it('exits active preview safely if permission is revoked and cannot be requested again', () => {
    const activePreview = reduceCameraScreenState(grantedState(), {
      type: 'start_preview',
    });

    expect(
      reduceCameraScreenState(activePreview, {
        type: 'permission_snapshot',
        snapshot: {
          isLoading: false,
          granted: false,
          canAskAgain: false,
        },
      }),
    ).toMatchObject({
      permission: 'denied',
      lifecycle: 'permission_denied',
      canShowPreview: false,
      shouldShowManualFallback: true,
    });
  });

  it('moves to interruption state when the active preview is backgrounded', () => {
    const activePreview = reduceCameraScreenState(grantedState(), {
      type: 'start_preview',
    });

    expect(
      reduceCameraScreenState(activePreview, {
        type: 'camera_interrupted',
        reason: 'backgrounded',
      }),
    ).toMatchObject({
      lifecycle: 'preview_interrupted',
      canShowPreview: false,
      shouldShowManualFallback: true,
    });
  });

  it('allows explicit manual fallback from any state', () => {
    expect(
      reduceCameraScreenState(grantedState(), {
        type: 'enter_manual_fallback',
      }),
    ).toMatchObject({
      lifecycle: 'manual_fallback',
      canShowPreview: false,
      shouldShowManualFallback: true,
    });
  });
});
