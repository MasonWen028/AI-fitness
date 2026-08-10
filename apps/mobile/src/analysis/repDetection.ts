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

import type { SquatMetrics } from './metrics';
import type { PhaseState, SquatPhase } from './phaseMachine';
import { getEffectiveKneeAngle } from './squatMetricsShared';

export type RepStatus = 'completed' | 'incomplete';

export type RepResult = {
  status: RepStatus;
  startTimestampMs: number;
  endTimestampMs: number;
  durationMs: number;
  kneeAngleRom: number;
  minConfidence: number;
  averageConfidence: number;
  issues: string[];
  engineVersion: string;
  profileVersion: string;
  ruleVersion: string;
};

type CurrentAttempt = {
  startTimestampMs: number;
  visitedBottom: boolean;
  minConfidence: number;
  confidenceSum: number;
  confidenceCount: number;
  kneeAngleValues: number[];
};

export type RepDetectionState = {
  completedReps: RepResult[];
  incompleteReps: RepResult[];
  currentAttempt: CurrentAttempt | null;
  lastPhase: SquatPhase;
};

export type RepDetectionConfig = {
  engineVersion: string;
  profileVersion: string;
  ruleVersion: string;
};

export const DEFAULT_REP_CONFIG: RepDetectionConfig = {
  engineVersion: 'm0-engine-0.1.0',
  profileVersion: 'm0-squat-candidate-0.1.0',
  ruleVersion: 'm0-squat-rules-0.1.0',
};

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

export function processPhaseUpdate(
  prev: RepDetectionState,
  phase: PhaseState,
  metrics: SquatMetrics | null,
  config: RepDetectionConfig = DEFAULT_REP_CONFIG,
): RepDetectionState {
  const currentPhase = phase.phase;
  const prevPhase = prev.lastPhase;

  if (currentPhase === prevPhase) {
    return updateAttemptMetrics(prev, metrics);
  }

  let state = { ...prev };

  switch (currentPhase) {
    case 'DESCENDING':
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
      if (state.currentAttempt) {
        state.currentAttempt = {
          ...state.currentAttempt,
          visitedBottom: true,
        };
      }
      break;

    case 'READY':
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
    case 'ASCENDING':
      break;
  }

  state.lastPhase = currentPhase;
  return updateAttemptMetrics(state, metrics);
}

function updateAttemptMetrics(
  state: RepDetectionState,
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

function buildRepResult(
  attempt: CurrentAttempt,
  endTimestampMs: number,
  status: RepStatus,
  config: RepDetectionConfig,
): RepResult {
  const durationMs = endTimestampMs - attempt.startTimestampMs;
  const averageConfidence =
    attempt.confidenceCount > 0
      ? attempt.confidenceSum / attempt.confidenceCount
      : 0;

  const kneeAngleRom =
    attempt.kneeAngleValues.length >= 2
      ? Math.max(...attempt.kneeAngleValues) -
        Math.min(...attempt.kneeAngleValues)
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

export function getCompletedRepCount(state: RepDetectionState): number {
  return state.completedReps.length;
}

export function getIncompleteRepCount(state: RepDetectionState): number {
  return state.incompleteReps.length;
}

export function hasActiveAttempt(state: RepDetectionState): boolean {
  return state.currentAttempt !== null;
}
