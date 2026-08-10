import { describe, it, expect } from 'vitest';
import {
  computeHipAngle,
  computeHipDepth,
  computeKneeAngle,
  computeRangeOverWindow,
  computeSquatMetrics,
  computeSquatROM,
  computeSquatVelocity,
  computeTorsoInclination,
  computeVelocity,
  getMetricById,
  MAX_VELOCITY_TIMESTAMP_GAP_MS,
  type MetricValue,
  type SquatMetricId,
} from './metrics';
import { normalizeObservation } from './normalization';
import { createSyntheticObservation } from '../pose/poseValidation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a standing-pose observation with all critical landmarks visible */
function makeStandingPose(sequence: number, timestampMs = sequence * 33) {
  return createSyntheticObservation(
    sequence,
    {
      nose: { x: 0.5, y: 0.15, visibility: 0.95 },
      left_shoulder: { x: 0.42, y: 0.25, visibility: 0.95 },
      right_shoulder: { x: 0.58, y: 0.25, visibility: 0.95 },
      left_hip: { x: 0.43, y: 0.55, visibility: 0.95 },
      right_hip: { x: 0.57, y: 0.55, visibility: 0.95 },
      left_knee: { x: 0.43, y: 0.78, visibility: 0.95 },
      right_knee: { x: 0.57, y: 0.78, visibility: 0.95 },
      left_ankle: { x: 0.43, y: 0.95, visibility: 0.95 },
      right_ankle: { x: 0.57, y: 0.95, visibility: 0.95 },
    },
    { timestampMs },
  );
}

/** Creates a deep-squat observation */
function makeDeepSquatPose(sequence: number, timestampMs = sequence * 33) {
  return createSyntheticObservation(
    sequence,
    {
      nose: { x: 0.5, y: 0.3, visibility: 0.9 },
      left_shoulder: { x: 0.4, y: 0.38, visibility: 0.9 },
      right_shoulder: { x: 0.6, y: 0.38, visibility: 0.9 },
      left_hip: { x: 0.42, y: 0.6, visibility: 0.9 },
      right_hip: { x: 0.58, y: 0.6, visibility: 0.9 },
      left_knee: { x: 0.38, y: 0.68, visibility: 0.9 },
      right_knee: { x: 0.62, y: 0.68, visibility: 0.9 },
      left_ankle: { x: 0.43, y: 0.9, visibility: 0.9 },
      right_ankle: { x: 0.57, y: 0.9, visibility: 0.9 },
    },
    { timestampMs },
  );
}

/** Creates a forward-leaning observation */
function makeLeaningPose(sequence: number, timestampMs = sequence * 33) {
  return createSyntheticObservation(
    sequence,
    {
      nose: { x: 0.55, y: 0.2, visibility: 0.9 },
      left_shoulder: { x: 0.48, y: 0.28, visibility: 0.9 },
      right_shoulder: { x: 0.62, y: 0.28, visibility: 0.9 },
      left_hip: { x: 0.43, y: 0.55, visibility: 0.9 },
      right_hip: { x: 0.57, y: 0.55, visibility: 0.9 },
      left_knee: { x: 0.43, y: 0.78, visibility: 0.9 },
      right_knee: { x: 0.57, y: 0.78, visibility: 0.9 },
      left_ankle: { x: 0.43, y: 0.95, visibility: 0.9 },
      right_ankle: { x: 0.57, y: 0.95, visibility: 0.9 },
    },
    { timestampMs },
  );
}

// ---------------------------------------------------------------------------
// MetricValue contract (FR-ANGLE-002)
// ---------------------------------------------------------------------------

describe('MetricValue contract (FR-ANGLE-002)', () => {
  it('every metric carries value, timestampMs, valid, minConfidence', () => {
    const obs = makeStandingPose(1);
    const frame = normalizeObservation(obs)!;
    const metrics = computeSquatMetrics(frame);

    for (const value of Object.values(metrics)) {
      expect(value).toHaveProperty('value');
      expect(value).toHaveProperty('timestampMs');
      expect(value).toHaveProperty('valid');
      expect(value).toHaveProperty('minConfidence');
      expect(typeof value.value).toBe('number');
      expect(typeof value.timestampMs).toBe('number');
      expect(typeof value.valid).toBe('boolean');
      expect(typeof value.minConfidence).toBe('number');
    }
  });

  it('timestampMs matches the frame timestamp', () => {
    const obs = makeStandingPose(5, 1234);
    const frame = normalizeObservation(obs)!;
    const metrics = computeSquatMetrics(frame);

    expect(metrics.kneeAngleLeft.timestampMs).toBe(1234);
    expect(metrics.torsoInclination.timestampMs).toBe(1234);
  });
});

