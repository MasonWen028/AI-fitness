import {
  createInitialPhaseState,
  updatePhase,
  type PhaseFSMState,
} from '../analysis/phaseMachine';
import {
  createInitialRepState,
  processPhaseUpdate,
  type RepDetectionState,
} from '../analysis/repDetection';
import {
  normalizeObservation,
  type NormalizedFrame,
} from '../analysis/normalization';
import { computeSquatMetrics, type SquatMetrics } from '../analysis/metrics';
import { evaluateFaults, type FaultResult } from '../analysis/faults';
import { selectFeedback, type FeedbackCue } from '../analysis/feedback';
import type { PoseObservation } from '../pose/poseContract';

export type LiveAnalysisSnapshot = {
  normalizedFrame: NormalizedFrame | null;
  metrics: SquatMetrics | null;
  phaseState: PhaseFSMState | null;
  repState: RepDetectionState;
  faults: FaultResult[];
  feedback: FeedbackCue | null;
};

export function createInitialLiveAnalysisSnapshot(): LiveAnalysisSnapshot {
  return {
    normalizedFrame: null,
    metrics: null,
    phaseState: null,
    repState: createInitialRepState(),
    faults: [],
    feedback: null,
  };
}

export function processLiveObservation(
  previous: LiveAnalysisSnapshot,
  observation: PoseObservation,
): LiveAnalysisSnapshot {
  const normalizedFrame = normalizeObservation(observation);
  if (!normalizedFrame) {
    return {
      ...previous,
      normalizedFrame: null,
      metrics: null,
      faults: [],
      feedback: null,
    };
  }

  const metrics = computeSquatMetrics(normalizedFrame);
  const phaseState = previous.phaseState
    ? updatePhase(previous.phaseState, metrics)
    : updatePhase(
        createInitialPhaseState(normalizedFrame.timestampMs),
        metrics,
      );
  const repState = processPhaseUpdate(previous.repState, phaseState, metrics);

  const faultEvaluation = evaluateFaults({
    metrics,
    phase: phaseState,
    repState,
  });
  const faults = [
    faultEvaluation.insufficientDepth,
    faultEvaluation.excessiveForwardLean,
  ].filter((fault): fault is FaultResult => fault !== null);
  const feedback = selectFeedback({
    phase: phaseState,
    quality: normalizedFrame.quality,
    faults,
    repState,
  });

  return {
    normalizedFrame,
    metrics,
    phaseState,
    repState,
    faults,
    feedback,
  };
}
