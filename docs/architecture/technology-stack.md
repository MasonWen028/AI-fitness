# Technology Stack

This register records technology choices by responsibility, decision state, milestone, risk, and revisit trigger. It preserves the SRS decision states exactly.

## Mobile Runtime

### React Native

- **Decision state:** `DECIDED`
- **Responsibility:** mobile application shell and UI runtime
- **Milestone introduced:** `M0`
- **Alternatives considered:** bare native iOS/Android apps
- **Justification:** fixed by SRS; enables shared TypeScript UI while allowing native modules for camera/pose work
- **Risks:** runtime boundary complexity between JS and native hot path
- **ADR:** `ADR-012`
- **Exit/revisit condition:** only if SRS changes or runtime constraints prove React Native non-viable

### TypeScript

- **Decision state:** `DECIDED`
- **Responsibility:** shared UI logic, contracts, exercise-engine semantics where applicable, backend language
- **Milestone introduced:** `M0`
- **Alternatives considered:** JavaScript-only, Kotlin Multiplatform, Dart
- **Justification:** fixed by SRS for mobile/web/backend alignment
- **Risks:** hot-path numeric work may still need native placement
- **ADR:** `ADR-016`
- **Exit/revisit condition:** none without SRS/ADR change

### Expo Development Builds / Prebuild

- **Decision state:** `PROPOSED`
- **Responsibility:** mobile development workflow while preserving native Swift/Kotlin access
- **Milestone introduced:** `M0`
- **Alternatives considered:** bare React Native
- **Justification:** official Expo docs support local/native modules and development builds without relying on Expo Go; this keeps M0 smaller if it does not block camera/pose/runtime experiments
- **Risks:** some native integration edge cases may force a bare fallback; CNG workflow must not obscure runtime benchmarking
- **ADR:** `ADR-012`
- **Exit/revisit condition:** switch to bare React Native if Expo materially blocks camera integration, pose provider embedding, or `ADR-016` measurement

### Bare React Native

- **Decision state:** `PROPOSED`
- **Responsibility:** fallback mobile build path if Expo-based workflow fails runtime requirements
- **Milestone introduced:** `M0` only if needed
- **Alternatives considered:** Expo development builds
- **Justification:** keeps full native control available if benchmark or integration evidence requires it
- **Risks:** larger setup/maintenance surface for the current milestone
- **ADR:** `ADR-012`
- **Exit/revisit condition:** use only if Expo path becomes a blocker

## Pose / CV

### MediaPipe Pose Landmarker

- **Decision state:** `PROPOSED`
- **Responsibility:** M0 pose provider candidate for live on-device body landmarks
- **Milestone introduced:** `M0`
- **Alternatives considered:** ONNX Runtime Mobile, native platform ML, custom model
- **Justification:** official docs support Android/iOS live stream usage, asynchronous callbacks, 33 landmarks, and on-device operation aligned with M0
- **Risks:** device thermal behavior, model load size, delegate variability, and output stability across devices
- **ADR:** `ADR-005`
- **Exit/revisit condition:** replace if device evidence, licensing, bundle constraints, or conformance results are unacceptable

### ONNX Runtime Mobile

- **Decision state:** `DEFERRED`
- **Responsibility:** future alternative provider/runtime path
- **Milestone introduced:** future
- **Alternatives considered:** MediaPipe, platform-native ML
- **Justification:** relevant only if provider replacement becomes necessary
- **Risks:** extra model/tooling complexity before there is evidence of need
- **ADR:** `ADR-005`
- **Exit/revisit condition:** revisit only if MediaPipe candidate fails or learned/custom models become justified

## Runtime Placement

### Native pose → bridge / JSI / worklet / native analysis

- **Decision state:** `TBD / ADR REQUIRED`
- **Responsibility:** transport and runtime placement for high-frequency `PoseObservation` handling
- **Milestone introduced:** `M0`
- **Alternatives considered:** Option A bridge, Option B JSI/equivalent, Option C native/worklet hot path with semantic events, Option D native hot analysis
- **Justification:** SRS requires benchmark evidence before selection
- **Risks:** latency, GC, serialization cost, overlay smoothness, maintenance burden, cross-platform drift
- **ADR:** `ADR-016`
- **Exit/revisit condition:** choose only after equivalent benchmark evidence on representative devices

## Web

### React

- **Decision state:** `DECIDED`
- **Responsibility:** web UI foundation
- **Milestone introduced:** `M1`
- **Alternatives considered:** Vue, Svelte
- **Justification:** fixed by SRS
- **Risks:** none beyond ordinary framework evolution
- **ADR:** `ADR-001`
- **Exit/revisit condition:** none without SRS change

