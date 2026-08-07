# ADR-011 — Cloud Deployment

Status

`DEFERRED`

Date

2026-08-07

Milestone

`M1` before environment deployment

Decision Owners

- Principal Software Architect
- Platform owner
- Security/privacy owner

## Context

The SRS provides a reference deployment topology but does not fix the cloud/platform choice. M0 does not require production deployment design beyond architecture direction.

## SRS Constraints

- no speculative infrastructure during M0
- Australian-region and privacy constraints matter
- Kubernetes and Redis are not justified by current milestones

## Decision

Defer final cloud/platform selection.

Preserve the reference direction only:

- managed web deployment
- single backend deployment unit
- managed PostgreSQL
- object storage/CDN as needed
- secret management and minimum observability

## Alternatives

- Cloud Run style deployment
- equivalent managed container/server platform

## Trade-offs

Deferral keeps architecture lean while preserving the shape M1 likely needs.

## Risks

- region and cost suitability still need direct review

## Validation / Evidence

Evidence pending M1 deployment planning.

## Consequences

- no platform-specific lock-in is introduced during M0 architecture work

## Revisit Trigger

Revisit before first real M1 deployment environment is selected.

## Related Requirements

- NFR-DEPLOY-001 through NFR-DEPLOY-005
- NFR-ENV-001 through NFR-ENV-004
