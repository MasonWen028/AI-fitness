import { useCameraPermissions } from 'expo-camera';
import { useEffect, useMemo, useReducer, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  Button,
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { PoseCameraView } from '../../modules/pose-camera';
import type { PoseProviderStatus } from '../pose/poseProviderStatus';
import { getUnavailablePoseProviderStatus } from '../pose/poseProviderStatus';
import type { PoseObservation } from '../pose/poseContract';
import { adaptNativePoseObservation } from '../pose/poseEventAdapters';
import { validatePoseObservation } from '../pose/poseValidation';
import {
  DEFAULT_POSE_MODEL_ASSET_PATH,
  DEFAULT_POSE_MODEL_VERSION,
} from '../pose/poseModelManifest';
import SkeletonOverlay from '../ui/SkeletonOverlay';
import {
  deriveInitialCameraState,
  reduceCameraScreenState,
} from './cameraState';
import {
  createInitialLiveAnalysisSnapshot,
  processLiveObservation,
  type LiveAnalysisSnapshot,
} from './analysisPipeline';
import {
  isTrackableObservation,
  shouldAdvanceAnalysis,
  shouldAttemptTrackingReacquisition,
  shouldEnterManualFallbackFromProviderMessage,
  shouldKeepNativeCameraActive,
} from './cameraRuntime';

type CameraPreviewScreenProps = {
  title: string;
  subtitle: string;
};

const OVERLAY_WIDTH = 320;
const OVERLAY_HEIGHT = 480;

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
  const [analysis, setAnalysis] = useState<LiveAnalysisSnapshot>(
    createInitialLiveAnalysisSnapshot(),
  );
  const [overlayEnabled, setOverlayEnabled] = useState(true);

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
        if (nextState !== 'active' && state.lifecycle === 'ACTIVE') {
          dispatch({ type: 'pause_requested' });
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [state.lifecycle]);

  useEffect(() => {
    if (
      state.lifecycle === 'MANUAL_FALLBACK' ||
      state.lifecycle === 'SET_COMPLETE' ||
      state.lifecycle === 'ERROR'
    ) {
      setAnalysis(createInitialLiveAnalysisSnapshot());
    }
  }, [state.lifecycle]);

  const showPermissionButton =
    state.permission !== 'granted' && state.canRequestPermission;

  const showPreview = shouldKeepNativeCameraActive(state.lifecycle);
  const nativeCameraActive = shouldKeepNativeCameraActive(state.lifecycle);

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

    switch (state.lifecycle) {
      case 'READY_TO_SETUP':
        return {
          label: 'Start Camera Setup',
          onPress: () => {
            dispatch({ type: 'start_setup' });
          },
        };
      case 'POSITIONING':
        return {
          label: 'Validate Positioning',
          onPress: () => {
            dispatch({ type: 'setup_quality_eligible' });
          },
        };
      case 'CALIBRATING':
        return {
          label: 'Finish Calibration',
          onPress: () => {
            dispatch({ type: 'calibration_passed' });
          },
        };
      case 'READY':
        return {
          label: 'Start Countdown',
          onPress: () => {
            dispatch({ type: 'start_countdown' });
          },
        };
      case 'COUNTDOWN':
        return {
          label: 'Enter Active Set',
          onPress: () => {
            dispatch({ type: 'countdown_completed' });
          },
        };
      case 'ACTIVE':
      case 'TRACKING_LOST':
      case 'PAUSED':
        return {
          label: 'End Set',
          onPress: () => {
            dispatch({ type: 'set_completed' });
          },
        };
      case 'ERROR':
        return {
          label: 'Retry Setup',
          onPress: () => {
            dispatch({ type: 'retry_setup' });
          },
        };
      case 'MANUAL_FALLBACK':
        if (state.permission === 'granted') {
          return {
            label: 'Return To Setup',
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
        break;
      default:
        break;
    }

    return {
      label: 'Use Manual Fallback',
      onPress: () => {
        dispatch({ type: 'enter_manual_fallback' });
      },
    };
  }, [
    permission?.canAskAgain,
    requestPermission,
    showPermissionButton,
    state.lifecycle,
    state.permission,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{subtitle}</Text>
        <Text style={styles.status}>{state.statusMessage}</Text>
        <Text style={styles.providerDetail}>
          Lifecycle: {state.lifecycle} · Cause: {state.cause} · Permission:{' '}
          {state.permission}
        </Text>
        <Text style={styles.providerDetail}>
          Snapshot: granted={permission?.granted ? 'true' : 'false'} ·
          canAskAgain=
          {permission?.canAskAgain ? 'true' : 'false'}
        </Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Skeleton overlay</Text>
          <Switch
            accessibilityLabel="Toggle skeleton overlay"
            onValueChange={setOverlayEnabled}
            value={overlayEnabled}
          />
        </View>
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
          Phase: {analysis.phaseState?.phase ?? 'n/a'} · Completed reps:{' '}
          {analysis.repState.completedReps.length} · Incomplete reps:{' '}
          {analysis.repState.incompleteReps.length}
        </Text>
        <Text style={styles.providerDetail}>
          Feedback: {analysis.feedback?.key ?? 'none'} · Faults:{' '}
          {analysis.faults
            .map((fault) => `${fault.code}:${fault.status}`)
            .join(', ') || 'none'}
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
          active={nativeCameraActive}
          delegate="CPU"
          facing="back"
          mirrored={false}
          modelAssetPath={DEFAULT_POSE_MODEL_ASSET_PATH}
          style={styles.preview}
          onProviderStatus={(event) => {
            const nextStatus = event.nativeEvent;
            setProviderStatus(nextStatus);

            if (
              shouldEnterManualFallbackFromProviderMessage(nextStatus.lastError)
            ) {
              dispatch({
                type: 'enter_manual_fallback',
                cause: 'manual_fallback_required',
              });
              return;
            }

            if (
              state.lifecycle === 'POSITIONING' &&
              nextStatus.health.observationsWithLandmarks > 0
            ) {
              dispatch({ type: 'setup_quality_eligible' });
            }

            if (
              state.lifecycle === 'CALIBRATING' &&
              nextStatus.health.observationsWithLandmarks > 0
            ) {
              dispatch({ type: 'calibration_passed' });
            }
          }}
          onPoseObservation={(event) => {
            try {
              const observation = adaptNativePoseObservation(
                event.nativeEvent as never,
              );
              const validation = validatePoseObservation(observation);
              if (!validation.valid) {
                dispatch({ type: 'tracking_lost' });
                setProviderStatus((current) => ({
                  ...current,
                  lastError: `Invalid PoseObservation: ${validation.errors.join('; ')}`,
                }));
                return;
              }

              setLastObservation(observation);

              if (
                state.lifecycle === 'COUNTDOWN' &&
                !isTrackableObservation(observation)
              ) {
                dispatch({ type: 'countdown_quality_lost' });
                return;
              }

              if (shouldAdvanceAnalysis(state.lifecycle)) {
                const nextAnalysis = processLiveObservation(
                  analysis,
                  observation,
                );
                setAnalysis(nextAnalysis);

                if (nextAnalysis.phaseState?.phase === 'TRACKING_LOST') {
                  dispatch({ type: 'tracking_lost' });
                }
                return;
              }

              if (shouldAttemptTrackingReacquisition(state.lifecycle)) {
                const nextAnalysis = processLiveObservation(
                  analysis,
                  observation,
                );
                setAnalysis(nextAnalysis);
                if (nextAnalysis.phaseState?.phase !== 'TRACKING_LOST') {
                  dispatch({ type: 'tracking_reacquired' });
                }
              }
            } catch (error) {
              setProviderStatus((current) => ({
                ...current,
                lastError:
                  error instanceof Error
                    ? error.message
                    : 'Pose observation adaptation failed',
              }));
              dispatch({
                type: 'enter_manual_fallback',
                cause: 'manual_fallback_required',
              });
            }
          }}
          onProviderError={(event) => {
            const message = event.nativeEvent.message;
            setProviderStatus((current) => ({
              ...current,
              lastError: message,
            }));
            dispatch({ type: 'technical_error' });
          }}
        />
        <SkeletonOverlay
          height={OVERLAY_HEIGHT}
          observation={lastObservation}
          visible={showPreview && overlayEnabled}
          width={OVERLAY_WIDTH}
        />
        {!showPreview ? (
          <View style={styles.previewOverlay}>
            <Text style={styles.placeholderTitle}>Camera preview inactive</Text>
            <Text style={styles.placeholderBody}>
              R2 keeps the native camera bounded to the explicit lifecycle and
              only advances analysis while ACTIVE.
            </Text>
            <Text style={styles.placeholderBody}>
              Expected model: {DEFAULT_POSE_MODEL_VERSION}
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  toggleLabel: {
    color: '#e2e8f0',
    fontSize: 13,
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
