# M0 Gate Checklist

## Gate States

> **Binary gate (per SRS M0-GATE-001, §54.1).** M0-GATE-001 permits only two outcomes: **FULL PASS** or **REQUEST CHANGES**. The previous "Conditional Pass" state is **not authorized by the SRS** and has been removed (see `docs/reviews/M0-R0-REQUIREMENT-RECONCILIATION.md` §4 Q2/Q3). A failing gate requires architecture revision, not exercise expansion.

### FULL PASS

All of the following are satisfied:

- M0 technical shell works
- camera path works with permission and lifecycle handling
- pose provider candidate works on representative devices
- `PoseObservation` is stable
- squat metrics, phase, rep, faults, and feedback behave deterministically
- fixtures and replay are complete
- benchmark evidence is complete
- privacy verification is complete
- no extra AI exercise has started
- required evidence artefacts exist and are linked

### REQUEST CHANGES

Any of the following occurs:

- privacy evidence fails
- benchmark evidence fails
- replay or fixture determinism fails
- the runtime path is not technically viable
- the selected candidate violates the architecture boundary model
- M0 scope expands beyond Squat
- required evidence artifacts are missing
- any mandatory M0 requirement (incl. all REQUIRED_M0 items) is incomplete
- ADR-005/012/016 are not accepted with measurements, or M0-ENG-001–008 do not all pass

## Gate Inputs

- SRS: `docs/SRS.md`
- Architecture: `docs/architecture/*`
- ADRs: `docs/architecture/adr/*`
- Test evidence: `docs/architecture/evidence/m0/*`

## Gate Evidence Links

- `runtime-benchmark.md`
- `squat-fixture-report.md`
- `privacy-verification.md`
- `m0-gate-report.md`

## Final Gate Rule

`M0-GATE-001` is **binary**: the gate returns **FULL PASS** or **REQUEST CHANGES**. FULL PASS requires that the evidence package demonstrates the AI Exercise Analysis architecture is technically viable for Bodyweight Squat, that privacy/runtime constraints are respected, **and** that all mandatory M0 requirements are complete with ADR-005/012/016 accepted (with measurements) and M0-ENG-001–008 passing. A failing gate requires architecture revision, not exercise expansion.
