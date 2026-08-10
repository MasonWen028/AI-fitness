package expo.modules.exerciseposecamera

import android.content.Context
import org.json.JSONObject
import java.security.MessageDigest

object PoseCameraModelDownloader {
  private const val MODEL_MANIFEST_ASSET = "pose_model_manifest.json"

  data class VerifiedModel(
    val assetPath: String,
    val modelVersion: String,
  )

  fun ensureBundledModel(context: Context, assetName: String): VerifiedModel {
    val manifest = readManifest(context)
    val expectedAssetPath = manifest.getString("assetPath")
    val expectedVersion = manifest.getString("modelVersion")
    val expectedSha256 = manifest.getString("sha256")

    require(assetName == expectedAssetPath) {
      "Model manifest asset mismatch: requested $assetName but manifest expects $expectedAssetPath"
    }

    val actualSha256 = context.assets.open(assetName).use { input ->
      val digest = MessageDigest.getInstance("SHA-256")
      val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
      var read = input.read(buffer)
      while (read >= 0) {
        if (read > 0) {
          digest.update(buffer, 0, read)
        }
        read = input.read(buffer)
      }
      digest.digest().joinToString(separator = "") { byte -> "%02X".format(byte) }
    }

    require(actualSha256 == expectedSha256) {
      "Model integrity mismatch for $assetName: expected $expectedSha256 but found $actualSha256"
    }

    return VerifiedModel(assetPath = assetName, modelVersion = expectedVersion)
  }

  private fun readManifest(context: Context): JSONObject {
    val manifestText = context.assets.open(MODEL_MANIFEST_ASSET).bufferedReader().use { it.readText() }
    return JSONObject(manifestText)
  }
}
