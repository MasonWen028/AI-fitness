# M0 Benchmark Plan

## Goal

Compare viable `ADR-016` runtime candidates using the same Squat fixtures and the same representative devices.

## Measures

- Camera FPS
- Pose FPS
- End-to-end latency
- Overlay smoothness
- JS thread load
- Memory
- Thermals
- Tracking recovery
- Battery
- Background behavior

## Candidate Comparison Rule

Every viable candidate must be exercised with identical semantic expectations and identical fixture sequences.

## Evidence Recording

Use `<VALIDATION_REQUIRED>` for any value that is not yet backed by approved evidence.

## Planned Evidence Artefact

`docs/architecture/evidence/m0/runtime-benchmark.md`

## Benchmark Outputs

- candidate name and runtime path
- device tier / platform
- fixture set used
- p50 / p95 latency
- frame drops and queue depth
- overlay observations
- JS responsiveness observations
- thermal trend
- battery trend
- qualitative go / conditional / no-go conclusion for the standard bridge option

## Exclusions

- invented target numbers
- hidden fallback numbers
- any benchmark unrelated to `M0` Squat
