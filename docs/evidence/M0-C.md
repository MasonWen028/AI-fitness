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
- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/PoseCameraConstants.kt`
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

### Prebuild persistence and autolinking

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
Generated package list includes `expo.modules.exerciseposecamera.ExercisePoseCameraModule`, proving the persistent local module survives clean prebuild through Expo autolinking.

### Automated verification

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

### Android toolchain detection

#### PASS

Detected runtime/toolchain paths:

- `java.exe`: `C:\Program Files\Java\jdk-18.0.2.1\bin\java.exe`
- `JAVA_HOME` used for verification: `C:\Program Files\Java\jdk-18.0.2.1`
- active Android SDK used for retry: `C:\Users\Administrator\AppData\Local\Android\Sdk`
- project-local SDK pointer: `apps/mobile/android/local.properties`

### Android Kotlin compilation

#### PASS

`apps/mobile/android/gradlew.bat :app:compileDebugKotlin`

Result:
Native Kotlin compilation completed successfully after fixing persistent `pose-camera` module errors and using the reinstalled Android SDK.

## NOT VERIFIED

### Clean prebuild command stability

- `pnpm --filter @exercise/mobile build` has been observed both passing and failing in this environment.
- The remaining failure mode is intermittent:
  - `EBUSY: resource busy or locked, rmdir 'E:\projects\Excercise\apps\mobile\android'`
- This is an environment/tooling lock issue, not proof that the persistent module is lost, but it means the clean prebuild command is not yet stable enough to treat as fully verified in the current machine state.

### Format gate from the final repository state

- `pnpm --filter @exercise/mobile format` passed before Android build regeneration, but fails again after native build because Prettier scans generated files under `apps/mobile/android` and `apps/mobile/modules/pose-camera/android/build`.
- The current failure is caused by generated artifacts, not by the authored M0-C source files themselves.

### Stage 1 Huawei CameraX preview-only isolation

#### VERIFIED

Physical-device evidence on Huawei / HarmonyOS now confirms a continuous Stage 1 preview-only session under the same `pid=30109`, `viewInstanceId=1`, `session=1`, and `generation=1` reached:

- `view_attached`
- `start_session`
- `camera_provider_obtained`
- `bind_to_lifecycle_success`
- `camera_state_changed state=OPEN`
- `preview_stream_state_changed streamState=STREAMING`

Observed authoritative sequence excerpt:

- `08-09 17:38:00.351` `event=view_attached`
- `08-09 17:38:00.545` `event=start_session`
- `08-09 17:38:00.629` `event=camera_provider_obtained`
- `08-09 17:38:00.665` `event=bind_to_lifecycle_success`
- `08-09 17:38:00.695` `event=camera_state_changed state=OPEN`
- `08-09 17:38:03.582` `event=preview_stream_state_changed ... streamState=STREAMING`

Additional verified Huawei Stage 1 facts:

- `PreviewView.ImplementationMode.COMPATIBLE` is now actually applied and logged as both expected and actual mode.
- `containerAttached=true` and `previewAttached=true` are both true through the successful streaming transition.
- `previewDisplayNull=false` and `displayRotation=0` are present by the successful run.
- `ViewTreeLifecycleOwner` remains null in this Expo native view hierarchy, but fallback `MainActivity` lifecycle ownership is sufficient for Stage 1 preview streaming on this device.
- The previous false negative came from a lifecycle/remount diagnostic gap, not from CameraX being unable to open the Huawei camera.

### Stage 2 Huawei preview + ImageAnalysis isolation

#### VERIFIED

Physical-device evidence on Huawei / HarmonyOS confirms a continuous Stage 2 session under the same `pid=31053`, `viewInstanceId=4`, `session=1`, and `generation=1` reached:

- `view_attached`
- `start_session`
- `camera_provider_obtained`
- `bind_to_lifecycle_success`
- `camera_state_changed state=OPEN`
- `image_analysis_created`
- `analysis_frame_received` for frames `1` through `5`

Observed authoritative sequence excerpt:

- `08-09 17:46:25.280` `event=start_session`
- `08-09 17:46:25.284` `event=camera_provider_obtained`
- `08-09 17:46:25.285` `event=image_analysis_created`
- `08-09 17:46:25.300` `event=bind_to_lifecycle_success`
- `08-09 17:46:25.329` `event=camera_state_changed state=OPEN`
- `08-09 17:46:25.898` `event=analysis_frame_received frameId=1 width=1280 height=960 rotation=90`
- `08-09 17:46:26.099` `event=analysis_frame_received frameId=5 width=1280 height=960 rotation=90`

Important Stage 2 interpretation:

- ImageAnalysis frame delivery works on the Huawei device in the Stage 2 isolation build.
- The run later detached during `ActivityThread.handleDestroyActivity`, so the diagnostic stack trace reflects host activity teardown rather than an analyzer crash.
- Combined with the verified Stage 1 `STREAMING` evidence, M0-C now has physical-device proof that CameraX preview reaches `STREAMING` and ImageAnalysis receives frames on Huawei.

### Stage 3 Huawei full pipeline isolation

#### VERIFIED

Physical-device evidence from the Stage 3 on-screen diagnostic shell confirms the full pipeline ran on Huawei with visible live preview and MediaPipe result production:

- live camera preview was visibly rendering on device
- `Provider: mediapipe · CPU · available`
- `Received: 3`
- `Dropped: 2`
- `Produced: 1`
- `Last sequence: 1`
- `Inference: 83ms`
- `Sequence 1 · Landmarks: unavailable · Count: 0`

This satisfies the M0-C Stage 3 evidence bar for the current technical shell:

- Camera permission granted
- Camera preview visibly active on device
- native provider available
- ImageAnalysis received frames (`Received > 0`)
- MediaPipe produced at least one result (`Produced > 0`, `Last sequence = 1`)

Interpretation:

- Huawei now has physical-device evidence for the full M0-C CameraX → ImageAnalysis → MediaPipe → structured observation path.
- The first observed Stage 3 result had no landmarks (`landmarks unavailable`, `Count 0`), but it is still a valid produced result proving the end-to-end runtime path is operating.

### Physical device runtime

#### VERIFIED

- Huawei Stage 1 preview-only CameraX runtime is physically verified.
- Huawei Stage 2 Preview + ImageAnalysis frame delivery is physically verified.
- Huawei Stage 3 full pipeline preview + ImageAnalysis + MediaPipe result production is physically verified.

### Native runtime correctness on device

- CameraX preview binding and preview streaming are physically verified on Huawei.
- ImageAnalysis frame delivery is physically verified on Huawei.
- MediaPipe inference/runtime execution and structured result production are physically verified on Huawei.

### Health counter integrity on device

The following counters are runtime-wired in native code and emitted:

- `providerLoadAttempts`
- `providerLoadFailures`
- `framesReceived`
- `framesSubmitted`
- `framesDropped`
- `observationsProduced`
- `observationsWithLandmarks`
- `observationsWithoutLandmarks`
- `providerErrors`
- `trackingLossCount`
- `lastSequence`
- `lastFrameId`
- `lastTimestampMs`
- `lastInferenceMs`

These are code-verified and compile-verified, but still not device-verified.

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
| HIGH | Clean prebuild command remains intermittently blocked by `EBUSY` while deleting `apps/mobile/android`, so full environment stability of the clean regeneration path is not yet proven. | Open |
| HIGH | The final format gate currently fails because generated Android/build artifacts are included in the mobile package formatting scope. | Open |
| MEDIUM | Stage 2 and Stage 3 successful runs can still end in `ActivityThread.handleDestroyActivity` teardown, but the collected evidence shows this is host activity lifecycle behavior after the pipeline has already produced valid results rather than a CameraX or MediaPipe startup failure. | Recorded |
| MEDIUM | Huawei Stage 1 required keeping one native `PoseCameraView` mounted continuously; prior conditional rendering let lifecycle/remount behavior masquerade as camera failure. | Recorded |
| MEDIUM | `ViewTreeLifecycleOwner` is null in the Expo native view hierarchy on device, but fallback `MainActivity` ownership is sufficient for Stage 1 preview streaming, Stage 2 frame delivery, and Stage 3 MediaPipe execution. | Recorded |
| LOW | `apps/mobile/android/local.properties` is machine-specific and should remain local-only infrastructure state, not a shared architecture source of truth. | Recorded |

## Scope verification

Verified:

- work remains within M0-C boundary intent
- no exercise engine / workout / backend / AI feature expansion was added
- JS lifecycle authority still lives in the M0-B reducer path
- persistent source is repository-owned rather than generated Android source
- persistent native module autolinks and compiles

Not verified:

- stability of the clean prebuild command under local filesystem lock contention
- final format gate with generated Android/build artifacts still present
