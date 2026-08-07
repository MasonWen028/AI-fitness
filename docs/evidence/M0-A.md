# M0-A Evidence

## Implementation

M0-A contains only the approved technical-shell scope:

- minimal pnpm workspace bootstrap
- Expo development-build mobile shell under `apps/mobile`
- TypeScript base configuration
- minimal lint/test/format/build scripts
- a tiny shell module with one minimal unit test
- no camera, pose, MediaPipe, exercise engine, backend, database, auth, networking, website, AI, or future M0-B+ implementation

## Verification

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | PASS | Lockfile is consistent and install completes from the repository root. |
| `pnpm --filter @exercise/mobile test` | PASS | Vitest runs deterministically and the single unit test passes. |
| `pnpm --filter @exercise/mobile lint` | PASS | ESLint executes successfully for the current shell scope. |
| `pnpm --filter @exercise/mobile typecheck` | PASS | Mobile TypeScript configuration passes `tsc --noEmit`. |
| `pnpm exec tsc -p tsconfig.base.json --noEmit` | PASS | Root TypeScript base configuration validates successfully. |
| `pnpm --filter @exercise/mobile format` | PASS | Prettier check passes for the current repository files. |
| `pnpm --filter @exercise/mobile build` | PASS | Uses the supported `CI=1` prebuild path and successfully runs Android prebuild. |
| `pnpm --filter @exercise/mobile start -- --help` | PASS | Confirms the Expo dev-client start command is wired correctly. |
| `pnpm --filter @exercise/mobile start -- --offline` | PASS | Metro starts successfully in offline dev-client mode; process was then stopped manually after verification. |

## Native Generation

### Observed state

- Android native output **was generated** by Expo prebuild at `apps/mobile/android`.
- iOS native output was **NOT VERIFIED** in this pass because the approved M0-A verification path is Android-only.

### Handling policy

- `apps/mobile/android` and `apps/mobile/ios` are currently treated as generated/ephemeral M0 artefacts.
- They are ignored by the repository `.gitignore` and are **not** treated as authoritative source in M0-A.
- This is consistent with the current ADR-012 direction of Expo Development Build / Prebuild experimentation, while preserving the ability to fall back later if required by evidence.

## Unit Test Assessment

- `apps/mobile/src/shell/m0Shell.test.ts` provides **minimal** coverage of the current shell helper behavior.
- This is acceptable because M0-A contains very little behavioral logic.
- M0-A is primarily validated through static/build/toolchain verification rather than broad unit testing.
- Higher-value deterministic unit testing begins when future M0 packages introduce real pose/runtime/domain behavior.

## Scope Verification

VERIFIED:

- no camera pipeline implementation
- no pose estimation
- no MediaPipe integration
- no Exercise Engine logic
- no workout domain
- no backend
- no PostgreSQL
- no authentication
- no networking
- no website
- no AI Coach
- no M1/M2 infrastructure

## Known Limitations

- Android native output is generated only as a prebuild verification artefact and is currently ignored locally.
- iOS native generation was not exercised in this M0-A verification pass.
- The current unit test covers only the small shell helper behavior and not UI rendering semantics.

## Open Items for M0-B

- camera permission and preview integration
- native pose-provider integration
- `PoseObservation` transport path
- skeleton overlay pipeline
- benchmark and privacy evidence beyond shell scope

## Review Remediation

| Accepted finding | Resolution |
| --- | --- |
| Evidence file contained stale verification statements | Replaced stale statements with command-by-command verified results. |
| Generated native directory handling was implicit | Documented that `apps/mobile/android` and `apps/mobile/ios` are treated as generated/ephemeral and ignored in the current Expo prebuild direction. |
| Unsupported Expo CLI flag in build script | Replaced direct unsupported flag usage with a small supported `CI=1` Node wrapper script. |
| `excercise` identifiers appeared accidental | No authoritative document defined `Excercise` as intentional, so M0-A identifiers were corrected to `exercise`. |
| Unused `@types/react-test-renderer` dependency | Removed it and updated the lockfile. |
