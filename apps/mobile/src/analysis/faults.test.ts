import { describe, expect, it } from 'vitest';

import type { SquatMetrics, MetricValue } from './metrics';
import type { PhaseState, SquatPhase } from './phaseMachine';
import type { RepDetectionState } from './repDetection';
import {
  DEFAULT_FAULT_CONFIG,
  FAULT_CATALOG,
  evaluateExcessiveForwardLean,
  evaluateFaults,
  evaluateInsufficientDepth,
  type FaultConfig,
  type FaultContext,
} from './faults';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMetric(
  value: number,
  overrides: Partial<MetricValue> = {},
): MetricValue {
  return {
    value,
    timestampMs: 1000,
    valid: true,
    minConfidence: 0.8,
    ...overrides,
  };
}

function makeMetrics(overrides: Partial<SquatMetrics> = {}): SquatMetrics {
  const defaultMetric = makeMetric(170);
  return {
    kneeAngleLeft: defaultMetric,
    kneeAngleRight: defaultMetric,
    hipAngleLeft: defaultMetric,
    hipAngleRight: defaultMetric,
    torsoInclination: makeMetric(10),
    hipDepth: makeMetric(0.5),
    ...overrides,
  };
}

function makePhase(
  phase: SquatPhase,
  overrides: Partial<PhaseState> = {},
): PhaseState {
  return {
    phase,
    enteredTimestampMs: 1000,
    transitionReason: 'init',
    confidence: 0.8,
    profileVersion: 'm0-squat-candidate-0.1.0',
    ...overrides,
  };
}

function makeRepState(
  overrides: Partial<RepDetectionState> = {},
): RepDetectionState {
  return {
    completedReps: [],
    incompleteReps: [],
    currentAttempt: null,
    lastPhase: 'READY',
    ...overrides,
  };
}

function makeContext(
  phase: SquatPhase,
  metricsOverrides: Partial<SquatMetrics> = {},
  repOverrides: Partial<RepDetectionState> = {},
  config?: FaultConfig,
): FaultContext {
  return {
    metrics: makeMetrics(metricsOverrides),
    phase: makePhase(phase),
    repState: makeRepState(repOverrides),
    config,
  };
}

// ---------------------------------------------------------------------------
// Tests: INSUFFICIENT_DEPTH (M0-J)
// ---------------------------------------------------------------------------

