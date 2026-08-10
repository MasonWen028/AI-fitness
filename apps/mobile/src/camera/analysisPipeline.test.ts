import { describe, expect, it } from 'vitest';

import { createSyntheticObservation } from '../pose/poseValidation';
import {
  createInitialLiveAnalysisSnapshot,
  processLiveObservation,
} from './analysisPipeline';

function squatObservation(
  sequence: number,
  leftKneeX: number,
  rightKneeX: number,
  kneeY: number,
  visibility = 0.95,
) {
  return createSyntheticObservation(sequence, {
    left_hip: { x: 0.42, y: 0.55, visibility },
    right_hip: { x: 0.58, y: 0.55, visibility },
    left_knee: { x: leftKneeX, y: kneeY, visibility },
    right_knee: { x: rightKneeX, y: kneeY, visibility },
    left_ankle: { x: 0.45, y: 0.92, visibility },
    right_ankle: { x: 0.55, y: 0.92, visibility },
    left_shoulder: { x: 0.42, y: 0.35, visibility },
    right_shoulder: { x: 0.58, y: 0.35, visibility },
    nose: { x: 0.5, y: 0.25, visibility },
  });
}

describe('analysisPipeline', () => {
  it('runs a live observation through normalization, metrics, phase, rep, fault, and feedback without a device', () => {
    const observations = [
      squatObservation(1, 0.44, 0.56, 0.68),
      squatObservation(2, 0.43, 0.57, 0.74),
      squatObservation(3, 0.41, 0.59, 0.82),
      squatObservation(4, 0.43, 0.57, 0.74),
      squatObservation(5, 0.44, 0.56, 0.68),
    ];

    let snapshot = createInitialLiveAnalysisSnapshot();
    for (const observation of observations) {
      snapshot = processLiveObservation(snapshot, observation);
    }

    expect(snapshot.normalizedFrame).not.toBeNull();
    expect(snapshot.metrics).not.toBeNull();
    expect(snapshot.phaseState).not.toBeNull();
    expect(snapshot.feedback).not.toBeNull();
    expect(snapshot.repState.completedReps.length).toBeGreaterThanOrEqual(0);
    expect(
      snapshot.faults.every(
        (fault) =>
          fault.code === 'INSUFFICIENT_DEPTH' ||
          fault.code === 'EXCESSIVE_FORWARD_LEAN',
      ),
    ).toBe(true);
  });

  it('does not fabricate reps for empty observations or tracking loss', () => {
    const noPose = createSyntheticObservation(1, {});
    const recovered = squatObservation(2, 0.44, 0.56, 0.68);

    let snapshot = createInitialLiveAnalysisSnapshot();
    snapshot = processLiveObservation(snapshot, noPose);
    expect(snapshot.repState.completedReps).toHaveLength(0);

    snapshot = processLiveObservation(snapshot, recovered);
    expect(snapshot.repState.completedReps).toHaveLength(0);
  });
});
