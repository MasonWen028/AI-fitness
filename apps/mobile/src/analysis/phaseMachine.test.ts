import { describe, it, expect } from 'vitest';
import {
  createInitialPhaseState,
  DEFAULT_SQUAT_PHASE_CONFIG,
  toPhaseState,
  updatePhase,
  type PhaseFSMState,
  type SquatPhaseConfig,
} from './phaseMachine';
import type { SquatMetrics, MetricValue } from './metrics';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a SquatMetrics object with a specific knee angle (symmetric left/right) */
function makeMetricsAtKneeAngle(
  kneeAngleDeg: number,
  timestampMs: number,
  valid = true,
): SquatMetrics {
  const confidence = valid ? 0.9 : 0.1;
  const kneeAngle: MetricValue = {
    value: kneeAngleDeg,
    timestampMs,
    valid,
    minConfidence: confidence,
  };
  // Other metrics are set to reasonable values but the FSM primarily uses knee angle
  const otherMetric: MetricValue = {
    value: 0,
    timestampMs,
    valid,
    minConfidence: confidence,
  };
  return {
    kneeAngleLeft: kneeAngle,
    kneeAngleRight: kneeAngle,
    hipAngleLeft: otherMetric,
    hipAngleRight: otherMetric,
    torsoInclination: otherMetric,
    hipDepth: otherMetric,
  };
}

/** Creates metrics with no valid landmarks (tracking lost) */
function makeInvalidMetrics(timestampMs: number): SquatMetrics {
  const invalid: MetricValue = { value: 180, timestampMs, valid: false, minConfidence: 0 };
  return {
    kneeAngleLeft: invalid,
    kneeAngleRight: invalid,
    hipAngleLeft: invalid,
    hipAngleRight: invalid,
    torsoInclination: invalid,
    hipDepth: invalid,
  };
}

/** Runs a sequence of knee angles through the FSM and returns the phase trace */
function runPhaseSequence(
  angles: Array<{ angle: number; timestampMs: number; valid?: boolean }>,
  config: SquatPhaseConfig = DEFAULT_SQUAT_PHASE_CONFIG,
): PhaseFSMState[] {
  const states: PhaseFSMState[] = [];
  let state = createInitialPhaseState(0, config);

  for (const { angle, timestampMs, valid } of angles) {
    const metrics = valid === false
      ? makeInvalidMetrics(timestampMs)
      : makeMetricsAtKneeAngle(angle, timestampMs, valid ?? true);
    state = updatePhase(state, metrics, config);
    states.push(state);
  }

  return states;
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

describe('createInitialPhaseState', () => {
  it('starts in READY phase', () => {
    const state = createInitialPhaseState(0);
    expect(state.phase).toBe('READY');
  });

  it('has init transition reason', () => {
    const state = createInitialPhaseState(0);
    expect(state.transitionReason).toBe('init');
  });

  it('includes profile version', () => {
    const state = createInitialPhaseState(0);
    expect(state.profileVersion).toBe(DEFAULT_SQUAT_PHASE_CONFIG.profileVersion);
  });
});

// ---------------------------------------------------------------------------
// Complete squat sequence
// ---------------------------------------------------------------------------

describe('Complete squat sequence', () => {
  it('transitions READY → DESCENDING → BOTTOM → ASCENDING → READY', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0, // no dwell for simpler testing
      trackingGraceMs: 1000,
    };

    const states = runPhaseSequence([
      // Standing (READY)
      { angle: 175, timestampMs: 0 },
      { angle: 175, timestampMs: 33 },
      // Descending
      { angle: 150, timestampMs: 66 },  // below descentKneeAngle (155)
      { angle: 130, timestampMs: 99 },
      { angle: 100, timestampMs: 132 }, // below bottomKneeAngle (110) → BOTTOM
      // At bottom
      { angle: 95, timestampMs: 165 },
      // Ascending
      { angle: 130, timestampMs: 198 }, // above ascentKneeAngle (125) → ASCENDING
      { angle: 150, timestampMs: 231 },
      // Back to standing
      { angle: 170, timestampMs: 264 }, // above standingKneeAngle (165) → READY
    ], config);

    const phases = states.map((s) => s.phase);

    // Should pass through all phases
    expect(phases).toContain('DESCENDING');
    expect(phases).toContain('BOTTOM');
    expect(phases).toContain('ASCENDING');
    expect(phases[phases.length - 1]).toBe('READY');
  });
});

