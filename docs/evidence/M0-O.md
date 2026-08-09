# M0-O Evidence

## VERIFIED

### Benchmark harness scope

- `apps/mobile/src/replay/benchmark.ts` benchmarks the frozen runtime semantics by replaying versioned M0-M fixtures through the read-only analysis pipeline.
- The harness does not modify `apps/mobile/src/analysis/**`, `apps/mobile/src/pose/poseContract.ts`, `apps/mobile/src/pose/poseValidation.ts`, or `apps/mobile/modules/pose-camera/**`.
- Replay uses the same `PoseObservation` contract and deterministic simulator path as the rest of Phase 2.

### Replay-driven benchmark harness

#### PASS

`apps/mobile/src/replay/benchmark.ts`

Implemented benchmark flow:

- creates a replay simulator from a versioned fixture
- supports `step`, `play`, and `accelerate` replay modes
- feeds replayed observations into:
  - `normalizeObservation()`
  - `computeSquatMetrics()`
  - `updatePhase()`
  - `processPhaseUpdate()`
- records summary artifacts for:
  - total / normalized / dropped frames
  - total / average / peak processing time
  - overlay candidate frames
  - estimated JS load
  - estimated memory footprint
  - tracking recovery frames
  - completed / incomplete rep counts
  - qualitative thermal and battery classes
  - background behavior placeholder (`not-measured`)

### Benchmark artifact semantics

#### PASS

The benchmark artifact output includes:

- fixture version
- exercise type
- fixture frame interval
- observation count measured
- summarized replay/processing metrics in a single serializable object

This keeps the harness suitable for repeatable benchmark comparisons across future runtime candidates.

### Automated verification

#### PASS

`pnpm --filter @exercise/mobile test`

Result:
All mobile Vitest suites passed in the Phase 2 worktree after adding M0-E, M0-M, and M0-N. Total passing tests at this checkpoint: `161`.

#### PASS

`pnpm --filter @exercise/mobile lint`

Result:
Lint passed in the Phase 2 worktree after Phase 2 implementation.

#### PASS

`pnpm --filter @exercise/mobile typecheck`

Result:
TypeScript typecheck passed in the Phase 2 worktree after Phase 2 implementation.

## NOT VERIFIED

### Real-device runtime candidate comparison

- This harness does not yet include measured device artifacts from multiple runtime candidates.
- No FPS, thermal, battery, or memory samples were collected from physical devices at this stage.

### Background behavior on device

- The benchmark artifact currently records `backgroundBehavior: 'not-measured'` because Phase 2 does not yet include automated device lifecycle benchmarking.

## Findings

| Severity | Finding | Status |
| --- | --- | --- |
| LOW | The benchmark harness currently uses synchronous JS timing around replayed analysis functions, so its latency values are comparative harness estimates rather than native-frame capture timings. | Recorded |
| LOW | Thermal, battery, and background metrics are currently classified or placeholder values until representative device benchmark runs are added. | Recorded |

## Scope verification

Verified:

- benchmark harness reuses the frozen `PoseObservation` contract
- benchmark harness reuses the read-only analysis pipeline without modifying WorkBuddy-owned files
- replay inputs are deterministic through the M0-M fixture and M0-N simulator path
- benchmark output is serializable and suitable for future candidate comparison

Not verified:

- representative device benchmark measurements
- cross-runtime candidate comparison results
- physical FPS / thermal / battery capture artifacts
