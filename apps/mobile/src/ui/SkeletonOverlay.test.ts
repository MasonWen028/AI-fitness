import { describe, expect, it } from 'vitest';

import { createEmptyObservation, createSyntheticObservation } from '../pose/poseValidation';
import {
  buildSkeletonSegments,
  clampNormalizedCoordinate,
  projectLandmarkToOverlay,
  SQUAT_SKELETON_CONNECTIONS,
} from './skeletonOverlayGeometry';

describe('SkeletonOverlay helpers', () => {
  it('clamps normalized coordinates into overlay bounds', () => {
    expect(clampNormalizedCoordinate(-1)).toBe(0);
    expect(clampNormalizedCoordinate(0.25)).toBe(0.25);
    expect(clampNormalizedCoordinate(2)).toBe(1);
  });

  it('projects normalized landmarks into screen coordinates', () => {
    const point = projectLandmarkToOverlay(
      { name: 'left_hip', x: 0.25, y: 0.75 },
      200,
      400,
    );

    expect(point).toEqual({ x: 50, y: 300 });
  });

  it('builds bounded squat skeleton segments from an observation', () => {
    const observation = createSyntheticObservation(1, {
      left_shoulder: { x: 0.2, y: 0.2 },
      right_shoulder: { x: 0.8, y: 0.2 },
      left_hip: { x: 0.3, y: 0.5 },
      right_hip: { x: 0.7, y: 0.5 },
      left_knee: { x: 0.35, y: 0.75 },
      right_knee: { x: 0.65, y: 0.75 },
      left_ankle: { x: 0.35, y: 0.95 },
      right_ankle: { x: 0.65, y: 0.95 },
    });

    const segments = buildSkeletonSegments(observation, 300, 600);

    expect(segments).toHaveLength(SQUAT_SKELETON_CONNECTIONS.length);
    expect(segments[0]).toMatchObject({
      from: 'left_shoulder',
      to: 'right_shoulder',
      start: { x: 60, y: 120 },
      end: { x: 240, y: 120 },
    });
    expect(segments.every((segment) => segment.start.x >= 0 && segment.end.x <= 300)).toBe(true);
    expect(segments.every((segment) => segment.start.y >= 0 && segment.end.y <= 600)).toBe(true);
  });

  it('skips connections when either endpoint is missing', () => {
    const observation = createEmptyObservation({
      sequence: 2,
      landmarksAvailable: true,
      landmarkCount: 4,
      people: [
        {
          posePresence: 0.9,
          imageLandmarks: [
            { name: 'left_shoulder', x: 0.2, y: 0.2 },
            { name: 'left_hip', x: 0.3, y: 0.5 },
            { name: 'left_knee', x: 0.35, y: 0.75 },
            { name: 'left_ankle', x: 0.35, y: 0.95 },
          ],
        },
      ],
    });

    const segments = buildSkeletonSegments(observation, 300, 600);

    expect(segments.some((segment) => segment.from === 'right_shoulder' && segment.to === 'right_hip')).toBe(false);
    expect(segments.some((segment) => segment.from === 'right_hip' && segment.to === 'right_knee')).toBe(false);
    expect(segments).toHaveLength(3);
  });

  it('returns no segments when observations are unavailable or dimensions are invalid', () => {
    const observation = createSyntheticObservation(3, {});

    expect(buildSkeletonSegments(observation, 300, 600)).toEqual([]);
    expect(buildSkeletonSegments(null, 300, 600)).toEqual([]);
    expect(buildSkeletonSegments(observation, 0, 600)).toEqual([]);
  });
});
