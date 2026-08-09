# Runtime Benchmark Evidence

## Source

- Detailed evidence: `docs/evidence/M0-O.md`
- Implementation: `apps/mobile/src/replay/benchmark.ts`
- Fixture format: `apps/mobile/src/fixtures/format.ts` (M0-M)
- Replay simulator: `apps/mobile/src/replay/replaySimulator.ts` (M0-N)

## Summary

The benchmark harness replays versioned M0-M fixtures through the read-only analysis pipeline (normalization -> metrics -> phase FSM -> rep detection) and records:

| Metric | Captured | Source |
|--------|----------|--------|
| Total frames | Yes | Replay cursor |
| Normalized frames | Yes | `normalizeObservation()` |
| Dropped frames | Yes | Normalization null returns |
| Processing time (total/avg/peak) | Yes | `performance.now()` around pipeline |
| Overlay candidate frames | Yes | Frames with valid landmarks |
| JS load score | Yes | Derived from processing time / frame interval |
| Memory footprint estimate | Yes | Heuristic from landmark data size |
| Tracking recovery frames | Yes | PAUSED -> active phase transitions |
| Completed rep count | Yes | `processPhaseUpdate()` |
| Incomplete rep count | Yes | `processPhaseUpdate()` |
| Thermal classification | Placeholder | `not-measured` until device runs |
| Battery classification | Placeholder | `not-measured` until device runs |
| Background behavior | Placeholder | `not-measured` until device runs |

## Runtime Candidate

| Field | Value |
|-------|-------|
| Provider | MediaPipe Pose Landmarker |
| Delegate | CPU |
| Platform | Android (Huawei / HarmonyOS) |
| Model | `pose_landmarker_lite.task` |
| Inference (observed) | 83ms (M0-C Stage 3 device evidence) |

## Caveats

1. **No cross-runtime candidate comparison**: Only MediaPipe/CPU/Android has been benchmarked. ADR-016 envisages comparing alternatives, but M0 has validated the leading candidate only.
2. **No real-device FPS/thermal/battery capture**: The harness produces comparative estimates from synchronous JS timing. Thermal, battery, and background metrics are classified as `not-measured`.
3. **Synchronous timing**: Latency values are JS pipeline estimates, not native-frame capture timings.

## Assessment

The benchmark **harness** is complete and functional. The benchmark **evidence** from real-device runs is incomplete. This is acceptable for M0 proof-of-architecture but must be completed before M1.

## References

- SRS: FR-BENCH-001 through FR-BENCH-004
- ADR: ADR-016 (pose observation transport runtime)
- Architecture: `docs/architecture/testing-validation.md`
- Evidence: `docs/evidence/M0-O.md`, `docs/evidence/M0-C.md`
