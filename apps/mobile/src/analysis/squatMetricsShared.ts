import type { MetricValue, SquatMetrics } from './metrics';

export function getEffectiveKneeAngle(metrics: SquatMetrics): MetricValue {
  const left = metrics.kneeAngleLeft;
  const right = metrics.kneeAngleRight;

  if (left.valid && right.valid) {
    return {
      value: (left.value + right.value) / 2,
      timestampMs: left.timestampMs,
      valid: true,
      minConfidence: Math.min(left.minConfidence, right.minConfidence),
    };
  }

  if (left.valid) return left;
  if (right.valid) return right;

  return {
    value: 180,
    timestampMs: left.timestampMs,
    valid: false,
    minConfidence: 0,
  };
}
