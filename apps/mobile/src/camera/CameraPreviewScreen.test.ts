import { describe, expect, it } from 'vitest';

import { buildSkeletonSegments } from '../ui/skeletonOverlayGeometry';
import { createSyntheticObservation } from '../pose/poseValidation';
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

  it('supports bounded overlay rendering from the frozen PoseObservation contract', () => {
    const observation = createSyntheticObservation(10, {
      left_shoulder: { x: 0.2, y: 0.2 },
      right_shoulder: { x: 0.8, y: 0.2 },
      left_hip: { x: 0.3, y: 0.5 },
      right_hip: { x: 0.7, y: 0.5 },
      left_knee: { x: 0.35, y: 0.75 },
      right_knee: { x: 0.65, y: 0.75 },
      left_ankle: { x: 0.35, y: 0.95 },
      right_ankle: { x: 0.65, y: 0.95 },
    });

    const segments = buildSkeletonSegments(observation, 320, 480);

    expect(segments.length).toBeGreaterThan(0);
    expect(segments.every((segment) => segment.start.x >= 0 && segment.start.x <= 320)).toBe(true);
    expect(segments.every((segment) => segment.end.y >= 0 && segment.end.y <= 480)).toBe(true);
  });
});
