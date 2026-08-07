# M0 Work Breakdown

## Work Packages

### M0-A — Technical Shell

Purpose: establish the React Native shell and native integration path.

### M0-B — Camera Pipeline

Purpose: handle permissioned preview, lifecycle, and backpressure.

### M0-C — Pose Provider

Purpose: integrate the leading native pose provider candidate.

### M0-D — PoseObservation

Purpose: stabilize the canonical observation contract and provider mapping.

### M0-E — Skeleton Overlay

Purpose: render bounded visual feedback from the observation stream.

### M0-F — Normalization

Purpose: canonicalize coordinates and quality diagnostics.

### M0-G — Squat Metrics

Purpose: compute the metric set required by the Squat profile candidate.

### M0-H — Squat Phase FSM

Purpose: implement deterministic phase transitions and tracking-loss behavior.

### M0-I — Rep Detection

Purpose: track completed and incomplete squat attempts.

### M0-J — Candidate Fault 1

Purpose: implement the first deterministic squat fault.

### M0-K — Candidate Fault 2

Purpose: implement the second deterministic squat fault.

### M0-L — Feedback Selector

Purpose: select one primary live cue and setup/tracking guidance.

### M0-M — Fixture Format

Purpose: define the replayable Squat fixture structure.

### M0-N — Replay Simulator

Purpose: replay fixtures and step through the runtime deterministically.

### M0-O — Benchmark Harness

Purpose: measure runtime candidates using identical fixtures and devices.

### M0-P — Privacy Verification

Purpose: prove raw frames remain local and transient by default.

### M0-Q — M0 Gate Report

Purpose: assemble evidence for `M0-GATE-001`.

## Package Rules

- packages are intentionally sequential where runtime state depends on the prior package
- packages do not introduce product features beyond M0
- packages are sized to support a clean evidence trail for the M0 gate

## Notes

This breakdown intentionally mirrors the architecture and gate criteria rather than inventing new work.
