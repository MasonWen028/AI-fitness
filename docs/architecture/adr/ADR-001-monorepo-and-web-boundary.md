# ADR-001 — Monorepo and Web Boundary

Status

`PROPOSED`

Date

2026-08-07

Milestone

`M0` architecture baseline for `M1` web enablement

Decision Owners

- Principal Software Architect
- Web architecture owner
- Mobile architecture owner
- Engineering lead

## Context

The SRS proposes a monorepo and proposes one M1 web deployment serving both the public website and authenticated web application. M0 does not need a full repo scaffold, but architecture must define the target structure and the minimum future boundary rules so that M1 can begin without repo re-architecture.

The project also needs future sharing between mobile, web, backend, exercise-engine code, fixtures, and profile definitions. At the same time, Ponytail/YAGNI principles prohibit creating every future app/package path during M0.

## SRS Constraints

- Monorepo is `PROPOSED`, not decided.
- M0 must not scaffold future modules merely because they appear in the SRS.
- M1 public and authenticated web may share one deployment if bundle/security boundaries remain clean.
- Public routes must not ship authenticated dashboard code in client bundles.
- Mobile/native boundaries and exercise runtime packages must remain isolated from UI/framework-specific coupling.

## Decision

Directionally adopt a **minimal monorepo target** with workspace tooling that can support:

- `apps/mobile`
- `apps/web`
- `apps/api`
- `apps/exercise-simulator`
- `packages/exercise-engine`
- `packages/pose-profiles`
- `packages/testing`
- `modules/pose-camera`

For `M1`, directionally prefer **one Next.js application** serving both public website and authenticated web surfaces, with strict route and bundle boundaries.

For `M0`, create only the files and folders required by the current milestone. This ADR does not authorize scaffolding the full target layout now.

## Alternatives

### Option A — Minimal monorepo target + one web app

- smallest likely path from M0 into M1
- allows shared packages where reuse is real
- keeps deployment and routing simple initially

### Option B — Separate website repo and authenticated web repo

- stronger deployment isolation
- higher duplication and coordination cost early
- premature split without measured need

### Option C — No monorepo target, independent app-by-app structure

- simplest day-zero shape
- increases odds of later structural churn once mobile/web/api/packages must align

## Trade-offs

- One web app simplifies early delivery but requires discipline around route-level bundle separation.
- A minimal monorepo target preserves future package boundaries, but M0 must resist scaffolding the whole structure early.
- Separate deployments may become appropriate later, but the current SRS and milestone scope do not justify that complexity.

## Risks

- Public/authenticated code boundaries could erode without enforcement.
- Teams may over-create packages because the target layout exists on paper.
- Shared package intent could drift into speculative abstraction.

## Validation / Evidence

- Evidence pending M1 implementation planning.
- Validate that public routes do not ship authenticated bundles.
- Validate that the eventual workspace boundary rules prevent app-to-app imports.

## Consequences

- Future architecture documents and planning may refer to the monorepo target.
- M0 remains free to create only the minimal required paths.
- M1 web planning proceeds assuming one Next.js app unless measured reasons justify a split.

## Revisit Trigger

Revisit if:

- public performance cannot be maintained with one web deployment,
- authenticated/public teams require independent release cadence,
- CMS or security boundaries require isolation,
- actual M0/M1 package sharing stays too small to justify a structured workspace.

## Related Requirements

- SRS Section 9
- SRS Section 11
- FR-WEB-001 through FR-WEB-009
- FR-SITE-001 through FR-SITE-005
- Appendix A references for ADR-001
