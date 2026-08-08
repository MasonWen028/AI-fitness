# M0-B Evidence

## VERIFIED

### Implementation

M0-B implements only the approved Camera Pipeline scope:

- contextual camera permission request flow
- explicit setup gate after permission grant
- explicit user action required before camera preview mounts
- preview gating through deterministic lifecycle state
- interruption handling for app backgrounding and camera mount failure
- manual fallback routing when camera access is unavailable or interrupted
- bounded camera state transitions that do not start pose/provider logic

### Files changed

- `apps/mobile/App.tsx`
- `apps/mobile/app.json`
- `apps/mobile/package.json`
- `apps/mobile/src/camera/CameraPreviewScreen.tsx`
- `apps/mobile/src/camera/cameraState.ts`
- `apps/mobile/src/camera/cameraState.test.ts`
- `pnpm-lock.yaml`

### Verification

#### PASS

`pnpm install --frozen-lockfile`

Result:
Frozen-lockfile install succeeds from the final repository state.

#### PASS

`pnpm --filter @exercise/mobile test`

Result:
All shell and camera state reducer tests passed (`10` tests total).

#### PASS

`pnpm --filter @exercise/mobile lint`

Result:
ESLint passed for the mobile package after the final M0-B changes.

#### PASS

`pnpm --filter @exercise/mobile typecheck`

Result:
Mobile TypeScript configuration passed `tsc --noEmit`.

#### PASS

`pnpm exec tsc -p tsconfig.base.json --noEmit`

Result:
Root TypeScript base verification passed.

#### PASS

`pnpm --filter @exercise/mobile format`

Result:
Prettier check passed after formatting the camera pipeline files.

#### PASS

`pnpm --filter @exercise/mobile start -- --help`

Result:
Expo dev-client startup command is wired correctly.

#### PASS

`$env:CI=1; pnpm --filter @exercise/mobile build`

Result:
Supported CI/prebuild verification path passed and regenerated Android native output as an ignored ephemeral artifact.

#### PASS

`pnpm --filter @exercise/mobile start -- --offline`

Result:
Metro startup path succeeds in offline dev-client mode; the process was terminated after startup verification.

## NOT VERIFIED

- first-time OS camera permission prompt on a physical device
- real permission denial behavior on a physical device
- blocked/permanently denied permission path on device where applicable
- actual camera preview rendering on representative Android hardware
- app background/foreground interruption behavior on physical hardware
- actual camera mount failure behavior on representative hardware
- iOS native generation and iOS device camera behavior
- privacy verification beyond local code/config inspection

These checks require physical device or platform-specific execution that was not performed in the current environment.

## NOT APPLICABLE

- pose detection
- MediaPipe or any pose provider integration
- `PoseObservation` transport
- Exercise Engine logic
- rep counting or workout domain behavior
- backend, database, authentication, networking, website, analytics, or AI inference
- M0-C and later work packages
- microphone/audio/video capture behavior

These areas are intentionally outside the approved M0-B scope.

## Scope Verification

Verified:

- no pose detection
- no MediaPipe or native provider implementation
- no exercise analysis logic
- no backend/database/auth/networking/website/AI work
- no microphone-specific runtime functionality
- no scope leakage into M0-C or later packages

## Remediation Review

| Severity | Finding | Resolution | Evidence |
| --- | --- | --- | --- |
| BLOCKER | Evidence file was stale and marked executed commands as `NOT VERIFIED` | Rewrote the evidence file from the final repository state using actual command results only. | This file and the command results listed above |
| HIGH | Formatting gate failed | Formatted the new camera files and reran the repository formatting check successfully. | `pnpm --filter @exercise/mobile format` |
| MEDIUM | Unnecessary microphone permission configuration | Removed microphone permission text from `app.json`; M0-B now requests only camera-related permission config. | `apps/mobile/app.json` |
| MEDIUM | Preview mounted automatically after permission grant | Restored explicit setup gating so permission grant leads to `ready_to_setup` and preview mounts only after an explicit `start_preview` action. | `apps/mobile/src/camera/cameraState.ts`, `apps/mobile/src/camera/cameraState.test.ts`, `apps/mobile/src/camera/CameraPreviewScreen.tsx` |
| LOW | Camera reducer/test coverage did not prove explicit setup gating | Added reducer coverage showing `ready_to_setup` does not imply preview mount and requires explicit preview start. | `apps/mobile/src/camera/cameraState.test.ts` |

## Remaining Risks

- Physical-device camera behavior is still `NOT VERIFIED` and should be exercised before relying on the preview flow beyond current milestone closure.
- Android prebuild continues to regenerate native output as an ignored/ephemeral artifact under the current M0-A/ADR-012 policy.
