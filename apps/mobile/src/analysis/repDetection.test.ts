import { describe, it, expect } from 'vitest';
import {
  createInitialRepState,
  DEFAULT_REP_CONFIG,
  getCompletedRepCount,
  getIncompleteRepCount,
  hasActiveAttempt,
  processPhaseUpdate,
  type RepDetectionState,
  type RepDetectionConfig,
} from './repDetection';
import type { PhaseState, SquatPhase } from './phaseMachine';
import type { SquatMetrics, MetricValue } from './metrics';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePhaseState(
  phase: SquatPhase,
  timestampMs: number,
  confidence = 0.9,
  reason: string = 'init',
): PhaseState {
  return {
    phase,
    enteredTimestampMs: timestampMs,
    transitionReason: reason as any,
    confidence,
    profileVersion: DEFAULT_REP_CONFIG.profileVersion,
  };
}

function makeMetrics(kneeAngleDeg: number, timestampMs: number, valid = true): SquatMetrics {
  const conf = valid ? 0.9 : 0.1;
  const kneeAngle: MetricValue = { value: kneeAngleDeg, timestampMs, valid, minConfidence: conf };
  const other: MetricValue = { value: 0, timestampMs, valid, minConfidence: conf };
  return {
    kneeAngleLeft: kneeAngle,
    kneeAngleRight: kneeAngle,
    hipAngleLeft: other,
    hipAngleRight: other,
    torsoInclination: other,
    hipDepth: other,
  };
}

