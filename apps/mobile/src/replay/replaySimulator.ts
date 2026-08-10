import type { PoseObservation } from '../pose/poseContract';
import type { PoseObservationFixture } from '../fixtures/types';

export type ReplayMode = 'idle' | 'playing' | 'completed';

export type ReplaySnapshot = {
  mode: ReplayMode;
  cursor: number;
  emittedCount: number;
  currentObservation: PoseObservation | null;
  nextObservation: PoseObservation | null;
};

export type ReplaySimulator = {
  getSnapshot(): ReplaySnapshot;
  step(): PoseObservation | null;
  play(): PoseObservation[];
  accelerate(stepSize?: number): PoseObservation[];
  reset(): void;
};

export function createReplaySimulator(
  fixture: PoseObservationFixture,
): ReplaySimulator {
  let cursor = 0;
  let emittedCount = 0;
  let mode: ReplayMode = fixture.observations.length > 0 ? 'idle' : 'completed';
  let currentObservation: PoseObservation | null = null;

  function getSnapshot(): ReplaySnapshot {
    return {
      mode,
      cursor,
      emittedCount,
      currentObservation,
      nextObservation: fixture.observations[cursor] ?? null,
    };
  }

  function step(): PoseObservation | null {
    if (cursor >= fixture.observations.length) {
      mode = 'completed';
      currentObservation = null;
      return null;
    }

    const observation = fixture.observations[cursor];
    cursor += 1;
    emittedCount += 1;
    currentObservation = observation;
    mode = cursor >= fixture.observations.length ? 'completed' : 'idle';
    return observation;
  }

  function play(): PoseObservation[] {
    if (fixture.observations.length === 0) {
      mode = 'completed';
      currentObservation = null;
      return [];
    }

    mode = 'playing';
    const emitted: PoseObservation[] = [];
    let observation = step();
    while (observation) {
      emitted.push(observation);
      observation = step();
    }
    return emitted;
  }

  function accelerate(stepSize = 2): PoseObservation[] {
    if (stepSize <= 0) {
      throw new Error('stepSize must be positive');
    }

    const emitted: PoseObservation[] = [];

    while (cursor < fixture.observations.length) {
      const observation = fixture.observations[cursor];
      emitted.push(observation);
      currentObservation = observation;
      emittedCount += 1;
      cursor += stepSize;
    }

    mode = 'completed';
    if (cursor >= fixture.observations.length) {
      cursor = fixture.observations.length;
    }

    return emitted;
  }

  function reset() {
    cursor = 0;
    emittedCount = 0;
    currentObservation = null;
    mode = fixture.observations.length > 0 ? 'idle' : 'completed';
  }

  return {
    getSnapshot,
    step,
    play,
    accelerate,
    reset,
  };
}
