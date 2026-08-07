# ADR-014 — Supported Devices / Users

Status

`DEFERRED`

Date

2026-08-07

Milestone

Provisional assumptions affect `M0`; formal decision required before broader release gates

Decision Owners

- Principal Software Architect
- Product owner
- Validation owner
- Privacy/legal owner

## Context

The SRS leaves the supported device matrix and age-eligibility policy unresolved. M0 may use provisional representative devices for benchmarking, but the final support matrix and user eligibility policy are not architecture decisions that can be invented here.

## SRS Constraints

- age eligibility is TBD
- device/browser/OS support matrix is TBD
- M0 can use provisional representative devices only for benchmark evidence

## Decision

Defer final supported-device and supported-user decisions.

Allow only provisional M0 benchmark assumptions necessary to execute `ADR-016` and pose-provider experiments.

## Alternatives

- define a full support matrix now — rejected
- use only ad hoc devices with no documented rationale — rejected

## Trade-offs

Deferral preserves SRS discipline while still allowing M0 evidence collection.

## Risks

- later release planning must still define and approve the real matrix

## Validation / Evidence

Evidence pending product/legal/validation review.

## Consequences

- M0 benchmark reports must clearly label provisional device assumptions

## Revisit Trigger

Revisit before M1/V1 support claims or release gates are finalized.

## Related Requirements

- FR-MOB-001
- NFR-PERF-004 through NFR-PERF-009
- M0-ENG-006 through M0-ENG-008
