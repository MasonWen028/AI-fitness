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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Squat phase states (FR-PHASE-001) */
export type SquatPhase =
  | 'READY'           // initial state, standing upright
  | 'DESCENDING'      // moving down into squat
  | 'BOTTOM'          // at the bottom of the squat
  | 'ASCENDING'       // moving back up
  | 'PAUSED'          // tracking lost, within grace period
  | 'TRACKING_LOST';  // tracking lost, beyond grace period

/** Reason for a phase transition */
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

/** Phase state output (FR-PHASE-005) */
export type PhaseState = {
  /** Current phase */
  phase: SquatPhase;
  /** Timestamp when the current phase was entered (ms) */
  enteredTimestampMs: number;
  /** Reason for entering the current phase */
  transitionReason: TransitionReason;
  /** Confidence of the transition (min confidence of contributing metrics) */
  confidence: number;
  /** Profile/ruleset version */
  profileVersion: string;
};

/** Internal FSM state — includes dwell tracking and tracking-loss timers */
export type PhaseFSMState = PhaseState & {
  /** Pending transition target (if dwell timer is active) */
  pendingTransition: SquatPhase | null;
  /** Timestamp when the pending transition condition first became true */
  pendingSinceMs: number;
  /** Timestamp of the last valid (tracked) observation */
  lastTrackedTimestampMs: number;
  /** The phase before tracking was lost (for resume from PAUSED) */
  preTrackingLossPhase: SquatPhase | null;
};

/** Threshold configuration for the squat phase machine */
export type SquatPhaseConfig = {
  thresholds: {
    /** Below this angle → start descending from READY (degrees) */
    descentKneeAngle: number;
    /** Below this angle → reached BOTTOM (degrees) */
    bottomKneeAngle: number;
    /** Above this angle → start ASCENDING from BOTTOM (degrees, > bottomKneeAngle for hysteresis) */
    ascentKneeAngle: number;
    /** Above this angle → back to READY / rep complete (degrees, > descentKneeAngle for hysteresis) */
    standingKneeAngle: number;
  };
  /** Minimum metric confidence required for transitions (0-1) */
  minConfidence: number;
  /** Minimum dwell time before a transition is confirmed (ms) */
  dwellMs: number;
  /** Grace period for tracking loss before transitioning to TRACKING_LOST (ms) */
  trackingGraceMs: number;
  /** Profile/ruleset version string */
  profileVersion: string;
};

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

/**
 * Default M0 squat phase thresholds.
 *
 * NOTE: These are technical-validation defaults for M0.
 * Production values require <VALIDATION_REQUIRED> per the architecture.
 * Hysteresis gaps are intentionally set to prevent chatter at thresholds.
 */
export const DEFAULT_SQUAT_PHASE_CONFIG: SquatPhaseConfig = {
  thresholds: {
    descentKneeAngle: 155,
    bottomKneeAngle: 110,
    ascentKneeAngle: 125,    // > bottomKneeAngle (hysteresis)
    standingKneeAngle: 165,  // > descentKneeAngle (hysteresis)
  },
  minConfidence: 0.5,
  dwellMs: 50,
  trackingGraceMs: 500,
  profileVersion: 'm0-squat-candidate-0.1.0',
};

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Creates the initial FSM state at the READY phase.
 */
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
    value: 180, // fallback: assume standing
    timestampMs: left.timestampMs,
    valid: false,
    minConfidence: 0,
  };
}

/**
 * Checks if tracking is currently lost based on metric validity.
 */
function isTrackingLost(metrics: SquatMetrics, minConfidence: number): boolean {
  const kneeAngle = getEffectiveKneeAngle(metrics);
  return !kneeAngle.valid || kneeAngle.minConfidence < minConfidence;
}

/**
 * Determines the target phase based on the current knee angle.
 * Returns null if no transition is warranted (staying in current phase).
 */
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

    // PAUSED and TRACKING_LOST are handled by tracking logic, not angle logic
    case 'PAUSED':
    case 'TRACKING_LOST':
      return null;
  }
}

