# ADR-015 — Form Score Version Comparability

Status

`DEFERRED`

Date

2026-08-07

Milestone

`M1` score introduction; `M2` trend interpretation

Decision Owners

- Principal Software Architect
- Product owner
- Analysis/validation owner

## Context

The SRS requires explicit version provenance and warns against plotting incompatible score versions as though they were directly comparable. The architecture needs the rule, but not a full comparability method today.

## SRS Constraints

- score inputs and versions are immutable
- historical scores from different versions must not be presented as directly comparable without a documented transform

## Decision

Defer any compatibility-transform design.

Adopt only the baseline rule:

- persist exact `formScoreVersion`
- segment or suppress incompatible trends by default

## Alternatives

- always compare all scores directly — rejected
- design a statistical transform now — premature

## Trade-offs

The architecture preserves honesty over false continuity.

## Risks

- later product teams may want simplistic cross-version charts; this ADR exists to block that shortcut

## Validation / Evidence

Evidence pending future score and progress work.

## Consequences

- data model and progress docs must keep score version explicit

## Revisit Trigger

Revisit only when score-based progress features are promoted and enough validation evidence exists to justify a compatibility model.

## Related Requirements

- FR-SCORE-001 through FR-SCORE-005
- FR-PROGRESS-001 through FR-PROGRESS-007
- FR-VERSION-003
