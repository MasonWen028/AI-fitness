import { describe, expect, it } from 'vitest';

import { createSyntheticObservation } from '../pose/poseValidation';
import { createFixture } from '../fixtures/format';
import { createReplaySimulator } from './replaySimulator';

function createFixtureForReplay() {
  return createFixture({
    exercise: 'bodyweight-squat',
    metadata: {
      recordedAt: '2026-08-09T22:15:00.000Z',
      source: 'synthetic',
      frameIntervalMs: 33,
    },
    observations: [
      createSyntheticObservation(0, { left_hip: { x: 0.4, y: 0.5 } }),
      createSyntheticObservation(1, { left_hip: { x: 0.41, y: 0.52 } }),
      createSyntheticObservation(2, { left_hip: { x: 0.42, y: 0.55 } }),
      createSyntheticObservation(3, { left_hip: { x: 0.43, y: 0.58 } }),
    ],
  });
}

describe('replay simulator', () => {
  it('steps one frame at a time deterministically', () => {
    const simulator = createReplaySimulator(createFixtureForReplay());

    expect(simulator.getSnapshot()).toMatchObject({
      mode: 'idle',
      cursor: 0,
      emittedCount: 0,
      currentObservation: null,
    });

    expect(simulator.step()?.sequence).toBe(0);
    expect(simulator.step()?.sequence).toBe(1);
    expect(simulator.getSnapshot()).toMatchObject({
      mode: 'idle',
      cursor: 2,
      emittedCount: 2,
      currentObservation: expect.objectContaining({ sequence: 1 }),
    });
  });

  it('plays remaining observations sequentially', () => {
    const simulator = createReplaySimulator(createFixtureForReplay());

    const sequences = simulator.play().map((observation) => observation.sequence);

    expect(sequences).toEqual([0, 1, 2, 3]);
    expect(simulator.getSnapshot()).toMatchObject({
      mode: 'completed',
      cursor: 4,
      emittedCount: 4,
      currentObservation: null,
    });
  });

  it('accelerates replay by skipping frames deterministically', () => {
    const simulator = createReplaySimulator(createFixtureForReplay());

    const sequences = simulator.accelerate(2).map((observation) => observation.sequence);

    expect(sequences).toEqual([0, 2]);
    expect(simulator.getSnapshot()).toMatchObject({
      mode: 'completed',
      cursor: 4,
      emittedCount: 2,
      currentObservation: expect.objectContaining({ sequence: 2 }),
    });
  });

  it('reset restores the simulator to the initial state', () => {
    const simulator = createReplaySimulator(createFixtureForReplay());
    simulator.play();

    simulator.reset();

    expect(simulator.getSnapshot()).toMatchObject({
      mode: 'idle',
      cursor: 0,
      emittedCount: 0,
      currentObservation: null,
      nextObservation: expect.objectContaining({ sequence: 0 }),
    });
  });

  it('rejects non-positive accelerate step sizes', () => {
    const simulator = createReplaySimulator(createFixtureForReplay());

    expect(() => simulator.accelerate(0)).toThrowError(/stepSize must be positive/);
  });

  it('repeated replay commands over the same fixture are deterministic', () => {
    const first = createReplaySimulator(createFixtureForReplay());
    const second = createReplaySimulator(createFixtureForReplay());

    expect(first.play()).toEqual(second.play());
  });
});