### Next.js

- **Decision state:** `PROPOSED`
- **Responsibility:** likely single deployment for public site + authenticated web in M1
- **Milestone introduced:** `M1`
- **Alternatives considered:** separate React website and React app, other React frameworks
- **Justification:** simplest likely path for public crawlable content and authenticated product while sharing navigation/design primitives
- **Risks:** public/authenticated bundle boundaries must remain strict; one deployment must not leak dashboard code to public routes
- **ADR:** `ADR-001`
- **Exit/revisit condition:** split only if measurable performance, deployment cadence, CMS isolation, or security concerns justify it

## Backend

### Node.js

- **Decision state:** `DECIDED`
- **Responsibility:** backend runtime
- **Milestone introduced:** `M1`
- **Alternatives considered:** Go, Java, Deno
- **Justification:** fixed by SRS and aligns with TypeScript stack
- **Risks:** none material for current scope
- **ADR:** `ADR-002`
- **Exit/revisit condition:** none without SRS change

### Plain Fastify

- **Decision state:** `PROPOSED`
- **Responsibility:** early M1 HTTP framework candidate
- **Milestone introduced:** `M1`
- **Alternatives considered:** NestJS + Fastify adapter
- **Justification:** official Fastify docs provide plugin encapsulation, schema validation/serialization, and clean module boundaries with less framework overhead
- **Risks:** some team conventions must be established manually compared with NestJS
- **ADR:** `ADR-002`
- **Exit/revisit condition:** choose Nest only if it demonstrably lowers M1 complexity around validation, auth, OpenAPI/contracts, testing, or modular maintenance

### NestJS + Fastify Adapter

- **Decision state:** `PROPOSED`
- **Responsibility:** structured backend framework alternative
- **Milestone introduced:** `M1`
- **Alternatives considered:** plain Fastify
- **Justification:** remains viable if framework conventions materially reduce M1 complexity
- **Risks:** higher abstraction and boilerplate than current milestone may need
- **ADR:** `ADR-002`
- **Exit/revisit condition:** use only if concrete M1 implementation value outweighs extra framework weight

## Database / Persistence

### PostgreSQL

- **Decision state:** `DECIDED`
- **Responsibility:** M1 system of record
- **Milestone introduced:** `M1`
- **Alternatives considered:** MySQL, SQLite-as-server, document stores
- **Justification:** fixed by SRS; needed for relational ownership, provenance, snapshots, and structured analysis
- **Risks:** none unusual
- **ADR:** `ADR-003`
- **Exit/revisit condition:** none without SRS change

### Drizzle ORM

- **Decision state:** `PROPOSED`
- **Responsibility:** leading M1 PostgreSQL access layer candidate
- **Milestone introduced:** `M1`
- **Alternatives considered:** Prisma, lighter SQL/query layer
- **Justification:** keeps PostgreSQL visible, supports explicit transactions and SQL-friendly schema evolution, has lower code-generation burden than Prisma, and avoids premature custom data-layer work
- **Risks:** less batteries-included workflow than Prisma; team must stay disciplined about schema organization and migration review
- **ADR:** `ADR-003`
- **Exit/revisit condition:** revisit if migration workflow, schema ergonomics, or team throughput become materially worse than Prisma

### Prisma ORM

- **Decision state:** `PROPOSED`
- **Responsibility:** higher-abstraction PostgreSQL access alternative
- **Milestone introduced:** `M1`
- **Alternatives considered:** Drizzle, lighter SQL/query layer
- **Justification:** strong migration and transaction tooling, mature client ergonomics, good JSON support
- **Risks:** heavier generated client, more abstraction from PostgreSQL semantics, and more token/codegen burden for a deliberately lean early backend
- **ADR:** `ADR-003`
- **Exit/revisit condition:** choose only if its productivity advantages clearly outweigh extra abstraction and generated-code overhead

### Minimal SQL / query layer

- **Decision state:** `PROPOSED`
- **Responsibility:** lowest-abstraction persistence option
- **Milestone introduced:** `M1`
- **Alternatives considered:** Drizzle, Prisma
- **Justification:** stays closest to PostgreSQL and avoids ORM abstraction entirely
- **Risks:** requires more custom discipline around schema typing, migrations, and query reuse than early M1 should absorb
- **ADR:** `ADR-003`
- **Exit/revisit condition:** use only if both Prisma and Drizzle prove materially unsuitable

### SQLite-compatible local mobile persistence

