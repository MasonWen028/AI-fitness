# M0 Parallel Development — Collaboration Rules

## Context

M0-C is merged to main. Two AI assistants (WorkBuddy and Kiro) will work in parallel on different branches to complete the remaining M0 work packages (D through Q).

## Dependency Analysis

```
main (M0-A + M0-B + M0-C merged)
  |
  +-- WorkBuddy: D -> F -> G -> H -> I -> J/K -> L   (analysis engine chain)
  |
  +-- Kiro:      P (immediate)                        (privacy, independent of D)
              -> E -> M -> N -> O                     (after D merges, UI + fixtures + replay + benchmark)
```

Key insight from dependency graph:
- **M0-P (Privacy)** depends only on M0-B (camera pipeline) — can start immediately, zero dependency on D.
- **M0-D (PoseObservation)** is the gate for E, F, M — everything downstream needs the stabilized contract.
- After D merges, Kiro can branch again for E + M + N + O while WorkBuddy continues F -> G -> H -> I -> J/K -> L.

## Phase 1 — Immediate Parallel (both branch from main)

### WorkBuddy branch: `feature/m0-d-analysis-foundation`

| Step | Package | Files touched | Type |
|------|---------|---------------|------|
| 1 | M0-D PoseObservation | `src/pose/poseContract.ts` (modify), `src/pose/poseContract.test.ts` (new) | Stabilize existing contract |
| 2 | M0-F Normalization | `src/analysis/normalization.ts` (new), `.test.ts` (new) | Pure TS + Vitest |
| 3 | M0-G Squat Metrics | `src/analysis/metrics.ts` (new), `.test.ts` (new) | Pure TS + Vitest |
| 4 | M0-H Phase FSM | `src/analysis/phaseFSM.ts` (new), `.test.ts` (new) | Pure TS + Vitest |
| 5 | M0-I Rep Detection | `src/analysis/repDetection.ts` (new), `.test.ts` (new) | Pure TS + Vitest |
| 6 | M0-J/K Faults | `src/analysis/faults.ts` (new), `.test.ts` (new) | Pure TS + Vitest |
| 7 | M0-L Feedback | `src/analysis/feedback.ts` (new), `.test.ts` (new) | Pure TS + Vitest |

### Kiro branch: `feature/m0-p-privacy-verification`

| Step | Package | Files touched | Type |
|------|---------|---------------|------|
| 1 | M0-P Privacy | `docs/evidence/M0-P.md` (new), possibly a verification script | Documentation + verification |

M0-P has zero file overlap with the analysis chain.

## Phase 2 — After M0-D merges to main

### Kiro branches: `feature/m0-e-overlay` then `feature/m0-mn-replay`

| Step | Package | Files touched | Type |
|------|---------|---------------|------|
| 1 | M0-E Skeleton Overlay | `src/ui/SkeletonOverlay.tsx` (new), `CameraPreviewScreen.tsx` (modify for integration) | UI component |
| 2 | M0-M Fixture Format | `src/fixtures/types.ts` (new), `src/fixtures/format.ts` (new) | Type definitions + serialization |
| 3 | M0-N Replay Simulator | `src/replay/replaySimulator.ts` (new), `.test.ts` (new) | Pure TS + Vitest |
| 4 | M0-O Benchmark | `src/replay/benchmark.ts` (new), `docs/evidence/M0-O.md` (new) | Benchmark harness |

## File Boundary Matrix

| Path | WorkBuddy | Kiro | Notes |
|------|-----------|------|-------|
| `src/pose/poseContract.ts` | Modify (D only) | Read-only | Frozen after D merges |
| `src/pose/poseContract.test.ts` | Create (D) | Read-only | |
| `src/analysis/**` | Exclusive | No touch | All new files |
| `src/ui/**` | No touch | Exclusive (E) | All new files |
| `src/fixtures/**` | No touch | Exclusive (M) | All new files |
| `src/replay/**` | No touch | Exclusive (N, O) | All new files |
| `src/camera/CameraPreviewScreen.tsx` | No touch | Modify (E integration) | Kiro adds overlay integration |
| `src/pose/poseProvider*.ts` | No touch | No touch | Stable, do not modify |
| `src/pose/poseEventAdapters.ts` | No touch | No touch | Stable, do not modify |
| `docs/evidence/M0-*.md` | Create D, F-L evidence | Create P, E, M, N, O evidence | Different files, no conflict |
| `modules/pose-camera/**` | No touch | No touch | M0-C complete, frozen |

## Contract Freeze Rule

After M0-D merges to main, `poseContract.ts` is **frozen** for the rest of M0.

- If either side discovers the contract needs changes (new field, type change):
  1. Create a commit with prefix `[CONTRACT-CHANGE]` describing the proposed change
  2. Notify the other side via the user
  3. Wait for acknowledgment before merging
  4. The other side rebases after the contract change merges

## Merge Order

1. `feature/m0-d-analysis-foundation` merges first (D is foundation for E, M)
2. Kiro creates new branches from updated main for Phase 2 work
3. `feature/m0-p-privacy-verification` merges independently (no dependencies)
4. Phase 2 branches merge in order: E -> M -> N -> O
5. WorkBuddy's analysis chain continues merging incrementally (F, G, H, I, J/K, L)
6. `M0-Q` (Gate Report) is the final merge — requires evidence from both sides

## Communication Protocol

- **Commit message prefixes:**
  - `[CONTRACT-CHANGE]` — poseContract.ts modified, other side must review
  - `[BOUNDARY-NOTICE]` — touching a file near the boundary line
  - `[EVIDENCE]` — adding/updating an evidence file
- **The user is the sync point** — forward any `[CONTRACT-CHANGE]` or `[BOUNDARY-NOTICE]` commits to the other side
- **No direct file conflicts expected** — all new work is in separate directories

## Testing Requirements

- Every new module must have Vitest unit tests
- Run `pnpm test` and `pnpm lint` before every commit
- Evidence files must reference actual test output, not assumed results
- Follow the pattern established in M0-A/B/C evidence files
