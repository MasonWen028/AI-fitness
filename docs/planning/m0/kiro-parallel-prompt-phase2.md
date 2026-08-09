# Kiro Collaboration Prompt — Phase 2 (E/M/N/O)

Paste this entire block to Kiro to start Phase 2 parallel work.

---

## Status Update

M0-D through M0-I and M0-P are now merged to main. The PoseObservation contract is frozen. WorkBuddy is now working on M0-J/K/L (faults + feedback) on branch `feature/m0-jkl-faults-feedback`.

You (Kiro) are assigned the remaining UI, fixtures, replay, and benchmark packages.

---

## Your Assignment (Kiro)

Create branch `feature/m0-emno-overlay-replay` from latest main.

Work through these packages in order:

### 1. M0-E — Skeleton Overlay

**Purpose:** Render bounded visual feedback from the PoseObservation stream.

**Acceptance Criteria:**
- Overlay follows the observation stream
- Overlay can be toggled independently
- Overlay remains bounded under dropped observations

**Files to create/modify:**
- `apps/mobile/src/ui/SkeletonOverlay.tsx` (new) — React component that renders a skeleton from `PoseObservation` landmarks
- `apps/mobile/src/ui/SkeletonOverlay.test.tsx` (new) — component tests
- `apps/mobile/src/camera/CameraPreviewScreen.tsx` (modify) — integrate overlay toggle

**Key context:**
- Read `apps/mobile/src/pose/poseContract.ts` for the `PoseObservation`, `Landmark`, `LandmarkName` types (FROZEN — do not modify)
- Read `apps/mobile/src/pose/poseValidation.ts` for `getLandmarkByName()`, `hasCriticalLandmarks()` helpers
- The overlay should map normalized landmark coordinates (0-1) to screen positions
- MediaPipe 33-landmark skeleton connections: see `LANDMARK_NAMES` in poseContract.ts
- Key skeleton connections for Squat: shoulders→hips→knees→ankles, plus hip-to-hip and shoulder-to-shoulder
- The overlay must handle missing landmarks gracefully (skip connections where either endpoint is missing)
- Toggle state should be managed locally in CameraPreviewScreen

### 2. M0-M — Fixture Format

**Purpose:** Define the replayable Squat fixture structure.

**Acceptance Criteria:**
- Fixtures are versioned and replayable
- Repeated replay is deterministic for the same inputs

**Files to create:**
- `apps/mobile/src/fixtures/types.ts` (new) — fixture type definitions
- `apps/mobile/src/fixtures/format.ts` (new) — serialization/deserialization
- `apps/mobile/src/fixtures/format.test.ts` (new) — tests

**Key context:**
- A fixture is a sequence of `PoseObservation` objects with deterministic timestamps
- Fixture format should include: version, exercise type, metadata, observation array
- Must be JSON-serializable for storage/replay
- Read `apps/mobile/src/pose/poseContract.ts` for `PoseObservation` shape
- Read `apps/mobile/src/pose/poseValidation.ts` for `createSyntheticObservation()` factory

### 3. M0-N — Replay Simulator

**Purpose:** Replay fixtures and step through the runtime deterministically.

**Acceptance Criteria:**
- Fixtures are versioned and replayable
- Repeated replay is deterministic for the same inputs
- Simulator can step through and accelerate replay

**Files to create:**
- `apps/mobile/src/replay/replaySimulator.ts` (new)
- `apps/mobile/src/replay/replaySimulator.test.ts` (new)

**Key context:**
- The simulator takes a fixture and emits observations at controlled timing
- Must support: step (one frame), play (sequential), accelerate (skip frames)
- Deterministic: same fixture + same step commands = identical output
- Depends on M0-M fixture types

### 4. M0-O — Benchmark Harness

**Purpose:** Measure runtime on representative devices.

**Acceptance Criteria:**
- Same fixtures and semantics are used across viable runtime candidates
- Benchmark artifacts capture FPS, latency, overlay, JS load, memory, thermals, tracking recovery, battery, and background behavior

**Files to create:**
- `apps/mobile/src/replay/benchmark.ts` (new)
- `docs/evidence/M0-O.md` (new)

