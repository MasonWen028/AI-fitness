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

function makeInvalidMetrics(timestampMs: number): SquatMetrics {
  const invalid: MetricValue = {
    value: 180,
    timestampMs,
    valid: false,
    minConfidence: 0,
  };
  return {
    kneeAngleLeft: invalid,
    kneeAngleRight: invalid,
    hipAngleLeft: invalid,
    hipAngleRight: invalid,
    torsoInclination: invalid,
    hipDepth: invalid,
  };
}

function runPhaseSequence(
  angles: Array<{ angle: number; timestampMs: number; valid?: boolean }>,
  config: SquatPhaseConfig = DEFAULT_SQUAT_PHASE_CONFIG,
): PhaseFSMState[] {
  const states: PhaseFSMState[] = [];
  let state = createInitialPhaseState(0, config);

  for (const { angle, timestampMs, valid } of angles) {
    const metrics =
      valid === false
        ? makeInvalidMetrics(timestampMs)
        : makeMetricsAtKneeAngle(angle, timestampMs, valid ?? true);
    state = updatePhase(state, metrics, config);
    states.push(state);
  }

  return states;
}

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
    expect(state.profileVersion).toBe(
      DEFAULT_SQUAT_PHASE_CONFIG.profileVersion,
    );
  });
});

describe('Complete squat sequence', () => {
  it('transitions READY → DESCENDING → BOTTOM → ASCENDING → READY', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0,
      trackingGraceMs: 1000,
    };

    const states = runPhaseSequence(
      [
        { angle: 175, timestampMs: 0 },
        { angle: 175, timestampMs: 33 },
        { angle: 150, timestampMs: 66 },
        { angle: 130, timestampMs: 99 },
        { angle: 100, timestampMs: 132 },
        { angle: 95, timestampMs: 165 },
        { angle: 130, timestampMs: 198 },
        { angle: 150, timestampMs: 231 },
        { angle: 170, timestampMs: 264 },
      ],
      config,
    );

    const phases = states.map((s) => s.phase);
    expect(phases).toContain('DESCENDING');
    expect(phases).toContain('BOTTOM');
    expect(phases).toContain('ASCENDING');
    expect(phases[phases.length - 1]).toBe('READY');
  });
});

describe('Hysteresis and jitter', () => {
  it('does not chatter at the descent threshold', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0,
    };

    const states = runPhaseSequence(
      [
        { angle: 175, timestampMs: 0 },
        { angle: 153, timestampMs: 33 },
        { angle: 157, timestampMs: 66 },
        { angle: 153, timestampMs: 99 },
        { angle: 157, timestampMs: 132 },
      ],
      config,
    );

    const readyCount = states.filter((s) => s.phase === 'READY').length;
    expect(readyCount).toBe(1);
  });
});

describe('Dwell time enforcement', () => {
  it('does not transition before dwell time elapses', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 100,
    };

    const states = runPhaseSequence(
      [
        { angle: 175, timestampMs: 0 },
        { angle: 150, timestampMs: 33 },
        { angle: 150, timestampMs: 66 },
      ],
      config,
    );

    expect(states[states.length - 1].phase).toBe('READY');
  });

  it('transitions after dwell time elapses', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 100,
    };

    const states = runPhaseSequence(
      [
        { angle: 175, timestampMs: 0 },
        { angle: 150, timestampMs: 33 },
        { angle: 150, timestampMs: 133 },
      ],
      config,
    );

    expect(states[states.length - 1].phase).toBe('DESCENDING');
  });
});

describe('Tracking loss', () => {
  it('enters PAUSED when tracking is lost', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0,
      trackingGraceMs: 500,
    };

    const states = runPhaseSequence(
      [
        { angle: 175, timestampMs: 0 },
        { angle: 150, timestampMs: 33 },
        { angle: 0, timestampMs: 66, valid: false },
      ],
      config,
    );

    expect(states[states.length - 1].phase).toBe('PAUSED');
    expect(states[states.length - 1].transitionReason).toBe('tracking_lost');
  });

  it('restores from PAUSED when tracking returns within grace period', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0,
      trackingGraceMs: 500,
    };

    const states = runPhaseSequence(
      [
        { angle: 175, timestampMs: 0 },
        { angle: 150, timestampMs: 33 },
        { angle: 0, timestampMs: 66, valid: false },
        { angle: 150, timestampMs: 100 },
      ],
      config,
    );

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

    const states = runPhaseSequence(
      [
        { angle: 175, timestampMs: 0 },
        { angle: 0, timestampMs: 33, valid: false },
        { angle: 0, timestampMs: 600, valid: false },
      ],
      config,
    );

    expect(states[states.length - 1].phase).toBe('TRACKING_LOST');
    expect(states[states.length - 1].transitionReason).toBe('grace_exceeded');
  });

  it('resets to READY after tracking is restored from TRACKING_LOST', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0,
      trackingGraceMs: 500,
    };

    const states = runPhaseSequence(
      [
        { angle: 175, timestampMs: 0 },
        { angle: 150, timestampMs: 33 },
        { angle: 0, timestampMs: 66, valid: false },
        { angle: 0, timestampMs: 600, valid: false },
        { angle: 175, timestampMs: 700 },
      ],
      config,
    );

    const lastState = states[states.length - 1];
    expect(lastState.phase).toBe('READY');
    expect(lastState.transitionReason).toBe('tracking_restored_reset');
  });
});

describe('Illegal transition rejection', () => {
  it('does not transition from READY to BOTTOM (skipping DESCENDING)', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0,
    };

    const states = runPhaseSequence(
      [
        { angle: 175, timestampMs: 0 },
        { angle: 100, timestampMs: 33 },
      ],
      config,
    );

    expect(states[states.length - 1].phase).toBe('DESCENDING');
  });
});

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
  });
});

describe('Low confidence handling', () => {
  it('treats low-confidence metrics as tracking loss', () => {
    const config: SquatPhaseConfig = {
      ...DEFAULT_SQUAT_PHASE_CONFIG,
      dwellMs: 0,
      minConfidence: 0.5,
      trackingGraceMs: 1000,
    };

    const states = runPhaseSequence(
      [
        { angle: 175, timestampMs: 0 },
        { angle: 150, timestampMs: 33, valid: false },
      ],
      config,
    );

    expect(states[states.length - 1].phase).toBe('PAUSED');
  });
});
