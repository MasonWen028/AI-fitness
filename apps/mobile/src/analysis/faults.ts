/**
 * M0-J / M0-K: Candidate Fault Detection
 *
 * SRS: FR-RULE-002, FR-RULE-003, FR-RULE-004, FR-FAULT-001, FR-FAULT-002, FR-FAULT-005
 *
 * Two M0 candidate Squat faults:
 * - M0-J: INSUFFICIENT_DEPTH — knee flexion at BOTTOM does not reach depth threshold
 * - M0-K: EXCESSIVE_FORWARD_LEAN — torso inclination exceeds lean threshold during movement
 *
 * Design principles:
 * - FR-RULE-002: Deterministic for identical inputs
 * - FR-RULE-003: Every emitted fault includes code, severity, confidence, phase/rep, evidence metric IDs, rule version
 * - FR-RULE-004: Fail closed — invalid/missing evidence produces no form assertion
 * - FR-FAULT-002: No fault stated when required evidence is missing or below confidence
 * - FR-FAULT-005: No force, pain, injury, muscle activation or clinical alignment claims
 *
 * NOTE: All numeric thresholds are M0 technical-validation defaults.
 * Production values require <VALIDATION_REQUIRED> per the architecture.
 */

import type { SquatMetrics, MetricValue, SquatMetricId } from './metrics';
import type { PhaseState, SquatPhase } from './phaseMachine';
import type { RepDetectionState } from './repDetection';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Fault status (SRS Section 27) */
export type FaultStatus =
  | 'DETECTED'         // validated rule and required view/quality met
  | 'NOT_OBSERVABLE';  // required evidence is missing or below confidence

/** Fault severity */
export type FaultSeverity = 'INFO' | 'IMPORTANT' | 'CRITICAL';

/** Stable machine fault codes (FR-FAULT-001) */
export type SquatFaultCode = 'INSUFFICIENT_DEPTH' | 'EXCESSIVE_FORWARD_LEAN';

/**
 * Fault evaluation result (FR-RULE-003).
 *
 * Every emitted fault includes:
 * - code: stable machine identifier (FR-FAULT-001)
 * - status: DETECTED or NOT_OBSERVABLE (FR-FAULT-002)
 * - severity: importance level
 * - confidence: minimum confidence of contributing evidence
 * - phase: squat phase when the fault was evaluated
 * - repIndex: index of the rep being evaluated (null if between reps)
 * - evidenceMetricIds: IDs of metrics used as evidence
 * - ruleVersion: version of the rule that produced this result
 * - timestampMs: when the fault was evaluated
 * - value: the metric value that triggered (or would trigger) the fault
 * - threshold: the threshold against which the value was compared
 */
export type FaultResult = {
  code: SquatFaultCode;
  status: FaultStatus;
  severity: FaultSeverity;
  confidence: number;
  phase: SquatPhase;
  repIndex: number | null;
  evidenceMetricIds: SquatMetricId[];
  ruleVersion: string;
  timestampMs: number;
  value: number;
  threshold: number;
};

/**
 * Combined result of evaluating both fault detectors.
 * `null` entries mean the fault was not evaluated (wrong phase or no active rep).
 */
export type FaultEvaluation = {
  insufficientDepth: FaultResult | null;
  excessiveForwardLean: FaultResult | null;
};

/**
 * Context for fault evaluation.
 */
export type FaultContext = {
  metrics: SquatMetrics;
  phase: PhaseState;
  repState: RepDetectionState;
  config?: FaultConfig;
};

/**
 * Configuration for fault detection thresholds.
 *
 * NOTE: All numeric values are M0 technical-validation defaults.
 * Production values require <VALIDATION_REQUIRED>.
 */
export type FaultConfig = {
  insufficientDepth: {
    /** Knee angle above this at BOTTOM → insufficient depth (degrees).
     *  Higher angle = less flexion = shallower squat. */
    kneeAngleThreshold: number;
    /** Minimum metric confidence required (0-1) */
    minConfidence: number;
    /** Severity when detected */
    severity: FaultSeverity;
  };
  excessiveForwardLean: {
    /** Torso inclination above this → excessive forward lean (degrees).
     *  0° = upright, increasing as person leans forward. */
    torsoInclinationThreshold: number;
    /** Minimum metric confidence required (0-1) */
    minConfidence: number;
    /** Severity when detected */
    severity: FaultSeverity;
  };
  /** Rule version string */
  ruleVersion: string;
};

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

/**
 * Default M0 fault configuration.
 *
 * NOTE: These are technical-validation defaults for M0.
 * Production values require <VALIDATION_REQUIRED> per the architecture.
 * These thresholds are intentionally conservative to avoid false positives
 * during M0 proof-of-architecture.
 */
