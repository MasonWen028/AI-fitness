import { describe, expect, it } from 'vitest';

import {
  deriveInitialCameraState,
  reduceCameraScreenState,
} from './cameraState';

describe('CameraPreviewScreen lifecycle integration seam', () => {
  it('does not reach preview_active before explicit start', () => {
    const granted = reduceCameraScreenState(deriveInitialCameraState(), {
      type: 'permission_snapshot',
      snapshot: {
        isLoading: false,
        granted: true,
        canAskAgain: false,
      },
    });

    expect(granted.lifecycle).toBe('ready_to_setup');
    expect(granted.canShowPreview).toBe(false);
  });
});
