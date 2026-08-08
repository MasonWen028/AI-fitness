import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useMemo, useReducer } from 'react';
import {
  AppState,
  type AppStateStatus,
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

    return {
      label: 'Use Manual Fallback',
      onPress: () => {
        dispatch({ type: 'enter_manual_fallback' });
      },
    };
  }, [requestPermission, showPermissionButton, state.lifecycle]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{subtitle}</Text>
        <Text style={styles.status}>{state.statusMessage}</Text>
      </View>

      {showPreview ? (
        <View style={styles.previewShell}>
          <CameraView
            facing="back"
            mode="picture"
            style={styles.preview}
            onMountError={() => {
              dispatch({
                type: 'camera_interrupted',
                reason: 'mount_error',
              });
            }}
          />
        </View>
      ) : (
        <View style={styles.placeholderShell}>
          <Text style={styles.placeholderTitle}>Camera preview inactive</Text>
          <Text style={styles.placeholderBody}>
            M0-B validates permission, lifecycle, interruption handling, and
            preview gating only.
          </Text>
        </View>
      )}

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
  previewShell: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  preview: {
    flex: 1,
  },
  placeholderShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 24,
    gap: 12,
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