export const DEFAULT_FAULT_CONFIG: FaultConfig = {
  insufficientDepth: {
    // If knee angle at BOTTOM > 140°, the squat is too shallow
    // (180° = fully straight, 90° = deep squat, 140° = barely quarter squat)
    kneeAngleThreshold: 140,
    minConfidence: 0.5,
    severity: 'IMPORTANT',
  },
  excessiveForwardLean: {
    // If torso inclination > 45° during movement, excessive forward lean
    // (0° = upright, 30° = slight lean, 45° = significant lean)
    torsoInclinationThreshold: 45,
    minConfidence: 0.5,
    severity: 'IMPORTANT',
  },
  ruleVersion: 'm0-squat-faults-0.1.0',
};

// ---------------------------------------------------------------------------
// M0-J: Insufficient Depth Fault
// ---------------------------------------------------------------------------

/**
 * Evaluates the INSUFFICIENT_DEPTH fault.
 *
 * This fault fires when the knee angle at the BOTTOM phase exceeds the
 * threshold, indicating the squat did not reach sufficient depth.
 *
 * Evaluation trigger: phase = BOTTOM
 * Evidence: knee_angle_left, knee_angle_right (effective = average of valid sides)
 * Fail closed: if knee angle is invalid or confidence < minConfidence → NOT_OBSERVABLE
 *
 * @param context  Fault evaluation context
 * @returns        FaultResult or null (null = not evaluated, wrong phase)
 */
export function evaluateInsufficientDepth(
  context: FaultContext,
): FaultResult | null {
  const { metrics, phase, repState, config = DEFAULT_FAULT_CONFIG } = context;
  const cfg = config.insufficientDepth;

  // Only evaluate at BOTTOM phase
  if (phase.phase !== 'BOTTOM') return null;

  // Get effective knee angle (average of valid sides)
  const kneeAngle = getEffectiveKneeAngle(metrics);

  // Determine rep index
  const repIndex = getRepIndex(repState);

  // Base result fields
  const baseResult = {
    code: 'INSUFFICIENT_DEPTH' as const,
    phase: phase.phase,
    repIndex,
    evidenceMetricIds: ['knee_angle_left', 'knee_angle_right'] as SquatMetricId[],
    ruleVersion: config.ruleVersion,
    timestampMs: phase.enteredTimestampMs,
    threshold: cfg.kneeAngleThreshold,
  };

  // FR-RULE-004 / FR-FAULT-002: Fail closed when evidence is insufficient
  if (!kneeAngle.valid) {
    return {
      ...baseResult,
      status: 'NOT_OBSERVABLE',
      severity: cfg.severity,
      confidence: kneeAngle.minConfidence,
      value: kneeAngle.value,
    };
  }

  if (kneeAngle.minConfidence < cfg.minConfidence) {
    return {
      ...baseResult,
      status: 'NOT_OBSERVABLE',
      severity: cfg.severity,
      confidence: kneeAngle.minConfidence,
      value: kneeAngle.value,
    };
  }

  // Evaluate threshold: knee angle > threshold → insufficient depth
  // (higher angle = less flexion = shallower squat)
  const detected = kneeAngle.value > cfg.kneeAngleThreshold;

  return {
    ...baseResult,
    status: detected ? 'DETECTED' : 'NOT_OBSERVABLE',
    severity: cfg.severity,
    confidence: kneeAngle.minConfidence,
    value: kneeAngle.value,
  };
}

// ---------------------------------------------------------------------------
// M0-K: Excessive Forward Lean Fault
// ---------------------------------------------------------------------------

/**
 * Evaluates the EXCESSIVE_FORWARD_LEAN fault.
 *
 * This fault fires when the torso inclination exceeds the threshold
 * during active movement (DESCENDING, BOTTOM, or ASCENDING phases).
 *
 * Evaluation trigger: phase in {DESCENDING, BOTTOM, ASCENDING}
 * Evidence: torso_inclination
 * Fail closed: if torso inclination is invalid or confidence < minConfidence → NOT_OBSERVABLE
 *
 * @param context  Fault evaluation context
 * @returns        FaultResult or null (null = not evaluated, wrong phase)
 */
