# Architecture Decision Records

This directory contains milestone-aligned architecture decision records for the AI Fitness Coaching Platform.

## Baseline ADR set

- `ADR-001-monorepo-and-web-boundary.md`
- `ADR-002-backend-framework-and-api-style.md`
- `ADR-003-postgresql-access-orm.md`
- `ADR-004-authentication-provider.md`
- `ADR-005-pose-provider-model.md`
- `ADR-006-on-device-inference.md`
- `ADR-007-exerciseposeprofile-and-rules-format.md`
- `ADR-008-raw-video-landmark-storage.md`
- `ADR-009-observability-analytics.md`
- `ADR-010-generative-ai-provider.md`
- `ADR-011-cloud-deployment.md`
- `ADR-012-react-native-build-camera-integration.md`
- `ADR-013-local-persistence-offline-evolution.md`
- `ADR-014-supported-devices-users.md`
- `ADR-015-form-score-version-comparability.md`
- `ADR-016-pose-observation-transport-runtime.md`

## Template requirements

Every ADR in this project should contain:

- title
- status
- date
- milestone
- decision owners
- context
- SRS constraints
- decision
- alternatives
- trade-offs
- risks
- validation / evidence
- consequences
- revisit trigger
- related requirements

## Review rule

An ADR becomes implementation-authoritative only after the required evidence and review are complete.

Where evidence is not yet available, the ADR must say so explicitly rather than pretending the decision is complete.
