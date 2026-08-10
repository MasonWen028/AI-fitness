import { describe, expect, it } from 'vitest';

import type { LandmarkName } from '../pose/poseContract';
import { SQUAT_CRITICAL_LANDMARKS } from '../pose/poseContract';
import { createSyntheticObservation } from '../pose/poseValidation';
import {
  assessQuality,
  computeAngle2D,
  computeAngle3D,
  getNormalizedLandmark,
  getNormalizedLandmarks,
  normalizeObservation,
  type Point3D,
} from './normalization';

function makeLandmarks(
  overrides: Partial<
    Record<
      LandmarkName,
      { x: number; y: number; z?: number; visibility?: number }
    >
  >,
): Partial<
  Record<
    LandmarkName,
    { x: number; y: number; z?: number; visibility?: number }
  >
> {
  return overrides;
}

describe('normalizeObservation', () => {
  it('returns null for missing person', () => {
    const obs = createSyntheticObservation(1, { nose: { x: 0.5, y: 0.5 } });
    expect(normalizeObservation(obs, 5)).toBeNull();
  });

  it('normalizes landmarks relative to hip midpoint', () => {
    const obs = createSyntheticObservation(1, {
      left_hip: { x: 0.4, y: 0.6, visibility: 0.9 },
      right_hip: { x: 0.6, y: 0.6, visibility: 0.9 },
      nose: { x: 0.5, y: 0.3, visibility: 0.9 },
    });
    const frame = normalizeObservation(obs);
    expect(frame).not.toBeNull();

    const hipLeft = getNormalizedLandmark(frame!, 'left_hip')!;
    const hipRight = getNormalizedLandmark(frame!, 'right_hip')!;
    const nose = getNormalizedLandmark(frame!, 'nose')!;

    expect(frame!.origin.x).toBeCloseTo(0.5, 5);
    expect(frame!.origin.y).toBeCloseTo(0.6, 5);

    expect(Math.abs(hipLeft.x + hipRight.x)).toBeLessThan(1e-10);
    expect(Math.abs(hipLeft.y + hipRight.y)).toBeLessThan(1e-10);

    expect(nose.x).toBeCloseTo(0, 5);
    expect(nose.y).toBeLessThan(0);
  });

  it('scale factor equals hip width', () => {
    const obs = createSyntheticObservation(1, {
      left_hip: { x: 0.4, y: 0.6, visibility: 0.9 },
      right_hip: { x: 0.6, y: 0.6, visibility: 0.9 },
    });
    const frame = normalizeObservation(obs);
    expect(frame).not.toBeNull();
    expect(frame!.scaleFactor).toBeCloseTo(0.2, 5);
  });

  it('falls back to shoulder width when hips missing', () => {
    const allLandmarks = makeLandmarks({
      left_shoulder: { x: 0.3, y: 0.2, visibility: 0.9 },
      right_shoulder: { x: 0.7, y: 0.2, visibility: 0.9 },
      nose: { x: 0.5, y: 0.1, visibility: 0.9 },
    });
    const obs = createSyntheticObservation(1, allLandmarks);
    const frame = normalizeObservation(obs);
    expect(frame).not.toBeNull();
    expect(frame!.scaleFactor).toBeCloseTo(0.4, 5);
  });

  it('handles mirrored coordinates', () => {
    const obs = createSyntheticObservation(
      1,
      {
        left_hip: { x: 0.4, y: 0.6, visibility: 0.9 },
        right_hip: { x: 0.6, y: 0.6, visibility: 0.9 },
      },
      { mirrored: true },
    );

    const frame = normalizeObservation(obs);
    expect(frame).not.toBeNull();

    const leftHip = getNormalizedLandmark(frame!, 'left_hip')!;
    const rightHip = getNormalizedLandmark(frame!, 'right_hip')!;

    expect(leftHip.x).toBeGreaterThan(0);
    expect(rightHip.x).toBeLessThan(0);
  });

  it('handles 90-degree rotation', () => {
    const obs = createSyntheticObservation(
      1,
      {
        left_hip: { x: 0.3, y: 0.6, visibility: 0.9 },
        right_hip: { x: 0.7, y: 0.6, visibility: 0.9 },
        nose: { x: 0.5, y: 0.2, visibility: 0.9 },
      },
      { rotationDegrees: 90 },
    );

    const frame = normalizeObservation(obs);
    expect(frame).not.toBeNull();

    const nose = getNormalizedLandmark(frame!, 'nose')!;
    const dist = Math.sqrt(nose.x * nose.x + nose.y * nose.y);
    expect(dist).toBeGreaterThan(0.5);
  });

  it('clamps NaN and Infinity coordinates into safe finite values', () => {
    const obs = createSyntheticObservation(1, {
      left_hip: { x: Number.NaN, y: Number.POSITIVE_INFINITY, visibility: 0.9 },
      right_hip: { x: 0.6, y: 0.6, visibility: 0.9 },
      nose: { x: Number.NEGATIVE_INFINITY, y: 0.2, visibility: 0.9 },
    });

    const frame = normalizeObservation(obs);
    expect(frame).not.toBeNull();

    for (const landmark of frame!.landmarks.values()) {
      expect(Number.isFinite(landmark.x)).toBe(true);
      expect(Number.isFinite(landmark.y)).toBe(true);
      expect(Number.isFinite(landmark.z)).toBe(true);
      expect(Number.isFinite(landmark.visibility)).toBe(true);
      expect(Number.isFinite(landmark.presence)).toBe(true);
    }
  });

  it('preserves sequence and frameId', () => {
    const obs = createSyntheticObservation(42, { nose: { x: 0.5, y: 0.5 } });
    const frame = normalizeObservation(obs);
    expect(frame!.sequence).toBe(42);
    expect(frame!.frameId).toBe(42);
  });

  it('all provided normalized landmarks are centered at origin', () => {
    const obs = createSyntheticObservation(1, {
      left_hip: { x: 0.4, y: 0.6, visibility: 0.9 },
      right_hip: { x: 0.6, y: 0.6, visibility: 0.9 },
      left_knee: { x: 0.4, y: 0.8, visibility: 0.9 },
      right_knee: { x: 0.6, y: 0.8, visibility: 0.9 },
    });
    const frame = normalizeObservation(obs);
    expect(frame).not.toBeNull();

    for (const name of [
      'left_hip',
      'right_hip',
      'left_knee',
      'right_knee',
    ] as const) {
      const lm = getNormalizedLandmark(frame!, name)!;
      expect(lm.x).toBeGreaterThanOrEqual(-5);
      expect(lm.x).toBeLessThanOrEqual(5);
      expect(lm.y).toBeGreaterThanOrEqual(-5);
      expect(lm.y).toBeLessThanOrEqual(5);
    }
  });
});