export function evaluateExcessiveForwardLean(
  context: FaultContext,
): FaultResult | null {
  const { metrics, phase, repState, config = DEFAULT_FAULT_CONFIG } = context;
  const cfg = config.excessiveForwardLean;

  // Only evaluate during active movement phases
  const activePhases: SquatPhase[] = ['DESCENDING', 'BOTTOM', 'ASCENDING'];
  if (!activePhases.includes(phase.phase)) return null;

  const torsoInclination = metrics.torsoInclination;

  // Determine rep index
  const repIndex = getRepIndex(repState);

  // Base result fields
  const baseResult = {
    code: 'EXCESSIVE_FORWARD_LEAN' as const,
    phase: phase.phase,
    repIndex,
    evidenceMetricIds: ['torso_inclination'] as SquatMetricId[],
    ruleVersion: config.ruleVersion,
    timestampMs: phase.enteredTimestampMs,
    threshold: cfg.torsoInclinationThreshold,
  };

  // FR-RULE-004 / FR-FAULT-002: Fail closed when evidence is insufficient
  if (!torsoInclination.valid) {
    return {
      ...baseResult,
      status: 'NOT_OBSERVABLE',
      severity: cfg.severity,
      confidence: torsoInclination.minConfidence,
      value: torsoInclination.value,
    };
  }

  if (torsoInclination.minConfidence < cfg.minConfidence) {
    return {
      ...baseResult,
      status: 'NOT_OBSERVABLE',
      severity: cfg.severity,
      confidence: torsoInclination.minConfidence,
      value: torsoInclination.value,
    };
  }

  // Evaluate threshold: torso inclination > threshold → excessive forward lean
  const detected = torsoInclination.value > cfg.torsoInclinationThreshold;

  return {
    ...baseResult,
    status: detected ? 'DETECTED' : 'NOT_OBSERVABLE',
    severity: cfg.severity,
    confidence: torsoInclination.minConfidence,
    value: torsoInclination.value,
  };
}

// ---------------------------------------------------------------------------
// Combined evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluates both fault detectors for the current context.
 *
 * Returns null for any fault that is not applicable to the current phase.
 *
 * @param context  Fault evaluation context
 * @returns        Combined evaluation result
 */
export function evaluateFaults(context: FaultContext): FaultEvaluation {
  return {
    insufficientDepth: evaluateInsufficientDepth(context),
    excessiveForwardLean: evaluateExcessiveForwardLean(context),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the effective knee angle from SquatMetrics.
 * Uses the average of left and right when both are valid,
 * or the valid one if only one side is valid.
 * Returns an invalid MetricValue if neither side is valid.
 */
function getEffectiveKneeAngle(metrics: SquatMetrics): MetricValue {
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

/**
 * Returns the current rep index (0-based) if an attempt is in progress,
 * or the index of the last completed rep if no attempt is active.
 * Returns null if no reps have been completed and no attempt is in progress.
 */
function getRepIndex(repState: RepDetectionState): number | null {
  if (repState.currentAttempt) {
    // Current attempt is the next rep (after all completed + incomplete)
    return repState.completedReps.length + repState.incompleteReps.length;
  }

  if (repState.completedReps.length > 0) {
    return repState.completedReps.length - 1;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Fault catalog (FR-FAULT-003)
// ---------------------------------------------------------------------------

/**
 * Fault documentation catalog (FR-FAULT-003).
 * Every fault type documents supported exercise, view, phase, evidence,
 * known confounders and validation status.
 */
export const FAULT_CATALOG: Record<SquatFaultCode, {
  code: SquatFaultCode;
  exercise: string;
  description: string;
  evidenceMetrics: SquatMetricId[];
  evaluationPhase: SquatPhase[];
  knownConfounders: string[];
  validationStatus: string;
}> = {
  INSUFFICIENT_DEPTH: {
    code: 'INSUFFICIENT_DEPTH',
    exercise: 'Bodyweight Squat',
    description: 'Knee flexion does not reach sufficient depth at the bottom of the squat',
    evidenceMetrics: ['knee_angle_left', 'knee_angle_right'],
    evaluationPhase: ['BOTTOM'],
    knownConfounders: [
      'Camera angle from below may overestimate depth',
      'Side view required for accurate knee angle',
      'Loose clothing may obscure joint position',
    ],
    validationStatus: 'M0 candidate — not clinically validated',
  },
  EXCESSIVE_FORWARD_LEAN: {
    code: 'EXCESSIVE_FORWARD_LEAN',
    exercise: 'Bodyweight Squat',
    description: 'Torso inclination exceeds threshold during active movement',
    evidenceMetrics: ['torso_inclination'],
    evaluationPhase: ['DESCENDING', 'BOTTOM', 'ASCENDING'],
    knownConfounders: [
      'Camera angle from above may underestimate lean',
      'Hip hinge dominant squatters may trigger false positive',
      'Shoulder landmark occlusion reduces accuracy',
    ],
    validationStatus: 'M0 candidate — not clinically validated',
  },
};
