import { useCameraPermissions } from 'expo-camera';
import { useEffect, useMemo, useReducer, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  Button,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PoseCameraView } from '../../modules/pose-camera';
import type { PoseProviderStatus } from '../pose/poseProviderStatus';
import { getUnavailablePoseProviderStatus } from '../pose/poseProviderStatus';
import type { PoseObservation } from '../pose/poseContract';
import {
  deriveInitialCameraState,
  reduceCameraScreenState,
} from './cameraState';

type CameraPreviewScreenProps = {
  title: string;
  subtitle: string;
};

export function CameraPreviewScreen({
  title,
  subtitle,
}: CameraPreviewScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, dispatch] = useReducer(
    reduceCameraScreenState,
    undefined,
    deriveInitialCameraState,
  );
  const [providerStatus, setProviderStatus] = useState<PoseProviderStatus>(
    getUnavailablePoseProviderStatus(Platform.OS),
  );
  const [lastObservation, setLastObservation] =
    useState<PoseObservation | null>(null);

  useEffect(() => {
    dispatch({
      type: 'permission_snapshot',
      snapshot: permission
        ? {
            isLoading: false,
            granted: permission.granted,
            canAskAgain: permission.canAskAgain,
          }
        : null,
    });
  }, [permission]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState !== 'active' && state.lifecycle === 'preview_active') {
          dispatch({
            type: 'camera_interrupted',
            reason: 'backgrounded',
          });
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [state.lifecycle]);

  const showPermissionButton =
    state.permission !== 'granted' && state.canRequestPermission;

  const showPreview = state.lifecycle === 'preview_active';

  const primaryAction = useMemo(() => {
    if (showPermissionButton) {
      return {
        label: 'Grant Camera Permission',
        onPress: async () => {
          dispatch({ type: 'request_permission_started' });
          await requestPermission();
        },
      };
    }

    if (state.lifecycle === 'ready_to_setup') {
      return {
        label: 'Start Camera',
        onPress: () => {
          dispatch({ type: 'start_preview' });
        },
      };
    }

    if (state.lifecycle === 'preview_interrupted') {
      return {
        label: 'Resume Camera Preview',
        onPress: () => {
          dispatch({ type: 'start_preview' });
        },
      };
    }

    if (state.lifecycle === 'manual_fallback' && state.permission === 'granted') {
      return {
        label: 'Return To Camera Setup',
        onPress: () => {
          dispatch({
            type: 'permission_snapshot',
            snapshot: {
              isLoading: false,
              granted: true,
              canAskAgain: permission?.canAskAgain ?? false,
            },
          });
        },
      };
    }

    return {
      label: 'Use Manual Fallback',
      onPress: () => {
        dispatch({ type: 'enter_manual_fallback' });
      },
    };
  }, [permission?.canAskAgain, requestPermission, showPermissionButton, state.lifecycle, state.permission]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{subtitle}</Text>
        <Text style={styles.status}>{state.statusMessage}</Text>
        <Text style={styles.providerDetail}>
          Lifecycle: {state.lifecycle} · Permission: {state.permission} · Can
          request: {state.canRequestPermission ? 'yes' : 'no'}
        </Text>
        <Text style={styles.providerDetail}>
          Snapshot: granted={permission?.granted ? 'true' : 'false'} · canAskAgain=
          {permission?.canAskAgain ? 'true' : 'false'}
        </Text>
        <Text style={styles.providerStatus}>
          Provider: {providerStatus.providerName} · {providerStatus.delegate} ·{' '}
          {providerStatus.isAvailable ? 'available' : 'unavailable'}
        </Text>
        <Text style={styles.providerDetail}>
          Model: {providerStatus.modelVersion} · Received:{' '}
          {providerStatus.health.framesReceived} · Dropped:{' '}
          {providerStatus.health.framesDropped}
        </Text>
        <Text style={styles.providerDetail}>
          Produced: {providerStatus.health.observationsProduced} · With
          landmarks: {providerStatus.health.observationsWithLandmarks} ·
          Without: {providerStatus.health.observationsWithoutLandmarks}
        </Text>
        <Text style={styles.providerDetail}>
          Last sequence: {providerStatus.health.lastSequence} · Last frame:{' '}
          {providerStatus.health.lastFrameId} · Last ts:{' '}
          {providerStatus.health.lastTimestampMs}
        </Text>
        <Text style={styles.providerDetail}>
          Inference: {providerStatus.health.lastInferenceMs}ms · Errors:{' '}
          {providerStatus.health.providerErrors}
        </Text>
        {providerStatus.lastError ? (
          <Text style={styles.providerError}>{providerStatus.lastError}</Text>
        ) : null}
        {lastObservation ? (
          <Text style={styles.providerDetail}>
            Sequence {lastObservation.sequence} · Landmarks:{' '}
            {lastObservation.landmarksAvailable ? 'available' : 'unavailable'} ·
            Count: {lastObservation.landmarkCount}
          </Text>
        ) : null}
      </View>

      <View style={styles.previewShell}>
        <PoseCameraView
          active={state.permission === 'granted'}
          delegate="CPU"
          facing="back"
          mirrored={false}
          modelAssetPath="pose_landmarker_lite.task"
          style={styles.preview}
          onProviderStatus={(event) => {
            setProviderStatus(event.nativeEvent);
          }}
          onPoseObservation={(event) => {
            setLastObservation(event.nativeEvent);
          }}
          onProviderError={(event) => {
            setProviderStatus((current) => ({
              ...current,
              lastError: event.nativeEvent.message,
            }));
          }}
        />
        {!showPreview ? (
          <View style={styles.previewOverlay}>
            <Text style={styles.placeholderTitle}>Camera preview inactive</Text>
            <Text style={styles.placeholderBody}>
              M0-C wires a native pose provider boundary, provider metadata, and
              health status into the existing preview shell.
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button onPress={primaryAction.onPress} title={primaryAction.label} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1020',
    padding: 24,
    gap: 24,
  },
  header: {
    gap: 12,
    paddingTop: 12,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    color: '#cbd5e1',
    fontSize: 16,
    textAlign: 'center',
  },
  status: {
    color: '#93c5fd',
    fontSize: 14,
    textAlign: 'center',
  },
  providerStatus: {
    color: '#e2e8f0',
    fontSize: 13,
    textAlign: 'center',
  },
  providerDetail: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  providerError: {
    color: '#fca5a5',
    fontSize: 12,
    textAlign: 'center',
  },
  previewShell: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
    position: 'relative',
  },
  preview: {
    flex: 1,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: 'rgba(11, 16, 32, 0.72)',
  },
  placeholderTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholderBody: {
    color: '#cbd5e1',
    fontSize: 15,
    textAlign: 'center',
  },
  actions: {
    paddingBottom: 8,
  },
});
