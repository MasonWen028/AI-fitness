/**
 * M0-H: Squat Phase State Machine
 *
 * SRS: FR-PHASE-001 through FR-PHASE-005
 *
 * The phase engine is a deterministic timestamped finite-state machine.
 * - FR-PHASE-001: explicit initial, movement, completion, paused, tracking-lost behaviour
 * - FR-PHASE-002: transitions require minimum confidence and dwell time; hysteresis on chattering thresholds
 * - FR-PHASE-003: illegal transitions are rejected with a diagnostic code
 * - FR-PHASE-004: tracking-loss beyond grace period pauses/invalidates the open rep
 * - FR-PHASE-005: phase output includes state, entered timestamp, transition reason, confidence, profile version
 */

import type { SquatMetrics, MetricValue } from './metrics';
import { getEffectiveKneeAngle } from './squatMetricsShared';

export type SquatPhase =
  'READY' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING' | 'PAUSED' | 'TRACKING_LOST';

export type TransitionReason =
  | 'init'
  | 'descent_started'
  | 'bottom_reached'
  | 'ascent_started'
  | 'standing_reached'
  | 'tracking_lost'
  | 'grace_exceeded'
  | 'tracking_restored'
  | 'tracking_restored_reset'
  | 'illegal_rejected';

export type PhaseState = {
  phase: SquatPhase;
  enteredTimestampMs: number;
  transitionReason: TransitionReason;
  confidence: number;
  profileVersion: string;
};

export type PhaseFSMState = PhaseState & {
  pendingTransition: SquatPhase | null;
  pendingSinceMs: number;
  lastTrackedTimestampMs: number;
  preTrackingLossPhase: SquatPhase | null;
};

export type SquatPhaseConfig = {
  thresholds: {
    descentKneeAngle: number;
    bottomKneeAngle: number;
    ascentKneeAngle: number;
    standingKneeAngle: number;
  };
  minConfidence: number;
  dwellMs: number;
  trackingGraceMs: number;
  profileVersion: string;
};

export const DEFAULT_SQUAT_PHASE_CONFIG: SquatPhaseConfig = {
  thresholds: {
    descentKneeAngle: 155,
    bottomKneeAngle: 110,
    ascentKneeAngle: 125,
    standingKneeAngle: 165,
  },
  minConfidence: 0.5,
  dwellMs: 50,
  trackingGraceMs: 500,
  profileVersion: 'm0-squat-candidate-0.1.0',
};

export function createInitialPhaseState(
  timestampMs: number,
  config: SquatPhaseConfig = DEFAULT_SQUAT_PHASE_CONFIG,
): PhaseFSMState {
  return {
    phase: 'READY',
    enteredTimestampMs: timestampMs,
    transitionReason: 'init',
    confidence: 0,
    profileVersion: config.profileVersion,
    pendingTransition: null,
    pendingSinceMs: 0,
    lastTrackedTimestampMs: timestampMs,
    preTrackingLossPhase: null,
  };
}

function isTrackingLost(metrics: SquatMetrics, minConfidence: number): boolean {
  const kneeAngle = getEffectiveKneeAngle(metrics);
  return !kneeAngle.valid || kneeAngle.minConfidence < minConfidence;
}

function determineTargetPhase(
  currentPhase: SquatPhase,
  kneeAngle: MetricValue,
  config: SquatPhaseConfig,
): SquatPhase | null {
  if (!kneeAngle.valid) return null;

  const angle = kneeAngle.value;
  const t = config.thresholds;

  switch (currentPhase) {
    case 'READY':
      if (angle < t.descentKneeAngle) return 'DESCENDING';
      return null;
    case 'DESCENDING':
      if (angle < t.bottomKneeAngle) return 'BOTTOM';
      if (angle > t.ascentKneeAngle) return 'ASCENDING';
      return null;
    case 'BOTTOM':
      if (angle > t.ascentKneeAngle) return 'ASCENDING';
      return null;
    case 'ASCENDING':
      if (angle > t.standingKneeAngle) return 'READY';
      if (angle < t.bottomKneeAngle) return 'BOTTOM';
      return null;
    case 'PAUSED':
    case 'TRACKING_LOST':
      return null;
  }
}

function isLegalTransition(from: SquatPhase, to: SquatPhase): boolean {
  if (from === to) return false;

  const legal: Record<SquatPhase, SquatPhase[]> = {
    READY: ['DESCENDING', 'PAUSED'],
    DESCENDING: ['BOTTOM', 'ASCENDING', 'PAUSED'],
    BOTTOM: ['ASCENDING', 'PAUSED'],
    ASCENDING: ['READY', 'BOTTOM', 'PAUSED'],
    PAUSED: ['READY', 'DESCENDING', 'BOTTOM', 'ASCENDING', 'TRACKING_LOST'],
    TRACKING_LOST: ['READY'],
  };

  return legal[from].includes(to);
}

