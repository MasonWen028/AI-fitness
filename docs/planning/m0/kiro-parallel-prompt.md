# Kiro Collaboration Prompt — M0 Parallel Development

Paste this entire block to Kiro to establish parallel development rules.

---

## Parallel Development Assignment

You are assigned to work in parallel with another AI assistant (WorkBuddy) on the M0 milestone of this project. M0-C is complete and merged to main. You each work on separate branches.

### Your assignment (Kiro)

**Branch 1 (immediate):** `feature/m0-p-privacy-verification`
- **M0-P Privacy Verification** — prove raw camera frames remain local and transient by default
- Depends only on M0-B (camera pipeline, already merged) — fully independent
- Deliverables: `docs/evidence/M0-P.md` + any verification scripts
- No file overlap with WorkBuddy's work

**Branch 2 (after M0-D merges to main):** `feature/m0-e-overlay` then `feature/m0-mn-replay`
- **M0-E Skeleton Overlay** — render bounded visual feedback from PoseObservation stream
  - Create `src/ui/SkeletonOverlay.tsx`
  - Integrate into `CameraPreviewScreen.tsx`
- **M0-M Fixture Format** — define replayable Squat fixture structure
  - Create `src/fixtures/types.ts`, `src/fixtures/format.ts`
- **M0-N Replay Simulator** — replay fixtures deterministically
  - Create `src/replay/replaySimulator.ts` + tests
- **M0-O Benchmark Harness** — measure runtime on representative devices
  - Create benchmark scripts + `docs/evidence/M0-O.md`

### WorkBuddy's assignment (do not touch these)

**Branch:** `feature/m0-d-analysis-foundation`
- M0-D (PoseObservation stabilization) -> M0-F (Normalization) -> M0-G (Metrics) -> M0-H (Phase FSM) -> M0-I (Reps) -> M0-J/K (Faults) -> M0-L (Feedback)
- All files under `src/analysis/**` are WorkBuddy's exclusive territory
- `src/pose/poseContract.ts` is modified by WorkBuddy during M0-D only, then frozen

### File boundary rules

| Path | Who can touch | Notes |
|------|---------------|-------|
| `src/pose/poseContract.ts` | WorkBuddy (D only), then FROZEN | You read it, never modify it |
| `src/analysis/**` | WorkBuddy only | All new files |
| `src/ui/**` | You (Kiro) | M0-E skeleton overlay |
| `src/fixtures/**` | You (Kiro) | M0-M fixture format |
| `src/replay/**` | You (Kiro) | M0-N replay, M0-O benchmark |
| `src/camera/CameraPreviewScreen.tsx` | You (Kiro) | M0-E overlay integration only |
| `src/pose/poseProvider*.ts` | NO ONE | Stable, frozen |
| `src/pose/poseEventAdapters.ts` | NO ONE | Stable, frozen |
| `modules/pose-camera/**` | NO ONE | M0-C complete, frozen |
| `docs/evidence/M0-P.md` | You (Kiro) | Your evidence file |
| `docs/evidence/M0-E.md`, `M0-M.md`, etc. | You (Kiro) | Your evidence files |
| `docs/evidence/M0-D.md`, `M0-F.md`, etc. | WorkBuddy | Their evidence files |

### Contract freeze rule

After WorkBuddy merges M0-D to main, `poseContract.ts` is frozen for the rest of M0. If you discover the contract needs a change:
1. Do NOT modify the file directly
2. Create a commit with prefix `[CONTRACT-CHANGE]` describing what needs to change and why
3. Ask the user to forward it to WorkBuddy
4. Wait for acknowledgment before proceeding

### Merge order
1. WorkBuddy merges M0-D first (it is your dependency for E and M)
2. You merge M0-P independently (no dependencies)
3. After D is on main, you create new branches for E, M, N, O
4. Final: M0-Q gate report requires evidence from both sides

### Communication
- Commit prefix `[CONTRACT-CHANGE]` = contract file changed, other side must review
- Commit prefix `[BOUNDARY-NOTICE]` = touching a file near the boundary
- Commit prefix `[EVIDENCE]` = adding/updating evidence file
- The user is the sync point between you and WorkBuddy

### Full rules document
See `docs/planning/m0/parallel-development-rules.md` for the complete file boundary matrix and phase breakdown.

---

## Your first task: M0-P Privacy Verification

Start by creating branch `feature/m0-p-privacy-verification` from main.

M0-P requires you to verify that raw camera frames remain local and transient:
1. Review `apps/mobile/modules/pose-camera/android/src/main/java/expo/modules/exerciseposecamera/ExercisePoseCameraView.kt` — confirm CameraX ImageAnalysis uses KEEP_ONLY_LATEST backpressure (frames are dropped, not stored)
2. Confirm no frame data is written to disk, logged, or transmitted over network
3. Confirm MediaPipe PoseLandmarker processes in-memory only, output is landmarks (not images)
4. Check `AndroidManifest.xml` for network permissions — document whether app could transmit data even if code doesn't
5. Write `docs/evidence/M0-P.md` with findings, referencing actual code lines
6. Follow the evidence file pattern established in `docs/evidence/M0-A.md`, `M0-B.md`, `M0-C.md`

Run `pnpm test` and `pnpm lint` before committing. Use the project's commit conventions.
