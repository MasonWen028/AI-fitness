/**
 * M0-L: Feedback Selector
 *
 * SRS: FR-FEEDBACK-001 through FR-FEEDBACK-007
 *
 * - FR-FEEDBACK-001: Live feedback generated locally from deterministic events, no network/LLM
 * - FR-FEEDBACK-002: No more than one primary corrective text cue at a time
 * - FR-FEEDBACK-006: Positive feedback shall not suppress a newly detected higher-priority correction
 * - FR-FEEDBACK-007: If tracking quality is inadequate, issue setup/tracking guidance instead of form judgement
 *
 * The feedback selector takes fault results, phase state, and quality metrics
 * and produces a single prioritised feedback cue (or tracking/setup guidance).
 */

import type { FaultResult, FaultStatus } from './faults';
import type { PhaseState, SquatPhase } from './phaseMachine';
import type { FrameQuality } from './normalization';
import type { RepDetectionState } from './repDetection';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Feedback category — determines priority ordering */
export type FeedbackCategory =
  | 'tracking_guidance'    // FR-FEEDBACK-007: tracking quality inadequate
  | 'setup_guidance'       // person not in position, camera angle issues
  | 'form_correction'      // FR-FEEDBACK-002: primary corrective cue
  | 'positive'             // encouragement / no faults detected
  | 'neutral';             // no active feedback (between reps, idle)

/** Feedback priority — higher number = higher priority (FR-FEEDBACK-006) */
export const FEEDBACK_PRIORITY: Record<FeedbackCategory, number> = {
  tracking_guidance: 100,   // Highest — supersedes all form cues
  setup_guidance: 90,       // Second — need correct setup before form
  form_correction: 50,      // Third — actual form feedback
  positive: 10,             // Fourth — positive reinforcement
  neutral: 0,               // Lowest — no feedback
};

/**
 * Feedback cue — the single output of the feedback selector.
 *
 * FR-FEEDBACK-002: Only one primary corrective cue is shown at a time.
 */
export type FeedbackCue = {
  /** Unique feedback key for localisation (FR-FAULT-001: stable machine ID) */
  key: string;
  /** Category for priority ordering */
  category: FeedbackCategory;
  /** Priority value (derived from category, higher = more urgent) */
  priority: number;
  /** Human-readable description (M0 English placeholder, will be localised) */
  message: string;
  /** Timestamp when this cue was generated */
  timestampMs: number;
  /** Phase when this cue was generated */
  phase: SquatPhase;
  /** Source fault code if this cue is a form correction */
  sourceFaultCode?: string;
  /** Confidence of the underlying evidence (0-1) */
  confidence: number;
};

/**
 * Context for feedback selection.
 */
export type FeedbackContext = {
  phase: PhaseState;
  quality: FrameQuality;
  faults: FaultResult[];
  repState: RepDetectionState;
  config?: FeedbackConfig;
};

/**
 * Configuration for feedback selection.
 *
 * NOTE: Cooldown values are M0 technical-validation defaults.
 * Production values require <VALIDATION_REQUIRED> per FR-FEEDBACK-003.
 */
export type FeedbackConfig = {
  /** Minimum quality score to issue form feedback (below this → tracking guidance) */
  minQualityForFormFeedback: number;
  /** Minimum person detection score to issue any feedback */
  minPersonDetected: number;
  /** Rule version */
  ruleVersion: string;
};

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

export const DEFAULT_FEEDBACK_CONFIG: FeedbackConfig = {
  minQualityForFormFeedback: 0.4,
  minPersonDetected: 0.3,
  ruleVersion: 'm0-feedback-0.1.0',
};

// ---------------------------------------------------------------------------
// Feedback messages (M0 English placeholders)
// ---------------------------------------------------------------------------

const FEEDBACK_MESSAGES = {
  // Tracking guidance (FR-FEEDBACK-007)
  NO_PERSON: 'No person detected — step into camera view',
  LOW_VISIBILITY: 'Tracking quality low — adjust lighting or position',
  TRACKING_LOST: 'Tracking lost — return to starting position',

  // Setup guidance
  NOT_READY: 'Stand upright in frame to begin',
  PAUSED: 'Hold still — recovering tracking...',

  // Form corrections (FR-FEEDBACK-002)
  INSUFFICIENT_DEPTH: 'Squat deeper — aim for thighs parallel to ground',
  EXCESSIVE_FORWARD_LEAN: 'Keep chest up — reduce forward lean',

  // Positive feedback
  GOOD_REP: 'Good rep!',
  GOOD_FORM: 'Form looks good — keep going',

  // Neutral
  IDLE: '',
} as const;

// ---------------------------------------------------------------------------
// Main selection function
// ---------------------------------------------------------------------------

/**
 * Selects the single highest-priority feedback cue for the current context.
 *
 * Priority order (FR-FEEDBACK-006, FR-FEEDBACK-007):
 * 1. Tracking guidance — if tracking quality is inadequate, this supersedes all form cues
 * 2. Setup guidance — if person is detected but not in a valid starting position
 * 3. Form correction — the highest-severity detected fault (FR-FEEDBACK-002: only one)
 * 4. Positive feedback — if no faults detected and tracking is good
 * 5. Neutral — no active feedback
 *
 * @param context  Feedback evaluation context
 * @returns        Single prioritised feedback cue
 */
