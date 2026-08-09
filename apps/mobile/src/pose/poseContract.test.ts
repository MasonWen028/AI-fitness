import { describe, expect, it } from 'vitest';

import {
  LANDMARK_COUNT,
  LANDMARK_INDEX,
  LANDMARK_NAMES,
  SQUAT_CRITICAL_LANDMARKS,
  isLandmarkName,
  type LandmarkName,
} from './poseContract';
import {
  assertValidPoseObservation,
  createEmptyObservation,
  createSyntheticObservation,
  getLandmarkByName,
  getLandmarksByNames,
  hasCriticalLandmarks,
  validatePoseObservation,
} from './poseValidation';

describe('LANDMARK_NAMES', () => {
  it('contains exactly 33 canonical landmarks', () => {
    expect(LANDMARK_NAMES).toHaveLength(33);
    expect(LANDMARK_COUNT).toBe(33);
  });

  it('matches the MediaPipe Pose Landmarker body model order', () => {
    expect(LANDMARK_NAMES[0]).toBe('nose');
    expect(LANDMARK_NAMES[11]).toBe('left_shoulder');
    expect(LANDMARK_NAMES[23]).toBe('left_hip');
    expect(LANDMARK_NAMES[31]).toBe('left_foot_index');
    expect(LANDMARK_NAMES[32]).toBe('right_foot_index');
  });
});

describe('LANDMARK_INDEX', () => {
  it('maps every landmark name to its correct index', () => {
    LANDMARK_NAMES.forEach((name, index) => {
      expect(LANDMARK_INDEX[name]).toBe(index);
    });
  });

  it('returns undefined for unknown names', () => {
    expect(LANDMARK_INDEX['fake_landmark']).toBeUndefined();
  });
});

describe('isLandmarkName', () => {
  it('returns true for valid landmark names', () => {
    expect(isLandmarkName('nose')).toBe(true);
    expect(isLandmarkName('left_hip')).toBe(true);
    expect(isLandmarkName('right_ankle')).toBe(true);
  });

  it('returns false for invalid names', () => {
    expect(isLandmarkName('fake_landmark')).toBe(false);
    expect(isLandmarkName('')).toBe(false);
    expect(isLandmarkName('LEFT_HIP')).toBe(false);
  });
});

describe('SQUAT_CRITICAL_LANDMARKS', () => {
  it('contains 8 landmarks needed for squat analysis', () => {
    expect(SQUAT_CRITICAL_LANDMARKS).toHaveLength(8);
  });

  it('includes hips, knees, ankles, and shoulders', () => {
    expect(SQUAT_CRITICAL_LANDMARKS).toContain('left_hip');
    expect(SQUAT_CRITICAL_LANDMARKS).toContain('right_hip');
    expect(SQUAT_CRITICAL_LANDMARKS).toContain('left_knee');
    expect(SQUAT_CRITICAL_LANDMARKS).toContain('right_knee');
    expect(SQUAT_CRITICAL_LANDMARKS).toContain('left_ankle');
    expect(SQUAT_CRITICAL_LANDMARKS).toContain('right_ankle');
    expect(SQUAT_CRITICAL_LANDMARKS).toContain('left_shoulder');
    expect(SQUAT_CRITICAL_LANDMARKS).toContain('right_shoulder');
  });
});

