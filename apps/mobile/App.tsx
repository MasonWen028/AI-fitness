import { StatusBar } from 'expo-status-bar';

import { CameraPreviewScreen } from './src/camera/CameraPreviewScreen';
import { getM0ShellCopy } from './src/shell/m0Shell';

export default function App() {
  const copy = getM0ShellCopy();

  return (
    <>
      <StatusBar style="auto" />
      <CameraPreviewScreen title={copy.title} subtitle={copy.subtitle} />
    </>
  );
}
