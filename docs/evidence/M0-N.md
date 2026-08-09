# M0-N Evidence

## VERIFIED

### Deterministic replay simulator

- `apps/mobile/src/replay/replaySimulator.ts` replays versioned M0-M fixtures deterministically.
- `apps/mobile/src/replay/replaySimulator.test.ts` verifies the simulator step/play/accelerate/reset behavior without touching frozen pose/provider files or WorkBuddy-owned analysis code.

### Replay controls

#### PASS

`apps/mobile/src/replay/replaySimulator.ts`

Implemented controls:

- `step()` — emits exactly one observation at the current cursor
- `play()` — emits all remaining observations sequentially
- `accelerate(stepSize)` — skips frames deterministically using a positive stride
- `reset()` — restores the initial replay state
- `getSnapshot()` — exposes current mode, cursor, emitted count, current observation, and next observation

### Determinism guarantees

#### PASS

Deterministic behavior is enforced by design:

- the simulator never mutates the underlying fixture observations
- replay order is fixture order only
- repeated identical command sequences over the same fixture produce identical emitted observations
- accelerated replay uses a stable stride-based cursor advance rule

### Automated verification

#### PASS

`pnpm --filter @exercise/mobile test`

Result:
All Phase 2 mobile Vitest suites passed in the isolated worktree. Total passing tests at the end of Phase 2 validation: `161`.

Relevant new coverage:

- `apps/mobile/src/replay/replaySimulator.test.ts`

Covered cases:

- deterministic step-by-step emission
- sequential play of remaining observations
- accelerated replay with stride skipping
- reset back to initial state
- invalid accelerate step-size rejection
- identical replay outputs across simulator instances with the same fixture

#### PASS

`pnpm --filter @exercise/mobile lint`

Result:
Lint passed in the Phase 2 worktree after M0-N implementation.

#### PASS

`pnpm --filter @exercise/mobile typecheck`

Result:
TypeScript typecheck passed in the Phase 2 worktree after M0-N implementation.

## NOT VERIFIED

### Real-time timer scheduling

- The current simulator is deterministic command-driven replay, not wall-clock timer-based playback.
- That is acceptable for M0 replay semantics, but not yet a full real-time media scheduler.

## Findings

| Severity | Finding | Status |
| --- | --- | --- |
| LOW | `play()` is intentionally implemented as sequential deterministic draining rather than time-delayed playback, which keeps the simulator stable for test and benchmark use. | Recorded |
| LOW | `accelerate(stepSize)` treats acceleration as a stride/skipping policy, not time compression; this matches the current M0 replay acceptance criteria. | Recorded |

## Scope verification

Verified:

- fixtures replay deterministically
- simulator can step through, play, and accelerate replay
- work stays inside the allowed Phase 2 replay boundary

Not verified:

- wall-clock scheduled playback for UX-facing replay
- multi-consumer replay synchronization beyond current M0 scope
