# Privacy Verification Report

## Source

- Detailed evidence: `docs/evidence/M0-P.md`
- Audited module: `apps/mobile/modules/pose-camera/` (repository-owned native module)

## Verification Scope

M0-P audits the repository-owned native pose-provider path for the following privacy invariants:

1. Raw video does not leave the device by default
2. No hidden network transmission occurs in the default path
3. Structured results only are uploadable

## Audit Results

### Raw-frame backpressure is transient

- **PASS** — `ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST` drops stale frames instead of queueing
- Every analyzed frame path closes `ImageProxy` explicitly, preventing retained camera buffers

### Frame processing remains in memory

- **PASS** — Frame pixels are copied into in-memory `Bitmap`, processed through MediaPipe `detectAsync()`, and never written to disk, cache, or content resolver

### Output is landmarks and scalars, not images

- **PASS** — Emitted events (`onPoseObservation`, `onProviderStatus`) contain only sequence metadata, image dimensions, rotation, provider metadata, and numeric landmark coordinates. No image bytes, bitmaps, or encoded image transport.

### No raw-frame disk persistence

- **PASS** — No code in `ExercisePoseCameraView.kt` or `PoseCameraModelDownloader.kt` writes frame data to files, app storage, media store, or caches

### No raw-frame network transmission

- **PASS** — The native module contains no HTTP client, socket, WebSocket, Retrofit, OkHttp, fetch bridge, or upload code. Module Gradle declares CameraX, AppCompat, React Android, and MediaPipe Tasks Vision only.

### Android permission posture

- **PASS WITH LIMITATION** — Module manifest requests `android.permission.CAMERA` only. No `INTERNET` or `ACCESS_NETWORK_STATE` in the module manifest. The overall application may still gain network capability from host app dependencies outside the M0-P audit surface.

## Limitations

1. **Scoped to repository-owned module**: M0-P verifies the pose-provider path is local/transient by default, not that every part of the entire app is globally network-impossible.
2. **No runtime heap forensics**: Evidence is from code structure (backpressure, in-memory processing, no persistence/transmission logic), not heap inspection.

## Assessment

Privacy verification **passes** for the M0 scope. The pose-provider path is local and transient by default. Raw frames do not leave the device, are not persisted, and are not transmitted over the network.

## References

- SRS: FR-PRIV-001 through FR-PRIV-004
- Evidence: `docs/evidence/M0-P.md`
- Audited code: `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/`
