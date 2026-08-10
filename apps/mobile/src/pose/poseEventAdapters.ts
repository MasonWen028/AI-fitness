import type { PoseObservation } from './poseContract';
import { VALID_ROTATIONS } from './poseContract';
import type { PoseProviderStatus } from './poseProviderStatus';

type NativeLandmark = {
  name: string;
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
};

type NativeObservation = {
  sequence: number;
  timestampMs: number;
  landmarksAvailable: boolean;
  landmarkCount: number;
  frameId: number;
  imageSize: { width: number; height: number };
  rotationDegrees: number;
  mirrored: boolean;
  people: Array<{
    trackingId?: string;
    imageLandmarks: NativeLandmark[];
    worldLandmarks?: NativeLandmark[];
    posePresence: number;
  }>;
  provider: {
    name: string;
    modelVersion: string;
    delegate: PoseObservation['provider']['delegate'] | string;
    inferenceMs: number;
  };
};

export function adaptNativePoseObservation(
  observation: NativeObservation,
): PoseObservation {
  return {
    sequence: observation.sequence,
    timestampMs: observation.timestampMs,
    landmarksAvailable: observation.landmarksAvailable,
    landmarkCount: observation.landmarkCount,
    frameId: observation.frameId,
    imageSize: observation.imageSize,
    rotationDegrees: normalizeRotation(observation.rotationDegrees),
    mirrored: observation.mirrored,
    people: observation.people.map((person) => ({
      trackingId: person.trackingId,
      imageLandmarks: person.imageLandmarks.map((landmark) => ({
        name: landmark.name as PoseObservation['people'][number]['imageLandmarks'][number]['name'],
        x: landmark.x,
        y: landmark.y,
        z: landmark.z,
        visibility: landmark.visibility ?? undefined,
        presence: landmark.presence ?? undefined,
      })),
      worldLandmarks: person.worldLandmarks?.map((landmark) => ({
        name: landmark.name as PoseObservation['people'][number]['imageLandmarks'][number]['name'],
        x: landmark.x,
        y: landmark.y,
        z: landmark.z,
        visibility: landmark.visibility ?? undefined,
        presence: landmark.presence ?? undefined,
      })),
      posePresence: person.posePresence,
    })),
    provider: {
      name: observation.provider.name,
      modelVersion: observation.provider.modelVersion,
      delegate: normalizeDelegate(observation.provider.delegate),
      inferenceMs: observation.provider.inferenceMs,
    },
  };
}

export function adaptNativePoseProviderStatus(
  status: PoseProviderStatus,
): PoseProviderStatus {
  return {
    ...status,
    delegate: normalizeDelegate(status.delegate),
  };
}

function normalizeRotation(rotationDegrees: number): 0 | 90 | 180 | 270 {
  const normalized = ((rotationDegrees % 360) + 360) % 360;
  if (VALID_ROTATIONS.includes(normalized as 0 | 90 | 180 | 270)) {
    return normalized as 0 | 90 | 180 | 270;
  }

  throw new Error(
    `Invalid canonical rotationDegrees ${rotationDegrees}. Expected one of ${VALID_ROTATIONS.join(', ')}.`,
  );
}

function normalizeDelegate(delegate: string): PoseProviderStatus['delegate'] {
  if (delegate === 'CPU' || delegate === 'GPU' || delegate === 'NPU') {
    return delegate;
  }

  return 'UNKNOWN';
}
