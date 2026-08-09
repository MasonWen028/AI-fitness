/**
 * M0-I: Rep Detection
 *
 * SRS: FR-REP-001 through FR-REP-003, FR-REP-005
 *
 * - FR-REP-001: A rep is counted only after the complete phase sequence
 *   returns to its completion/reset state (READY → DESCENDING → BOTTOM → ASCENDING → READY).
 * - FR-REP-002: Noise or repeated frames in one phase shall not create duplicate reps.
 * - FR-REP-003: Incomplete, paused or interrupted attempts are retained as incomplete,
 *   not incrementing completed reps.
 * - FR-REP-005: Rep results include start/end, duration, ROM metrics, issues,
 *   confidence summary, and engine/profile/rule versions.
 */

import type { SquatMetrics, MetricValue } from './metrics';
import type { PhaseState, SquatPhase } from './phaseMachine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Status of a rep attempt */
export type RepStatus = 'completed' | 'incomplete';

/** Result of a single rep attempt (FR-REP-005) */
export type RepResult = {
  /** Completed or incomplete */
  status: RepStatus;
  /** Timestamp when the attempt started (entering DESCENDING from READY) */
  startTimestampMs: number;
  /** Timestamp when the attempt ended (returning to READY or tracking lost) */
  endTimestampMs: number;
  /** Duration of the attempt in milliseconds */
  durationMs: number;
  /** Knee angle range of motion during the attempt (degrees) */
  kneeAngleRom: number;
  /** Minimum confidence during the attempt (0-1) */
  minConfidence: number;
  /** Average confidence during the attempt (0-1) */
  averageConfidence: number;
  /** Issues detected during the attempt */
  issues: string[];
  /** Engine version */
  engineVersion: string;
  /** Profile version */
  profileVersion: string;
  /** Rule version */
  ruleVersion: string;
};

/** Internal state for tracking the current attempt */
type CurrentAttempt = {
  startTimestampMs: number;
  visitedBottom: boolean;
  minConfidence: number;
  confidenceSum: number;
  confidenceCount: number;
  kneeAngleValues: number[];
};

/** Rep detection state */
export type RepDetectionState = {
  /** Completed reps in order */
  completedReps: RepResult[];
  /** Incomplete attempts in order */
  incompleteReps: RepResult[];
  /** Current attempt in progress, or null if none */
  currentAttempt: CurrentAttempt | null;
  /** The last known phase (for detecting transitions) */
  lastPhase: SquatPhase;
};

/** Configuration for rep detection */
export type RepDetectionConfig = {
  engineVersion: string;
  profileVersion: string;
  ruleVersion: string;
};

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

export const DEFAULT_REP_CONFIG: RepDetectionConfig = {
  engineVersion: 'm0-engine-0.1.0',
  profileVersion: 'm0-squat-candidate-0.1.0',
  ruleVersion: 'm0-squat-rules-0.1.0',
};

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Creates the initial rep detection state.
 */
export function createInitialRepState(
  initialPhase: SquatPhase = 'READY',
): RepDetectionState {
  return {
    completedReps: [],
    incompleteReps: [],
    currentAttempt: null,
    lastPhase: initialPhase,
  };
}

// ---------------------------------------------------------------------------
// Rep detection update
// ---------------------------------------------------------------------------

/**
 * Processes a phase state update and updates rep detection accordingly.
 *
 * Call this function for every frame with the current PhaseState from the FSM.
 *
 * @param prev     Previous rep detection state
 * @param phase    Current phase state from the FSM
 * @param metrics  Current squat metrics (null if tracking lost)
 * @param config   Rep detection configuration
 * @returns        Updated rep detection state
 */
