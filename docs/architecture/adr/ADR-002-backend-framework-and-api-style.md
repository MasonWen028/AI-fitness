# ADR-002 — Backend Framework and API Style

Status

`PROPOSED`

Date

2026-08-07

Milestone

`M1`

Decision Owners

- Principal Software Architect
- Backend architecture owner
- API owner
- Engineering lead

## Context

The SRS fixes Node.js + TypeScript for the backend, proposes NestJS + Fastify, and proposes REST/OpenAPI-style contracts, but does not finalize the framework or API style. The early backend scope is intentionally small: Identity/Profile, Catalogue/Content, Workout, Workout Session, Structured Exercise Analysis, and minimum Audit.

Ponytail principles favor the smallest architecture that satisfies the current milestone. A larger framework is justified only if it materially reduces M1 implementation complexity.

## SRS Constraints

- Node.js + TypeScript are `DECIDED`.
- Express should not be used without concrete reason.
- Backend remains a modular monolith.
- Do not introduce microservices, Redis, CQRS, or event buses.
- API must be versioned, runtime-validated, and explicit about representations.
- State-changing retryable endpoints must support idempotency.

## Decision

Directionally prefer **plain Fastify** for the early M1 modular monolith and **REST JSON with a versioned `/api/v1` contract** as the leading API style.

Keep NestJS + Fastify as a viable alternative, but do not adopt it unless implementation planning demonstrates a concrete reduction in M1 complexity around validation, authentication integration, OpenAPI/contracts, testing structure, or maintainability.

## Alternatives

### Option A — Plain Fastify + REST

- low framework weight
- strong plugin encapsulation
- explicit route, validation, and serialization control
- aligns with minimalist modular-monolith goals

### Option B — NestJS + Fastify adapter + REST

- more built-in structure and conventions
- more framework weight and abstraction
- may reduce wiring for some teams, but only if that benefit is real

### Option C — Other API styles such as GraphQL

- rejected for current scope
- adds complexity without SRS support or measured need

## Trade-offs

- Plain Fastify keeps architecture smaller and more explicit, but some conventions must be supplied by project structure.
- NestJS may feel more structured, but the early module set is small enough that extra framework ceremony may not pay for itself.
- REST is sufficient for the bounded M1 surfaces and keeps the contract simple for mobile/web clients.

## Risks

- A too-light structure could drift without clear module rules.
- A too-heavy framework could consume time with boilerplate and architecture that M1 does not need.
- OpenAPI tooling specifics still require implementation planning.

## Validation / Evidence

- Evidence pending M1 implementation planning.
- Validate that chosen approach supports explicit request/response validation, auth guards, idempotency, and contract generation/review without overbuilding.

## Consequences

- Backend docs and planning assume a Fastify-first modular monolith.
- Controllers/handlers must stay thin and avoid embedding domain rules.
- Contract generation remains a likely M1 requirement, but exact tooling remains open until implementation planning.

## Revisit Trigger

Revisit if:

- auth/provider integration becomes materially easier with NestJS,
- OpenAPI/contract workflows impose excessive hand wiring in plain Fastify,
- testing or module isolation costs are measurably worse than expected.

## Related Requirements

- FR-API-001 through FR-API-012
- FR-CONTRACT-001 through FR-CONTRACT-005
- NFR-SEC-001 through NFR-SEC-008
- Appendix A references for ADR-002
