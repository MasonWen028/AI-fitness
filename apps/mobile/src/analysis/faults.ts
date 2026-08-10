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

import type { SquatMetrics, SquatMetricId } from './metrics';
import type { PhaseState, SquatPhase } from './phaseMachine';
import type { RepDetectionState } from './repDetection';
import { getEffectiveKneeAngle } from './squatMetricsShared';

export type FaultStatus = 'DETECTED' | 'NOT_OBSERVABLE';

export type FaultSeverity = 'INFO' | 'IMPORTANT' | 'CRITICAL';

export type SquatFaultCode = 'INSUFFICIENT_DEPTH' | 'EXCESSIVE_FORWARD_LEAN';

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

export type FaultEvaluation = {
  insufficientDepth: FaultResult | null;
  excessiveForwardLean: FaultResult | null;
};

export type FaultContext = {
  metrics: SquatMetrics;
  phase: PhaseState;
  repState: RepDetectionState;
  config?: FaultConfig;
};

export type FaultConfig = {
  insufficientDepth: {
    kneeAngleThreshold: number;
    minConfidence: number;
    severity: FaultSeverity;
  };
  excessiveForwardLean: {
    torsoInclinationThreshold: number;
    minConfidence: number;
    severity: FaultSeverity;
  };
  ruleVersion: string;
};

export const DEFAULT_FAULT_CONFIG: FaultConfig = {
  insufficientDepth: {
    kneeAngleThreshold: 140,
    minConfidence: 0.5,
    severity: 'IMPORTANT',
  },
  excessiveForwardLean: {
    torsoInclinationThreshold: 45,
    minConfidence: 0.5,
    severity: 'IMPORTANT',
  },
  ruleVersion: 'm0-squat-faults-0.1.0',
};

export function evaluateInsufficientDepth(
  context: FaultContext,
): FaultResult | null {
  const { metrics, phase, repState, config = DEFAULT_FAULT_CONFIG } = context;
  const cfg = config.insufficientDepth;

  if (phase.phase !== 'BOTTOM') return null;

  const kneeAngle = getEffectiveKneeAngle(metrics);
  const repIndex = getRepIndex(repState);

  const baseResult = {
    code: 'INSUFFICIENT_DEPTH' as const,
    phase: phase.phase,
    repIndex,
    evidenceMetricIds: [
      'knee_angle_left',
      'knee_angle_right',
    ] as SquatMetricId[],
    ruleVersion: config.ruleVersion,
    timestampMs: phase.enteredTimestampMs,
    threshold: cfg.kneeAngleThreshold,
  };

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

  const detected = kneeAngle.value > cfg.kneeAngleThreshold;

  return {
    ...baseResult,
    status: detected ? 'DETECTED' : 'NOT_OBSERVABLE',
    severity: cfg.severity,
    confidence: kneeAngle.minConfidence,
    value: kneeAngle.value,
  };
}

export function evaluateExcessiveForwardLean(
  context: FaultContext,
): FaultResult | null {
  const { metrics, phase, repState, config = DEFAULT_FAULT_CONFIG } = context;
  const cfg = config.excessiveForwardLean;

  const activePhases: SquatPhase[] = ['DESCENDING', 'BOTTOM', 'ASCENDING'];
  if (!activePhases.includes(phase.phase)) return null;

  const torsoInclination = metrics.torsoInclination;
  const repIndex = getRepIndex(repState);

  const baseResult = {
    code: 'EXCESSIVE_FORWARD_LEAN' as const,
    phase: phase.phase,
    repIndex,
    evidenceMetricIds: ['torso_inclination'] as SquatMetricId[],
    ruleVersion: config.ruleVersion,
    timestampMs: phase.enteredTimestampMs,
    threshold: cfg.torsoInclinationThreshold,
  };

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

  const detected = torsoInclination.value > cfg.torsoInclinationThreshold;

  return {
    ...baseResult,
    status: detected ? 'DETECTED' : 'NOT_OBSERVABLE',
    severity: cfg.severity,
    confidence: torsoInclination.minConfidence,
    value: torsoInclination.value,
  };
}

export function evaluateFaults(context: FaultContext): FaultEvaluation {
  return {
    insufficientDepth: evaluateInsufficientDepth(context),
    excessiveForwardLean: evaluateExcessiveForwardLean(context),
  };
}

function getRepIndex(repState: RepDetectionState): number | null {
  if (repState.currentAttempt) {
    return repState.completedReps.length + repState.incompleteReps.length;
  }

  if (repState.completedReps.length > 0) {
    return repState.completedReps.length - 1;
  }

  return null;
}

export const FAULT_CATALOG: Record<
  SquatFaultCode,
  {
    code: SquatFaultCode;
    exercise: string;
    description: string;
    evidenceMetrics: SquatMetricId[];
    evaluationPhase: SquatPhase[];
    knownConfounders: string[];
    validationStatus: string;
  }
> = {
  INSUFFICIENT_DEPTH: {
    code: 'INSUFFICIENT_DEPTH',
    exercise: 'Bodyweight Squat',
    description:
      'Knee flexion does not reach sufficient depth at the bottom of the squat',
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
