# M0-M Evidence

## VERIFIED

### Versioned fixture format

- `apps/mobile/src/fixtures/types.ts` defines a versioned replayable fixture shape around the frozen `PoseObservation` contract.
- `apps/mobile/src/fixtures/format.ts` provides creation, validation, serialization, and deserialization for JSON-safe deterministic fixtures.
- `apps/mobile/src/fixtures/format.test.ts` verifies versioning, round-trip determinism, cloning, validation, and monotonic ordering constraints.

### Fixture structure

#### PASS

`apps/mobile/src/fixtures/types.ts`

The fixture format includes:

- `version` — fixed format version (`m0-fixture-v1`)
- `exercise` — exercise type (`bodyweight-squat`)
- `metadata` — recorded timestamp, source, notes/tags, and deterministic `frameIntervalMs`
- `observations` — ordered `PoseObservation[]`

This keeps fixtures JSON-serializable, replayable, and stable for deterministic simulation.

### Serialization and validation

#### PASS

`apps/mobile/src/fixtures/format.ts`

Implemented behavior:

- `createFixture()` deep-clones observations and metadata to avoid mutation leaks
- `serializeFixture()` produces stable JSON from a normalized fixture object
- `deserializeFixture()` validates parsed JSON before recreating the fixture
- `validateFixture()` enforces:
  - exact fixture version
  - supported exercise type
  - required metadata fields
  - positive `frameIntervalMs`
  - valid tags array when present
  - valid frozen `PoseObservation` payloads via `assertValidPoseObservation()`
  - monotonic sequences and timestamps

### Automated verification

#### PASS

`pnpm --filter @exercise/mobile test`

Result:
All Phase 2 mobile Vitest suites passed in the isolated worktree. Total passing tests at the end of Phase 2 validation: `161`.

Relevant new coverage:

- `apps/mobile/src/fixtures/format.test.ts`

Covered cases:

- versioned fixture creation
- deterministic serialize/deserialize round trips
- deep clone protection against mutation leaks
- invalid metadata / invalid observation rejection
- monotonic timestamp / sequence enforcement
- invalid deserialization error path

#### PASS

`pnpm --filter @exercise/mobile lint`

Result:
Lint passed in the Phase 2 worktree after M0-M implementation.

#### PASS

`pnpm --filter @exercise/mobile typecheck`

Result:
TypeScript typecheck passed in the Phase 2 worktree after M0-M implementation.

## NOT VERIFIED

### On-device fixture capture workflow

- M0-M does not yet include a device-side fixture recording/export path.
- The current work defines the replayable format only.

## Findings

| Severity | Finding | Status |
| --- | --- | --- |
| LOW | The current fixture format is intentionally narrow (`bodyweight-squat` only) to match M0 scope and avoid premature generalization. | Recorded |
| LOW | Determinism relies on preserving ordered observations and fixed metadata frame intervals, so future fixture generators should not reorder observations implicitly. | Recorded |

## Scope verification

Verified:

- fixtures are versioned and replayable
- repeated serialize/deserialize cycles are deterministic for the same input
- work stays inside the allowed Phase 2 fixtures boundary

Not verified:

- device-side fixture capture/export
- future multi-exercise fixture generalization beyond M0 scope
