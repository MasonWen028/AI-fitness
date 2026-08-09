import type { PoseObservation } from '../pose/poseContract';

export const FIXTURE_FORMAT_VERSION = 'm0-fixture-v1' as const;

export type ExerciseFixtureType = 'bodyweight-squat';

export type FixtureMetadata = {
  recordedAt: string;
  source: 'synthetic' | 'device-capture' | 'replay-export';
  notes?: string;
  tags?: string[];
  frameIntervalMs: number;
};

export type PoseObservationFixture = {
  version: typeof FIXTURE_FORMAT_VERSION;
  exercise: ExerciseFixtureType;
  metadata: FixtureMetadata;
  observations: PoseObservation[];
};

export type FixtureValidationResult = {
  valid: boolean;
  errors: string[];
};
