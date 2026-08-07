# M0 Implementation Order

## Order

1. **M0-A — Technical Shell**
   - establish the React Native development shell and native integration path

2. **M0-B — Camera Pipeline**
   - implement permissioned preview, lifecycle, interruption handling, and backpressure

3. **M0-C — Pose Provider**
   - integrate the leading native pose provider candidate

4. **M0-D — PoseObservation**
   - define and stabilize the canonical observation contract and mapping

5. **M0-E — Skeleton Overlay**
   - render bounded overlay updates from the observation stream

6. **M0-F — Normalization**
   - implement coordinate canonicalization and quality diagnostics

7. **M0-G — Squat Metrics**
   - implement the minimum metric set required by the Squat profile candidate

8. **M0-H — Squat Phase FSM**
   - implement deterministic phase transitions and tracking-loss behavior

9. **M0-I — Rep Detection**
   - implement rep opening/completion and incomplete-attempt handling

10. **M0-J — Candidate Fault 1**
    - implement first deterministic squat fault

11. **M0-K — Candidate Fault 2**
    - implement second deterministic squat fault

12. **M0-L — Feedback Selector**
    - select one primary live cue plus setup/tracking guidance

13. **M0-M — Fixture Format**
    - define replayable canonical fixture structure

14. **M0-N — Replay Simulator**
    - implement deterministic replay and interactive simulation

15. **M0-O — Benchmark Harness**
    - benchmark runtime candidates on representative devices

16. **M0-P — Privacy Verification**
    - verify raw frames remain local and transient by default

17. **M0-Q — M0 Gate Report**
    - assemble the evidence package and gate decision

## Sequencing Notes

- The runtime candidate is not selected before benchmark evidence.
- The pose-provider candidate must remain provider-neutral via `PoseObservation`.
- Fixture and replay work must precede benchmark comparison so all candidates are tested against the same semantics.
- Privacy verification must be evidence-based, not assumed.
