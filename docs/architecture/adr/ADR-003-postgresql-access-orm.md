# ADR-003 — PostgreSQL Access / ORM

Status

`PROPOSED`

Date

2026-08-07

Milestone

`M1`

Decision Owners

- Principal Software Architect
- Backend architecture owner
- Data architecture owner
- Engineering lead

## Context

PostgreSQL is `DECIDED` for M1. The open decision is how the Node.js backend should access it while preserving migration safety, explicit transactions, type safety, query visibility, schema evolution, and long-term maintainability.

The minimum M1 persistence model must support:

- canonical `Exercise` and taxonomy
- `WorkoutTemplate` and immutable workout snapshots
- `WorkoutSession` / `WorkoutSet`
- `ExerciseAnalysis` / `RepAnalysis` / `DetectedFormIssue`
- exact model/profile/rules/version provenance
- idempotent structured-result upload

This is a moderate relational workload with versioned records, snapshots, JSON-capable metadata, and bounded operational records. It does not justify a complex data framework or speculative repository abstraction.

## SRS Constraints

- PostgreSQL is `DECIDED`.
- M0 uses no production database.
- M1 must support ownership, snapshots, structured analysis, version provenance, and idempotency.
- PostgreSQL must not store raw camera frames or per-frame landmark streams.
- Do not choose solely by popularity.
- Evaluate Prisma vs Drizzle vs minimal SQL/query layer.

## Decision

Directionally prefer **Drizzle** as the leading M1 PostgreSQL access layer.

Rationale:

- keeps PostgreSQL semantics visible,
- supports explicit transaction handling,
- supports JSONB and PostgreSQL column/type features directly,
- provides strong TypeScript typing without a large generated client surface,
- keeps query behavior comparatively transparent,
- reduces codegen/token burden relative to Prisma,
- avoids pushing too much custom migration/typing discipline into a hand-built SQL layer.

Prisma remains a credible alternative, but is not the leading direction for this milestone. A fully custom SQL/query layer is not preferred initially.

## Alternatives

### Option A — Drizzle

Strengths:

- SQL-oriented and explicit
- broad PostgreSQL type visibility
- transactional ergonomics close to SQL
- lower generated-code overhead
- easier query transparency for a lean architecture

Weaknesses:

- fewer opinionated abstractions than Prisma
- requires project discipline for schema organization and migration review

### Option B — Prisma

Strengths:

- productive client ergonomics
- mature migration workflow
- strong transaction support
- JSON field support

Weaknesses:

- heavier generated client/model workflow
- greater abstraction distance from PostgreSQL details
- less aligned with the requested minimal token/codegen burden

### Option C — Minimal SQL / query layer

Strengths:

- maximum query transparency
- minimal abstraction

Weaknesses:

- pushes migration, typing, and reuse burden into custom code early
- higher maintenance cost than the milestone needs
- too easy to create ad hoc conventions

## Trade-offs

- Drizzle is slightly less opinionated than Prisma, but that is acceptable because the M1 persistence model is still bounded and benefits from visible SQL semantics.
- Prisma may accelerate some CRUD workflows, but the cost is a heavier abstraction and generated surface that the architecture is intentionally trying to avoid.
- A minimal SQL layer stays closest to PostgreSQL but creates too much custom discipline burden for early M1.

## Risks

- Drizzle migration workflows still require review discipline and team familiarity.
- Prisma could outperform Drizzle in team velocity if the team strongly prefers higher-level workflows, but no such hidden constraint is present here.
- A premature custom SQL approach could increase maintenance and inconsistency.

## Validation / Evidence

Evidence pending M1 implementation planning.

The chosen access layer must be validated against:

- migration safety for iterative schema change,
- explicit transactions for session completion and analysis persistence,
- JSONB support for bounded metadata where appropriate,
- clear modeling of immutable snapshots and provenance,
- idempotency record support,
- maintainable query inspection and debugging.

## Consequences

- Backend architecture and data architecture assume a Drizzle-first path.
- Database design should remain relational and explicit, without generic repository abstractions.
- Schema changes should remain reviewable and version-controlled.

## Revisit Trigger

Revisit if:

- Drizzle migration or schema ergonomics materially slow implementation,
- Prisma demonstrates a clear net reduction in M1 complexity without unacceptable abstraction cost,
- actual persistence needs shrink enough that an even lighter path is genuinely simpler.

## Related Requirements

- FR-API-003 through FR-API-010
- FR-EXERCISE-001 through FR-EXERCISE-007
- FR-WORKOUT-001 through FR-WORKOUT-007
- FR-SESSION-001 through FR-SESSION-007
- FR-UPLOAD-001 through FR-UPLOAD-004
- FR-VERSION-001 through FR-VERSION-004
- FR-CONTRACT-001 through FR-CONTRACT-005
- FR-API-004
- FR-API-009
- AC-IDEMP-001
- Appendix A references for ADR-003
