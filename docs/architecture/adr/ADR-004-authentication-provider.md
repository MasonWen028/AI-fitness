# ADR-004 — Authentication Provider

Status

`PROPOSED`

Date

2026-08-07

Milestone

`M1`

Decision Owners

- Principal Software Architect
- Security/privacy owner
- Backend owner
- Product/engineering lead

## Context

The SRS decides that M1 must use a managed identity solution and must not build custom password security. Vendor selection remains open, with Supabase Auth currently proposed.

M1 auth must support mobile and web flows, secure token handling, ownership enforcement, deletion/revocation support, and future admin security evolution.

## SRS Constraints

- Managed identity is `DECIDED`.
- Vendor remains `PROPOSED`.
- API must validate tokens and enforce ownership independently.
- Mobile must use protected storage and safe auth flow patterns.
- Roles remain minimal in M1.

## Decision

Keep **Supabase Auth** as the leading vendor candidate, but do not accept the vendor decision yet.

This ADR remains `PROPOSED` pending a focused M1 auth comparison that covers:

- Australian region/privacy suitability
- web/mobile flow fit
- deletion/export/session revocation support
- MFA/admin roadmap
- operational incident controls
- cost and exit path

## Alternatives

- Supabase Auth
- Auth0
- Clerk
- other managed identity providers only if they meet the same constraints

## Trade-offs

- Keeping the decision open preserves SRS discipline.
- Supabase remains a practical leading candidate, but vendor finalization is not required to complete M0 architecture.

## Risks

- premature vendor lock-in without deletion/exit review
- over-coupling provider user records to domain ownership

## Validation / Evidence

Evidence pending M1 auth planning.

## Consequences

- architecture documents assume a provider-neutral application user model
- vendor-specific implementation is deferred

## Revisit Trigger

Revisit before any M1 auth implementation begins.

## Related Requirements

- FR-AUTH-001 through FR-AUTH-010
- NFR-SEC-001 through NFR-SEC-006
- NFR-PRIVACY-005 through NFR-PRIVACY-010
