# Contributing

## Branches

- `main` is the reviewed stable baseline.
- Feature branches should use the form `feature/<work-package>-<short-description>`.

Examples:

- `feature/m0-b-camera-pipeline`
- `feature/m0-c-pose-provider`

## One Work Package Per Branch

Do not implement more than one approved work package in the same branch unless explicitly approved.

## Commit Messages

Use Conventional Commits.

Examples:

- `feat(m0-b): implement camera preview`
- `fix(m0-b): handle camera permission denial`
- `test(m0-b): add camera lifecycle tests`
- `docs(m0-b): update implementation evidence`

## Before Pull Request

Run the approved quality gate before opening a PR.

## Code Review

A PR should not merge while unresolved Critical, High, or Medium findings remain.

Low findings may be accepted and documented.

## Merge Policy

- Prefer pull requests into `main`.
- Do not push feature work directly to `main`.
- Do not force-push `main`.
- Recommended default merge strategy: squash merge, unless the team later agrees otherwise.
