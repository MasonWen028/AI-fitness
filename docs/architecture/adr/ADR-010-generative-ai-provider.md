# ADR-010 — Generative AI Provider

Status

`DEFERRED`

Date

2026-08-07

Milestone

Optional `M2`, not required for `M0` or baseline `M1`

Decision Owners

- Principal Software Architect
- Product owner
- Safety/privacy owner

## Context

AI Coach is not implemented in M0 and not required in M1. Provider selection would be speculative now.

## SRS Constraints

- no LLM in the live pose/phase/rep/rule loop
- M1 requires deterministic summary first
- M2 generative summary is optional and separately governed

## Decision

Defer provider selection entirely.

Preserve only these architecture rules:

- AI Coach consumes structured minimised facts only
- no raw video by default
- generated output is bounded by schema and safety policy
- provider outages must not block workout completion

## Alternatives

- any future provider meeting privacy/safety/region requirements

## Trade-offs

Deferral avoids spending architecture budget on a feature outside current milestone scope.

## Risks

- later teams may underestimate safety and privacy review needs

## Validation / Evidence

Evidence pending future M2 scope approval.

## Consequences

- no current implementation work is authorized for AI Coach provider integration

## Revisit Trigger

Revisit only when structured generative summary is promoted into active scope.

## Related Requirements

- FR-COACH-001 through FR-COACH-007
