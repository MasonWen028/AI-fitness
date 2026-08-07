# ADR-013 — Local Persistence / Offline Evolution

Status

`PROPOSED`

Date

2026-08-07

Milestone

`M1`

Decision Owners

- Principal Software Architect
- Mobile architecture owner
- Data architecture owner
- Backend owner

## Context

The SRS requires M1 to support:

- durable active-workout checkpoint
- completed-set persistence
- stable client-generated IDs
- structured upload retry state
- process-death recovery
- idempotent completion

It explicitly does **not** require the full M2 transactional outbox/conflict engine. The architecture must therefore stay small in M1 while avoiding a dead-end for M2 offline evolution.

## SRS Constraints

- M0 needs no product sync
- M1 needs durable checkpoint and retryable structured upload only
- M2 later adds ordered mutation outbox/conflict handling
- local schema migrations must be transactional and recoverable
- local data should support secure sign-out cleanup where policy requires

## Decision

Directionally prefer a **SQLite-compatible local relational store** for M1 mobile persistence.

The M1 local model should contain only what is needed for:

- active workout checkpoint
- completed set/result persistence
- stable client session/result identifiers
- bounded structured upload retry metadata
- resumable lifecycle state after process death
- idempotent completion tracking

Do **not** implement a general mutation outbox or conflict engine in M1.

## Alternatives

### Option A — SQLite-compatible local relational store

- transactional
- resilient across process death
- good fit for checkpoint + retry metadata
- evolves naturally toward later outbox patterns if needed

### Option B — ad hoc files / key-value persistence

- may be simpler initially
- poorer fit for transactional checkpoint/update semantics
- higher risk of awkward M2 migration

### Option C — full outbox now

- rejected as premature M2 infrastructure

## Trade-offs

- A relational local store is slightly heavier than a pure file/key-value path, but better aligned with the checkpoint and idempotency semantics M1 already needs.
- Not building the outbox now keeps scope disciplined, but schema keys and result boundaries must be stable enough to support future evolution.

## Risks

- over-designing the local schema toward M2 too early
- under-designing identifier boundaries such that M2 later requires rekeying or migration pain

## Validation / Evidence

Evidence pending M1 implementation planning.

The design must prove:

- process-death recovery works,
- active set/workout checkpoint is durable,
- completed set/result persists before user-visible success,
- retries preserve stable IDs and idempotency semantics,
- schema migration remains transactional.

## Consequences

- mobile architecture assumes local relational persistence rather than ad hoc files
- M1 implementation remains bounded to checkpoint/retry needs
- M2 can later add outbox-style records without redefining completed-session identity

## Revisit Trigger

Revisit if M1 persistence needs stay materially smaller than expected or if actual device/platform constraints make the relational local store materially worse than a simpler option.

## Related Requirements

- FR-OFFLINE-001 through FR-OFFLINE-006
- FR-UPLOAD-001 through FR-UPLOAD-004
- FR-SESSION-001 through FR-SESSION-007
- FR-AIFC-007
- FR-MOB-006
- FR-MOB-008
- FR-SESSION-003
- AC-OFFLINE-001
- Appendix A references for ADR-013