describe('assessQuality', () => {
  it('returns zero quality for no person', () => {
    const obs = createSyntheticObservation(1, {});
    const quality = assessQuality(obs);
    expect(quality.personDetected).toBe(false);
    expect(quality.hasCriticalLandmarks).toBe(false);
    expect(quality.overallScore).toBe(0);
  });

  it('detects low-visibility critical landmarks', () => {
    const obs = createSyntheticObservation(1, {
      left_hip: { x: 0.4, y: 0.6, visibility: 0.9 },
      right_hip: { x: 0.6, y: 0.6, visibility: 0.9 },
    });
    const quality = assessQuality(obs, 0, 0.5);
    expect(quality.lowVisibilityLandmarks).toContain('left_knee');
    expect(quality.lowVisibilityLandmarks).toContain('right_knee');
    expect(quality.hasCriticalLandmarks).toBe(false);
  });

  it('detects low visibility landmarks', () => {
    const allLandmarks: Partial<
      Record<LandmarkName, { x: number; y: number; visibility?: number }>
    > = {};
    for (const name of SQUAT_CRITICAL_LANDMARKS) {
      allLandmarks[name] = { x: 0.5, y: 0.5, visibility: 0.8 };
    }
    allLandmarks.left_knee = { x: 0.4, y: 0.7, visibility: 0.2 };

    const obs = createSyntheticObservation(1, allLandmarks);
    const quality = assessQuality(obs, 0, 0.5);
    expect(quality.lowVisibilityLandmarks).toContain('left_knee');
    expect(quality.hasCriticalLandmarks).toBe(false);
  });

  it('reports high quality when all critical landmarks present', () => {
    const allLandmarks: Partial<
      Record<LandmarkName, { x: number; y: number; visibility?: number }>
    > = {};
    for (const name of SQUAT_CRITICAL_LANDMARKS) {
      allLandmarks[name] = { x: 0.5, y: 0.5, visibility: 0.9 };
    }
    const obs = createSyntheticObservation(1, allLandmarks);
    const quality = assessQuality(obs);
    expect(quality.hasCriticalLandmarks).toBe(true);
    expect(quality.missingLandmarks).toHaveLength(0);
    expect(quality.lowVisibilityLandmarks).toHaveLength(0);
    expect(quality.overallScore).toBeGreaterThan(0.5);
  });
});