// ---------------------------------------------------------------------------
// Hysteresis / jitter (FR-PHASE-002)
// ---------------------------------------------------------------------------

describe('Hysteresis and jitter', () => {
  it('does not chatter at the descent threshold', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0,
    };

    // Oscillate around the descent threshold (155°)
    const states = runPhaseSequence([
      { angle: 175, timestampMs: 0 },   // READY
      { angle: 153, timestampMs: 33 },  // below 155 → DESCENDING
      { angle: 157, timestampMs: 66 },  // above 155 but below 165 (standing) → stays DESCENDING
      { angle: 153, timestampMs: 99 },  // below 155 again → stays DESCENDING
      { angle: 157, timestampMs: 132 }, // still below 165 → stays DESCENDING
    ], config);

    // Should not bounce back to READY because standingKneeAngle (165) > descentKneeAngle (155)
    const readyCount = states.filter((s) => s.phase === 'READY').length;
    expect(readyCount).toBe(1); // only the initial READY
  });

  it('does not chatter at the bottom threshold', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0,
    };

    const states = runPhaseSequence([
      { angle: 175, timestampMs: 0 },   // READY
      { angle: 150, timestampMs: 33 },  // DESCENDING
      { angle: 105, timestampMs: 66 },  // below 110 → BOTTOM
      { angle: 115, timestampMs: 99 },  // above 110 but below 125 (ascent) → stays BOTTOM
      { angle: 108, timestampMs: 132 }, // below 110 again → stays BOTTOM
    ], config);

    // Should not bounce between BOTTOM and DESCENDING
    const bottomCount = states.filter((s) => s.phase === 'BOTTOM').length;
    expect(bottomCount).toBe(3); // frames at 66, 99, 132
  });
});

// ---------------------------------------------------------------------------
// Dwell time (FR-PHASE-002)
// ---------------------------------------------------------------------------

describe('Dwell time enforcement', () => {
  it('does not transition before dwell time elapses', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 100,
    };

    const states = runPhaseSequence([
      { angle: 175, timestampMs: 0 },     // READY
      { angle: 150, timestampMs: 33 },    // condition met but dwell not yet (33 < 100)
      { angle: 150, timestampMs: 66 },    // still not yet (66 < 100)
    ], config);

    // Should still be READY (dwell not elapsed)
    expect(states[states.length - 1].phase).toBe('READY');
  });

  it('transitions after dwell time elapses', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 100,
    };

    const states = runPhaseSequence([
      { angle: 175, timestampMs: 0 },     // READY
      { angle: 150, timestampMs: 33 },    // condition met, start dwell timer
      { angle: 150, timestampMs: 133 },   // dwell elapsed (133 - 33 = 100) → DESCENDING
    ], config);

    expect(states[states.length - 1].phase).toBe('DESCENDING');
  });

  it('resets dwell timer if condition changes', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 100,
    };

    const states = runPhaseSequence([
      { angle: 175, timestampMs: 0 },     // READY
      { angle: 150, timestampMs: 33 },    // start descent dwell
      { angle: 175, timestampMs: 66 },    // back to standing → cancel pending
      { angle: 150, timestampMs: 99 },    // start descent dwell again
      { angle: 150, timestampMs: 132 },   // only 33ms since restart, not 100
    ], config);

    expect(states[states.length - 1].phase).toBe('READY');
  });
});

// ---------------------------------------------------------------------------
// Tracking loss (FR-PHASE-004)
// ---------------------------------------------------------------------------

