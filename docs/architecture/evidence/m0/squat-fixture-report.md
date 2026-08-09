# Squat Fixture Determinism Report

## Source

- Fixture format evidence: `docs/evidence/M0-M.md`
- Replay simulator evidence: `docs/evidence/M0-N.md`
- Fixture implementation: `apps/mobile/src/fixtures/format.ts`, `apps/mobile/src/fixtures/types.ts`
- Replay implementation: `apps/mobile/src/replay/replaySimulator.ts`
- Tests: `apps/mobile/src/fixtures/format.test.ts` (6 tests), `apps/mobile/src/replay/replaySimulator.test.ts` (6 tests)

## Fixture Format

- **Version:** `m0-fixture-v1`
- **Exercise:** `bodyweight-squat` (M0 scope only)
- **Structure:** version, exercise, metadata (timestamp, source, notes, tags, frameIntervalMs), observations (ordered `PoseObservation[]`)
- **Serialization:** JSON-safe, deterministic via `serializeFixture()` / `deserializeFixture()`
- **Validation:** `validateFixture()` enforces version, exercise, metadata, monotonic sequences/timestamps, and `assertValidPoseObservation()` on each observation
- **Clone protection:** `createFixture()` deep-clones observations to prevent mutation leaks

## Determinism Verification

### Round-trip determinism

- `serializeFixture()` -> `deserializeFixture()` -> `serializeFixture()` produces identical output
- Verified in `format.test.ts`

### Replay determinism

- `step()`, `play()`, `accelerate()` produce identical emitted observations across separate simulator instances with the same fixture
- The simulator never mutates underlying fixture observations
- Replay order is fixture order only
- Verified in `replaySimulator.test.ts`

### Phase/rep/rule determinism

- The analysis pipeline (normalization -> metrics -> phase FSM -> rep detection) is deterministic by design
- 227 unit tests verify deterministic behavior across metrics, phase transitions, rep counting, fault detection, and feedback selection
- No randomness, no `Date.now()` in analysis code, no floating-point ambiguity (all degenerate inputs produce finite fallbacks)

## Conformance

| Check | Result |
|-------|--------|
| Fixture version enforced | PASS |
| Exercise type restricted to squat | PASS |
| Monotonic sequence/timestamp | PASS |
| PoseObservation contract validation | PASS |
| Serialize/deserialize round-trip | PASS |
| Deep clone protection | PASS |
| Replay step determinism | PASS |
| Replay play determinism | PASS |
| Replay accelerate determinism | PASS |
| Cross-instance replay identity | PASS |

## Assessment

Fixture and replay determinism is **fully verified**. No conformance mismatches were found.

## References

- SRS: FR-REPLAY-001 through FR-REPLAY-004
- Evidence: `docs/evidence/M0-M.md`, `docs/evidence/M0-N.md`
- Tests: `apps/mobile/src/fixtures/format.test.ts`, `apps/mobile/src/replay/replaySimulator.test.ts`