- **Decision state:** `PROPOSED`
- **Responsibility:** M1 durable checkpoint and structured upload retry state on device
- **Milestone introduced:** `M1`
- **Alternatives considered:** file-based persistence, key-value stores
- **Justification:** transactional local storage fits checkpoint durability and future M2 sync evolution better than ad hoc file storage
- **Risks:** schema migration discipline is still required; must not overbuild an M2 outbox early
- **ADR:** `ADR-013`
- **Exit/revisit condition:** revisit only if actual M1 persistence needs stay materially simpler than a relational local store

## Identity

### Managed Identity Provider

- **Decision state:** `DECIDED`
- **Responsibility:** production auth approach for M1 onward
- **Milestone introduced:** `M1`
- **Alternatives considered:** custom auth
- **Justification:** fixed by SRS; avoids custom password security
- **Risks:** vendor coupling until export/deletion and exit path are validated
- **ADR:** `ADR-004`
- **Exit/revisit condition:** vendor-specific selection still open

### Supabase Auth

- **Decision state:** `PROPOSED`
- **Responsibility:** auth vendor candidate
- **Milestone introduced:** `M1`
- **Alternatives considered:** Auth0, Clerk
- **Justification:** current SRS proposal; official docs support auth methods and standalone usage
- **Risks:** backend/domain separation must remain clear; vendor fit for region, deletion, MFA roadmap, and exit still requires ADR review
- **ADR:** `ADR-004`
- **Exit/revisit condition:** replace if AU-region/privacy/cost/operational review fails

## Monorepo / Tooling

### pnpm workspaces

- **Decision state:** `PROPOSED`
- **Responsibility:** package management and workspace linking
- **Milestone introduced:** target structure begins in `M0`
- **Alternatives considered:** npm workspaces, yarn
- **Justification:** minimal and common workspace management for the proposed monorepo layout
- **Risks:** none material if used narrowly
- **ADR:** `ADR-001`
- **Exit/revisit condition:** revisit only if workspace tooling becomes a blocker

### Turborepo

- **Decision state:** `PROPOSED`
- **Responsibility:** task orchestration for the eventual monorepo
- **Milestone introduced:** only if justified by actual workspace growth
- **Alternatives considered:** native package scripts only
- **Justification:** can help once multiple apps/packages exist, but does not need to be heavily used in M0
- **Risks:** premature build orchestration complexity if adopted before the repo actually needs it
- **ADR:** `ADR-001`
- **Exit/revisit condition:** keep optional until workspace size justifies it

## Final State Tables

## DECIDED

| Technology | Responsibility | Milestone | ADR |
| --- | --- | --- | --- |
| React Native | Mobile shell | M0 | ADR-012 |
| TypeScript | Shared language | M0 | ADR-012 / ADR-016 |
| On-device live inference | Privacy + runtime constraint | M0 | ADR-006 |
| React | Web UI foundation | M1 | ADR-001 |
| Node.js | Backend runtime | M1 | ADR-002 |
| PostgreSQL | System of record | M1 | ADR-003 |
| Managed identity provider | Auth approach | M1 | ADR-004 |

## PROPOSED / M0 Evaluation

| Technology | Responsibility | Milestone | ADR |
| --- | --- | --- | --- |
| Expo development builds | Mobile workflow | M0 | ADR-012 |
| Bare React Native | Mobile fallback | M0 | ADR-012 |
| MediaPipe Pose Landmarker | Pose provider candidate | M0 | ADR-005 |
| Next.js | M1 public + authenticated web | M1 | ADR-001 |
| Plain Fastify | Backend framework candidate | M1 | ADR-002 |
| NestJS + Fastify | Backend framework alternative | M1 | ADR-002 |
| Drizzle | Leading PostgreSQL access candidate | M1 | ADR-003 |
| Prisma | Alternative PostgreSQL access candidate | M1 | ADR-003 |
| Minimal SQL layer | Lowest-abstraction persistence option | M1 | ADR-003 |
| SQLite-compatible local persistence | Mobile checkpoint/retry store | M1 | ADR-013 |
| Supabase Auth | Auth vendor candidate | M1 | ADR-004 |
| pnpm workspaces | Workspace management | M0/M1 | ADR-001 |
| Turborepo | Workspace task orchestration | M0/M1 | ADR-001 |

## DEFERRED

| Technology | Responsibility | Milestone | ADR |
| --- | --- | --- | --- |
| ONNX Runtime Mobile | Future provider/runtime option | Future | ADR-005 |
| Generative AI provider | Optional post-workout summary | M2 optional | ADR-010 |
| Cloud deployment platform | Production topology | M1 | ADR-011 |
| Advanced observability vendor stack | Expanded monitoring/analytics | M1/M2/V1 | ADR-009 |
| Subscription platform | Monetization | Future | ADR-010 / future monetization ADR |