describe('Tracking loss', () => {
  it('enters PAUSED when tracking is lost', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0,
      trackingGraceMs: 500,
    };

    const states = runPhaseSequence([
      { angle: 175, timestampMs: 0 },        // READY
      { angle: 150, timestampMs: 33 },       // DESCENDING
      { angle: 0, timestampMs: 66, valid: false }, // tracking lost → PAUSED
    ], config);

    expect(states[states.length - 1].phase).toBe('PAUSED');
    expect(states[states.length - 1].transitionReason).toBe('tracking_lost');
  });

  it('restores from PAUSED when tracking returns within grace period', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0,
      trackingGraceMs: 500,
    };

    const states = runPhaseSequence([
      { angle: 175, timestampMs: 0 },        // READY
      { angle: 150, timestampMs: 33 },       // DESCENDING
      { angle: 0, timestampMs: 66, valid: false }, // PAUSED
      { angle: 150, timestampMs: 100 },      // tracking restored (100 - 66 = 34 < 500)
    ], config);

    const lastState = states[states.length - 1];
    expect(lastState.phase).not.toBe('PAUSED');
    expect(lastState.transitionReason).toBe('tracking_restored');
  });

  it('transitions to TRACKING_LOST when grace period is exceeded', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0,
      trackingGraceMs: 500,
    };

    const states = runPhaseSequence([
      { angle: 175, timestampMs: 0 },        // READY
      { angle: 0, timestampMs: 33, valid: false }, // PAUSED (33)
      { angle: 0, timestampMs: 600, valid: false }, // 600 - 33 = 567 > 500 → TRACKING_LOST
    ], config);

    expect(states[states.length - 1].phase).toBe('TRACKING_LOST');
    expect(states[states.length - 1].transitionReason).toBe('grace_exceeded');
  });

  it('resets to READY after tracking is restored from TRACKING_LOST', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0,
      trackingGraceMs: 500,
    };

    const states = runPhaseSequence([
      { angle: 175, timestampMs: 0 },         // READY
      { angle: 150, timestampMs: 33 },        // DESCENDING
      { angle: 0, timestampMs: 66, valid: false },  // PAUSED
      { angle: 0, timestampMs: 600, valid: false },  // TRACKING_LOST
      { angle: 175, timestampMs: 700 },       // tracking restored → READY (reset)
    ], config);

    const lastState = states[states.length - 1];
    expect(lastState.phase).toBe('READY');
    expect(lastState.transitionReason).toBe('tracking_restored_reset');
  });
});

// ---------------------------------------------------------------------------
// Illegal transitions (FR-PHASE-003)
// ---------------------------------------------------------------------------

describe('Illegal transition rejection', () => {
  it('does not transition from READY to BOTTOM (skipping DESCENDING)', () => {
    // This is implicitly tested by the phase logic: determineTargetPhase
    // only returns BOTTOM when current phase is DESCENDING.
    // READY → BOTTOM is not in the legal transition table.
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0,
    };

    const states = runPhaseSequence([
      { angle: 175, timestampMs: 0 },   // READY
      { angle: 100, timestampMs: 33 },  // very low angle, but from READY can only go to DESCENDING
    ], config);

    // Should go to DESCENDING, not BOTTOM (illegal from READY)
    expect(states[states.length - 1].phase).toBe('DESCENDING');
  });
});

// ---------------------------------------------------------------------------
// PhaseState output (FR-PHASE-005)
// ---------------------------------------------------------------------------

describe('PhaseState output (FR-PHASE-005)', () => {
  it('includes state, entered timestamp, transition reason, confidence, profile version', () => {
    const state = createInitialPhaseState(42);
    const output = toPhaseState(state);

    expect(output).toHaveProperty('phase');
    expect(output).toHaveProperty('enteredTimestampMs');
    expect(output).toHaveProperty('transitionReason');
    expect(output).toHaveProperty('confidence');
    expect(output).toHaveProperty('profileVersion');

    expect(output.phase).toBe('READY');
    expect(output.enteredTimestampMs).toBe(42);
    expect(output.transitionReason).toBe('init');
    expect(typeof output.confidence).toBe('number');
    expect(typeof output.profileVersion).toBe('string');
  });

  it('updates enteredTimestampMs on transition', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0,
    };

    const states = runPhaseSequence([
      { angle: 175, timestampMs: 0 },
      { angle: 150, timestampMs: 100 },
    ], config);

    const output = toPhaseState(states[states.length - 1]);
    expect(output.enteredTimestampMs).toBe(100);
    expect(output.transitionReason).toBe('descent_started');
  });
});

// ---------------------------------------------------------------------------
// Low confidence (FR-PHASE-002)
// ---------------------------------------------------------------------------

describe('Low confidence handling', () => {
  it('treats low-confidence metrics as tracking loss', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0,
      minConfidence: 0.5,
      trackingGraceMs: 1000,
    };

    const states = runPhaseSequence([
      { angle: 175, timestampMs: 0 },        // READY
      { angle: 150, timestampMs: 33, valid: false }, // low visibility → PAUSED
    ], config);

    expect(states[states.length - 1].phase).toBe('PAUSED');
  });
});
