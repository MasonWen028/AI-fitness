# AI Fitness Coaching Platform

An AI-powered fitness coaching platform that uses on-device computer vision to guide exercise execution, estimate pose, count repetitions, detect selected form issues, and provide privacy-preserving feedback.

## Project Status

- Current milestone: `M0 — Technical Validation`
- Current validated package: `M0-A — Technical Shell`
- Current AI exercise scope: `Bodyweight Squat` only

This is **not yet a production fitness application**.

## Product Vision

The long-term product is expected to include:

- a React Native mobile application
- a React / Next.js web application
- an official website
- a Node.js / TypeScript backend
- PostgreSQL for system-of-record data
- on-device pose estimation
- a deterministic Exercise Engine
- an optional structured AI Coach later

## Core Architecture

Camera
→ Pose Provider
→ PoseObservation
→ Normalization
→ Metrics
→ Phase
→ Rep Detection
→ Rule Evaluation
→ Feedback
→ Structured Result

`Exercise Content != Pose Detection != Exercise Analysis != AI Coach`

## Privacy Principle

- Live camera processing is on-device by default
- Raw continuous video is not uploaded to the backend by default
- Raw frame streams are not stored in PostgreSQL

## Current Technology Direction

### Decided

- React Native
- TypeScript
- Node.js
- PostgreSQL
- on-device inference

### Proposed / under evaluation

- Expo Development Builds
- MediaPipe Pose
- Fastify / NestJS direction
- ORM / database access layer
- native / JS runtime transport strategy

## Repository Structure

Only directories that currently exist are documented here:

- `apps/mobile/`
- `docs/`
- `.kiro/`
- `.agents/`

## Development Setup

Verified commands:

- `pnpm install`
- `pnpm --filter @exercise/mobile test`
- `pnpm --filter @exercise/mobile lint`
- `pnpm --filter @exercise/mobile typecheck`
- `pnpm exec tsc -p tsconfig.base.json --noEmit`
- `pnpm --filter @exercise/mobile format`
- `pnpm --filter @exercise/mobile build`
- `pnpm --filter @exercise/mobile start`

## Development Workflow

- `main` is the stable reviewed baseline.
- Each approved work package uses a short-lived feature branch.
- One work package per branch.
- Merge back to `main` only after the quality gate and review.

Suggested branch examples:

- `feature/m0-b-camera-pipeline`
- `feature/m0-c-pose-provider`

## Quality Gate

A change is ready only when:

- tests pass
- lint passes
- typecheck passes
- formatting verification passes where configured
- build / prebuild verification passes
- evidence is updated
- code review is marked ready to merge
- no unresolved Critical / High / Medium findings remain

## Documentation

- `docs/SRS.md`
- `docs/architecture/`
- `docs/design/` (if present)
- `docs/planning/`
- `docs/evidence/`

## Exercise Dataset

Reference dataset seed:

- https://github.com/hasaneyldrm/exercises-dataset

This repository uses the external dataset as catalogue seed / reference data only. It is **not** the pose-comparison dataset.

## License

Project licence: TBD.