export function updatePhase(
  prev: PhaseFSMState,
  metrics: SquatMetrics,
  config: SquatPhaseConfig = DEFAULT_SQUAT_PHASE_CONFIG,
): PhaseFSMState {
  const timestampMs = metrics.kneeAngleLeft.timestampMs;
  const trackingLost = isTrackingLost(metrics, config.minConfidence);

  if (trackingLost) {
    if (prev.phase !== 'PAUSED' && prev.phase !== 'TRACKING_LOST') {
      return {
        ...prev,
        phase: 'PAUSED',
        enteredTimestampMs: timestampMs,
        transitionReason: 'tracking_lost',
        confidence: 0,
        pendingTransition: null,
        pendingSinceMs: 0,
        preTrackingLossPhase: prev.phase,
      };
    }

    if (prev.phase === 'PAUSED') {
      const pauseDuration = timestampMs - prev.enteredTimestampMs;
      if (pauseDuration > config.trackingGraceMs) {
        return {
          ...prev,
          phase: 'TRACKING_LOST',
          enteredTimestampMs: timestampMs,
          transitionReason: 'grace_exceeded',
          confidence: 0,
          pendingTransition: null,
          pendingSinceMs: 0,
        };
      }
    }

    return { ...prev, lastTrackedTimestampMs: prev.lastTrackedTimestampMs };
  }

  if (prev.phase === 'TRACKING_LOST') {
    return {
      ...prev,
      phase: 'READY',
      enteredTimestampMs: timestampMs,
      transitionReason: 'tracking_restored_reset',
      confidence: getEffectiveKneeAngle(metrics).minConfidence,
      pendingTransition: null,
      pendingSinceMs: 0,
      lastTrackedTimestampMs: timestampMs,
      preTrackingLossPhase: null,
    };
  }

  if (prev.phase === 'PAUSED') {
    const kneeAngle = getEffectiveKneeAngle(metrics);
    const resumePhase = determineResumePhase(kneeAngle, config);
    return {
      ...prev,
      phase: resumePhase,
      enteredTimestampMs: timestampMs,
      transitionReason: 'tracking_restored',
      confidence: kneeAngle.minConfidence,
      pendingTransition: null,
      pendingSinceMs: 0,
      lastTrackedTimestampMs: timestampMs,
      preTrackingLossPhase: null,
    };
  }

  const kneeAngle = getEffectiveKneeAngle(metrics);
  const targetPhase = determineTargetPhase(prev.phase, kneeAngle, config);

  if (targetPhase === null) {
    return {
      ...prev,
      pendingTransition: null,
      pendingSinceMs: 0,
      lastTrackedTimestampMs: timestampMs,
    };
  }

  if (!isLegalTransition(prev.phase, targetPhase)) {
    return {
      ...prev,
      pendingTransition: null,
      pendingSinceMs: 0,
      lastTrackedTimestampMs: timestampMs,
      transitionReason: 'illegal_rejected',
    };
  }

  if (prev.pendingTransition !== targetPhase) {
    if (config.dwellMs <= 0) {
      return {
        ...prev,
        phase: targetPhase,
        enteredTimestampMs: timestampMs,
        transitionReason: getTransitionReason(prev.phase, targetPhase),
        confidence: kneeAngle.minConfidence,
        pendingTransition: null,
        pendingSinceMs: 0,
        lastTrackedTimestampMs: timestampMs,
      };
    }
    return {
      ...prev,
      pendingTransition: targetPhase,
      pendingSinceMs: timestampMs,
      lastTrackedTimestampMs: timestampMs,
    };
  }

  const dwellElapsed = timestampMs - prev.pendingSinceMs;
  if (dwellElapsed < config.dwellMs) {
    return { ...prev, lastTrackedTimestampMs: timestampMs };
  }

  return {
    ...prev,
    phase: targetPhase,
    enteredTimestampMs: timestampMs,
    transitionReason: getTransitionReason(prev.phase, targetPhase),
    confidence: kneeAngle.minConfidence,
    pendingTransition: null,
    pendingSinceMs: 0,
    lastTrackedTimestampMs: timestampMs,
  };
}

function determineResumePhase(
  kneeAngle: MetricValue,
  config: SquatPhaseConfig,
): SquatPhase {
  if (!kneeAngle.valid) return 'READY';

  const angle = kneeAngle.value;
  const t = config.thresholds;

  if (angle > t.standingKneeAngle) return 'READY';
  if (angle < t.bottomKneeAngle) return 'BOTTOM';
  if (angle < t.descentKneeAngle) return 'DESCENDING';
  return 'ASCENDING';
}

function getTransitionReason(
  from: SquatPhase,
  to: SquatPhase,
): TransitionReason {
  switch (to) {
    case 'DESCENDING':
      return 'descent_started';
    case 'BOTTOM':
      return 'bottom_reached';
    case 'ASCENDING':
      return 'ascent_started';
    case 'READY':
      return 'standing_reached';
    case 'PAUSED':
      return 'tracking_lost';
    case 'TRACKING_LOST':
      return 'grace_exceeded';
    default:
      return 'init';
  }
}

export function toPhaseState(fsm: PhaseFSMState): PhaseState {
  return {
    phase: fsm.phase,
    enteredTimestampMs: fsm.enteredTimestampMs,
    transitionReason: fsm.transitionReason,
    confidence: fsm.confidence,
    profileVersion: fsm.profileVersion,
  };
}