describe('validatePoseObservation', () => {
  it('accepts a valid observation with landmarks', () => {
    const obs = createSyntheticObservation(1, {
      left_hip: { x: 0.5, y: 0.6, z: 0, visibility: 0.9 },
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
    const obs = createEmptyObservation({ rotationDegrees: 45 as 0 | 90 | 180 | 270 });
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('rotationDegrees'))).toBe(true);
  });

  it('rejects zero or negative imageSize dimensions', () => {
    const obs = createEmptyObservation({ imageSize: { width: 0, height: 480 } });
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

  it('rejects invalid provider.delegate', () => {
    const obs = createEmptyObservation({
      provider: { name: 'test', modelVersion: '1', delegate: 'TPU' as never, inferenceMs: 10 },
    });
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('delegate'))).toBe(true);
  });

  it('rejects empty provider.name', () => {
    const obs = createEmptyObservation({
      provider: { name: '', modelVersion: '1', delegate: 'CPU', inferenceMs: 10 },
    });
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('provider.name'))).toBe(true);
  });

  it('rejects negative inferenceMs', () => {
    const obs = createEmptyObservation({
      provider: { name: 'test', modelVersion: '1', delegate: 'CPU', inferenceMs: -5 },
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

  it('rejects landmark with invalid name', () => {
    const obs = createEmptyObservation();
    obs.people = [
      {
        imageLandmarks: [{ name: 'fake_landmark' as LandmarkName, x: 0, y: 0 }],
        posePresence: 0.5,
      },
    ];
    obs.landmarksAvailable = true;
    obs.landmarkCount = 1;
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('LandmarkName'))).toBe(true);
  });

  it('rejects landmark with non-finite x', () => {
    const obs = createEmptyObservation();
    obs.people = [
      {
        imageLandmarks: [{ name: 'nose', x: NaN, y: 0 }],
        posePresence: 0.5,
      },
    ];
    obs.landmarksAvailable = true;
    obs.landmarkCount = 1;
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('.x'))).toBe(true);
  });

  it('rejects visibility outside 0..1', () => {
    const obs = createEmptyObservation();
    obs.people = [
      {
        imageLandmarks: [{ name: 'nose', x: 0.5, y: 0.5, visibility: 1.5 }],
        posePresence: 0.5,
      },
    ];
    obs.landmarksAvailable = true;
    obs.landmarkCount = 1;
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('visibility'))).toBe(true);
  });

  it('accepts visibility and presence as undefined', () => {
    const obs = createEmptyObservation();
    obs.people = [
      {
        imageLandmarks: [{ name: 'nose', x: 0.5, y: 0.5 }],
        posePresence: 0.5,
      },
    ];
    obs.landmarksAvailable = true;
    obs.landmarkCount = 1;
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(true);
  });

  it('accepts worldLandmarks as undefined', () => {
    const obs = createSyntheticObservation(1, { nose: { x: 0.5, y: 0.5 } });
    expect(obs.people[0]!.worldLandmarks).toBeUndefined();
    const result = validatePoseObservation(obs);
    expect(result.valid).toBe(true);
  });

  it('accepts worldLandmarks when populated', () => {
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
      frameId: 'abc',
      imageSize: { width: -1, height: 0 },
      rotationDegrees: 99,
      mirrored: 'false',
      people: 'not-an-array',
      provider: { name: '', modelVersion: '', delegate: 'TPU', inferenceMs: -1 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(5);
  });
});

describe('assertValidPoseObservation', () => {
  it('does not throw for valid observations', () => {
    const obs = createEmptyObservation();
    expect(() => assertValidPoseObservation(obs)).not.toThrow();
  });

  it('throws for invalid observations', () => {
    expect(() => assertValidPoseObservation({ sequence: -1 })).toThrow(
      /Invalid PoseObservation/,
    );
  });
});

describe('createEmptyObservation', () => {
  it('produces a valid observation', () => {
    const obs = createEmptyObservation();
    expect(validatePoseObservation(obs).valid).toBe(true);
  });

  it('applies overrides correctly', () => {
    const obs = createEmptyObservation({ sequence: 42, mirrored: true });
    expect(obs.sequence).toBe(42);
    expect(obs.mirrored).toBe(true);
  });
});

describe('createSyntheticObservation', () => {
  it('produces a valid observation', () => {
    const obs = createSyntheticObservation(1, {
      left_hip: { x: 0.5, y: 0.6 },
      right_hip: { x: 0.4, y: 0.6 },
    });
    expect(validatePoseObservation(obs).valid).toBe(true);
  });

  it('sets landmarksAvailable to false when no landmarks provided', () => {
    const obs = createSyntheticObservation(1, {});
    expect(obs.landmarksAvailable).toBe(false);
    expect(obs.landmarkCount).toBe(0);
  });

  it('populates all 33 landmark slots, zeroing unprovided ones', () => {
    const obs = createSyntheticObservation(1, { nose: { x: 0.5, y: 0.5 } });
    expect(obs.people[0]!.imageLandmarks).toHaveLength(33);
    expect(obs.people[0]!.imageLandmarks[0]!.name).toBe('nose');
    expect(obs.people[0]!.imageLandmarks[0]!.x).toBe(0.5);
    expect(obs.people[0]!.imageLandmarks[1]!.name).toBe('left_eye_inner');
    expect(obs.people[0]!.imageLandmarks[1]!.x).toBe(0);
  });

  it('counts only provided landmarks in landmarkCount', () => {
    const obs = createSyntheticObservation(5, {
      nose: { x: 0.5, y: 0.5 },
      left_hip: { x: 0.3, y: 0.7 },
    });
    expect(obs.landmarkCount).toBe(33);
    expect(obs.landmarksAvailable).toBe(true);
  });
});

