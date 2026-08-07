# ADR-006 — On-device Inference

Status

`ACCEPTED`

Date

2026-08-07

Milestone

`M0`

Decision Owners

- Principal Software Architect
- Privacy/security owner
- Mobile runtime owner

## Context

The SRS already fixes the core posture for live AI Form Check: inference is on device by default and raw frames are not continuously uploaded to a backend. This ADR records that architectural invariant so dependent work cannot drift toward cloud-first inference merely for implementation convenience.

## SRS Constraints

- on-device live inference is `DECIDED`
- raw frames are processed locally and discarded by default
- structured results only are uploaded by default
- privacy and latency are first-order product constraints

## Decision

Adopt **on-device live inference** as the mandatory architecture for M0/M1 Form Check.

The backend receives only structured results by default. Any future replay, diagnostics, or saved-video design requires a separate scoped decision and privacy review.

## Alternatives

- cloud live inference for M0/M1 — rejected
- hybrid default video upload — rejected

## Trade-offs

- on-device inference increases native/runtime complexity,
- but preserves privacy and avoids network-latency dependence in the live loop.

## Risks

- low-end device runtime constraints
- higher mobile integration complexity

## Validation / Evidence

Evidence comes from the SRS and must be reinforced by M0 benchmark and privacy verification work.

## Consequences

- M0 must solve native/mobile runtime challenges locally
- backend does not become a crutch for real-time movement analysis

## Revisit Trigger

Revisit only if future product scope explicitly introduces a separately governed replay/diagnostic path.

## Related Requirements

- NFR-PRIVACY-001 through NFR-PRIVACY-004
- FR-POSE-001 through FR-POSE-009
- FR-COACH-001 through FR-COACH-003 boundaries
