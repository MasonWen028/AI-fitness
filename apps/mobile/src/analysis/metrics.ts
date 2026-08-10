/**
 * M0-G: Squat Metrics
 *
 * SRS: FR-ANGLE-001 through FR-ANGLE-004, FR-ANGLE-006
 *
 * Metric kinds (M0 reusable set):
 * - Three-point angle: knee (hip-knee-ankle), hip (shoulder-hip-knee)
 * - Segment-to-vertical angle: torso inclination
 * - Normalised distance: hip depth (hip-to-knee vertical distance)
 * - Angular velocity: rate of change of angle metrics
 * - Range over a window: ROM (range of motion)
 *
 * Every metric carries: value, timestamp, validity, minConfidence (FR-ANGLE-002).
 * All functions clamp floating-point and handle missing/zero-length vectors without NaN (FR-ANGLE-003).
 * Velocity uses actual elapsed time and rejects non-monotonic / implausibly large gaps (FR-ANGLE-004).
 */

import type { LandmarkName } from '../pose/poseContract';
import type {
  NormalizedFrame,
  NormalizedPoint,
  Point3D,
} from './normalization';
import {
  getNormalizedLandmark,
  computeAngle2D,
  computeAngle3D,
} from './normalization';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Canonical metric value (FR-ANGLE-002).
 * Every metric carries value, timestamp, validity and contributing minimum confidence.
 */
export type MetricValue = {
  /** Metric value in the unit appropriate for the metric kind (degrees, hip-widths, deg/s, etc.) */
  value: number;
  /** Timestamp of the observation this metric was derived from (ms) */
  timestampMs: number;
  /** Whether the metric is considered valid for downstream use */
  valid: boolean;
  /** Minimum visibility among the contributing landmarks (0-1) */
  minConfidence: number;
};

/** Named metric identifiers for the M0 Squat profile candidate */
export type SquatMetricId =
  | 'knee_angle_left'
  | 'knee_angle_right'
  | 'hip_angle_left'
  | 'hip_angle_right'
  | 'torso_inclination'
  | 'hip_depth';

/** Complete metric set for a single normalized frame */
export type SquatMetrics = {
  kneeAngleLeft: MetricValue;
  kneeAngleRight: MetricValue;
  hipAngleLeft: MetricValue;
  hipAngleRight: MetricValue;
  torsoInclination: MetricValue;
  hipDepth: MetricValue;
};

/** Velocity metrics (angular for angles, linear for depth) */
export type SquatVelocity = SquatMetrics;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum visibility for a landmark to contribute to a valid metric */
export const METRIC_MIN_VISIBILITY = 0.5;

/** Maximum allowed timestamp gap between two frames for velocity computation (ms) */
export const MAX_VELOCITY_TIMESTAMP_GAP_MS = 1000;

/** Fallback value for invalid angle metrics (neutral standing angle) */
const INVALID_ANGLE_VALUE = 180;

/** Fallback value for invalid distance metrics */
const INVALID_DISTANCE_VALUE = 0;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely retrieves a landmark from a normalized frame.
 * Returns undefined if the landmark is missing or has zero visibility.
 */
function getValidLandmark(
  frame: NormalizedFrame,
  name: LandmarkName,
  minVisibility = METRIC_MIN_VISIBILITY,
): NormalizedPoint | undefined {
  const lm = frame.landmarks.get(name);
  if (!lm) return undefined;
  if (lm.visibility < minVisibility) return undefined;
  return lm;
}

/**
 * Computes the midpoint of two landmarks.
 * Returns undefined if either landmark is missing or low-visibility.
 */
function getMidpoint(
  frame: NormalizedFrame,
  a: LandmarkName,
  b: LandmarkName,
  minVisibility = METRIC_MIN_VISIBILITY,
): NormalizedPoint | undefined {
  const la = getValidLandmark(frame, a, minVisibility);
  const lb = getValidLandmark(frame, b, minVisibility);
  if (!la || !lb) return undefined;
  return {
    name: a, // synthetic name for midpoint
    x: (la.x + lb.x) / 2,
    y: (la.y + lb.y) / 2,
    z: (la.z + lb.z) / 2,
    visibility: Math.min(la.visibility, lb.visibility),
    presence: Math.min(la.presence, lb.presence),
  };
}

/**
 * Returns the minimum visibility among an array of landmarks.
 */
