import type { PoseObservation } from '../pose/poseContract';
import type { PoseObservationFixture } from '../fixtures/types';
import { createReplaySimulator } from './replaySimulator';
import { normalizeObservation } from '../analysis/normalization';
import { computeSquatMetrics } from '../analysis/metrics';
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

export type BenchmarkSummary = {
  framesTotal: number;
  framesNormalized: number;
  framesDropped: number;
  replayMode: 'step' | 'play' | 'accelerate';
  acceleration: number;
  totalProcessingMs: number;
  averageProcessingMs: number;
  peakProcessingMs: number;
  overlayCandidateFrames: number;
  jsLoadScore: number;
  memoryFootprintEstimate: number;
  trackingRecoveryFrames: number | null;
  completedRepCount: number;
  incompleteRepCount: number;
  thermalRisk: 'low' | 'medium' | 'high';
  batteryProfile: 'low' | 'medium' | 'high';
  backgroundBehavior: 'not-measured';
};

export type BenchmarkArtifact = {
  fixtureVersion: string;
  exercise: string;
  frameIntervalMs: number;
  observationsMeasured: number;
  summary: BenchmarkSummary;
};

export function runReplayBenchmark(
  fixture: PoseObservationFixture,
  options: {
    mode?: 'step' | 'play' | 'accelerate';
    accelerateBy?: number;
  } = {},
): BenchmarkArtifact {
  const mode = options.mode ?? 'play';
  const accelerateBy = options.accelerateBy ?? 2;
  const simulator = createReplaySimulator(fixture);

  const observations = collectReplayObservations(simulator, mode, accelerateBy);
  const trackingRecoveryFrames = measureTrackingRecovery(observations);

  let totalProcessingMs = 0;
  let peakProcessingMs = 0;
  let framesNormalized = 0;
  let overlayCandidateFrames = 0;
  let phaseState: PhaseFSMState | null = null;
  let repState: RepDetectionState | null = null;

  for (const observation of observations) {
    const frameStarted = globalThis.performance?.now?.() ?? Date.now();
    const normalized = normalizeObservation(observation);
    if (normalized) {
      framesNormalized += 1;
      if (normalized.quality.hasCriticalLandmarks) {
        overlayCandidateFrames += 1;
      }
      const metrics = computeSquatMetrics(normalized);
      phaseState = phaseState
        ? updatePhase(phaseState, metrics)
        : updatePhase(createInitialPhaseState(normalized.timestampMs), metrics);
      repState = repState
        ? processPhaseUpdate(repState, phaseState, metrics)
        : processPhaseUpdate(createInitialRepState(phaseState.phase), phaseState, metrics);
    }
    const frameElapsed = (globalThis.performance?.now?.() ?? Date.now()) - frameStarted;
    totalProcessingMs += frameElapsed;
    peakProcessingMs = Math.max(peakProcessingMs, frameElapsed);
  }

  const framesTotal = observations.length;
  const framesDropped = Math.max(0, fixture.observations.length - framesTotal);
  const averageProcessingMs = framesTotal > 0 ? totalProcessingMs / framesTotal : 0;
  const completedRepCount = repState?.completedReps.length ?? 0;
  const incompleteRepCount = repState?.incompleteReps.length ?? 0;

  return {
    fixtureVersion: fixture.version,
    exercise: fixture.exercise,
    frameIntervalMs: fixture.metadata.frameIntervalMs,
    observationsMeasured: framesTotal,
    summary: {
      framesTotal,
      framesNormalized,
      framesDropped,
      replayMode: mode,
      acceleration: mode === 'accelerate' ? accelerateBy : 1,
      totalProcessingMs,
      averageProcessingMs,
      peakProcessingMs,
      overlayCandidateFrames,
      jsLoadScore: computeJsLoadScore(averageProcessingMs),
      memoryFootprintEstimate: estimateMemoryFootprint(observations),
      trackingRecoveryFrames,
      completedRepCount,
      incompleteRepCount,
      thermalRisk: classifyThermalRisk(averageProcessingMs),
      batteryProfile: classifyBatteryProfile(averageProcessingMs),
      backgroundBehavior: 'not-measured',
    },
  };
}

function collectReplayObservations(
  simulator: ReturnType<typeof createReplaySimulator>,
  mode: 'step' | 'play' | 'accelerate',
  accelerateBy: number,
): PoseObservation[] {
  switch (mode) {
    case 'step': {
      const collected: PoseObservation[] = [];
      let observation = simulator.step();
      while (observation) {
        collected.push(observation);
        observation = simulator.step();
      }
      return collected;
    }
    case 'accelerate':
      return simulator.accelerate(accelerateBy);
    case 'play':
    default:
      return simulator.play();
  }
}

function computeJsLoadScore(averageProcessingMs: number): number {
  if (averageProcessingMs <= 0) {
    return 0;
  }

  return Number((averageProcessingMs / 16.67).toFixed(3));
}

function estimateMemoryFootprint(observations: PoseObservation[]): number {
  return observations.reduce((sum, observation) => {
    const landmarkCount = observation.people.reduce(
      (count, person) => count + person.imageLandmarks.length + (person.worldLandmarks?.length ?? 0),
      0,
    );
    return sum + landmarkCount * 56;
  }, 0);
}

function measureTrackingRecovery(observations: PoseObservation[]): number | null {
  const lossIndex = observations.findIndex((observation) => !observation.landmarksAvailable);
  if (lossIndex === -1) {
    return null;
  }

  for (let index = lossIndex + 1; index < observations.length; index += 1) {
    if (observations[index].landmarksAvailable) {
      return index - lossIndex;
    }
  }

  return null;
}

function classifyThermalRisk(averageProcessingMs: number): 'low' | 'medium' | 'high' {
  if (averageProcessingMs < 4) {
    return 'low';
  }
  if (averageProcessingMs < 10) {
    return 'medium';
  }
  return 'high';
}

function classifyBatteryProfile(averageProcessingMs: number): 'low' | 'medium' | 'high' {
  if (averageProcessingMs < 3) {
    return 'low';
  }
  if (averageProcessingMs < 8) {
    return 'medium';
  }
  return 'high';
}
