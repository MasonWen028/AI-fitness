# M0-P Evidence

## VERIFIED

### Scope and dependency policy

- M0-P depends only on the camera / pose-provider path that already exists after `M0-B` and `M0-C`.
- The audit stayed within the allowed M0-P boundary and did not modify `apps/mobile/src/pose/poseContract.ts`, `apps/mobile/src/pose/poseProvider*.ts`, `apps/mobile/src/pose/poseEventAdapters.ts`, `apps/mobile/modules/pose-camera/**`, or any `src/analysis/**` files.
- The verification target is the repository-owned native module under `apps/mobile/modules/pose-camera/`, not generated Android output.

### Raw-frame backpressure is transient by default

#### PASS

`apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraView.kt`

Findings:

- `ImageAnalysis` is configured with `ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST`, which means stale frames are dropped instead of queued or persisted.
- The analyzer also drops frames when the view is inactive or when an inference is already in flight.
- Every analyzed frame path closes `ImageProxy` explicitly, preventing retained camera buffers from accumulating.

Relevant code:

- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraView.kt:257`
- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraView.kt:278`
- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraView.kt:284`
- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraView.kt:312`

Result:
Raw camera frames are handled as transient analyzer inputs with latest-frame backpressure and explicit buffer release.

### Frame processing remains in memory

#### PASS

`apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraView.kt`

Findings:

- The analyzer copies pixel data from the current `ImageProxy` buffer into an in-memory `Bitmap`.
- The optional rotation / mirroring step creates another in-memory `Bitmap` only.
- MediaPipe receives an in-memory `MPImage` through `poseLandmarker?.detectAsync(...)`.
- There is no file write, cache write, content-resolver write, or export of frame bitmaps in the audited module.

Relevant code:

- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraView.kt:298`
- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraView.kt:300`
- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraView.kt:305`

Result:
Frame pixels stay in memory only during the active analyzer / inference path.

### Output is landmarks and scalar status, not images

#### PASS

`apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraView.kt`

Findings:

- The native module emits `onPoseObservation` payloads composed of sequence metadata, image size, rotation, provider metadata, and numeric landmark coordinates.
- The native module emits `onProviderStatus` payloads composed of scalar health counters and bounded runtime metadata.
- No emitted event payload includes image bytes, frame bitmaps, file paths to captured frames, or encoded image transport.

Relevant code:

- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraView.kt:343`
- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraView.kt:421`
- `apps/mobile/src/pose/poseContract.ts:47`

Result:
MediaPipe output is reduced to landmarks and provider/status scalars before crossing the native-to-JS boundary.

### No raw-frame disk persistence in the audited path

#### PASS

Audited files:

- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraView.kt`
- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/PoseCameraModelDownloader.kt`

Findings:

- `ExercisePoseCameraView.kt` contains no code that writes frame data to local files, app storage, media store, or caches.
- `PoseCameraModelDownloader.kt` only opens the bundled model asset and closes it immediately to verify its presence; it does not write the model or any frame data to disk.

Relevant code:

- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/PoseCameraModelDownloader.kt:8`

Result:
No raw camera frame persistence to disk was found in the repository-owned M0-C native provider path.

### No raw-frame network transmission in the audited path

#### PASS

Audited files:

- `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraView.kt`
- `apps/mobile/modules/pose-camera/android/build.gradle`
- `apps/mobile/modules/pose-camera/android/src/main/AndroidManifest.xml`

Findings:

- The native pose module contains no HTTP client, socket, WebSocket, Retrofit, OkHttp, fetch bridge, or upload code.
- The module Gradle file declares CameraX, AppCompat, React Android, and MediaPipe Tasks Vision only.
- The module manifest requests `android.permission.CAMERA` only.

Relevant code:

- `apps/mobile/modules/pose-camera/android/build.gradle:12`
- `apps/mobile/modules/pose-camera/android/src/main/AndroidManifest.xml:2`

Result:
The repository-owned native pose module does not itself implement network transmission of raw frames.

### Android permission posture

#### PASS WITH LIMITATION

`apps/mobile/modules/pose-camera/android/src/main/AndroidManifest.xml`

Findings:

- The local module manifest declares only `android.permission.CAMERA`.
- No `android.permission.INTERNET` or `android.permission.ACCESS_NETWORK_STATE` declaration exists in the module manifest audited for M0-P.

Relevant code:

- `apps/mobile/modules/pose-camera/android/src/main/AndroidManifest.xml:2`

Limitation:

- This verification is specific to the repository-owned local module manifest and audited module code paths.
- The overall application may still gain network capability from the host app manifest or other dependencies outside the M0-P audit surface.
- M0-P therefore verifies that the pose-provider path is local/transient by default, not that every part of the entire app is globally network-impossible.

## NOT VERIFIED

### Whole-app network impossibility

- M0-P does not prove that the entire application binary lacks all network capability in every merged dependency.
- It proves that the audited repository-owned pose-provider path neither requests network permission in its module manifest nor implements frame transmission in its own code.

### Runtime memory forensics

- M0-P does not include heap inspection or native memory forensics to prove exact object lifetimes beyond the code path and buffer-release behavior.
- The evidence instead verifies the intended privacy posture from code structure: latest-frame backpressure, in-memory processing, and no frame persistence or transmission logic.

## NOT APPLICABLE

- exercise analysis correctness
- rep counting
- form scoring
- UI overlay behavior
- replay / benchmark correctness
- backend, auth, sync, analytics, telemetry
- MediaPipe model accuracy

## Findings

| Severity | Finding | Status |
| --- | --- | --- |
| LOW | The audited local module manifest requests only camera permission and does not itself request network permissions. | Recorded |
| LOW | Privacy verification is scoped to the repository-owned pose-provider path; it does not by itself prove that unrelated app layers or future dependencies cannot add network behavior elsewhere. | Recorded |

## Scope verification

Verified:

- latest-frame backpressure is configured in the native analyzer path
- raw frame buffers are dropped/closed rather than stored
- frame processing remains in memory only
- emitted outputs are landmarks and scalar provider metadata, not images
- no raw-frame disk persistence exists in the audited repository-owned native module path
- no raw-frame network transmission exists in the audited repository-owned native module path
- local module manifest requests camera permission only

Not verified:

- whole-app absence of all network capability outside the audited M0-P surface
- runtime heap-forensics proof of exact memory lifetime beyond code inspection
