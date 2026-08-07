# M0 Test Strategy

## Strategy

Use deterministic tests first, then fixture replay, then simulator, then device benchmarking.

## Per-package test coverage

### M0-A
- unit: shell and native module wiring
- manual: app boots in target development workflow

### M0-B
- unit: lifecycle and state reducer behavior
- fixture: permission/restriction states
- manual: camera permission and preview flow

### M0-C
- unit: provider initialization wrappers
- fixture: provider load failure and health metadata
- manual: on-device pose capture

### M0-D
- unit: canonical mapping helpers
- fixture: metadata and landmark mapping conformance
- replay: canonical observation shape stability

### M0-E
- unit: overlay update cadence logic
- simulator: overlay visibility and drop tolerance
- manual: overlay can be toggled independently

### M0-F
- unit: normalization math
- fixture: mirror/rotation/scale/translation edge cases
- replay: same input, same normalized output

### M0-G
- unit: metric calculations
- fixture: degenerate geometry and velocity cases
- replay: metrics stable across runs

### M0-H
- unit: phase transition logic
- fixture: jitter, tracking loss, and invalid transition cases
- replay: deterministic phase timeline

### M0-I
- unit: rep lifecycle reducer
- fixture: complete vs incomplete attempts
- replay: exactly one completed rep for canonical squat sequence

### M0-J / M0-K
- unit: rule evaluation conditions
- fixture: positive, negative, boundary, low-confidence, noise
- replay: fault emergence matches approved evidence only

### M0-L
- unit: feedback prioritization and cooldown
- fixture: simultaneous cue conflict resolution
- simulator: one-primary-cue behavior

### M0-M
- unit: fixture schema validation
- replay: schema version compatibility

### M0-N
- simulator: step-through, speed-up, and repeatability
- replay: same fixture set produces same outputs

### M0-O
- benchmark: candidate runtime comparison
- manual: thermal/overlay sanity review on device

### M0-P
- manual + instrumented: no raw video upload, no hidden network transmission
- lifecycle: permission / failure / fallback behavior

### M0-Q
- review: all evidence linked and complete
- checklist: gate pass/conditional/fail criteria are satisfied

## Test Layers

- **Unit tests:** geometry, reducer, validator, and state-machine logic
- **Fixture tests:** canonical squat sequences and edge cases
- **Replay tests:** repeatable semantic comparison across candidate runtimes
- **Simulator tests:** user-visible timeline and overlay behavior without live movement
- **Benchmark tests:** device performance, thermals, memory, battery, background behavior
- **Manual verification:** permission flow, camera preview, and privacy behavior

## Test Rule

No package is considered complete from live movement alone. Fixture and replay evidence are required for M0 gate readiness.
