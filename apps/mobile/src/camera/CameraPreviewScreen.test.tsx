import { describe, expect, it } from 'vitest';

import {
  deriveInitialCameraState,
  reduceCameraScreenState,
} from './cameraState';

describe('CameraPreviewScreen lifecycle integration seam', () => {
  it('does not reach ACTIVE or preview enablement before explicit setup flow', () => {
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
});
