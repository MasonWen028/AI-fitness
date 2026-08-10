import { describe, expect, it } from 'vitest';

import type { LandmarkName } from './poseContract';
import { LANDMARK_COUNT, LANDMARK_NAMES } from './poseContract';
import {
  assertValidPoseObservation,
  createEmptyObservation,
  createSyntheticObservation,
  getLandmarkByName,
  getLandmarksByNames,
  hasCriticalLandmarks,
  validatePoseObservation,
} from './poseValidation';

describe('validatePoseObservation', () => {
  it('accepts a valid observation with landmarks', () => {
    const obs = createSyntheticObservation(1, {
      left_hip: { x: 0.6, y: 0.6, z: 0, visibility: 0.9 },
      right_hip: { x: 0.4, y: 0.6, z: 0, visibility: 0.9 },
    });
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts a valid observation without landmarks', () => {
    const obs = createEmptyObservation({ sequence: 5 });
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects non-object input', () => {
    expect(validatePoseObservation(null).valid).toBe(false);
    expect(validatePoseObservation(undefined).valid).toBe(false);
    expect(validatePoseObservation('string').valid).toBe(false);
    expect(validatePoseObservation(42).valid).toBe(false);
  });

  it('rejects negative sequence', () => {
    const obs = createEmptyObservation({ sequence: -1 });
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('sequence'))).toBe(true);
  });

  it('rejects non-finite sequence (NaN/Infinity)', () => {
    const obs = createEmptyObservation({ sequence: NaN });
    expect(validatePoseObservation(obs).valid).toBe(false);
  });

  it('rejects negative timestampMs', () => {
    const obs = createEmptyObservation({ timestampMs: -1 });
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('timestampMs'))).toBe(true);
  });

  it('rejects invalid rotationDegrees', () => {
    const obs = createEmptyObservation({
      rotationDegrees: 45 as 0 | 90 | 180 | 270,
    });
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('rotationDegrees'))).toBe(true);
  });

  it('rejects zero or negative imageSize dimensions', () => {
    const obs = createEmptyObservation({
      imageSize: { width: 0, height: 480 },
    });
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('imageSize.width'))).toBe(true);
  });

  it('rejects landmarkCount exceeding LANDMARK_COUNT', () => {
    const obs = createEmptyObservation({ landmarkCount: 99 });
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('landmarkCount'))).toBe(true);
  });

  it('rejects invalid provider delegate', () => {
    const obs = createEmptyObservation({
      provider: {
        name: 'test',
        modelVersion: '1',
        delegate: 'TPU' as never,
        inferenceMs: 10,
      },
    });
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('delegate'))).toBe(true);
  });

  it('rejects empty provider name', () => {
    const obs = createEmptyObservation({
      provider: {
        name: '',
        modelVersion: '1',
        delegate: 'CPU',
        inferenceMs: 10,
      },
    });
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('provider.name'))).toBe(true);
  });

  it('rejects negative provider inferenceMs', () => {
    const obs = createEmptyObservation({
      provider: {
        name: 'test',
        modelVersion: '1',
        delegate: 'CPU',
        inferenceMs: -5,
      },
    });
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('inferenceMs'))).toBe(true);
  });

  it('rejects posePresence outside 0..1', () => {
    const obs = createSyntheticObservation(1, { nose: { x: 0.5, y: 0.5 } });
    obs.people[0]!.posePresence = 1.5;
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('posePresence'))).toBe(true);
  });

  it('rejects invalid landmark names', () => {
    const obs = createEmptyObservation({
      people: [
        {
          imageLandmarks: [{ name: 'invalid_name', x: 0, y: 0 } as never],
          posePresence: 0.9,
        },
      ],
    });
    obs.landmarksAvailable = true;
    obs.landmarkCount = 1;
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('LandmarkName'))).toBe(true);
  });

  it('rejects non-finite landmark coordinates', () => {
    const obs = createSyntheticObservation(1, { nose: { x: 0.5, y: 0.5 } });
    obs.people[0]!.imageLandmarks[0]!.x = Number.NaN;
    obs.landmarksAvailable = true;
    obs.landmarkCount = 1;
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('.x'))).toBe(true);
  });

  it('rejects out-of-range visibility', () => {
    const obs = createSyntheticObservation(1, { nose: { x: 0.5, y: 0.5 } });
    obs.people[0]!.imageLandmarks[0]!.visibility = 2;
    obs.landmarksAvailable = true;
    obs.landmarkCount = 1;
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('visibility'))).toBe(true);
  });

  it('accepts optional presence in range', () => {
    const obs = createSyntheticObservation(1, { nose: { x: 0.5, y: 0.5 } });
    obs.people[0]!.imageLandmarks[0]!.presence = 0.8;
    obs.landmarksAvailable = true;
    obs.landmarkCount = LANDMARK_COUNT;
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(true);
  });

  it('accepts missing worldLandmarks', () => {
    const obs = createSyntheticObservation(1, { nose: { x: 0.5, y: 0.5 } });
    expect(obs.people[0]!.worldLandmarks).toBeUndefined();
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(true);
  });

  it('accepts worldLandmarks when present', () => {
    const obs = createSyntheticObservation(1, { nose: { x: 0.5, y: 0.5 } });
    obs.people[0]!.worldLandmarks = obs.people[0]!.imageLandmarks;
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(true);
  });

  it('collects multiple errors at once', () => {
    const result = validatePoseObservation({
      sequence: -1,
      timestampMs: -1,
      landmarksAvailable: 'yes',
      landmarkCount: -1,
      frameId: NaN,
      imageSize: { width: 0, height: -1 },
      rotationDegrees: 45,
      mirrored: 'no',
      people: 'bad',
      provider: {
        name: '',
        modelVersion: '',
        delegate: 'TPU',
        inferenceMs: -1,
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(3);
  });

  it('rejects adapter boundary mismatch where landmarkCount does not match canonical people payload', () => {
    const obs = createSyntheticObservation(1, {
      nose: { x: 0.5, y: 0.5 },
      left_hip: { x: 0.4, y: 0.6 },
      right_hip: { x: 0.6, y: 0.6 },
    });
    obs.landmarkCount = LANDMARK_COUNT - 1;

    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes('landmarkCount'))).toBe(
      true,
    );
  });
});