function minVisibilityOf(landmarks: (NormalizedPoint | undefined)[]): number {
  const visibilities = landmarks
    .filter((lm): lm is NormalizedPoint => lm !== undefined)
    .map((lm) => lm.visibility);
  if (visibilities.length === 0) return 0;
  return Math.min(...visibilities);
}

/**
 * Creates an invalid MetricValue with a safe fallback value.
 */
function invalidMetric(
  value: number,
  timestampMs: number,
  minConfidence = 0,
): MetricValue {
  return {
    value: Number.isFinite(value) ? value : 0,
    timestampMs,
    valid: false,
    minConfidence,
  };
}

// ---------------------------------------------------------------------------
// Three-point angle metrics
// ---------------------------------------------------------------------------

/**
 * Computes a three-point angle at `vertex` using points a–vertex–c.
 * Returns an invalid MetricValue if any landmark is missing or the geometry is degenerate.
 *
 * @param frame   Normalized frame
 * @param aName   Landmark name for point a (proximal)
 * @param vertexName  Landmark name for the vertex (joint)
 * @param cName   Landmark name for point c (distal)
 */
function computeThreePointAngle(
  frame: NormalizedFrame,
  aName: LandmarkName,
  vertexName: LandmarkName,
  cName: LandmarkName,
): MetricValue {
  const a = getValidLandmark(frame, aName);
  const vertex = getValidLandmark(frame, vertexName);
  const c = getValidLandmark(frame, cName);

  const minConf = minVisibilityOf([a, vertex, c]);

  if (!a || !vertex || !c) {
    return invalidMetric(INVALID_ANGLE_VALUE, frame.timestampMs, minConf);
  }

  // FR-ANGLE-003: clamp floating-point, handle zero-length without NaN
  const angle = computeAngle3D(a, vertex, c);

  // Guard against NaN (shouldn't happen with computeAngle3D, but be safe)
  if (!Number.isFinite(angle)) {
    return invalidMetric(INVALID_ANGLE_VALUE, frame.timestampMs, minConf);
  }

  return {
    value: angle,
    timestampMs: frame.timestampMs,
    valid: true,
    minConfidence: minConf,
  };
}

/**
 * Knee angle: three-point angle at the knee (hip–knee–ankle).
 * Standing ≈ 180°, deep squat ≈ 70–90°.
 */
export function computeKneeAngle(
  frame: NormalizedFrame,
  side: 'left' | 'right',
): MetricValue {
  if (side === 'left') {
    return computeThreePointAngle(frame, 'left_hip', 'left_knee', 'left_ankle');
  }
  return computeThreePointAngle(
    frame,
    'right_hip',
    'right_knee',
    'right_ankle',
  );
}

/**
 * Hip angle: three-point angle at the hip (shoulder–hip–knee).
 * Standing ≈ 180°, deep squat ≈ 70–90°.
 */
export function computeHipAngle(
  frame: NormalizedFrame,
  side: 'left' | 'right',
): MetricValue {
  if (side === 'left') {
    return computeThreePointAngle(
      frame,
      'left_shoulder',
      'left_hip',
      'left_knee',
    );
  }
  return computeThreePointAngle(
    frame,
    'right_shoulder',
    'right_hip',
    'right_knee',
  );
}

// ---------------------------------------------------------------------------
// Segment-to-vertical angle
// ---------------------------------------------------------------------------

/**
 * Torso inclination: angle of the shoulder-to-hip segment from the vertical axis.
 *
 * 0° = upright (torso aligned with gravity), increasing as the person leans forward.
 * Uses the 2D angle between the torso vector and the vertical-up direction.
 *
 * Uses shoulder midpoint and hip midpoint for robustness.
 */
export function computeTorsoInclination(frame: NormalizedFrame): MetricValue {
  const shoulder = getMidpoint(frame, 'left_shoulder', 'right_shoulder');
  const hip = getMidpoint(frame, 'left_hip', 'right_hip');

  const minConf = minVisibilityOf([shoulder, hip]);

  if (!shoulder || !hip) {
    return invalidMetric(INVALID_ANGLE_VALUE, frame.timestampMs, minConf);
  }

  // In normalized image coordinates, y increases downward.
  // Vertical-up direction = (0, -1).
  // We compute the 2D angle between hip→shoulder and vertical-up.
  const torsoVec: Point3D = {
    x: shoulder.x - hip.x,
    y: shoulder.y - hip.y,
    z: 0, // inclination is a 2D metric (image plane)
  };
  const verticalUp: Point3D = { x: 0, y: -1, z: 0 };

  // Use computeAngle2D with vertex at hip
  const angle = computeAngle2D(torsoVec, { x: 0, y: 0, z: 0 }, verticalUp);

  if (!Number.isFinite(angle)) {
    return invalidMetric(INVALID_ANGLE_VALUE, frame.timestampMs, minConf);
  }

  return {
    value: angle,
    timestampMs: frame.timestampMs,
    valid: true,
    minConfidence: minConf,
  };
}

