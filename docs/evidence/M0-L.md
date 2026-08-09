# M0-L Evidence — Feedback Selector

## VERIFIED

### Work Package
M0-L — Feedback Selector: select one primary corrective cue and setup/tracking guidance.

### SRS Requirements
- FR-FEEDBACK-001: Live feedback generated locally from deterministic events, no network/LLM
- FR-FEEDBACK-002: No more than one primary corrective text cue at a time
- FR-FEEDBACK-006: Positive feedback shall not suppress a newly detected higher-priority correction
- FR-FEEDBACK-007: If tracking quality is inadequate, issue setup/tracking guidance instead of form judgement

### Implementation

#### Files
- `apps/mobile/src/analysis/feedback.ts` (implementation)
- `apps/mobile/src/analysis/feedback.test.ts` (tests)

### Feedback priority system

| Priority | Category | Description |
|----------|----------|-------------|
| 100 | tracking_guidance | Tracking quality inadequate — supersedes all form cues |
| 90 | setup_guidance | Person detected but not in valid starting position |
| 50 | form_correction | Primary corrective cue from detected fault |
| 10 | positive | Encouragement / no faults detected |
| 0 | neutral | No active feedback (idle, between reps) |

### Selection logic

1. **Tracking guidance (FR-FEEDBACK-007):**
   - Phase = TRACKING_LOST → "Tracking lost — return to starting position"
   - Person not detected → "No person detected — step into camera view"
   - Quality below form feedback threshold → "Tracking quality low — adjust lighting or position"

2. **Setup guidance:**
   - Phase = PAUSED → "Hold still — recovering tracking..."
   - READY with no current attempt → "Stand upright in frame to begin"

3. **Form correction (FR-FEEDBACK-002):**
   - Selects highest-severity detected fault (CRITICAL > IMPORTANT > INFO)
   - Ties broken by higher confidence
   - Only one form correction at a time

4. **Positive feedback:**
   - During active movement with no faults → "Form looks good — keep going"
   - After completed rep → "Good rep!"

5. **Neutral:**
   - Fallback for edge cases

### shouldSupersede utility (FR-FEEDBACK-006)
- Higher priority always supersedes lower (form correction > positive)
- Same priority: newer timestamp wins
- Ensures positive feedback never suppresses a newly detected correction

### FeedbackCue type
```typescript
type FeedbackCue = {
  key: string;                    // stable localisation key
  category: FeedbackCategory;     // priority category
  priority: number;               // derived from category
  message: string;                // M0 English placeholder
  timestampMs: number;            // when generated
  phase: SquatPhase;              // current phase
  sourceFaultCode?: string;       // fault code if form correction
  confidence: number;             // evidence confidence
};
```

### Automated verification

#### PASS
`pnpm --filter @exercise/mobile test`

Result: 11 test files, 208 tests total (24 new for M0-L).

Test coverage:
- Tracking guidance: TRACKING_LOST, no person, low visibility, supersedes faults, custom config
- Setup guidance: PAUSED, READY idle, READY after completed rep, READY after incomplete rep
- Form correction: INSUFFICIENT_DEPTH, EXCESSIVE_FORWARD_LEAN, severity sorting, confidence sorting, ignores NOT_OBSERVABLE, only one at a time
- Positive feedback: good_form during active movement, good_rep after completed rep
- shouldSupersede: form > positive, positive does not supersede form, tracking > form, same priority newer wins
- Cue structure: all required fields present, priority ordering correct

#### PASS
`pnpm --filter @exercise/mobile typecheck` — No type errors.

#### PASS
`pnpm --filter @exercise/mobile lint` — No lint errors.

### Acceptance Criteria
- [x] Only one primary corrective cue is shown at a time
- [x] Tracking/setup guidance supersedes form cues when evidence is weak

## NOT VERIFIED
- Per-code cooldown (FR-FEEDBACK-003 — values are `TBD-PROFILE-001` until approved)
- Audio feedback (FR-FEEDBACK-005 — deferred to M2)
- Localised text (M0 uses English placeholders)
- UI rendering of feedback cues

## Findings

| Severity | Finding | Status |
|----------|---------|--------|
| LOW | Feedback messages are English placeholders. Production requires localised text (FR-FEEDBACK-004). | Recorded |
| LOW | Cooldown not implemented in M0 (FR-FEEDBACK-003 — values TBD). | Recorded |
| LOW | No audio/haptic feedback in M0 (deferred to M2 per SRS). | Recorded |