describe('evaluateInsufficientDepth', () => {
  describe('phase gating', () => {
    it('returns null when phase is READY', () => {
      const result = evaluateInsufficientDepth(makeContext('READY'));
      expect(result).toBeNull();
    });

    it('returns null when phase is DESCENDING', () => {
      const result = evaluateInsufficientDepth(makeContext('DESCENDING'));
      expect(result).toBeNull();
    });

    it('returns null when phase is ASCENDING', () => {
      const result = evaluateInsufficientDepth(makeContext('ASCENDING'));
      expect(result).toBeNull();
    });

    it('returns null when phase is PAUSED', () => {
      const result = evaluateInsufficientDepth(makeContext('PAUSED'));
      expect(result).toBeNull();
    });

    it('returns null when phase is TRACKING_LOST', () => {
      const result = evaluateInsufficientDepth(makeContext('TRACKING_LOST'));
      expect(result).toBeNull();
    });

    it('returns a result when phase is BOTTOM', () => {
      const result = evaluateInsufficientDepth(makeContext('BOTTOM'));
      expect(result).not.toBeNull();
      expect(result!.code).toBe('INSUFFICIENT_DEPTH');
    });
  });

  describe('detection logic', () => {
    it('detects when knee angle exceeds threshold at BOTTOM', () => {
      // Default threshold = 140°, knee angle = 150° → DETECTED
      const metrics = makeMetrics({
        kneeAngleLeft: makeMetric(150),
        kneeAngleRight: makeMetric(150),
      });
      const result = evaluateInsufficientDepth(
        makeContext('BOTTOM', {
          kneeAngleLeft: metrics.kneeAngleLeft,
          kneeAngleRight: metrics.kneeAngleRight,
        }),
      );
      expect(result).not.toBeNull();
      expect(result!.status).toBe('DETECTED');
      expect(result!.value).toBe(150);
      expect(result!.threshold).toBe(140);
    });

    it('does not detect when knee angle is below threshold', () => {
      // Knee angle = 100° (deep squat) → NOT_OBSERVABLE (no fault)
      const result = evaluateInsufficientDepth(
        makeContext('BOTTOM', {
          kneeAngleLeft: makeMetric(100),
          kneeAngleRight: makeMetric(100),
        }),
      );
      expect(result).not.toBeNull();
      expect(result!.status).toBe('NOT_OBSERVABLE');
    });

    it('detects at exact threshold boundary (>)', () => {
      // Knee angle = 140° exactly → NOT_OBSERVABLE (not > threshold)
      const result = evaluateInsufficientDepth(
        makeContext('BOTTOM', {
          kneeAngleLeft: makeMetric(140),
          kneeAngleRight: makeMetric(140),
        }),
      );
      expect(result!.status).toBe('NOT_OBSERVABLE');

      // Knee angle = 140.001 → DETECTED
      const result2 = evaluateInsufficientDepth(
        makeContext('BOTTOM', {
          kneeAngleLeft: makeMetric(140.001),
          kneeAngleRight: makeMetric(140.001),
        }),
      );
      expect(result2!.status).toBe('DETECTED');
    });

    it('uses average of left and right when both valid', () => {
      const result = evaluateInsufficientDepth(
        makeContext('BOTTOM', {
          kneeAngleLeft: makeMetric(130),
          kneeAngleRight: makeMetric(150),
        }),
      );
      // Average = 140, not > 140, so NOT_OBSERVABLE
      expect(result!.value).toBe(140);
      expect(result!.status).toBe('NOT_OBSERVABLE');
    });

    it('uses only valid side when one is invalid', () => {
      const result = evaluateInsufficientDepth(
        makeContext('BOTTOM', {
          kneeAngleLeft: makeMetric(150, { valid: true }),
          kneeAngleRight: makeMetric(0, { valid: false }),
        }),
      );
      expect(result!.value).toBe(150);
      expect(result!.status).toBe('DETECTED');
    });
  });

  describe('fail closed (FR-RULE-004)', () => {
    it('returns NOT_OBSERVABLE when knee angle is invalid', () => {
      const result = evaluateInsufficientDepth(
        makeContext('BOTTOM', {
          kneeAngleLeft: makeMetric(0, { valid: false }),
          kneeAngleRight: makeMetric(0, { valid: false }),
        }),
      );
      expect(result!.status).toBe('NOT_OBSERVABLE');
    });

    it('returns NOT_OBSERVABLE when confidence below minimum', () => {
      const result = evaluateInsufficientDepth(
        makeContext('BOTTOM', {
          kneeAngleLeft: makeMetric(150, { minConfidence: 0.3 }),
          kneeAngleRight: makeMetric(150, { minConfidence: 0.3 }),
        }),
      );
      // Default minConfidence = 0.5, metric confidence = 0.3
      expect(result!.status).toBe('NOT_OBSERVABLE');
    });

    it('returns NOT_OBSERVABLE when one side low confidence even if value high', () => {
      // Even if the effective angle would exceed threshold, low confidence fails closed
      const result = evaluateInsufficientDepth(
        makeContext('BOTTOM', {
          kneeAngleLeft: makeMetric(150, { minConfidence: 0.3 }),
          kneeAngleRight: makeMetric(150, { valid: false }),
        }),
      );
      // Only left is valid but confidence = 0.3 < 0.5
      expect(result!.status).toBe('NOT_OBSERVABLE');
    });
  });

  describe('result fields (FR-RULE-003)', () => {
    it('includes all required fields in detected fault', () => {
      const repState = makeRepState({
        currentAttempt: {
          startTimestampMs: 500,
          visitedBottom: false,
          minConfidence: 0.8,
          confidenceSum: 0.8,
          confidenceCount: 1,
          kneeAngleValues: [],
        },
      });
      const result = evaluateInsufficientDepth(
        makeContext(
          'BOTTOM',
          {
            kneeAngleLeft: makeMetric(150, { minConfidence: 0.7 }),
            kneeAngleRight: makeMetric(150, { minConfidence: 0.9 }),
          },
          repState,
        ),
      );
      expect(result).not.toBeNull();
      expect(result!.code).toBe('INSUFFICIENT_DEPTH');
      expect(result!.status).toBe('DETECTED');
      expect(result!.severity).toBe('IMPORTANT');
      expect(result!.confidence).toBe(0.7); // min of 0.7 and 0.9
      expect(result!.phase).toBe('BOTTOM');
      expect(result!.repIndex).toBe(0);
      expect(result!.evidenceMetricIds).toEqual([
        'knee_angle_left',
        'knee_angle_right',
      ]);
      expect(result!.ruleVersion).toBe(DEFAULT_FAULT_CONFIG.ruleVersion);
      expect(result!.timestampMs).toBe(1000);
      expect(result!.value).toBe(150);
      expect(result!.threshold).toBe(140);
    });
  });

  describe('rep index', () => {
    it('returns null repIndex when no attempt and no completed reps', () => {
      const result = evaluateInsufficientDepth(makeContext('BOTTOM'));
      expect(result!.repIndex).toBeNull();
    });

    it('returns current attempt repIndex when attempt in progress', () => {
      const repState = makeRepState({
        completedReps: [],
        incompleteReps: [],
        currentAttempt: {
          startTimestampMs: 500,
          visitedBottom: false,
          minConfidence: 0.8,
          confidenceSum: 0.8,
          confidenceCount: 1,
          kneeAngleValues: [],
        },
      });
      const result = evaluateInsufficientDepth(
        makeContext(
          'BOTTOM',
          {},
          {
            currentAttempt: repState.currentAttempt,
          },
        ),
      );
      expect(result!.repIndex).toBe(0);
    });

    it('returns last completed repIndex when no current attempt', () => {
      const repState = makeRepState({
        completedReps: [
          {
            status: 'completed',
            startTimestampMs: 0,
            endTimestampMs: 500,
            durationMs: 500,
            kneeAngleRom: 60,
            minConfidence: 0.8,
            averageConfidence: 0.8,
            issues: [],
            engineVersion: 'm0-engine-0.1.0',
            profileVersion: 'm0-squat-candidate-0.1.0',
            ruleVersion: 'm0-squat-rules-0.1.0',
          },
        ],
        currentAttempt: null,
      });
      const result = evaluateInsufficientDepth(
        makeContext('BOTTOM', {}, repState),
      );
      expect(result!.repIndex).toBe(0);
    });
  });

  describe('custom config', () => {
    it('uses custom threshold from config', () => {
      const config: FaultConfig = {
        ...DEFAULT_FAULT_CONFIG,
        insufficientDepth: {
          kneeAngleThreshold: 120,
          minConfidence: 0.5,
          severity: 'IMPORTANT',
        },
      };
      // Knee angle = 130, threshold = 120 → DETECTED
      const result = evaluateInsufficientDepth(
        makeContext(
          'BOTTOM',
          {
            kneeAngleLeft: makeMetric(130),
            kneeAngleRight: makeMetric(130),
          },
          {},
          config,
        ),
      );
      expect(result!.status).toBe('DETECTED');
      expect(result!.threshold).toBe(120);
    });

    it('uses custom minConfidence from config', () => {
      const config: FaultConfig = {
        ...DEFAULT_FAULT_CONFIG,
        insufficientDepth: {
          kneeAngleThreshold: 140,
          minConfidence: 0.9,
          severity: 'CRITICAL',
        },
      };
      // Confidence = 0.7, minConfidence = 0.9 → NOT_OBSERVABLE
      const result = evaluateInsufficientDepth(
        makeContext(
          'BOTTOM',
          {
            kneeAngleLeft: makeMetric(150, { minConfidence: 0.7 }),
            kneeAngleRight: makeMetric(150, { minConfidence: 0.7 }),
          },
          {},
          config,
        ),
      );
      expect(result!.status).toBe('NOT_OBSERVABLE');
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: EXCESSIVE_FORWARD_LEAN (M0-K)
// ---------------------------------------------------------------------------

describe('evaluateExcessiveForwardLean', () => {
  describe('phase gating', () => {
    it('returns null when phase is READY', () => {
      const result = evaluateExcessiveForwardLean(makeContext('READY'));
      expect(result).toBeNull();
    });

    it('returns null when phase is PAUSED', () => {
      const result = evaluateExcessiveForwardLean(makeContext('PAUSED'));
      expect(result).toBeNull();
    });

    it('returns null when phase is TRACKING_LOST', () => {
      const result = evaluateExcessiveForwardLean(makeContext('TRACKING_LOST'));
      expect(result).toBeNull();
    });

    it('returns a result when phase is DESCENDING', () => {
      const result = evaluateExcessiveForwardLean(makeContext('DESCENDING'));
      expect(result).not.toBeNull();
      expect(result!.code).toBe('EXCESSIVE_FORWARD_LEAN');
    });

    it('returns a result when phase is BOTTOM', () => {
      const result = evaluateExcessiveForwardLean(makeContext('BOTTOM'));
      expect(result).not.toBeNull();
      expect(result!.code).toBe('EXCESSIVE_FORWARD_LEAN');
    });

    it('returns a result when phase is ASCENDING', () => {
      const result = evaluateExcessiveForwardLean(makeContext('ASCENDING'));
      expect(result).not.toBeNull();
      expect(result!.code).toBe('EXCESSIVE_FORWARD_LEAN');
    });
  });

  describe('detection logic', () => {
    it('detects when torso inclination exceeds threshold', () => {
      // Default threshold = 45°, inclination = 50° → DETECTED
      const result = evaluateExcessiveForwardLean(
        makeContext('DESCENDING', {
          torsoInclination: makeMetric(50),
        }),
      );
      expect(result!.status).toBe('DETECTED');
      expect(result!.value).toBe(50);
      expect(result!.threshold).toBe(45);
    });

    it('does not detect when torso inclination is below threshold', () => {
      const result = evaluateExcessiveForwardLean(
        makeContext('DESCENDING', {
          torsoInclination: makeMetric(30),
        }),
      );
      expect(result!.status).toBe('NOT_OBSERVABLE');
    });

    it('detects at exact threshold boundary (>)', () => {
      // Exactly 45° → NOT_OBSERVABLE (not > 45)
      const result = evaluateExcessiveForwardLean(
        makeContext('BOTTOM', {
          torsoInclination: makeMetric(45),
        }),
      );
      expect(result!.status).toBe('NOT_OBSERVABLE');

      // 45.001° → DETECTED
      const result2 = evaluateExcessiveForwardLean(
        makeContext('BOTTOM', {
          torsoInclination: makeMetric(45.001),
        }),
      );
      expect(result2!.status).toBe('DETECTED');
    });
  });

  describe('fail closed (FR-RULE-004)', () => {
    it('returns NOT_OBSERVABLE when torso inclination is invalid', () => {
      const result = evaluateExcessiveForwardLean(
        makeContext('DESCENDING', {
          torsoInclination: makeMetric(50, { valid: false }),
        }),
      );
      expect(result!.status).toBe('NOT_OBSERVABLE');
    });

    it('returns NOT_OBSERVABLE when confidence below minimum', () => {
      const result = evaluateExcessiveForwardLean(
        makeContext('DESCENDING', {
          torsoInclination: makeMetric(50, { minConfidence: 0.3 }),
        }),
      );
      expect(result!.status).toBe('NOT_OBSERVABLE');
    });
  });

  describe('result fields (FR-RULE-003)', () => {
    it('includes all required fields in detected fault', () => {
      const result = evaluateExcessiveForwardLean(
        makeContext('BOTTOM', {
          torsoInclination: makeMetric(55, { minConfidence: 0.75 }),
        }),
      );
      expect(result).not.toBeNull();
      expect(result!.code).toBe('EXCESSIVE_FORWARD_LEAN');
      expect(result!.status).toBe('DETECTED');
      expect(result!.severity).toBe('IMPORTANT');
      expect(result!.confidence).toBe(0.75);
      expect(result!.phase).toBe('BOTTOM');
      expect(result!.evidenceMetricIds).toEqual(['torso_inclination']);
      expect(result!.ruleVersion).toBe(DEFAULT_FAULT_CONFIG.ruleVersion);
      expect(result!.timestampMs).toBe(1000);
      expect(result!.value).toBe(55);
      expect(result!.threshold).toBe(45);
    });
  });

  describe('custom config', () => {
    it('uses custom threshold from config', () => {
      const config: FaultConfig = {
        ...DEFAULT_FAULT_CONFIG,
        excessiveForwardLean: {
          torsoInclinationThreshold: 30,
          minConfidence: 0.5,
          severity: 'CRITICAL',
        },
      };
      // Inclination = 35, threshold = 30 → DETECTED
      const result = evaluateExcessiveForwardLean(
        makeContext(
          'DESCENDING',
          {
            torsoInclination: makeMetric(35),
          },
          {},
          config,
        ),
      );
      expect(result!.status).toBe('DETECTED');
      expect(result!.threshold).toBe(30);
      expect(result!.severity).toBe('CRITICAL');
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: evaluateFaults (combined)
// ---------------------------------------------------------------------------

describe('evaluateFaults', () => {
  it('returns both nulls when phase is READY', () => {
    const result = evaluateFaults(makeContext('READY'));
    expect(result.insufficientDepth).toBeNull();
    expect(result.excessiveForwardLean).toBeNull();
  });

  it('returns only lean result when phase is DESCENDING', () => {
    const result = evaluateFaults(makeContext('DESCENDING'));
    expect(result.insufficientDepth).toBeNull();
    expect(result.excessiveForwardLean).not.toBeNull();
  });

  it('returns both results when phase is BOTTOM', () => {
    const result = evaluateFaults(makeContext('BOTTOM'));
    expect(result.insufficientDepth).not.toBeNull();
    expect(result.excessiveForwardLean).not.toBeNull();
  });

  it('returns only lean result when phase is ASCENDING', () => {
    const result = evaluateFaults(makeContext('ASCENDING'));
    expect(result.insufficientDepth).toBeNull();
    expect(result.excessiveForwardLean).not.toBeNull();
  });

  it('returns both nulls when phase is TRACKING_LOST', () => {
    const result = evaluateFaults(makeContext('TRACKING_LOST'));
    expect(result.insufficientDepth).toBeNull();
    expect(result.excessiveForwardLean).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: Fault catalog (FR-FAULT-003)
// ---------------------------------------------------------------------------

describe('FAULT_CATALOG', () => {
  it('documents INSUFFICIENT_DEPTH fault', () => {
    const entry = FAULT_CATALOG.INSUFFICIENT_DEPTH;
    expect(entry.code).toBe('INSUFFICIENT_DEPTH');
    expect(entry.exercise).toBe('Bodyweight Squat');
    expect(entry.description).toBeTruthy();
    expect(entry.evidenceMetrics).toContain('knee_angle_left');
    expect(entry.evidenceMetrics).toContain('knee_angle_right');
    expect(entry.evaluationPhase).toContain('BOTTOM');
    expect(entry.knownConfounders.length).toBeGreaterThan(0);
    expect(entry.validationStatus).toContain('M0 candidate');
  });

  it('documents EXCESSIVE_FORWARD_LEAN fault', () => {
    const entry = FAULT_CATALOG.EXCESSIVE_FORWARD_LEAN;
    expect(entry.code).toBe('EXCESSIVE_FORWARD_LEAN');
    expect(entry.exercise).toBe('Bodyweight Squat');
    expect(entry.description).toBeTruthy();
    expect(entry.evidenceMetrics).toContain('torso_inclination');
    expect(entry.evaluationPhase).toContain('DESCENDING');
    expect(entry.evaluationPhase).toContain('BOTTOM');
    expect(entry.evaluationPhase).toContain('ASCENDING');
    expect(entry.knownConfounders.length).toBeGreaterThan(0);
    expect(entry.validationStatus).toContain('M0 candidate');
  });
});

// ---------------------------------------------------------------------------
// Tests: determinism (FR-RULE-002)
// ---------------------------------------------------------------------------

describe('determinism (FR-RULE-002)', () => {
  it('produces identical results for identical inputs', () => {
    const ctx = makeContext('BOTTOM', {
      kneeAngleLeft: makeMetric(145, { minConfidence: 0.7 }),
      kneeAngleRight: makeMetric(145, { minConfidence: 0.7 }),
      torsoInclination: makeMetric(50, { minConfidence: 0.8 }),
    });

    const result1 = evaluateFaults(ctx);
    const result2 = evaluateFaults(ctx);

    expect(result1).toEqual(result2);
  });

  it('produces consistent results across multiple calls', () => {
    const ctx = makeContext('DESCENDING', {
      torsoInclination: makeMetric(40, { minConfidence: 0.6 }),
    });

    for (let i = 0; i < 5; i++) {
      const result = evaluateFaults(ctx);
      expect(result.excessiveForwardLean!.status).toBe('NOT_OBSERVABLE');
      expect(result.excessiveForwardLean!.value).toBe(40);
    }
  });
});
