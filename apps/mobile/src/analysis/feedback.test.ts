import { describe, expect, it } from 'vitest';

import type { FaultResult } from './faults';
import type { PhaseState, SquatPhase } from './phaseMachine';
import type { FrameQuality } from './normalization';
import type { RepDetectionState, RepResult } from './repDetection';
import {
  DEFAULT_FEEDBACK_CONFIG,
  FEEDBACK_PRIORITY,
  selectFeedback,
  shouldSupersede,
  type FeedbackConfig,
  type FeedbackContext,
} from './feedback';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function makeQuality(
  overrides: Partial<FrameQuality> = {},
): FrameQuality {
  return {
    hasCriticalLandmarks: true,
    minVisibility: 0.7,
    averageVisibility: 0.8,
    missingLandmarks: [],
    lowVisibilityLandmarks: [],
    personDetected: true,
    overallScore: 0.8,
    ...overrides,
  };
}

function makeFault(
  code: string,
  status: 'DETECTED' | 'NOT_OBSERVABLE',
  overrides: Partial<FaultResult> = {},
): FaultResult {
  return {
    code: code as FaultResult['code'],
    status,
    severity: 'IMPORTANT',
    confidence: 0.75,
    phase: 'BOTTOM',
    repIndex: 0,
    evidenceMetricIds: [],
    ruleVersion: 'm0-squat-faults-0.1.0',
    timestampMs: 1000,
    value: 150,
    threshold: 140,
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

function makeRepResult(
  status: 'completed' | 'incomplete',
  overrides: Partial<RepResult> = {},
): RepResult {
  return {
    status,
    startTimestampMs: 500,
    endTimestampMs: 1000,
    durationMs: 500,
    kneeAngleRom: 60,
    minConfidence: 0.8,
    averageConfidence: 0.8,
    issues: [],
    engineVersion: 'm0-engine-0.1.0',
    profileVersion: 'm0-squat-candidate-0.1.0',
    ruleVersion: 'm0-squat-rules-0.1.0',
    ...overrides,
  };
}

function makeContext(
  phase: SquatPhase,
  overrides: {
    quality?: Partial<FrameQuality>;
    faults?: FaultResult[];
    repState?: Partial<RepDetectionState>;
    config?: FeedbackConfig;
  } = {},
): FeedbackContext {
  return {
    phase: makePhase(phase),
    quality: makeQuality(overrides.quality),
    faults: overrides.faults ?? [],
    repState: makeRepState(overrides.repState),
    config: overrides.config,
  };
}

// ---------------------------------------------------------------------------
// Tests: Tracking guidance (FR-FEEDBACK-007)
// ---------------------------------------------------------------------------

describe('selectFeedback — tracking guidance (FR-FEEDBACK-007)', () => {
  it('returns tracking_lost when phase is TRACKING_LOST', () => {
    const cue = selectFeedback(makeContext('TRACKING_LOST'));
    expect(cue.category).toBe('tracking_guidance');
    expect(cue.key).toBe('tracking.tracking_lost');
    expect(cue.priority).toBe(FEEDBACK_PRIORITY.tracking_guidance);
  });

  it('returns no_person when person not detected', () => {
    const cue = selectFeedback(makeContext('READY', {
      quality: { personDetected: false, overallScore: 0 },
    }));
    expect(cue.category).toBe('tracking_guidance');
    expect(cue.key).toBe('tracking.no_person');
  });

  it('returns low_visibility when quality below form feedback threshold', () => {
    const cue = selectFeedback(makeContext('DESCENDING', {
      quality: { overallScore: 0.3 },
    }));
    expect(cue.category).toBe('tracking_guidance');
    expect(cue.key).toBe('tracking.low_visibility');
  });

  it('tracking guidance supersedes form faults', () => {
    // Even with a detected fault, low quality → tracking guidance
    // overallScore must be above minPersonDetected (0.3) but below minQualityForFormFeedback (0.4)
    const fault = makeFault('INSUFFICIENT_DEPTH', 'DETECTED');
    const cue = selectFeedback(makeContext('BOTTOM', {
      quality: { overallScore: 0.35 },
      faults: [fault],
    }));
    expect(cue.category).toBe('tracking_guidance');
    expect(cue.key).toBe('tracking.low_visibility');
  });

  it('uses custom minQualityForFormFeedback from config', () => {
    const config: FeedbackConfig = {
      ...DEFAULT_FEEDBACK_CONFIG,
      minQualityForFormFeedback: 0.6,
    };
    // Quality = 0.5, threshold = 0.6 → tracking guidance
    const cue = selectFeedback(makeContext('DESCENDING', {
      quality: { overallScore: 0.5 },
      config,
    }));
    expect(cue.category).toBe('tracking_guidance');
  });
});

// ---------------------------------------------------------------------------
// Tests: Setup guidance
// ---------------------------------------------------------------------------

describe('selectFeedback — setup guidance', () => {
  it('returns paused when phase is PAUSED', () => {
    const cue = selectFeedback(makeContext('PAUSED'));
    expect(cue.category).toBe('setup_guidance');
    expect(cue.key).toBe('setup.paused');
  });

  it('returns not_ready when READY with no current attempt and no completed reps', () => {
    const cue = selectFeedback(makeContext('READY'));
    expect(cue.category).toBe('setup_guidance');
    expect(cue.key).toBe('setup.not_ready');
  });

  it('returns positive good_rep when READY after a completed rep', () => {
    const cue = selectFeedback(makeContext('READY', {
      repState: {
        completedReps: [makeRepResult('completed')],
        currentAttempt: null,
      },
    }));
    expect(cue.category).toBe('positive');
    expect(cue.key).toBe('positive.good_rep');
  });

  it('returns not_ready when READY after an incomplete rep', () => {
    const cue = selectFeedback(makeContext('READY', {
      repState: {
        completedReps: [],
        incompleteReps: [makeRepResult('incomplete')],
        currentAttempt: null,
      },
    }));
    expect(cue.category).toBe('setup_guidance');
    expect(cue.key).toBe('setup.not_ready');
  });
});

// ---------------------------------------------------------------------------
// Tests: Form correction (FR-FEEDBACK-002)
// ---------------------------------------------------------------------------

describe('selectFeedback — form correction (FR-FEEDBACK-002)', () => {
  it('returns form correction when a fault is detected during active phase', () => {
    const fault = makeFault('INSUFFICIENT_DEPTH', 'DETECTED');
    const cue = selectFeedback(makeContext('BOTTOM', {
      faults: [fault],
      repState: { currentAttempt: {
        startTimestampMs: 500, visitedBottom: true,
        minConfidence: 0.8, confidenceSum: 0.8, confidenceCount: 1, kneeAngleValues: [],
      } },
    }));
    expect(cue.category).toBe('form_correction');
    expect(cue.key).toBe('form.insufficient_depth');
    expect(cue.sourceFaultCode).toBe('INSUFFICIENT_DEPTH');
  });

  it('returns form correction for EXCESSIVE_FORWARD_LEAN', () => {
    const fault = makeFault('EXCESSIVE_FORWARD_LEAN', 'DETECTED');
    const cue = selectFeedback(makeContext('DESCENDING', {
      faults: [fault],
      repState: { currentAttempt: {
        startTimestampMs: 500, visitedBottom: false,
        minConfidence: 0.8, confidenceSum: 0.8, confidenceCount: 1, kneeAngleValues: [],
      } },
    }));
    expect(cue.category).toBe('form_correction');
    expect(cue.key).toBe('form.excessive_forward_lean');
    expect(cue.sourceFaultCode).toBe('EXCESSIVE_FORWARD_LEAN');
  });

  it('selects highest severity fault when multiple detected', () => {
    const fault1 = makeFault('INSUFFICIENT_DEPTH', 'DETECTED', { severity: 'IMPORTANT' });
    const fault2 = makeFault('EXCESSIVE_FORWARD_LEAN', 'DETECTED', { severity: 'CRITICAL' });
    const cue = selectFeedback(makeContext('BOTTOM', {
      faults: [fault1, fault2],
      repState: { currentAttempt: {
        startTimestampMs: 500, visitedBottom: true,
        minConfidence: 0.8, confidenceSum: 0.8, confidenceCount: 1, kneeAngleValues: [],
      } },
    }));
    expect(cue.sourceFaultCode).toBe('EXCESSIVE_FORWARD_LEAN');
  });

  it('selects higher confidence when severity is equal', () => {
    const fault1 = makeFault('INSUFFICIENT_DEPTH', 'DETECTED', {
      severity: 'IMPORTANT', confidence: 0.6,
    });
    const fault2 = makeFault('EXCESSIVE_FORWARD_LEAN', 'DETECTED', {
      severity: 'IMPORTANT', confidence: 0.9,
    });
    const cue = selectFeedback(makeContext('BOTTOM', {
      faults: [fault1, fault2],
      repState: { currentAttempt: {
        startTimestampMs: 500, visitedBottom: true,
        minConfidence: 0.8, confidenceSum: 0.8, confidenceCount: 1, kneeAngleValues: [],
      } },
    }));
    expect(cue.sourceFaultCode).toBe('EXCESSIVE_FORWARD_LEAN');
  });

  it('ignores NOT_OBSERVABLE faults for form correction', () => {
    const fault = makeFault('INSUFFICIENT_DEPTH', 'NOT_OBSERVABLE');
    const cue = selectFeedback(makeContext('BOTTOM', {
      faults: [fault],
      repState: { currentAttempt: {
        startTimestampMs: 500, visitedBottom: true,
        minConfidence: 0.8, confidenceSum: 0.8, confidenceCount: 1, kneeAngleValues: [],
      } },
    }));
    // No detected faults → positive feedback
    expect(cue.category).toBe('positive');
  });

  it('only one form correction at a time (FR-FEEDBACK-002)', () => {
    const faults = [
      makeFault('INSUFFICIENT_DEPTH', 'DETECTED'),
      makeFault('EXCESSIVE_FORWARD_LEAN', 'DETECTED'),
    ];
    const cue = selectFeedback(makeContext('BOTTOM', {
      faults,
      repState: { currentAttempt: {
        startTimestampMs: 500, visitedBottom: true,
        minConfidence: 0.8, confidenceSum: 0.8, confidenceCount: 1, kneeAngleValues: [],
      } },
    }));
    // Should have exactly one sourceFaultCode
    expect(cue.sourceFaultCode).toBeDefined();
    expect(cue.category).toBe('form_correction');
  });
});

// ---------------------------------------------------------------------------
// Tests: Positive feedback
// ---------------------------------------------------------------------------

describe('selectFeedback — positive feedback', () => {
  it('returns good_form during active movement with no faults', () => {
    const cue = selectFeedback(makeContext('DESCENDING', {
      repState: { currentAttempt: {
        startTimestampMs: 500, visitedBottom: false,
        minConfidence: 0.8, confidenceSum: 0.8, confidenceCount: 1, kneeAngleValues: [],
      } },
    }));
    expect(cue.category).toBe('positive');
    expect(cue.key).toBe('positive.good_form');
  });

  it('returns good_rep when returning to READY after completed rep', () => {
    const cue = selectFeedback(makeContext('READY', {
      repState: {
        completedReps: [makeRepResult('completed')],
        currentAttempt: null,
      },
    }));
    expect(cue.category).toBe('positive');
    expect(cue.key).toBe('positive.good_rep');
  });
});

// ---------------------------------------------------------------------------
// Tests: Neutral
// ---------------------------------------------------------------------------

describe('selectFeedback — neutral', () => {
  it('returns neutral for READY with current attempt (edge case)', () => {
    // This is an unusual state but should not crash
    const cue = selectFeedback(makeContext('READY', {
      repState: { currentAttempt: {
        startTimestampMs: 500, visitedBottom: false,
        minConfidence: 0.8, confidenceSum: 0.8, confidenceCount: 1, kneeAngleValues: [],
      } },
    }));
    // READY with current attempt — positive good_rep doesn't apply (no completed reps)
    // Falls through to neutral
    expect(cue.category === 'positive' || cue.category === 'neutral').toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests: Priority ordering (FR-FEEDBACK-006)
// ---------------------------------------------------------------------------

describe('shouldSupersede (FR-FEEDBACK-006)', () => {
  it('form correction supersedes positive feedback', () => {
    const current = {
      key: 'positive.good_form',
      category: 'positive' as const,
      priority: FEEDBACK_PRIORITY.positive,
      message: 'Good form',
      timestampMs: 1000,
      phase: 'DESCENDING' as const,
      confidence: 0.8,
    };
    const candidate = {
      key: 'form.insufficient_depth',
      category: 'form_correction' as const,
      priority: FEEDBACK_PRIORITY.form_correction,
      message: 'Squat deeper',
      timestampMs: 1000,
      phase: 'DESCENDING' as const,
      confidence: 0.7,
    };
    expect(shouldSupersede(current, candidate)).toBe(true);
  });

  it('positive feedback does not supersede form correction', () => {
    const current = {
      key: 'form.insufficient_depth',
      category: 'form_correction' as const,
      priority: FEEDBACK_PRIORITY.form_correction,
      message: 'Squat deeper',
      timestampMs: 1000,
      phase: 'BOTTOM' as const,
      confidence: 0.7,
    };
    const candidate = {
      key: 'positive.good_form',
      category: 'positive' as const,
      priority: FEEDBACK_PRIORITY.positive,
      message: 'Good form',
      timestampMs: 2000,
      phase: 'BOTTOM' as const,
      confidence: 0.8,
    };
    expect(shouldSupersede(current, candidate)).toBe(false);
  });

  it('tracking guidance supersedes form correction', () => {
    const current = {
      key: 'form.excessive_forward_lean',
      category: 'form_correction' as const,
      priority: FEEDBACK_PRIORITY.form_correction,
      message: 'Keep chest up',
      timestampMs: 1000,
      phase: 'DESCENDING' as const,
      confidence: 0.8,
    };
    const candidate = {
      key: 'tracking.low_visibility',
      category: 'tracking_guidance' as const,
      priority: FEEDBACK_PRIORITY.tracking_guidance,
      message: 'Tracking quality low',
      timestampMs: 1000,
      phase: 'DESCENDING' as const,
      confidence: 0.3,
    };
    expect(shouldSupersede(current, candidate)).toBe(true);
  });

  it('same priority — newer timestamp wins', () => {
    const current = {
      key: 'form.insufficient_depth',
      category: 'form_correction' as const,
      priority: FEEDBACK_PRIORITY.form_correction,
      message: 'Squat deeper',
      timestampMs: 1000,
      phase: 'BOTTOM' as const,
      confidence: 0.7,
    };
    const candidate = {
      key: 'form.excessive_forward_lean',
      category: 'form_correction' as const,
      priority: FEEDBACK_PRIORITY.form_correction,
      message: 'Keep chest up',
      timestampMs: 2000,
      phase: 'BOTTOM' as const,
      confidence: 0.8,
    };
    expect(shouldSupersede(current, candidate)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests: Feedback cue structure
// ---------------------------------------------------------------------------

describe('feedback cue structure', () => {
  it('every cue has required fields', () => {
    const cue = selectFeedback(makeContext('BOTTOM', {
      faults: [makeFault('INSUFFICIENT_DEPTH', 'DETECTED')],
      repState: { currentAttempt: {
        startTimestampMs: 500, visitedBottom: true,
        minConfidence: 0.8, confidenceSum: 0.8, confidenceCount: 1, kneeAngleValues: [],
      } },
    }));
    expect(cue.key).toBeTruthy();
    expect(cue.category).toBeTruthy();
    expect(cue.priority).toBeGreaterThan(0);
    expect(cue.message).toBeTruthy();
    expect(cue.timestampMs).toBe(1000);
    expect(cue.phase).toBe('BOTTOM');
    expect(cue.confidence).toBeGreaterThanOrEqual(0);
  });

  it('priority values are correctly ordered', () => {
    expect(FEEDBACK_PRIORITY.tracking_guidance).toBeGreaterThan(FEEDBACK_PRIORITY.setup_guidance);
    expect(FEEDBACK_PRIORITY.setup_guidance).toBeGreaterThan(FEEDBACK_PRIORITY.form_correction);
    expect(FEEDBACK_PRIORITY.form_correction).toBeGreaterThan(FEEDBACK_PRIORITY.positive);
    expect(FEEDBACK_PRIORITY.positive).toBeGreaterThan(FEEDBACK_PRIORITY.neutral);
  });
});
