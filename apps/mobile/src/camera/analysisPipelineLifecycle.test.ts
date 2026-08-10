import { describe, expect, it } from 'vitest';

import { createSyntheticObservation } from '../pose/poseValidation';
import {
  createInitialLiveAnalysisSnapshot,
  processLiveObservation,
} from './analysisPipeline';
import {
  shouldAdvanceAnalysis,
  shouldAttemptTrackingReacquisition,
} from './cameraRuntime';

function trackableObservation(sequence: number) {
  return createSyntheticObservation(sequence, {
    left_hip: { x: 0.42, y: 0.55, visibility: 0.95 },
    right_hip: { x: 0.58, y: 0.55, visibility: 0.95 },
    left_knee: { x: 0.44, y: 0.72, visibility: 0.95 },
    right_knee: { x: 0.56, y: 0.72, visibility: 0.95 },
    left_ankle: { x: 0.45, y: 0.9, visibility: 0.95 },
    right_ankle: { x: 0.55, y: 0.9, visibility: 0.95 },
    left_shoulder: { x: 0.42, y: 0.35, visibility: 0.95 },
    right_shoulder: { x: 0.58, y: 0.35, visibility: 0.95 },
  });
}

describe('analysis pipeline lifecycle boundaries', () => {
  it('does not advance reps during COUNTDOWN-equivalent non-ACTIVE handling', () => {
    const snapshot = createInitialLiveAnalysisSnapshot();
    const next = processLiveObservation(snapshot, trackableObservation(1));

    expect(shouldAdvanceAnalysis('COUNTDOWN')).toBe(false);
    expect(next.repState.completedReps).toHaveLength(0);
  });

  it('supports TRACKING_LOST recovery without fabricating completed reps', () => {
    const empty = createSyntheticObservation(1, {});
    const recovered = trackableObservation(2);

    let snapshot = createInitialLiveAnalysisSnapshot();
    snapshot = processLiveObservation(snapshot, empty);
    expect(snapshot.phaseState?.phase).toBe('PAUSED');

    if (shouldAttemptTrackingReacquisition('TRACKING_LOST')) {
      snapshot = processLiveObservation(snapshot, recovered);
    }

    expect(snapshot.repState.completedReps).toHaveLength(0);
  });
});