describe('computeAngle2D', () => {
  it('computes 90 degrees for perpendicular vectors', () => {
    const a: Point3D = { x: 1, y: 0, z: 0 };
    const vertex: Point3D = { x: 0, y: 0, z: 0 };
    const c: Point3D = { x: 0, y: 1, z: 0 };

    const angle = computeAngle2D(a, vertex, c);
    expect(angle).toBeCloseTo(90, 1);
  });

  it('computes 180 degrees for opposite vectors', () => {
    const a: Point3D = { x: 1, y: 0, z: 0 };
    const vertex: Point3D = { x: 0, y: 0, z: 0 };
    const c: Point3D = { x: -1, y: 0, z: 0 };

    const angle = computeAngle2D(a, vertex, c);
    expect(angle).toBeCloseTo(180, 1);
  });

  it('computes 0 degrees for same direction', () => {
    const a: Point3D = { x: 1, y: 0, z: 0 };
    const vertex: Point3D = { x: 0, y: 0, z: 0 };
    const c: Point3D = { x: 2, y: 0, z: 0 };

    const angle = computeAngle2D(a, vertex, c);
    expect(angle).toBeCloseTo(0, 1);
  });

  it('returns 0 when vertex coincides with endpoint', () => {
    const a: Point3D = { x: 0, y: 0, z: 0 };
    const vertex: Point3D = { x: 0, y: 0, z: 0 };
    const c: Point3D = { x: 1, y: 0, z: 0 };

    const angle = computeAngle2D(a, vertex, c);
    expect(angle).toBe(0);
  });
});

describe('computeAngle3D', () => {
  it('computes 90 degrees for 3D perpendicular vectors', () => {
    const a: Point3D = { x: 1, y: 0, z: 0 };
    const vertex: Point3D = { x: 0, y: 0, z: 0 };
    const c: Point3D = { x: 0, y: 0, z: 1 };

    const angle = computeAngle3D(a, vertex, c);
    expect(angle).toBeCloseTo(90, 1);
  });
});

describe('getNormalizedLandmarks', () => {
  it('retrieves multiple landmarks at once', () => {
    const obs = createSyntheticObservation(1, {
      left_hip: { x: 0.4, y: 0.6, visibility: 0.9 },
      right_hip: { x: 0.6, y: 0.6, visibility: 0.9 },
      left_knee: { x: 0.4, y: 0.8, visibility: 0.9 },
    });
    const frame = normalizeObservation(obs)!;
    const result = getNormalizedLandmarks(frame, [
      'left_hip',
      'left_knee',
      'nose',
    ]);
    expect(result).toHaveLength(3);
    expect(result[0]!.point).toBeDefined();
    expect(result[1]!.point).toBeDefined();
    expect(result[2]!.point).toBeDefined();
  });
});
