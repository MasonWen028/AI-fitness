package expo.modules.exerciseposecamera

import android.content.Context
import java.io.File

object PoseCameraModelDownloader {
  fun ensureBundledModel(context: Context, assetName: String): String {
    context.assets.open(assetName).close()
    return assetName
  }
}
