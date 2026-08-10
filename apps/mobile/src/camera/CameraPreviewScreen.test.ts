import { describe, expect, it } from 'vitest';

import { shouldKeepNativeCameraActive } from './cameraRuntime';
import {
  deriveInitialCameraState,
  reduceCameraScreenState,
} from './cameraState';

describe('CameraPreviewScreen lifecycle integration seam', () => {
  it('does not reach active tracking before explicit setup and countdown flow', () => {
    const granted = reduceCameraScreenState(deriveInitialCameraState(), {
      type: 'permission_snapshot',
      snapshot: {
        isLoading: false,
        granted: true,
        canAskAgain: false,
      },
    });

    expect(granted.lifecycle).toBe('READY_TO_SETUP');
    expect(granted.canShowPreview).toBe(false);
  });

  it('activates native camera from lifecycle state instead of permission alone', () => {
    const ready = reduceCameraScreenState(deriveInitialCameraState(), {
      type: 'permission_snapshot',
      snapshot: {
        isLoading: false,
        granted: true,
        canAskAgain: false,
      },
    });
    const positioning = reduceCameraScreenState(ready, { type: 'start_setup' });
    const paused = reduceCameraScreenState(
      reduceCameraScreenState(
        reduceCameraScreenState(
          reduceCameraScreenState(positioning, {
            type: 'setup_quality_eligible',
          }),
          { type: 'calibration_passed' },
        ),
        { type: 'start_countdown' },
      ),
      { type: 'countdown_paused' },
    );

    expect(shouldKeepNativeCameraActive(ready.lifecycle)).toBe(false);
    expect(shouldKeepNativeCameraActive(positioning.lifecycle)).toBe(true);
    expect(shouldKeepNativeCameraActive(paused.lifecycle)).toBe(false);
  });
});