export function processPhaseUpdate(
  prev: RepDetectionState,
  phase: PhaseState,
  metrics: SquatMetrics | null,
  config: RepDetectionConfig = DEFAULT_REP_CONFIG,
): RepDetectionState {
  const currentPhase = phase.phase;
  const prevPhase = prev.lastPhase;

  // No phase change → just update metrics tracking if attempt is open
  if (currentPhase === prevPhase) {
    return updateAttemptMetrics(prev, phase, metrics);
  }

  // Phase changed → handle transition
  let state = { ...prev };

  switch (currentPhase) {
    case 'DESCENDING':
      // Opening a new attempt when transitioning from READY to DESCENDING
      if (prevPhase === 'READY' && !state.currentAttempt) {
        state.currentAttempt = {
          startTimestampMs: phase.enteredTimestampMs,
          visitedBottom: false,
          minConfidence: phase.confidence,
          confidenceSum: phase.confidence,
          confidenceCount: 1,
          kneeAngleValues: [],
        };
      }
      break;

    case 'BOTTOM':
      // Mark that the attempt reached the bottom
      if (state.currentAttempt) {
        state.currentAttempt = {
          ...state.currentAttempt,
          visitedBottom: true,
        };
      }
      break;

    case 'READY':
      // Attempt completed (returned to READY)
      if (state.currentAttempt) {
        const attempt = state.currentAttempt;
        const rep = buildRepResult(
          attempt,
          phase.enteredTimestampMs,
          attempt.visitedBottom ? 'completed' : 'incomplete',
          config,
        );

        if (attempt.visitedBottom) {
          state.completedReps = [...state.completedReps, rep];
        } else {
          state.incompleteReps = [...state.incompleteReps, rep];
        }
        state.currentAttempt = null;
      }
      break;

    case 'TRACKING_LOST':
      // Attempt interrupted by tracking loss → incomplete
      if (state.currentAttempt) {
        const attempt = state.currentAttempt;
        const rep = buildRepResult(
          attempt,
          phase.enteredTimestampMs,
          'incomplete',
          config,
        );
        rep.issues.push('tracking_lost');
        state.incompleteReps = [...state.incompleteReps, rep];
        state.currentAttempt = null;
      }
      break;

    case 'PAUSED':
      // Paused is transient — the attempt continues if tracking is restored
      // No action needed here; tracking loss is handled by TRACKING_LOST
      break;

    case 'ASCENDING':
      // No special action — just continue tracking
      break;
  }

  state.lastPhase = currentPhase;
  return updateAttemptMetrics(state, phase, metrics);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Updates the current attempt with metrics from the latest frame.
 */
function updateAttemptMetrics(
  state: RepDetectionState,
  phase: PhaseState,
  metrics: SquatMetrics | null,
): RepDetectionState {
  if (!state.currentAttempt || !metrics) {
    return state;
  }

  const kneeAngle = getEffectiveKneeAngle(metrics);
  if (!kneeAngle.valid) {
    return state;
  }

  const attempt = state.currentAttempt;
  const newMin = Math.min(attempt.minConfidence, kneeAngle.minConfidence);
  const newSum = attempt.confidenceSum + kneeAngle.minConfidence;
  const newCount = attempt.confidenceCount + 1;
  const newKneeAngles = [...attempt.kneeAngleValues, kneeAngle.value];

  return {
    ...state,
    currentAttempt: {
      ...attempt,
      minConfidence: newMin,
      confidenceSum: newSum,
      confidenceCount: newCount,
      kneeAngleValues: newKneeAngles,
    },
  };
}

/**
 * Extracts the effective knee angle from SquatMetrics.
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
  return { value: 180, timestampMs: left.timestampMs, valid: false, minConfidence: 0 };
}

/**
 * Builds a RepResult from a completed attempt.
 */
function buildRepResult(
  attempt: CurrentAttempt,
  endTimestampMs: number,
  status: RepStatus,
  config: RepDetectionConfig,
): RepResult {
  const durationMs = endTimestampMs - attempt.startTimestampMs;
  const averageConfidence = attempt.confidenceCount > 0
    ? attempt.confidenceSum / attempt.confidenceCount
    : 0;

  const kneeAngleRom = attempt.kneeAngleValues.length >= 2
    ? Math.max(...attempt.kneeAngleValues) - Math.min(...attempt.kneeAngleValues)
    : 0;

  return {
    status,
    startTimestampMs: attempt.startTimestampMs,
    endTimestampMs,
    durationMs,
    kneeAngleRom,
    minConfidence: attempt.minConfidence,
    averageConfidence,
    issues: [],
    engineVersion: config.engineVersion,
    profileVersion: config.profileVersion,
    ruleVersion: config.ruleVersion,
  };
}

// ---------------------------------------------------------------------------
// Public accessors
// ---------------------------------------------------------------------------

/**
 * Returns the total count of completed reps.
 */
export function getCompletedRepCount(state: RepDetectionState): number {
  return state.completedReps.length;
}

/**
 * Returns the total count of incomplete attempts.
 */
export function getIncompleteRepCount(state: RepDetectionState): number {
  return state.incompleteReps.length;
}

/**
 * Returns whether a rep attempt is currently in progress.
 */
export function hasActiveAttempt(state: RepDetectionState): boolean {
  return state.currentAttempt !== null;
}
