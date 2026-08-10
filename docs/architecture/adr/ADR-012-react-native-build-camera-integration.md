# ADR-012 — React Native Build / Camera Integration

Status

`PROPOSED`

Date

2026-08-07

Milestone

`M0`

Decision Owners

- Principal Software Architect
- Mobile runtime owner
- Native iOS owner
- Native Android owner

## Context

M0 requires a React Native technical shell with native Swift/Kotlin capability, camera preview, pose-provider integration, and runtime-transport experimentation. Expo Go is not sufficient because the pose pipeline requires custom native code. The open question is whether the project should start with Expo development builds/local modules or move directly to bare React Native.

Official Expo documentation supports local Expo Modules, custom native code, and development builds while remaining compatible with the React Native New Architecture.

## SRS Constraints

- React Native + TypeScript are `DECIDED`
- M0 must allow native Swift/Kotlin code
- app must not depend on a WebView for the pose loop
- camera lifecycle, permissions, backgrounding, and manual fallback must be supported
- runtime-sensitive choices must be benchmarked only where evidence matters

## Decision

Directionally prefer **Expo Development Builds + local Expo Module** as the starting M0 build and camera/native integration path.

Keep **bare React Native** as the documented fallback if Expo-based workflow materially interferes with:

- native camera integration,
- pose provider embedding,
- overlay rendering,
- `ADR-016` transport/runtime experiments,
- required iOS/Android parity.

## Alternatives

### Option A — Expo development builds + local Expo Module

- preserves native Swift/Kotlin extension path
- smaller initial workflow than jumping directly to bare
- aligns with the requirement to allow native code without depending on Expo Go

### Option B — Bare React Native from the start

- maximum native control
- larger setup and maintenance surface immediately

### Option C — Expo Go

- rejected because it does not satisfy native pose pipeline requirements

## Trade-offs

- Expo development builds reduce initial setup weight, but must not hide or constrain the native runtime path.
- Bare React Native offers maximal control, but that control may be unnecessary if Expo modules meet the technical requirements.

## Risks

- Expo workflow could complicate some lower-level runtime experiments.
- Camera/provider library compatibility must still be proven in practice.
- The team could mistake Expo development builds for a guarantee that all runtime options remain equally easy.

## Validation / Evidence

Evidence pending M0 spike.

Required evidence:

- native module path works on iOS and Android
- camera preview and permission lifecycle work cleanly
- pose provider integrates without blocking `ADR-016` experiments
- fallback path to bare React Native remains available if needed

## Consequences

- M0 planning proceeds assuming Expo development builds first
- native boundaries are designed explicitly rather than hidden behind generic JS-only assumptions
- Expo Go is excluded from M0 architecture

## Revisit Trigger

Revisit if Expo materially blocks camera/provider/runtime needs or if benchmark instrumentation becomes meaningfully harder than in a bare setup.

## Related Requirements

- FR-MOB-001 through FR-MOB-011
- FR-CAMERA-001 through FR-CAMERA-009
- FR-AIFC-001 through FR-AIFC-009 — *mandatory M0 (confirmed by M0-R0 reconciliation, 2026-08-10); the M0 implementation SHALL cover the full explicit lifecycle state model; any specific state deferred to a later milestone MUST be documented with explicit SRS/ADR rationale*
- NFR-PERF-004 through NFR-PERF-008
- FR-MOB-010
- FR-CAMERA-003
- FR-CAMERA-007
- AC-CAMERA-001
- AC-CAMERA-002
