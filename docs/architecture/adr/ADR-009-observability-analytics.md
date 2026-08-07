# ADR-009 — Observability / Analytics

Status

`DEFERRED`

Date

2026-08-07

Milestone

`M1` minimum implementation, broader `M2/V1` expansion

Decision Owners

- Principal Software Architect
- Platform/observability owner
- Privacy owner

## Context

The SRS requires minimum M1 observability and allowlisted analytics, but vendor/tool selection is not needed to finish M0 architecture. The architecture already fixes the privacy guardrails: no raw video, no full landmark streams, no unsafe analytics properties.

## SRS Constraints

- minimum M1 monitoring is required
- analytics must be allowlisted and privacy-safe
- camera-derived raw data may not be sent to general analytics/logs

## Decision

Defer vendor/tool finalization. Preserve only the architecture rules:

- structured logs and correlation IDs
- privacy-safe allowlisted analytics
- pose/runtime health counters without raw media
- capability for kill-switch and profile anomaly monitoring later

## Alternatives

- OpenTelemetry-compatible stack
- managed crash/error reporting
- managed analytics provider

## Trade-offs

Deferral avoids premature vendor commitment while preserving required signal boundaries.

## Risks

- later vendor choices must still align with privacy and region constraints

## Validation / Evidence

Evidence pending M1 implementation planning.

## Consequences

- architecture docs may reference observability requirements without selecting vendors now

## Revisit Trigger

Revisit before M1 production monitoring implementation begins.

## Related Requirements

- FR-ANALYTICS-001 through FR-ANALYTICS-005
- NFR-OBS-001 through NFR-OBS-005
- NFR-PRIVACY-007 through NFR-PRIVACY-010