export function selectFeedback(
  context: FeedbackContext,
): FeedbackCue {
  const { phase, quality, faults, repState, config = DEFAULT_FEEDBACK_CONFIG } = context;
  const timestampMs = phase.enteredTimestampMs;

  // --- Priority 1: Tracking guidance (FR-FEEDBACK-007) ---

  if (phase.phase === 'TRACKING_LOST') {
    return makeCue(
      'tracking.tracking_lost',
      'tracking_guidance',
      FEEDBACK_MESSAGES.TRACKING_LOST,
      timestampMs,
      phase.phase,
      0,
    );
  }

  if (!quality.personDetected || quality.overallScore < config.minPersonDetected) {
    return makeCue(
      'tracking.no_person',
      'tracking_guidance',
      FEEDBACK_MESSAGES.NO_PERSON,
      timestampMs,
      phase.phase,
      0,
    );
  }

  if (quality.overallScore < config.minQualityForFormFeedback) {
    return makeCue(
      'tracking.low_visibility',
      'tracking_guidance',
      FEEDBACK_MESSAGES.LOW_VISIBILITY,
      timestampMs,
      phase.phase,
      quality.overallScore,
    );
  }

  // --- Priority 2: Setup guidance ---

  if (phase.phase === 'PAUSED') {
    return makeCue(
      'setup.paused',
      'setup_guidance',
      FEEDBACK_MESSAGES.PAUSED,
      timestampMs,
      phase.phase,
      phase.confidence,
    );
  }

  if (phase.phase === 'READY' && !repState.currentAttempt) {
    // Between reps — either idle or positive feedback for last rep
    const lastRep = getLastRep(repState);
    if (lastRep?.status === 'completed') {
      return makeCue(
        'positive.good_rep',
        'positive',
        FEEDBACK_MESSAGES.GOOD_REP,
        timestampMs,
        phase.phase,
        lastRep.averageConfidence,
      );
    }
    return makeCue(
      'setup.not_ready',
      'setup_guidance',
      FEEDBACK_MESSAGES.NOT_READY,
      timestampMs,
      phase.phase,
      phase.confidence,
    );
  }

  // --- Priority 3: Form correction (FR-FEEDBACK-002) ---
  // Select the highest-priority detected fault

  const detectedFaults = faults.filter((f) => f.status === 'DETECTED');
  if (detectedFaults.length > 0) {
    // Sort by severity (CRITICAL > IMPORTANT > INFO), then by confidence (higher first)
    const sorted = [...detectedFaults].sort((a, b) => {
      const severityOrder: Record<string, number> = { CRITICAL: 3, IMPORTANT: 2, INFO: 1 };
      const sevDiff = (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0);
      if (sevDiff !== 0) return sevDiff;
      return b.confidence - a.confidence;
    });

    const topFault = sorted[0];
    const message = getFaultMessage(topFault.code);
    return makeCue(
      `form.${topFault.code.toLowerCase()}`,
      'form_correction',
      message,
      timestampMs,
      phase.phase,
      topFault.confidence,
      topFault.code,
    );
  }

  // --- Priority 4: Positive feedback ---
  // During active movement with no detected faults and good tracking

  const activePhases: SquatPhase[] = ['DESCENDING', 'BOTTOM', 'ASCENDING'];
  if (activePhases.includes(phase.phase)) {
    return makeCue(
      'positive.good_form',
      'positive',
      FEEDBACK_MESSAGES.GOOD_FORM,
      timestampMs,
      phase.phase,
      phase.confidence,
    );
  }

  // --- Priority 5: Neutral ---

  return makeCue(
    'neutral.idle',
    'neutral',
    FEEDBACK_MESSAGES.IDLE,
    timestampMs,
    phase.phase,
    0,
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCue(
  key: string,
  category: FeedbackCategory,
  message: string,
  timestampMs: number,
  phase: SquatPhase,
  confidence: number,
  sourceFaultCode?: string,
): FeedbackCue {
  return {
    key,
    category,
    priority: FEEDBACK_PRIORITY[category],
    message,
    timestampMs,
    phase,
    sourceFaultCode,
    confidence,
  };
}

function getFaultMessage(code: string): string {
  switch (code) {
    case 'INSUFFICIENT_DEPTH':
      return FEEDBACK_MESSAGES.INSUFFICIENT_DEPTH;
    case 'EXCESSIVE_FORWARD_LEAN':
      return FEEDBACK_MESSAGES.EXCESSIVE_FORWARD_LEAN;
    default:
      return 'Form correction needed';
  }
}

function getLastRep(
  repState: RepDetectionState,
): { status: 'completed' | 'incomplete'; averageConfidence: number } | null {
  if (repState.completedReps.length > 0) {
    const last = repState.completedReps[repState.completedReps.length - 1];
    return { status: 'completed', averageConfidence: last.averageConfidence };
  }
  if (repState.incompleteReps.length > 0) {
    const last = repState.incompleteReps[repState.incompleteReps.length - 1];
    return { status: 'incomplete', averageConfidence: last.averageConfidence };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Priority comparison utility (FR-FEEDBACK-006)
// ---------------------------------------------------------------------------

/**
 * Compares two feedback cues by priority.
 * Returns true if `candidate` should replace `current`.
 *
 * FR-FEEDBACK-006: Positive feedback shall not suppress a newly detected
 * higher-priority correction. This means a form correction always supersedes
 * positive feedback, even if the positive feedback was issued more recently.
 */
export function shouldSupersede(
  current: FeedbackCue,
  candidate: FeedbackCue,
): boolean {
  // Higher priority always supersedes lower
  if (candidate.priority > current.priority) return true;
  if (candidate.priority < current.priority) return false;

  // Same priority — newer timestamp wins
  return candidate.timestampMs >= current.timestampMs;
}