**Key context:**
- Uses replay simulator to feed observations through the analysis pipeline
- Measures: per-frame processing time, FPS, memory usage
- Write evidence file following the pattern in `docs/evidence/M0-D.md`

---

## File Boundary Rules (UPDATED)

| Path | Who can touch | Notes |
|------|---------------|-------|
| `src/pose/poseContract.ts` | FROZEN | Do not modify |
| `src/pose/poseValidation.ts` | FROZEN | Do not modify |
| `src/pose/poseProvider*.ts` | FROZEN | Do not modify |
| `src/pose/poseEventAdapters.ts` | FROZEN | Do not modify |
| `src/analysis/**` | WorkBuddy only | J/K/L fault detection + feedback |
| `src/ui/**` | You (Kiro) | M0-E skeleton overlay |
| `src/fixtures/**` | You (Kiro) | M0-M fixture format |
| `src/replay/**` | You (Kiro) | M0-N replay, M0-O benchmark |
| `src/camera/CameraPreviewScreen.tsx` | You (Kiro) | M0-E overlay integration only |
| `modules/pose-camera/**` | FROZEN | M0-C complete |
| `docs/evidence/M0-E.md` | You (Kiro) | Your evidence |
| `docs/evidence/M0-M.md` | You (Kiro) | Your evidence |
| `docs/evidence/M0-N.md` | You (Kiro) | Your evidence |
| `docs/evidence/M0-O.md` | You (Kiro) | Your evidence |
| `docs/evidence/M0-J.md`, `M0-K.md`, `M0-L.md` | WorkBuddy | Their evidence |

---

## Technical Context

### Available APIs (on main, frozen)

**PoseObservation contract** (`src/pose/poseContract.ts`):
- `PoseObservation` — canonical observation type
- `Landmark` — single landmark with x, y, z, visibility, presence, name
- `LandmarkName` — union type of 33 MediaPipe landmark names
- `LANDMARK_NAMES` — const array of all 33 names in MediaPipe order
- `LANDMARK_INDEX` — name → index lookup map
- `SQUAT_CRITICAL_LANDMARKS` — 8 landmarks critical for squat analysis
- `isLandmarkName()` — type guard

**Validation helpers** (`src/pose/poseValidation.ts`):
- `validatePoseObservation(obs)` — structural validation
- `getLandmarkByName(obs, name, personIndex)` — single landmark lookup
- `getLandmarksByNames(obs, names, personIndex)` — batch lookup
- `hasCriticalLandmarks(obs, required, personIndex, minVisibility)` — squat readiness check
- `createEmptyObservation(overrides)` — factory for empty observations
- `createSyntheticObservation(sequence, landmarks, overrides)` — factory for test fixtures

**Analysis APIs** (read-only for Kiro, used by benchmark):
- `normalizeObservation(obs)` from `src/analysis/normalization.ts`
- `computeSquatMetrics(frame)` from `src/analysis/metrics.ts`
- `updatePhase(prev, metrics)` from `src/analysis/phaseMachine.ts`
- `processPhaseUpdate(prev, phase, metrics)` from `src/analysis/repDetection.ts`

### Testing

- Run `"C:\Users\Administrator\AppData\Local\pnpm\pnpm.CMD" test` before every commit
- Run `"C:\Users\Administrator\AppData\Local\pnpm\pnpm.CMD" lint` before every commit
- Run `"C:\Users\Administrator\AppData\Local\pnpm\pnpm.CMD" typecheck` before every commit
- Follow Vitest patterns established in existing test files
- Evidence files must reference actual test output, not assumed results

### Commit conventions

- `feat(m0-e): description` for feature commits
- `docs(m0-e): description` for evidence/documentation commits
- Use `[BOUNDARY-NOTICE]` prefix if touching a file near the boundary
- The user is the sync point between you and WorkBuddy

---

## Getting Started

1. `git fetch origin && git checkout main && git pull origin main`
2. `git checkout -b feature/m0-emno-overlay-replay`
3. Start with M0-E (Skeleton Overlay) — it's the most self-contained
4. Read the files listed above before writing any code
5. Follow the existing code style (TypeScript, functional, no classes unless needed)
6. Every new module must have Vitest tests
7. Create evidence files following the pattern in `docs/evidence/M0-D.md`
