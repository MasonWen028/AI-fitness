import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { PoseObservation } from '../pose/poseContract';
import {
  buildSkeletonJoints,
  buildSkeletonSegments,
  type SkeletonSegment,
} from './skeletonOverlayGeometry';

export type SkeletonOverlayProps = {
  observation: PoseObservation | null;
  visible: boolean;
  width: number;
  height: number;
  personIndex?: number;
};

function createSegmentStyle(segment: SkeletonSegment) {
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angleRadians = Math.atan2(dy, dx);
  const angleDegrees = `${(angleRadians * 180) / Math.PI}deg`;

  return {
    left: segment.start.x,
    top: segment.start.y,
    width: length,
    transform: [{ rotate: angleDegrees }],
  } as const;
}

export function SkeletonOverlay({
  observation,
  visible,
  width,
  height,
  personIndex = 0,
}: SkeletonOverlayProps) {
  if (!visible) {
    return null;
  }

  const segments = buildSkeletonSegments(
    observation,
    width,
    height,
    personIndex,
  );
  const joints = buildSkeletonJoints(observation, width, height, personIndex);

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {segments.map((segment) => (
        <View
          key={`${segment.from}-${segment.to}`}
          style={[styles.segment, createSegmentStyle(segment)]}
        />
      ))}
      {joints.map(({ name, point }) => (
        <View
          key={name}
          style={[
            styles.joint,
            {
              left: point.x - JOINT_RADIUS,
              top: point.y - JOINT_RADIUS,
            },
          ]}
        />
      ))}
    </View>
  );
}

const SEGMENT_THICKNESS = 3;
const JOINT_RADIUS = 4;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  segment: {
    position: 'absolute',
    height: SEGMENT_THICKNESS,
    borderRadius: SEGMENT_THICKNESS,
    backgroundColor: '#38bdf8',
    transformOrigin: 'left center',
  },
  joint: {
    position: 'absolute',
    width: JOINT_RADIUS * 2,
    height: JOINT_RADIUS * 2,
    borderRadius: JOINT_RADIUS,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
});

export default SkeletonOverlay;
