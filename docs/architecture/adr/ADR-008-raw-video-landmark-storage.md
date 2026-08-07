# ADR-008 — Raw Video / Landmark Storage

Status

`DEFERRED`

Date

2026-08-07

Milestone

Future; not required for `M0` or baseline `M1`

Decision Owners

- Principal Software Architect
- Privacy/security owner
- Data governance owner

## Context

The SRS already decides that raw video and continuous landmark streams are not stored by default. What remains unresolved is any future opt-in diagnostic or saved-video path.

## SRS Constraints

- default architecture stores no continuous raw video
- PostgreSQL must not store per-frame landmark streams
- any diagnostic landmark/video collection requires separate consent and governance

## Decision

Defer the design of any optional raw-video or landmark-sequence storage path.

The only active architecture invariant is:

- no default raw-video upload/storage
- no PostgreSQL storage of full landmark streams

## Alternatives

- isolated opt-in diagnostic storage
- landmark-only diagnostic storage
- future user-saved video feature

None are needed now.

## Trade-offs

Deferral avoids premature privacy/storage design while preserving a strict default prohibition.

## Risks

- future teams may try to add diagnostics casually; this ADR exists to block that drift without separate review

## Validation / Evidence

Evidence pending any future scoped proposal.

## Consequences

- current architecture remains privacy-first and local-only for raw frame handling

## Revisit Trigger

Revisit only when a future feature explicitly requires diagnostic or saved-video capture.

## Related Requirements

- NFR-PRIVACY-001 through NFR-PRIVACY-010
- FR-VALDATA-001 through FR-VALDATA-010