// ---------------------------------------------------------------------------
// Knee angle (hip-knee-ankle)
// ---------------------------------------------------------------------------

describe('computeKneeAngle', () => {
  it('produces a valid angle for a standing pose', () => {
    const obs = makeStandingPose(1);
    const frame = normalizeObservation(obs)!;
    const angle = computeKneeAngle(frame, 'left');

    expect(angle.valid).toBe(true);
    expect(angle.value).toBeGreaterThan(160);
    expect(angle.value).toBeLessThanOrEqual(180);
    expect(angle.minConfidence).toBeGreaterThan(0);
  });

  it('produces a smaller angle for a deep squat', () => {
    const standing = normalizeObservation(makeStandingPose(1))!;
    const deep = normalizeObservation(makeDeepSquatPose(2))!;

    const standingAngle = computeKneeAngle(standing, 'left');
    const deepAngle = computeKneeAngle(deep, 'left');

    expect(deepAngle.value).toBeLessThan(standingAngle.value);
  });

  it('returns invalid metric when landmarks are missing', () => {
    const obs = createSyntheticObservation(1, {
      nose: { x: 0.5, y: 0.2, visibility: 0.9 },
    });
    const frame = normalizeObservation(obs)!;
    const angle = computeKneeAngle(frame, 'left');

    expect(angle.valid).toBe(false);
    expect(Number.isFinite(angle.value)).toBe(true);
    expect(angle.value).toBe(180); // fallback value
  });

  it('returns invalid metric when landmarks have low visibility', () => {
    const obs = createSyntheticObservation(1, {
      left_hip: { x: 0.4, y: 0.5, visibility: 0.1 },
      left_knee: { x: 0.4, y: 0.7, visibility: 0.1 },
      left_ankle: { x: 0.4, y: 0.9, visibility: 0.1 },
    });
    const frame = normalizeObservation(obs)!;
    const angle = computeKneeAngle(frame, 'left');

    expect(angle.valid).toBe(false);
  });

  it('computes both left and right sides', () => {
    const frame = normalizeObservation(makeStandingPose(1))!;
    const left = computeKneeAngle(frame, 'left');
    const right = computeKneeAngle(frame, 'right');

    expect(left.valid).toBe(true);
    expect(right.valid).toBe(true);
    // Symmetric pose should have similar angles
    expect(Math.abs(left.value - right.value)).toBeLessThan(10);
  });
});

// ---------------------------------------------------------------------------
// Hip angle (shoulder-hip-knee)
// ---------------------------------------------------------------------------

