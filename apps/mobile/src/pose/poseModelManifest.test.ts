import { describe, expect, it } from 'vitest';

import {
  DEFAULT_POSE_MODEL_ASSET_PATH,
  DEFAULT_POSE_MODEL_MANIFEST_ASSET,
  DEFAULT_POSE_MODEL_SHA256,
  DEFAULT_POSE_MODEL_VERSION,
} from './poseModelManifest';
import { shouldEnterManualFallbackFromProviderMessage } from '../camera/cameraRuntime';

describe('poseModelManifest', () => {
  it('exports the manifest-backed canonical model identity', () => {
    expect(DEFAULT_POSE_MODEL_MANIFEST_ASSET).toBe('pose_model_manifest.json');
    expect(DEFAULT_POSE_MODEL_ASSET_PATH).toBe('pose_landmarker_lite.task');
    expect(DEFAULT_POSE_MODEL_VERSION).toBe(
      'mediapipe-pose-landmarker-lite@1.0.0',
    );
    expect(DEFAULT_POSE_MODEL_SHA256).toMatch(/^[A-F0-9]{64}$/);
  });

  it('treats integrity mismatch as a fail-safe manual-fallback condition', () => {
    expect(
      shouldEnterManualFallbackFromProviderMessage(
        `Model integrity mismatch for ${DEFAULT_POSE_MODEL_ASSET_PATH}: expected ${DEFAULT_POSE_MODEL_SHA256}`,
      ),
    ).toBe(true);
  });
});
