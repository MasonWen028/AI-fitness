# M0-C Evidence

## VERIFIED

### Architecture policy

- ADR-012 direction was checked before implementation.
- `apps/mobile/scripts/prebuild.cjs` uses `expo prebuild --platform android --clean`, so generated Android output is ephemeral.
- A repository-owned persistent native source exists under `apps/mobile/modules/pose-camera/` instead of treating `apps/mobile/android/...` as authoritative.
- The existing M0-B reducer remains the JS lifecycle authority; the native pose camera view is mounted only while `preview_active` is active in `apps/mobile/src/camera/CameraPreviewScreen.tsx`.

### Persistent source created

- `apps/mobile/modules/pose-camera/package.json`
- `apps/mobile/modules/pose-camera/expo-module.config.json`
- `apps/mobile/modules/pose-camera/index.ts`
- `apps/mobile/modules/pose-camera/src/PoseCameraView.tsx`
- `apps/mobile/modules/pose-camera/android/build.gradle`
- `apps/mobile/modules/pose-camera/android/src/main/AndroidManifest.xml`
- `apps/mobile/modules/pose-camera/android/src/main/assets/pose_landmarker_lite.task`
- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraModule.kt`
- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraView.kt`
- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/PoseCameraModelDownloader.kt`
- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/PoseCameraRecords.kt`
- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/LandmarkNames.kt`
- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/PoseCameraStatusPayload.kt`
- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/PoseCameraObservationPayload.kt`

### JS / contract work

- `apps/mobile/src/pose/poseContract.ts` includes `sequence`, `landmarksAvailable`, and `landmarkCount` for observations.
- `apps/mobile/src/pose/poseProviderStatus.ts` models bounded scalar runtime health counters.
- `apps/mobile/src/pose/poseEventAdapters.ts` adapts native observation/status payloads into the canonical TS contract.
- `apps/mobile/src/camera/CameraPreviewScreen.tsx` mounts the native pose camera view only during `preview_active` and surfaces compact debug information.

### Prebuild persistence

#### PASS

`pnpm --filter @exercise/mobile build`

Result:
Repository-supported clean Expo prebuild completed successfully and regenerated the Android project.

#### PASS

`node node_modules/.pnpm/expo-modules-autolinking@2.1.15/node_modules/expo-modules-autolinking/bin/expo-modules-autolinking.js search --platform android --project-root e:\projects\Excercise\apps\mobile --json`

Result:
Expo autolinking resolved the local `pose-camera` module from `apps/mobile/modules/pose-camera`.

#### PASS

`node node_modules/.pnpm/expo-modules-autolinking@2.1.15/node_modules/expo-modules-autolinking/bin/expo-modules-autolinking.js resolve --platform android --project-root e:\projects\Excercise\apps\mobile --json`

Result:
Expo autolinking resolved Android project metadata for `pose-camera`, including `expo.modules.exerciseposecamera.ExercisePoseCameraModule`.

#### PASS

`node node_modules/.pnpm/expo-modules-autolinking@2.1.15/node_modules/expo-modules-autolinking/bin/expo-modules-autolinking.js generate-package-list --platform android --project-root e:\projects\Excercise\apps\mobile --target e:\projects\Excercise\apps\mobile\android\app\build\generated\autolinking\src\main\java\com\exercise\mobile\PackageList.kt --namespace com.exercise.mobile`

Result:
Generated `apps/mobile/android/app/build/generated/autolinking/src/main/java/com/exercise/mobile/PackageList.kt` includes `expo.modules.exerciseposecamera.ExercisePoseCameraModule`, proving the persistent local module survives clean prebuild through Expo autolinking.

### Tests and checks that passed

#### PASS

`pnpm install --frozen-lockfile`

Result:
Workspace install succeeded from the final repository state.

#### PASS

`pnpm --filter @exercise/mobile test`

Result:
All mobile Vitest suites passed (`16` tests), including pose event adapter and M0-B reducer coverage.

#### PASS

`pnpm --filter @exercise/mobile lint`

Result:
ESLint passed for the mobile package.

#### PASS

`pnpm --filter @exercise/mobile typecheck`

Result:
Mobile TypeScript typecheck passed.

#### PASS

`pnpm exec tsc -p tsconfig.base.json --noEmit`

Result:
Root TypeScript verification passed.

## NOT VERIFIED

### Android native compilation

- Android native compilation is `NOT VERIFIED`.
- `java` is unavailable on `PATH` and `JAVA_HOME` is unset in the current environment, so actual Kotlin/Gradle compilation could not be executed.

### Physical device runtime

- No physical-device run was performed.
- No real camera → CameraX ImageAnalysis → MediaPipe → canonical PoseObservation evidence was captured.

### Native runtime correctness

- The persistent native view/module Kotlin files were authored and autolink persistence is proven, but real runtime execution is not verified because Android native compilation and device execution were not performed.
- Frame rotation correctness, CameraX resource cleanup, stale-session rejection, and live landmark emission remain `NOT VERIFIED` on device.

## NOT APPLICABLE

- exercise recognition
- rep counting
- form scoring
- coaching
- workout/session logic
- backend, database, auth, networking, analytics, telemetry
- image/video upload or storage
- M0-D canonical provider fixture/replay work beyond the M0-C observation seam

## Findings

| Severity | Finding | Status |
| --- | --- | --- |
| BLOCKER | Android native compilation remains unverified because Java/JAVA_HOME is unavailable in the current environment. | Open |
| BLOCKER | No physical-device evidence exists for real camera frame ingestion and canonical pose observation emission. | Open |
| HIGH | The persistent Expo module is autolinked and generated correctly, but there is still no verified Android compile or device proof that the CameraX + MediaPipe path runs successfully. | Open |
| MEDIUM | `pnpm --filter @exercise/mobile format` currently fails due to formatting issues across existing and changed mobile files. | Open |
| LOW | Earlier persistence review looked in the wrong generated location; the correct proof lives under build-generated autolinking outputs, not app source. | Recorded |

## Scope verification

Verified:

- work remains within M0-C boundary intent
- no exercise engine / workout / backend / AI feature expansion was added
- JS lifecycle authority still lives in the M0-B reducer path
- persistent source is repository-owned rather than generated Android source

Not verified:

- end-to-end native frame ingestion execution from the persistent Expo module
- actual Android compilation of the new local module
- device-produced canonical pose observations
