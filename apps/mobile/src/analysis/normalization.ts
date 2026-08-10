import type {
  Landmark,
  LandmarkName,
  PoseObservation,
} from '../pose/poseContract';
import { LANDMARK_NAMES, SQUAT_CRITICAL_LANDMARKS } from '../pose/poseContract';
import {
  getLandmarksByNames,
  hasCriticalLandmarks,
} from '../pose/poseValidation';

export type Point3D = {
  x: number;
  y: number;
  z: number;
};

export type NormalizedPoint = Point3D & {
  name: LandmarkName;
  visibility: number;
  presence: number;
};

export type NormalizedFrame = {
  sequence: number;
  timestampMs: number;
  frameId: number;
  landmarks: ReadonlyMap<LandmarkName, NormalizedPoint>;
  origin: { x: number; y: number; z: number };
  scaleFactor: number;
  quality: FrameQuality;
};

export type FrameQuality = {
  hasCriticalLandmarks: boolean;
  minVisibility: number;
  averageVisibility: number;
  missingLandmarks: LandmarkName[];
  lowVisibilityLandmarks: LandmarkName[];
  personDetected: boolean;
  overallScore: number;
};

const DEFAULT_VISIBILITY = 0.5;
const DEFAULT_PRESENCE = 0.5;

export function normalizeObservation(
  observation: PoseObservation,
  personIndex = 0,
  minVisibility = DEFAULT_VISIBILITY,
): NormalizedFrame | null {
  const person = observation.people[personIndex];
  if (!person) return null;

  const rawLandmarks = canonicalizeCoordinates(
    person.imageLandmarks,
    observation.rotationDegrees,
    observation.mirrored,
  );

  const landmarkMap = new Map<LandmarkName, NormalizedPoint>();
  for (const lm of rawLandmarks) {
    landmarkMap.set(lm.name, lm);
  }

  const origin = computeHipMidpoint(landmarkMap);
  const scaleFactor = computeScaleFactor(landmarkMap);

  const normalizedLandmarks = new Map<LandmarkName, NormalizedPoint>();
  for (const [name, lm] of landmarkMap) {
    normalizedLandmarks.set(name, {
      name,
      x: (lm.x - origin.x) / scaleFactor,
      y: (lm.y - origin.y) / scaleFactor,
      z: (lm.z - origin.z) / scaleFactor,
      visibility: lm.visibility,
      presence: lm.presence,
    });
  }

  const quality = assessQuality(observation, personIndex, minVisibility);

  return {
    sequence: observation.sequence,
    timestampMs: observation.timestampMs,
    frameId: observation.frameId,
    landmarks: normalizedLandmarks,
    origin,
    scaleFactor,
    quality,
  };
}

function canonicalizeCoordinates(
  landmarks: Landmark[],
  rotation: 0 | 90 | 180 | 270,
  mirrored: boolean,
): NormalizedPoint[] {
  return landmarks.map((lm) => {
    let x = clamp(lm.x, 0, 1);
    let y = clamp(lm.y, 0, 1);

    if (mirrored) {
      x = 1 - x;
    }

    let nx: number;
    let ny: number;
    switch (rotation) {
      case 0:
        nx = x;
        ny = y;
        break;
      case 90:
        nx = 1 - y;
        ny = x;
        break;
      case 180:
        nx = 1 - x;
        ny = 1 - y;
        break;
      case 270:
        nx = y;
        ny = 1 - x;
        break;
    }

    return {
      name: lm.name,
      x: clamp(nx, 0, 1),
      y: clamp(ny, 0, 1),
      z: Number.isFinite(lm.z) ? (lm.z ?? 0) : 0,
      visibility: clamp(lm.visibility ?? DEFAULT_VISIBILITY, 0, 1),
      presence: clamp(lm.presence ?? DEFAULT_PRESENCE, 0, 1),
    };
  });
}

function computeHipMidpoint(landmarks: Map<LandmarkName, NormalizedPoint>): {
  x: number;
  y: number;
  z: number;
} {
  const leftHip = landmarks.get('left_hip');
  const rightHip = landmarks.get('right_hip');

  if (leftHip && rightHip) {
    return {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
      z: (leftHip.z + rightHip.z) / 2,
    };
  }

  if (leftHip) {
    return { x: leftHip.x, y: leftHip.y, z: leftHip.z };
  }
  if (rightHip) {
    return { x: rightHip.x, y: rightHip.y, z: rightHip.z };
  }

  let sumX = 0,
    sumY = 0,
    sumZ = 0,
    count = 0;
  for (const lm of landmarks.values()) {
    if (lm.visibility > 0) {
      sumX += lm.x;
      sumY += lm.y;
      sumZ += lm.z;
      count++;
    }
  }
  if (count === 0) return { x: 0.5, y: 0.5, z: 0 };
  return { x: sumX / count, y: sumY / count, z: sumZ / count };
}