// ---------------------------------------------------------------------------
// Normalised distance metric
// ---------------------------------------------------------------------------

/**
 * Hip depth: normalised vertical distance from hip midpoint to knee midpoint.
 *
 * Positive = hips above knees (standing tall).
 * Near zero = hips at knee level (parallel squat depth).
 * Negative = hips below knees (deep squat / "ass to grass").
 *
 * Units: hip-widths (because the frame is normalised by hip width).
 */
export function computeHipDepth(frame: NormalizedFrame): MetricValue {
  const hip = getMidpoint(frame, 'left_hip', 'right_hip');
  const knee = getMidpoint(frame, 'left_knee', 'right_knee');

  const minConf = minVisibilityOf([hip, knee]);

  if (!hip || !knee) {
    return invalidMetric(INVALID_DISTANCE_VALUE, frame.timestampMs, minConf);
  }

  // In y-down image coordinates: hip above knee means hip.y < knee.y
  // After normalization, origin is at hip midpoint, so hip.y ≈ 0.
  // Depth = knee.y - hip.y (positive when hip is above knee)
  const depth = knee.y - hip.y;

  if (!Number.isFinite(depth)) {
    return invalidMetric(INVALID_DISTANCE_VALUE, frame.timestampMs, minConf);
  }

  return {
    value: depth,
    timestampMs: frame.timestampMs,
    valid: true,
    minConfidence: minConf,
  };
}

// ---------------------------------------------------------------------------
// Full squat metric set
// ---------------------------------------------------------------------------

/**
 * Computes all M0 Squat metrics for a single normalized frame.
 */
export function computeSquatMetrics(frame: NormalizedFrame): SquatMetrics {
  return {
    kneeAngleLeft: computeKneeAngle(frame, 'left'),
    kneeAngleRight: computeKneeAngle(frame, 'right'),
    hipAngleLeft: computeHipAngle(frame, 'left'),
    hipAngleRight: computeHipAngle(frame, 'right'),
    torsoInclination: computeTorsoInclination(frame),
    hipDepth: computeHipDepth(frame),
  };
}

// ---------------------------------------------------------------------------
// Velocity metrics (FR-ANGLE-004)
// ---------------------------------------------------------------------------

/**
 * Computes angular (or linear) velocity from two metric values.
 *
 * FR-ANGLE-004:
 * - Uses actual elapsed time (curr - prev)
 * - Rejects non-monotonic timestamps (curr <= prev)
 * - Rejects implausibly large gaps (> MAX_VELOCITY_TIMESTAMP_GAP_MS)
 *
 * @returns MetricValue where value is in deg/s (angles) or hip-widths/s (distance)
 */
export function computeVelocity(
  prev: MetricValue,
  curr: MetricValue,
): MetricValue {
  const elapsedMs = curr.timestampMs - prev.timestampMs;

  // Reject non-monotonic timestamps
  if (elapsedMs <= 0) {
    return invalidMetric(
      0,
      curr.timestampMs,
      Math.min(prev.minConfidence, curr.minConfidence),
    );
  }

  // Reject implausibly large gaps
  if (elapsedMs > MAX_VELOCITY_TIMESTAMP_GAP_MS) {
    return invalidMetric(
      0,
      curr.timestampMs,
      Math.min(prev.minConfidence, curr.minConfidence),
    );
  }

  // If either metric is invalid, velocity is invalid but still computed with safe values
  const bothValid = prev.valid && curr.valid;
  const minConf = Math.min(prev.minConfidence, curr.minConfidence);

  const deltaValue = curr.value - prev.value;
  const elapsedSec = elapsedMs / 1000;
  const velocity = deltaValue / elapsedSec;

  if (!Number.isFinite(velocity)) {
    return invalidMetric(0, curr.timestampMs, minConf);
  }

  return {
    value: velocity,
    timestampMs: curr.timestampMs,
    valid: bothValid,
    minConfidence: minConf,
  };
}

/**
 * Computes velocity metrics for the full squat metric set from two consecutive frames.
 */
