# M0 Acceptance Criteria

## M0-A — Technical Shell

- React Native shell runs on target iOS/Android development path
- native module path is available for camera/pose integration
- no product backend/auth is required

## M0-B — Camera Pipeline

- camera permission is contextual
- preview starts and stops correctly with lifecycle
- backpressure prevents unbounded frame queueing
- denial and interruption route to manual fallback

## M0-C — Pose Provider

- native provider candidate executes on device
- provider metadata is captured
- load failure and tracking degradation are handled safely

## M0-D — PoseObservation

- canonical observation contract is stable
- provider output maps to canonical observation shape
- timestamp/orientation/mirror metadata are present

## M0-E — Skeleton Overlay

- overlay follows the observation stream
- overlay can be toggled independently
- overlay remains bounded under dropped observations

## M0-F — Normalization

- orientation, mirror, scale, and translation are normalized deterministically
- missing anchors produce quality diagnostics

## M0-G — Squat Metrics

- required Squat metrics are computed deterministically
- invalid geometry does not propagate NaN

## M0-H — Squat Phase FSM

- state transitions are deterministic and legal
- tracking-loss pauses advancement
- jitter does not create illegal transitions

## M0-I — Rep Detection

- one valid squat sequence produces exactly one completed rep
- incomplete attempts are retained as incomplete and not counted as complete

## M0-J / M0-K — Candidate Faults

- each candidate fault fires only on approved evidence conditions
- low-confidence and noisy inputs fail closed

## M0-L — Feedback Selector

- only one primary corrective cue is shown at a time
- tracking/setup guidance supersedes form cues when evidence is weak

## M0-M / M0-N — Fixtures and Replay

- fixtures are versioned and replayable
- repeated replay is deterministic for the same inputs
- simulator can step through and accelerate replay

## M0-O — Benchmark Harness

- same fixtures and semantics are used across viable runtime candidates
- benchmark artifacts capture FPS, latency, overlay, JS load, memory, thermals, tracking recovery, battery, and background behavior

## M0-P — Privacy Verification

- raw video does not leave the device by default
- no hidden network transmission occurs in the default path
- structured results only are uploadable

## M0-Q — Gate Report

- all evidence artifacts are assembled
- `M0-GATE-001` can be evaluated without guessing missing inputs
- gate decision is documented as pass / conditional pass / fail