function computeScaleFactor(
  landmarks: Map<LandmarkName, NormalizedPoint>,
): number {
  const leftHip = landmarks.get('left_hip');
  const rightHip = landmarks.get('right_hip');

  if (leftHip && rightHip) {
    const dx = leftHip.x - rightHip.x;
    const dy = leftHip.y - rightHip.y;
    const dz = leftHip.z - rightHip.z;
    const hipWidth = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (hipWidth > 1e-6) {
      return hipWidth;
    }
  }

  const leftShoulder = landmarks.get('left_shoulder');
  const rightShoulder = landmarks.get('right_shoulder');
  if (leftShoulder && rightShoulder) {
    const dx = leftShoulder.x - rightShoulder.x;
    const dy = leftShoulder.y - rightShoulder.y;
    const dz = leftShoulder.z - rightShoulder.z;
    const shoulderWidth = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (shoulderWidth > 1e-6) {
      return shoulderWidth;
    }
  }

  const leftHip2 = landmarks.get('left_hip');
  const leftShoulder2 = landmarks.get('left_shoulder');
  if (leftHip2 && leftShoulder2) {
    const dx = leftShoulder2.x - leftHip2.x;
    const dy = leftShoulder2.y - leftHip2.y;
    const dz = leftShoulder2.z - leftHip2.z;
    const torsoLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (torsoLength > 1e-6) {
      return torsoLength;
    }
  }

  return 1;
}

export function assessQuality(
  observation: PoseObservation,
  personIndex = 0,
  minVisibility = DEFAULT_VISIBILITY,
): FrameQuality {
  const person = observation.people[personIndex];
  if (
    !person ||
    !observation.landmarksAvailable ||
    person.imageLandmarks.length === 0
  ) {
    return {
      hasCriticalLandmarks: false,
      minVisibility: 0,
      averageVisibility: 0,
      missingLandmarks: [...SQUAT_CRITICAL_LANDMARKS],
      lowVisibilityLandmarks: [],
      personDetected: false,
      overallScore: 0,
    };
  }

  const criticalResults = getLandmarksByNames(
    observation,
    SQUAT_CRITICAL_LANDMARKS,
    personIndex,
  );
  const missingLandmarks: LandmarkName[] = [];
  const lowVisibilityLandmarks: LandmarkName[] = [];

  for (const { name, landmark } of criticalResults) {
    if (!landmark) {
      missingLandmarks.push(name);
    } else if (
      landmark.visibility !== undefined &&
      landmark.visibility < minVisibility
    ) {
      lowVisibilityLandmarks.push(name);
    }
  }

  const allVisibilities = person.imageLandmarks
    .map((lm) => clamp(lm.visibility ?? DEFAULT_VISIBILITY, 0, 1))
    .filter((v) => v > 0);

  const minVis = allVisibilities.length > 0 ? Math.min(...allVisibilities) : 0;
  const avgVis =
    allVisibilities.length > 0
      ? allVisibilities.reduce((a, b) => a + b, 0) / allVisibilities.length
      : 0;

  const hasCritical = hasCriticalLandmarks(
    observation,
    SQUAT_CRITICAL_LANDMARKS,
    personIndex,
    minVisibility,
  );
  const personDetected = person.posePresence > 0.3;

  const criticalScore =
    (SQUAT_CRITICAL_LANDMARKS.length -
      missingLandmarks.length -
      lowVisibilityLandmarks.length) /
    SQUAT_CRITICAL_LANDMARKS.length;
  const overallScore = personDetected ? criticalScore * avgVis : 0;

  return {
    hasCriticalLandmarks: hasCritical,
    minVisibility: minVis,
    averageVisibility: avgVis,
    missingLandmarks,
    lowVisibilityLandmarks,
    personDetected,
    overallScore,
  };
}

export function getNormalizedLandmark(
  frame: NormalizedFrame,
  name: LandmarkName,
): NormalizedPoint | undefined {
  return frame.landmarks.get(name);
}

export function getNormalizedLandmarks(
  frame: NormalizedFrame,
  names: readonly LandmarkName[],
): Array<{ name: LandmarkName; point: NormalizedPoint | undefined }> {
  return names.map((name) => ({ name, point: frame.landmarks.get(name) }));
}

export function computeAngle2D(
  a: Point3D,
  vertex: Point3D,
  c: Point3D,
): number {
  const v1x = a.x - vertex.x;
  const v1y = a.y - vertex.y;
  const v2x = c.x - vertex.x;
  const v2y = c.y - vertex.y;

  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

  if (mag1 < 1e-10 || mag2 < 1e-10) return 0;

  const cos = clamp(dot / (mag1 * mag2), -1, 1);
  return Math.acos(cos) * (180 / Math.PI);
}

export function computeAngle3D(
  a: Point3D,
  vertex: Point3D,
  c: Point3D,
): number {
  const v1x = a.x - vertex.x;
  const v1y = a.y - vertex.y;
  const v1z = a.z - vertex.z;
  const v2x = c.x - vertex.x;
  const v2y = c.y - vertex.y;
  const v2z = c.z - vertex.z;

  const dot = v1x * v2x + v1y * v2y + v1z * v2z;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y + v2z * v2z);

  if (mag1 < 1e-10 || mag2 < 1e-10) return 0;

  const cos = clamp(dot / (mag1 * mag2), -1, 1);
  return Math.acos(cos) * (180 / Math.PI);
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export const SQUAT_LANDMARKS = SQUAT_CRITICAL_LANDMARKS;
export const ALL_LANDMARK_NAMES = LANDMARK_NAMES;