/** Runs a complete phase sequence through the rep detector */
function runPhaseSequence(
  sequence: Array<{ phase: SquatPhase; timestampMs: number; kneeAngle?: number; valid?: boolean }>,
  config: RepDetectionConfig = DEFAULT_REP_CONFIG,
): RepDetectionState {
  let state = createInitialRepState('READY');

  for (const { phase, timestampMs, kneeAngle, valid } of sequence) {
    const phaseState = makePhaseState(phase, timestampMs);
    const metrics = kneeAngle !== undefined
      ? makeMetrics(kneeAngle, timestampMs, valid ?? true)
      : null;
    state = processPhaseUpdate(state, phaseState, metrics, config);
  }

  return state;
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

describe('createInitialRepState', () => {
  it('starts with no completed or incomplete reps', () => {
    const state = createInitialRepState();
    expect(getCompletedRepCount(state)).toBe(0);
    expect(getIncompleteRepCount(state)).toBe(0);
    expect(hasActiveAttempt(state)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Complete rep (FR-REP-001)
// ---------------------------------------------------------------------------

describe('Complete rep', () => {
  it('counts exactly one rep for READY → DESC → BOTTOM → ASC → READY', () => {
    const state = runPhaseSequence([
      { phase: 'READY', timestampMs: 0, kneeAngle: 175 },
      { phase: 'DESCENDING', timestampMs: 100, kneeAngle: 150 },
      { phase: 'DESCENDING', timestampMs: 150, kneeAngle: 130 },
      { phase: 'BOTTOM', timestampMs: 200, kneeAngle: 100 },
      { phase: 'BOTTOM', timestampMs: 250, kneeAngle: 95 },
      { phase: 'ASCENDING', timestampMs: 300, kneeAngle: 130 },
      { phase: 'ASCENDING', timestampMs: 350, kneeAngle: 150 },
      { phase: 'READY', timestampMs: 400, kneeAngle: 175 },
    ]);

    expect(getCompletedRepCount(state)).toBe(1);
    expect(getIncompleteRepCount(state)).toBe(0);
    expect(hasActiveAttempt(state)).toBe(false);

    const rep = state.completedReps[0];
    expect(rep.status).toBe('completed');
    expect(rep.startTimestampMs).toBe(100);
    expect(rep.endTimestampMs).toBe(400);
    expect(rep.durationMs).toBe(300);
    expect(rep.kneeAngleRom).toBeGreaterThan(0);
    expect(rep.minConfidence).toBeGreaterThan(0);
    expect(rep.averageConfidence).toBeGreaterThan(0);
    expect(rep.issues).toHaveLength(0);
  });

  it('counts multiple reps in sequence', () => {
    const state = runPhaseSequence([
      // Rep 1
      { phase: 'READY', timestampMs: 0, kneeAngle: 175 },
      { phase: 'DESCENDING', timestampMs: 100, kneeAngle: 150 },
      { phase: 'BOTTOM', timestampMs: 200, kneeAngle: 100 },
      { phase: 'ASCENDING', timestampMs: 300, kneeAngle: 130 },
      { phase: 'READY', timestampMs: 400, kneeAngle: 175 },
      // Rep 2
      { phase: 'DESCENDING', timestampMs: 500, kneeAngle: 150 },
      { phase: 'BOTTOM', timestampMs: 600, kneeAngle: 95 },
      { phase: 'ASCENDING', timestampMs: 700, kneeAngle: 130 },
      { phase: 'READY', timestampMs: 800, kneeAngle: 175 },
      // Rep 3
      { phase: 'DESCENDING', timestampMs: 900, kneeAngle: 150 },
      { phase: 'BOTTOM', timestampMs: 1000, kneeAngle: 100 },
      { phase: 'ASCENDING', timestampMs: 1100, kneeAngle: 130 },
      { phase: 'READY', timestampMs: 1200, kneeAngle: 175 },
    ]);

    expect(getCompletedRepCount(state)).toBe(3);
    expect(getIncompleteRepCount(state)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// No duplicate reps (FR-REP-002)
// ---------------------------------------------------------------------------

describe('No duplicate reps', () => {
  it('repeated READY frames do not create duplicate reps', () => {
    const state = runPhaseSequence([
      { phase: 'READY', timestampMs: 0, kneeAngle: 175 },
      { phase: 'DESCENDING', timestampMs: 100, kneeAngle: 150 },
      { phase: 'BOTTOM', timestampMs: 200, kneeAngle: 100 },
      { phase: 'ASCENDING', timestampMs: 300, kneeAngle: 130 },
      { phase: 'READY', timestampMs: 400, kneeAngle: 175 },
      // Staying in READY for multiple frames
      { phase: 'READY', timestampMs: 500, kneeAngle: 175 },
      { phase: 'READY', timestampMs: 600, kneeAngle: 175 },
    ]);

    expect(getCompletedRepCount(state)).toBe(1);
  });

  it('repeated DESCENDING frames do not open multiple attempts', () => {
    const state = runPhaseSequence([
      { phase: 'READY', timestampMs: 0, kneeAngle: 175 },
      { phase: 'DESCENDING', timestampMs: 100, kneeAngle: 150 },
      { phase: 'DESCENDING', timestampMs: 150, kneeAngle: 140 },
      { phase: 'DESCENDING', timestampMs: 200, kneeAngle: 130 },
      { phase: 'BOTTOM', timestampMs: 250, kneeAngle: 100 },
      { phase: 'ASCENDING', timestampMs: 300, kneeAngle: 130 },
      { phase: 'READY', timestampMs: 400, kneeAngle: 175 },
    ]);

    expect(getCompletedRepCount(state)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Incomplete attempts (FR-REP-003)
// ---------------------------------------------------------------------------

describe('Incomplete attempts', () => {
  it('partial squat (no BOTTOM) is incomplete', () => {
    const state = runPhaseSequence([
      { phase: 'READY', timestampMs: 0, kneeAngle: 175 },
      { phase: 'DESCENDING', timestampMs: 100, kneeAngle: 150 },
      // Goes down a bit but comes back up without reaching BOTTOM
      { phase: 'ASCENDING', timestampMs: 200, kneeAngle: 140 },
      { phase: 'READY', timestampMs: 300, kneeAngle: 175 },
    ]);

    expect(getCompletedRepCount(state)).toBe(0);
    expect(getIncompleteRepCount(state)).toBe(1);

    const rep = state.incompleteReps[0];
    expect(rep.status).toBe('incomplete');
  });

  it('tracking loss during attempt creates incomplete rep', () => {
    const state = runPhaseSequence([
      { phase: 'READY', timestampMs: 0, kneeAngle: 175 },
      { phase: 'DESCENDING', timestampMs: 100, kneeAngle: 150 },
      { phase: 'BOTTOM', timestampMs: 200, kneeAngle: 100 },
      { phase: 'PAUSED', timestampMs: 300, kneeAngle: 0, valid: false },
      { phase: 'TRACKING_LOST', timestampMs: 900, kneeAngle: 0, valid: false },
    ]);

    expect(getCompletedRepCount(state)).toBe(0);
    expect(getIncompleteRepCount(state)).toBe(1);

    const rep = state.incompleteReps[0];
    expect(rep.status).toBe('incomplete');
    expect(rep.issues).toContain('tracking_lost');
  });

  it('tracking restored after grace period resets to READY without counting', () => {
    const state = runPhaseSequence([
      { phase: 'READY', timestampMs: 0, kneeAngle: 175 },
      { phase: 'DESCENDING', timestampMs: 100, kneeAngle: 150 },
      { phase: 'BOTTOM', timestampMs: 200, kneeAngle: 100 },
      { phase: 'PAUSED', timestampMs: 300, kneeAngle: 0, valid: false },
      { phase: 'TRACKING_LOST', timestampMs: 900, kneeAngle: 0, valid: false },
      // Tracking restored → resets to READY
      { phase: 'READY', timestampMs: 1000, kneeAngle: 175 },
    ]);

    // The incomplete rep was recorded when TRACKING_LOST happened
    expect(getCompletedRepCount(state)).toBe(0);
    expect(getIncompleteRepCount(state)).toBe(1);
    // After restore to READY, no new attempt is opened
    expect(hasActiveAttempt(state)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Rep result fields (FR-REP-005)
// ---------------------------------------------------------------------------

describe('Rep result fields (FR-REP-005)', () => {
  it('includes start/end, duration, ROM, confidence, and version info', () => {
    const state = runPhaseSequence([
      { phase: 'READY', timestampMs: 0, kneeAngle: 175 },
      { phase: 'DESCENDING', timestampMs: 100, kneeAngle: 150 },
      { phase: 'BOTTOM', timestampMs: 200, kneeAngle: 100 },
      { phase: 'ASCENDING', timestampMs: 300, kneeAngle: 130 },
      { phase: 'READY', timestampMs: 400, kneeAngle: 175 },
    ]);

    const rep = state.completedReps[0];

    // Start/end
    expect(rep.startTimestampMs).toBe(100);
    expect(rep.endTimestampMs).toBe(400);

    // Duration
    expect(rep.durationMs).toBe(300);

    // ROM
    expect(rep.kneeAngleRom).toBeGreaterThan(0);
    // Knee went from ~150 to ~100 and back to ~175
    // ROM = max - min = 175 - 100 = 75 (approximately)

    // Confidence
    expect(rep.minConfidence).toBeGreaterThan(0);
    expect(rep.averageConfidence).toBeGreaterThan(0);
    expect(rep.averageConfidence).toBeGreaterThanOrEqual(rep.minConfidence);

    // Versions
    expect(rep.engineVersion).toBe(DEFAULT_REP_CONFIG.engineVersion);
    expect(rep.profileVersion).toBe(DEFAULT_REP_CONFIG.profileVersion);
    expect(rep.ruleVersion).toBe(DEFAULT_REP_CONFIG.ruleVersion);

    // Issues
    expect(rep.issues).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Active attempt tracking
// ---------------------------------------------------------------------------

describe('Active attempt tracking', () => {
  it('hasActiveAttempt is true during DESCENDING', () => {
    const state = runPhaseSequence([
      { phase: 'READY', timestampMs: 0, kneeAngle: 175 },
      { phase: 'DESCENDING', timestampMs: 100, kneeAngle: 150 },
    ]);

    expect(hasActiveAttempt(state)).toBe(true);
  });

  it('hasActiveAttempt is false after rep completion', () => {
    const state = runPhaseSequence([
      { phase: 'READY', timestampMs: 0, kneeAngle: 175 },
      { phase: 'DESCENDING', timestampMs: 100, kneeAngle: 150 },
      { phase: 'BOTTOM', timestampMs: 200, kneeAngle: 100 },
      { phase: 'ASCENDING', timestampMs: 300, kneeAngle: 130 },
      { phase: 'READY', timestampMs: 400, kneeAngle: 175 },
    ]);

    expect(hasActiveAttempt(state)).toBe(false);
  });

  it('hasActiveAttempt is false in READY with no prior descent', () => {
    const state = runPhaseSequence([
      { phase: 'READY', timestampMs: 0, kneeAngle: 175 },
      { phase: 'READY', timestampMs: 100, kneeAngle: 175 },
    ]);

    expect(hasActiveAttempt(state)).toBe(false);
  });
});