describe('getLandmarkByName', () => {
  it('finds a landmark by name', () => {
    const obs = createSyntheticObservation(1, { nose: { x: 0.5, y: 0.3 } });
    const lm = getLandmarkByName(obs, 'nose');
    expect(lm).toBeDefined();
    expect(lm!.x).toBe(0.5);
  });

  it('returns undefined for missing person index', () => {
    const obs = createSyntheticObservation(1, { nose: { x: 0.5, y: 0.3 } });
    expect(getLandmarkByName(obs, 'nose', 5)).toBeUndefined();
  });
});

describe('getLandmarksByNames', () => {
  it('retrieves multiple landmarks by name', () => {
    const obs = createSyntheticObservation(1, {
      left_hip: { x: 0.3, y: 0.7 },
      right_hip: { x: 0.7, y: 0.7 },
      left_knee: { x: 0.3, y: 0.9 },
    });
    const result = getLandmarksByNames(obs, ['left_hip', 'right_hip', 'left_knee', 'nose']);
    expect(result).toHaveLength(4);
    expect(result[0]!.landmark!.x).toBe(0.3);
    expect(result[1]!.landmark!.x).toBe(0.7);
    expect(result[2]!.landmark!.y).toBe(0.9);
    expect(result[3]!.landmark).toBeDefined();
    expect(result[3]!.landmark!.x).toBe(0);
    expect(result[3]!.landmark!.visibility).toBe(0);
  });
});

describe('hasCriticalLandmarks', () => {
  it('returns true when all critical landmarks are present with sufficient visibility', () => {
    const landmarks: Partial<Record<LandmarkName, { x: number; y: number; visibility?: number }>> = {};
    for (const name of SQUAT_CRITICAL_LANDMARKS) {
      landmarks[name] = { x: 0.5, y: 0.5, visibility: 0.8 };
    }
    const obs = createSyntheticObservation(1, landmarks);
    expect(hasCriticalLandmarks(obs, SQUAT_CRITICAL_LANDMARKS)).toBe(true);
  });

  it('returns false when a critical landmark is missing', () => {
    const landmarks: Partial<Record<LandmarkName, { x: number; y: number; visibility?: number }>> = {};
    for (const name of SQUAT_CRITICAL_LANDMARKS) {
      landmarks[name] = { x: 0.5, y: 0.5, visibility: 0.8 };
    }
    delete landmarks['left_knee'];
    const obs = createSyntheticObservation(1, landmarks);
    expect(hasCriticalLandmarks(obs, SQUAT_CRITICAL_LANDMARKS)).toBe(false);
  });

  it('returns false when visibility is below threshold', () => {
    const landmarks: Partial<Record<LandmarkName, { x: number; y: number; visibility?: number }>> = {};
    for (const name of SQUAT_CRITICAL_LANDMARKS) {
      landmarks[name] = { x: 0.5, y: 0.5, visibility: 0.8 };
    }
    landmarks['left_knee'] = { x: 0.5, y: 0.5, visibility: 0.3 };
    const obs = createSyntheticObservation(1, landmarks);
    expect(hasCriticalLandmarks(obs, SQUAT_CRITICAL_LANDMARKS, 0, 0.5)).toBe(false);
  });

  it('returns true when visibility is undefined (assumed visible)', () => {
    const landmarks: Partial<Record<LandmarkName, { x: number; y: number; visibility?: number }>> = {};
    for (const name of SQUAT_CRITICAL_LANDMARKS) {
      landmarks[name] = { x: 0.5, y: 0.5 };
    }
    const obs = createSyntheticObservation(1, landmarks);
    expect(hasCriticalLandmarks(obs, SQUAT_CRITICAL_LANDMARKS)).toBe(true);
  });
});