/**
 * Legal transition check (FR-PHASE-003).
 * Returns true if the transition from → to is legal.
 */
function isLegalTransition(from: SquatPhase, to: SquatPhase): boolean {
  // Self-transitions are not real transitions
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

// ---------------------------------------------------------------------------
// FSM update function
// ---------------------------------------------------------------------------

/**
 * Updates the phase state based on new squat metrics.
 *
 * This is the main entry point for the phase machine. It processes one
 * observation at a time and produces the new phase state.
 *
 * @param prev     Previous FSM state
 * @param metrics  Squat metrics for the current frame
 * @param config   Phase configuration (thresholds, dwell, grace)
 * @returns        New FSM state
 */
export function updatePhase(
  prev: PhaseFSMState,
  metrics: SquatMetrics,
  config: SquatPhaseConfig = DEFAULT_SQUAT_PHASE_CONFIG,
): PhaseFSMState {
  const timestampMs = metrics.kneeAngleLeft.timestampMs;
  const trackingLost = isTrackingLost(metrics, config.minConfidence);

  // --- Tracking loss handling (FR-PHASE-004) ---

  if (trackingLost) {
    if (prev.phase !== 'PAUSED' && prev.phase !== 'TRACKING_LOST') {
      // First frame of tracking loss → enter PAUSED
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

    // Already in PAUSED → check if grace period exceeded
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

    // Still in PAUSED or TRACKING_LOST, no change
    return { ...prev, lastTrackedTimestampMs: prev.lastTrackedTimestampMs };
  }

  // --- Tracking restored ---

  if (prev.phase === 'TRACKING_LOST') {
    // Reset to READY after tracking loss (rep invalidated)
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
    // Resume from paused — go to the phase that matches current metrics
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

  // --- Normal phase transition logic ---

  const kneeAngle = getEffectiveKneeAngle(metrics);
  const targetPhase = determineTargetPhase(prev.phase, kneeAngle, config);

  // No transition warranted → clear any pending transition
  if (targetPhase === null) {
    return {
      ...prev,
      pendingTransition: null,
      pendingSinceMs: 0,
      lastTrackedTimestampMs: timestampMs,
    };
  }

  // FR-PHASE-003: reject illegal transitions
  if (!isLegalTransition(prev.phase, targetPhase)) {
    return {
      ...prev,
      pendingTransition: null,
      pendingSinceMs: 0,
      lastTrackedTimestampMs: timestampMs,
      // Keep the same phase but log the rejection via transitionReason
      transitionReason: 'illegal_rejected',
    };
  }

  // FR-PHASE-002: dwell time check
  // If this is a new pending transition, start the dwell timer
  if (prev.pendingTransition !== targetPhase) {
    // If dwell is 0, execute the transition immediately
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

  // Pending transition is the same as target → check if dwell time has elapsed
  const dwellElapsed = timestampMs - prev.pendingSinceMs;
  if (dwellElapsed < config.dwellMs) {
    // Dwell not yet satisfied, keep waiting
    return { ...prev, lastTrackedTimestampMs: timestampMs };
  }

  // Dwell satisfied → execute the transition
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

/**
 * Determines the appropriate phase to resume to after tracking is restored.
 * Based on the current knee angle value.
 */
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

/**
 * Maps a transition to its reason string.
 */
function getTransitionReason(from: SquatPhase, to: SquatPhase): TransitionReason {
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

// ---------------------------------------------------------------------------
// Public view: extract PhaseState (FR-PHASE-005) from FSM state
// ---------------------------------------------------------------------------

/**
 * Returns the public PhaseState (without internal dwell/timer fields).
 * FR-PHASE-005: includes state, entered timestamp, transition reason, confidence, profile version.
 */
export function toPhaseState(fsm: PhaseFSMState): PhaseState {
  return {
    phase: fsm.phase,
    enteredTimestampMs: fsm.enteredTimestampMs,
    transitionReason: fsm.transitionReason,
    confidence: fsm.confidence,
    profileVersion: fsm.profileVersion,
  };
}