describe('pose contract helpers', () => {
  it('produces a valid observation', () => {
    const obs = createEmptyObservation();
    expect(validatePoseObservation(obs).valid).toBe(true);
  });

  it('creates a full synthetic observation when landmarks are provided', () => {
    const obs = createSyntheticObservation(7, {
      left_hip: { x: 0.6, y: 0.6 },
      right_hip: { x: 0.4, y: 0.6 },
    });

    expect(obs.landmarkCount).toBe(LANDMARK_COUNT);
    expect(obs.people[0]!.imageLandmarks).toHaveLength(LANDMARK_COUNT);
  });

  it('finds landmarks by name', () => {
    const obs = createSyntheticObservation(1, {
      left_knee: { x: 0.4, y: 0.8 },
    });
    expect(getLandmarkByName(obs, 'left_knee')).toBeDefined();
    expect(getLandmarkByName(obs, 'right_knee')).toBeDefined();
  });

  it('returns selected landmarks in order', () => {
    const obs = createSyntheticObservation(1, {
      left_hip: { x: 0.4, y: 0.6 },
      right_hip: { x: 0.6, y: 0.6 },
    });
    const selected = getLandmarksByNames(obs, ['left_hip', 'right_hip']);
    expect(selected.map((entry) => entry.name)).toEqual([
      'left_hip',
      'right_hip',
    ]);
  });

  it('reports critical landmarks only when visibility passes threshold', () => {
    const landmarks: Partial<
      Record<LandmarkName, { x: number; y: number; visibility?: number }>
    > = {};
    for (const name of LANDMARK_NAMES) {
      landmarks[name] = { x: 0.5, y: 0.5, visibility: 0.9 };
    }
    landmarks.left_knee = { x: 0.45, y: 0.75, visibility: 0.2 };

    const obs = createSyntheticObservation(1, landmarks);
    expect(hasCriticalLandmarks(obs, ['left_knee', 'right_knee'], 0, 0.5)).toBe(
      false,
    );
  });

  it('assertValidPoseObservation throws on invalid input', () => {
    expect(() => assertValidPoseObservation({ sequence: -1 })).toThrow(
      /Invalid PoseObservation/,
    );
  });
});
