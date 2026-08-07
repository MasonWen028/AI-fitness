# Architecture Context Index

This file routes future work to the smallest authoritative context set.

The SRS remains authoritative. Read only the sections and documents relevant to the current task.

| Topic | Authoritative files | Relevant SRS sections | Relevant ADRs | Milestone | Implementation status |
| --- | --- | --- | --- | --- | --- |
| Architecture rules / hierarchy | `docs/SRS.md`, `docs/architecture/README.md`, `.kiro/steering/project-architecture.md` | Sections 1, 54, 57, Appendix F | All relevant ADRs | M0+ | Baseline documented |
| Camera work | `docs/architecture/mobile-architecture.md`, `docs/architecture/pose-engine.md` | Sections 20, 21, AI Form Check Lifecycle | `ADR-012`, `ADR-016`, `ADR-005` | M0 | Architecture documented; implementation not started |
| Pose provider / model | `docs/architecture/pose-engine.md`, `docs/architecture/technology-stack.md` | Sections 10.2, 21, Transport Spike | `ADR-005`, `ADR-016` | M0 | Candidate documented; evidence pending |
| Exercise engine work | `docs/architecture/exercise-engine.md`, `docs/architecture/exercise-pose-profile.md` | Sections 22–29, 39 | `ADR-007`, `ADR-016` | M0 | Architecture documented; implementation not started |
| ExercisePoseProfile / rules | `docs/architecture/exercise-pose-profile.md`, `docs/architecture/adr/ADR-007-exerciseposeprofile-and-rules-format.md` | Sections 26, 27, 28, 39 | `ADR-007` | M0/M1 | Baseline documented |
| M0 planning / order / gate | `docs/architecture/m0-technical-plan.md`, `docs/architecture/testing-validation.md` | Sections 44, 48, 54, 58, 60 | `ADR-005`, `ADR-012`, `ADR-016` | M0 | Execution-ready plan documented |
| Testing / replay / simulator | `docs/architecture/testing-validation.md` | Section 48, Validation Dataset Workflow, Section 60 | `ADR-007`, `ADR-016` | M0/M1 | Architecture documented |
| Privacy / raw camera data | `docs/architecture/security-privacy.md`, `docs/architecture/data-architecture.md` | Sections 32.4, 42, 43 | `ADR-006`, `ADR-008` | M0/M1 | Architecture documented |
| Catalogue / dataset import | `docs/architecture/data-architecture.md`, `docs/architecture/system-overview.md` | Sections 17, 37, 38 | `ADR-003` | M1 | Architecture documented; not implemented |
| Backend / API | `docs/architecture/backend-architecture.md`, `docs/architecture/technology-stack.md` | Sections 15, 16, 33, 34 | `ADR-002`, `ADR-003`, `ADR-004` | M1 | Architecture documented; decisions partly proposed |
| Local persistence / offline evolution | `docs/architecture/data-architecture.md`, `docs/architecture/adr/ADR-013-local-persistence-offline-evolution.md` | Sections 35, 36 | `ADR-013` | M1/M2 | M1 direction documented; M2 deferred |
| Web / website boundary | `docs/architecture/web-architecture.md` | Sections 12, 14 | `ADR-001` | M1 | Architecture documented; implementation not started |
| Deployment / environments | `docs/architecture/deployment.md` | Sections 49, 50, 51 | `ADR-011` | M1 | Reference topology documented; decision deferred |
| Auth provider | `docs/architecture/backend-architecture.md`, `docs/architecture/adr/ADR-004-authentication-provider.md` | Section 16 | `ADR-004` | M1 | Candidate documented; decision pending |
| Future AI Coach | `docs/SRS.md` only unless promoted | Section 30 | `ADR-010` | M2 optional | Deferred |
| Progress / score comparability | `docs/SRS.md`, `docs/architecture/data-architecture.md` | Sections 28, 31, 53 | `ADR-015` | M2 | Deferred |

## Loading rule

For every task:

1. Read `.kiro/steering/project-architecture.md`.
2. Read this file.
3. Read only the linked SRS sections for the topic.
4. Read only the linked architecture docs and ADRs.
5. If anything seems inconsistent, read the full authoritative SRS section before deciding.