describe('computeHipAngle', () => {
  it('produces a valid angle for a standing pose', () => {
    const frame = normalizeObservation(makeStandingPose(1))!;
    const angle = computeHipAngle(frame, 'left');

    expect(angle.valid).toBe(true);
    expect(angle.value).toBeGreaterThan(150);
    expect(angle.value).toBeLessThanOrEqual(180);
  });

  it('produces a smaller angle for a deep squat', () => {
    const standing = normalizeObservation(makeStandingPose(1))!;
    const deep = normalizeObservation(makeDeepSquatPose(2))!;

    const standingAngle = computeHipAngle(standing, 'left');
    const deepAngle = computeHipAngle(deep, 'left');

    expect(deepAngle.value).toBeLessThan(standingAngle.value);
  });

  it('returns invalid when shoulder is missing', () => {
    const obs = createSyntheticObservation(1, {
      left_hip: { x: 0.4, y: 0.5, visibility: 0.9 },
      left_knee: { x: 0.4, y: 0.7, visibility: 0.9 },
    });
    const frame = normalizeObservation(obs)!;
    const angle = computeHipAngle(frame, 'left');

    expect(angle.valid).toBe(false);
    expect(Number.isFinite(angle.value)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Torso inclination (segment-to-vertical)
// ---------------------------------------------------------------------------

describe('computeTorsoInclination', () => {
  it('produces near-zero inclination for an upright pose', () => {
    const frame = normalizeObservation(makeStandingPose(1))!;
    const incl = computeTorsoInclination(frame);

    expect(incl.valid).toBe(true);
    expect(incl.value).toBeLessThan(10); // nearly upright
  });

  it('produces a larger inclination for a leaning pose', () => {
    const upright = normalizeObservation(makeStandingPose(1))!;
    const leaning = normalizeObservation(makeLeaningPose(2))!;

    const uprightIncl = computeTorsoInclination(upright);
    const leaningIncl = computeTorsoInclination(leaning);

    expect(leaningIncl.value).toBeGreaterThan(uprightIncl.value);
  });

  it('returns invalid when hip or shoulder landmarks are missing', () => {
    const obs = createSyntheticObservation(1, {
      nose: { x: 0.5, y: 0.2, visibility: 0.9 },
    });
    const frame = normalizeObservation(obs)!;
    const incl = computeTorsoInclination(frame);

    expect(incl.valid).toBe(false);
    expect(Number.isFinite(incl.value)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Hip depth (normalized distance)
// ---------------------------------------------------------------------------

describe('computeHipDepth', () => {
  it('produces a positive value for a standing pose (hips above knees)', () => {
    const frame = normalizeObservation(makeStandingPose(1))!;
    const depth = computeHipDepth(frame);

    expect(depth.valid).toBe(true);
    expect(depth.value).toBeGreaterThan(0);
  });

  it('produces a smaller value for a deep squat (hips closer to knees)', () => {
    const standing = normalizeObservation(makeStandingPose(1))!;
    const deep = normalizeObservation(makeDeepSquatPose(2))!;

    const standingDepth = computeHipDepth(standing);
    const deepDepth = computeHipDepth(deep);

    expect(deepDepth.value).toBeLessThan(standingDepth.value);
  });

  it('returns invalid when knee landmarks are missing', () => {
    const obs = createSyntheticObservation(1, {
      left_hip: { x: 0.4, y: 0.5, visibility: 0.9 },
      right_hip: { x: 0.6, y: 0.5, visibility: 0.9 },
    });
    const frame = normalizeObservation(obs)!;
    const depth = computeHipDepth(frame);

    expect(depth.valid).toBe(false);
    expect(Number.isFinite(depth.value)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Full squat metric set
// ---------------------------------------------------------------------------

describe('computeSquatMetrics', () => {
  it('computes all six metrics for a valid frame', () => {
    const frame = normalizeObservation(makeStandingPose(1))!;
    const metrics = computeSquatMetrics(frame);

    expect(metrics.kneeAngleLeft.valid).toBe(true);
    expect(metrics.kneeAngleRight.valid).toBe(true);
    expect(metrics.hipAngleLeft.valid).toBe(true);
    expect(metrics.hipAngleRight.valid).toBe(true);
    expect(metrics.torsoInclination.valid).toBe(true);
    expect(metrics.hipDepth.valid).toBe(true);
  });

  it('all metrics are invalid for an empty frame', () => {
    const obs = createSyntheticObservation(1, {});
    const frame = normalizeObservation(obs)!;
    const metrics = computeSquatMetrics(frame);

    expect(metrics.kneeAngleLeft.valid).toBe(false);
    expect(metrics.kneeAngleRight.valid).toBe(false);
    expect(metrics.hipAngleLeft.valid).toBe(false);
    expect(metrics.hipAngleRight.valid).toBe(false);
    expect(metrics.torsoInclination.valid).toBe(false);
    expect(metrics.hipDepth.valid).toBe(false);

    // FR-ANGLE-003: no NaN propagation
    for (const value of Object.values(metrics)) {
      expect(Number.isFinite(value.value)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Velocity (FR-ANGLE-004)
// ---------------------------------------------------------------------------

describe('computeVelocity', () => {
  it('computes velocity from two valid metrics with monotonic timestamps', () => {
    const prev: MetricValue = {
      value: 170,
      timestampMs: 1000,
      valid: true,
      minConfidence: 0.9,
    };
    const curr: MetricValue = {
      value: 100,
      timestampMs: 1100,
      valid: true,
      minConfidence: 0.9,
    };

    const vel = computeVelocity(prev, curr);

    // (100 - 170) / 0.1s = -700 deg/s
    expect(vel.valid).toBe(true);
    expect(vel.value).toBeCloseTo(-700, 0);
    expect(vel.timestampMs).toBe(1100);
  });

  it('rejects non-monotonic timestamps (curr <= prev)', () => {
    const prev: MetricValue = {
      value: 170,
      timestampMs: 1100,
      valid: true,
      minConfidence: 0.9,
    };
    const curr: MetricValue = {
      value: 100,
      timestampMs: 1000,
      valid: true,
      minConfidence: 0.9,
    };

    const vel = computeVelocity(prev, curr);

    expect(vel.valid).toBe(false);
    expect(Number.isFinite(vel.value)).toBe(true);
  });

  it('rejects equal timestamps (zero elapsed time)', () => {
    const prev: MetricValue = {
      value: 170,
      timestampMs: 1000,
      valid: true,
      minConfidence: 0.9,
    };
    const curr: MetricValue = {
      value: 100,
      timestampMs: 1000,
      valid: true,
      minConfidence: 0.9,
    };

    const vel = computeVelocity(prev, curr);

    expect(vel.valid).toBe(false);
  });

  it('rejects implausibly large timestamp gaps', () => {
    const prev: MetricValue = {
      value: 170,
      timestampMs: 1000,
      valid: true,
      minConfidence: 0.9,
    };
    const curr: MetricValue = {
      value: 100,
      timestampMs: 1000 + MAX_VELOCITY_TIMESTAMP_GAP_MS + 1,
      valid: true,
      minConfidence: 0.9,
    };

    const vel = computeVelocity(prev, curr);

    expect(vel.valid).toBe(false);
  });

  it('accepts gap at the boundary (exactly MAX_VELOCITY_TIMESTAMP_GAP_MS)', () => {
    const prev: MetricValue = {
      value: 180,
      timestampMs: 0,
      valid: true,
      minConfidence: 0.9,
    };
    const curr: MetricValue = {
      value: 90,
      timestampMs: MAX_VELOCITY_TIMESTAMP_GAP_MS,
      valid: true,
      minConfidence: 0.9,
    };

    const vel = computeVelocity(prev, curr);

    expect(vel.valid).toBe(true);
    // (90 - 180) / 1.0s = -90 deg/s
    expect(vel.value).toBeCloseTo(-90, 0);
  });

  it('produces invalid velocity when either metric is invalid', () => {
    const prev: MetricValue = {
      value: 170,
      timestampMs: 1000,
      valid: false,
      minConfidence: 0.3,
    };
    const curr: MetricValue = {
      value: 100,
      timestampMs: 1100,
      valid: true,
      minConfidence: 0.9,
    };

    const vel = computeVelocity(prev, curr);

    expect(vel.valid).toBe(false);
  });
});

describe('computeSquatVelocity', () => {
  it('computes velocity for all metrics from two consecutive frames', () => {
    const prevMetrics = computeSquatMetrics(
      normalizeObservation(makeStandingPose(1, 1000))!,
    );
    const currMetrics = computeSquatMetrics(
      normalizeObservation(makeDeepSquatPose(2, 1100))!,
    );

    const velocity = computeSquatVelocity(prevMetrics, currMetrics);

    // Knee angle should decrease (negative velocity) during squat descent
    expect(velocity.kneeAngleLeft.valid).toBe(true);
    expect(velocity.kneeAngleLeft.value).toBeLessThan(0);

    // Hip depth should decrease (negative velocity) during descent
    expect(velocity.hipDepth.valid).toBe(true);
    expect(velocity.hipDepth.value).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// ROM (range over a window)
// ---------------------------------------------------------------------------

describe('computeRangeOverWindow', () => {
  it('computes range as max - min for valid values', () => {
    const values: MetricValue[] = [
      { value: 170, timestampMs: 0, valid: true, minConfidence: 0.9 },
      { value: 120, timestampMs: 100, valid: true, minConfidence: 0.9 },
      { value: 90, timestampMs: 200, valid: true, minConfidence: 0.9 },
      { value: 140, timestampMs: 300, valid: true, minConfidence: 0.8 },
    ];

    const rom = computeRangeOverWindow(values);

    expect(rom.valid).toBe(true);
    expect(rom.value).toBeCloseTo(80, 0); // 170 - 90 = 80
    expect(rom.timestampMs).toBe(300);
    expect(rom.minConfidence).toBeCloseTo(0.8, 2);
  });

  it('returns invalid for fewer than 2 valid values', () => {
    const values: MetricValue[] = [
      { value: 170, timestampMs: 0, valid: true, minConfidence: 0.9 },
      { value: 90, timestampMs: 100, valid: false, minConfidence: 0 },
    ];

    const rom = computeRangeOverWindow(values);

    expect(rom.valid).toBe(false);
  });

  it('excludes invalid values from range computation', () => {
    const values: MetricValue[] = [
      { value: 200, timestampMs: 0, valid: false, minConfidence: 0 },
      { value: 170, timestampMs: 100, valid: true, minConfidence: 0.9 },
      { value: 90, timestampMs: 200, valid: true, minConfidence: 0.9 },
      { value: 50, timestampMs: 300, valid: false, minConfidence: 0 },
    ];

    const rom = computeRangeOverWindow(values);

    expect(rom.valid).toBe(true);
    expect(rom.value).toBeCloseTo(80, 0); // 170 - 90, not 200 - 50
  });

  it('returns invalid for an empty window', () => {
    const rom = computeRangeOverWindow([]);

    expect(rom.valid).toBe(false);
    expect(Number.isFinite(rom.value)).toBe(true);
  });
});

describe('computeSquatROM', () => {
  it('computes ROM for all metrics over a window of frames', () => {
    const standing = computeSquatMetrics(
      normalizeObservation(makeStandingPose(1, 0))!,
    );
    const deep = computeSquatMetrics(
      normalizeObservation(makeDeepSquatPose(2, 100))!,
    );
    const standing2 = computeSquatMetrics(
      normalizeObservation(makeStandingPose(3, 200))!,
    );

    const rom = computeSquatROM([standing, deep, standing2]);

    // Knee angle ROM should be significant (standing to deep squat and back)
    expect(rom.kneeAngleLeft.valid).toBe(true);
    expect(rom.kneeAngleLeft.value).toBeGreaterThan(10);
  });

  it('returns all-invalid for an empty window', () => {
    const rom = computeSquatROM([]);

    expect(rom.kneeAngleLeft.valid).toBe(false);
    expect(rom.hipDepth.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getMetricById
// ---------------------------------------------------------------------------

describe('getMetricById', () => {
  it('retrieves each metric by its ID', () => {
    const metrics = computeSquatMetrics(
      normalizeObservation(makeStandingPose(1))!,
    );

    const ids: SquatMetricId[] = [
      'knee_angle_left',
      'knee_angle_right',
      'hip_angle_left',
      'hip_angle_right',
      'torso_inclination',
      'hip_depth',
    ];

    for (const id of ids) {
      const metric = getMetricById(metrics, id);
      expect(metric).toBeDefined();
      expect(typeof metric.value).toBe('number');
    }
  });

  it('returns the correct metric for each ID', () => {
    const metrics = computeSquatMetrics(
      normalizeObservation(makeStandingPose(1))!,
    );

    expect(getMetricById(metrics, 'knee_angle_left')).toBe(
      metrics.kneeAngleLeft,
    );
    expect(getMetricById(metrics, 'knee_angle_right')).toBe(
      metrics.kneeAngleRight,
    );
    expect(getMetricById(metrics, 'hip_angle_left')).toBe(metrics.hipAngleLeft);
    expect(getMetricById(metrics, 'hip_angle_right')).toBe(
      metrics.hipAngleRight,
    );
    expect(getMetricById(metrics, 'torso_inclination')).toBe(
      metrics.torsoInclination,
    );
    expect(getMetricById(metrics, 'hip_depth')).toBe(metrics.hipDepth);
  });
});

// ---------------------------------------------------------------------------
// NaN safety (FR-ANGLE-003)
// ---------------------------------------------------------------------------

describe('NaN safety (FR-ANGLE-003)', () => {
  it('no metric produces NaN or Infinity for a valid frame', () => {
    const frame = normalizeObservation(makeStandingPose(1))!;
    const metrics = computeSquatMetrics(frame);

    for (const value of Object.values(metrics)) {
      expect(Number.isFinite(value.value)).toBe(true);
    }
  });

  it('no metric produces NaN or Infinity for a degenerate frame', () => {
    const obs = createSyntheticObservation(1, {
      left_hip: { x: 0.5, y: 0.5, visibility: 0.9 },
      right_hip: { x: 0.5, y: 0.5, visibility: 0.9 }, // zero hip width
    });
    const frame = normalizeObservation(obs)!;
    const metrics = computeSquatMetrics(frame);

    for (const value of Object.values(metrics)) {
      expect(Number.isFinite(value.value)).toBe(true);
    }
  });

  it('no metric produces NaN for a frame with all landmarks at origin', () => {
    const obs = createSyntheticObservation(1, {
      left_hip: { x: 0.5, y: 0.5, visibility: 0.9 },
      right_hip: { x: 0.5, y: 0.5, visibility: 0.9 },
      left_shoulder: { x: 0.5, y: 0.5, visibility: 0.9 },
      right_shoulder: { x: 0.5, y: 0.5, visibility: 0.9 },
      left_knee: { x: 0.5, y: 0.5, visibility: 0.9 },
      right_knee: { x: 0.5, y: 0.5, visibility: 0.9 },
      left_ankle: { x: 0.5, y: 0.5, visibility: 0.9 },
      right_ankle: { x: 0.5, y: 0.5, visibility: 0.9 },
    });
    const frame = normalizeObservation(obs)!;
    const metrics = computeSquatMetrics(frame);

    for (const value of Object.values(metrics)) {
      expect(Number.isFinite(value.value)).toBe(true);
    }
  });
});