export function computeSquatVelocity(
  prev: SquatMetrics,
  curr: SquatMetrics,
): SquatVelocity {
  return {
    kneeAngleLeft: computeVelocity(prev.kneeAngleLeft, curr.kneeAngleLeft),
    kneeAngleRight: computeVelocity(prev.kneeAngleRight, curr.kneeAngleRight),
    hipAngleLeft: computeVelocity(prev.hipAngleLeft, curr.hipAngleLeft),
    hipAngleRight: computeVelocity(prev.hipAngleRight, curr.hipAngleRight),
    torsoInclination: computeVelocity(
      prev.torsoInclination,
      curr.torsoInclination,
    ),
    hipDepth: computeVelocity(prev.hipDepth, curr.hipDepth),
  };
}

// ---------------------------------------------------------------------------
// Range of Motion (ROM) — range over a window
// ---------------------------------------------------------------------------

/**
 * Computes the range (max - min) of a metric over a window of values.
 *
 * The result carries:
 * - value: max - min (only considering valid metrics)
 * - timestampMs: timestamp of the last valid metric in the window
 * - valid: true only if at least 2 valid metrics exist in the window
 * - minConfidence: minimum confidence among contributing metrics
 *
 * Invalid metrics in the window are excluded from the range computation
 * but do not invalidate the result if enough valid metrics remain.
 */
export function computeRangeOverWindow(values: MetricValue[]): MetricValue {
  const validValues = values.filter((v) => v.valid);

  if (validValues.length === 0) {
    return invalidMetric(
      0,
      values.length > 0 ? values[values.length - 1].timestampMs : 0,
      0,
    );
  }

  const minConf = Math.min(...validValues.map((v) => v.minConfidence));
  const lastTimestamp = validValues[validValues.length - 1].timestampMs;

  if (validValues.length < 2) {
    // Need at least 2 points to have a meaningful range
    return {
      value: 0,
      timestampMs: lastTimestamp,
      valid: false,
      minConfidence: minConf,
    };
  }

  const metricValues = validValues.map((v) => v.value);
  const range = Math.max(...metricValues) - Math.min(...metricValues);

  if (!Number.isFinite(range)) {
    return invalidMetric(0, lastTimestamp, minConf);
  }

  return {
    value: range,
    timestampMs: lastTimestamp,
    valid: true,
    minConfidence: minConf,
  };
}

/**
 * Computes ROM for all squat metrics over a window of SquatMetrics.
 *
 * @param window  Array of SquatMetrics from consecutive frames
 * @returns ROM for each metric
 */
export function computeSquatROM(window: SquatMetrics[]): SquatMetrics {
  if (window.length === 0) {
    const zero: MetricValue = {
      value: 0,
      timestampMs: 0,
      valid: false,
      minConfidence: 0,
    };
    return {
      kneeAngleLeft: zero,
      kneeAngleRight: zero,
      hipAngleLeft: zero,
      hipAngleRight: zero,
      torsoInclination: zero,
      hipDepth: zero,
    };
  }

  return {
    kneeAngleLeft: computeRangeOverWindow(window.map((m) => m.kneeAngleLeft)),
    kneeAngleRight: computeRangeOverWindow(window.map((m) => m.kneeAngleRight)),
    hipAngleLeft: computeRangeOverWindow(window.map((m) => m.hipAngleLeft)),
    hipAngleRight: computeRangeOverWindow(window.map((m) => m.hipAngleRight)),
    torsoInclination: computeRangeOverWindow(
      window.map((m) => m.torsoInclination),
    ),
    hipDepth: computeRangeOverWindow(window.map((m) => m.hipDepth)),
  };
}

// ---------------------------------------------------------------------------
// Utility: extract a single metric from SquatMetrics by ID
// ---------------------------------------------------------------------------

/**
 * Retrieves a specific metric from the SquatMetrics set by its ID.
 */
export function getMetricById(
  metrics: SquatMetrics,
  id: SquatMetricId,
): MetricValue {
  switch (id) {
    case 'knee_angle_left':
      return metrics.kneeAngleLeft;
    case 'knee_angle_right':
      return metrics.kneeAngleRight;
    case 'hip_angle_left':
      return metrics.hipAngleLeft;
    case 'hip_angle_right':
      return metrics.hipAngleRight;
    case 'torso_inclination':
      return metrics.torsoInclination;
    case 'hip_depth':
      return metrics.hipDepth;
  }
}
