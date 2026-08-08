package expo.modules.exerciseposecamera

import android.annotation.SuppressLint
import android.content.Context
import android.os.SystemClock
import android.util.Size
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.core.UseCaseGroup
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.lifecycle.awaitInstance
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.components.containers.Landmark
import com.google.mediapipe.tasks.components.containers.NormalizedLandmark
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.io.Closeable
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong

@SuppressLint("ViewConstructor")
class ExercisePoseCameraView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext), Closeable {
  private val previewView = PreviewView(context)
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
  private val analysisExecutor: ExecutorService = Executors.newSingleThreadExecutor()
  private val onProviderStatus by EventDispatcher<Map<String, Any?>>()
  private val onPoseObservation by EventDispatcher<Map<String, Any?>>()
  private val onProviderError by EventDispatcher<Map<String, Any?>>()

  private var providerSessionId = AtomicLong(0)
  private var activeSessionId = 0L
  private var poseLandmarker: PoseLandmarker? = null
  private var cameraProvider: ProcessCameraProvider? = null
  private var camera: Camera? = null
  private var imageAnalysis: ImageAnalysis? = null
  private var preview: Preview? = null
  private var setupJob: Job? = null
  private var inferenceInFlight = AtomicBoolean(false)
  private var lastEmittedSequence = 0L
  private var currentSequence = 0L

  private val providerLoadAttempts = AtomicLong(0)
  private val providerLoadFailures = AtomicLong(0)
  private val framesReceived = AtomicLong(0)
  private val framesSubmitted = AtomicLong(0)
  private val framesDropped = AtomicLong(0)
  private val observationsProduced = AtomicLong(0)
  private val observationsWithLandmarks = AtomicLong(0)
  private val observationsWithoutLandmarks = AtomicLong(0)
  private val providerErrors = AtomicLong(0)
  private val trackingLossCount = AtomicLong(0)

  var active: Boolean = false
  var facing: String = "back"
  var mirrored: Boolean = false
  var modelAssetPath: String = DEFAULT_MODEL_ASSET_PATH
  var delegateName: String = DEFAULT_DELEGATE_NAME

  private var lastError: String? = null
  private var lastInferenceMs = 0L
  private var lastTimestampMs = 0L
  private var lastFrameId = 0L

  init {
    addView(previewView)
  }

  fun onPropsUpdated() {
    if (!active) {
      shutdown()
      return
    }

    if (setupJob?.isActive == true) {
      return
    }

    setupJob = scope.launch {
      startSession()
    }
  }

  private suspend fun startSession() {
    shutdownSession()

    activeSessionId = providerSessionId.incrementAndGet()
    currentSequence = 0
    lastEmittedSequence = 0
    lastError = null
    providerLoadAttempts.incrementAndGet()
    emitStatus()

    try {
      val bundledModelPath = PoseCameraModelDownloader.ensureBundledModel(context, modelAssetPath)
      val delegate = when (delegateName.uppercase()) {
        "GPU" -> Delegate.GPU
        else -> Delegate.CPU
      }

      poseLandmarker = PoseLandmarker.createFromOptions(
        context,
        PoseLandmarker.PoseLandmarkerOptions.builder()
          .setBaseOptions(
            BaseOptions.builder()
              .setDelegate(delegate)
              .setModelAssetPath(bundledModelPath)
              .build(),
          )
          .setRunningMode(RunningMode.LIVE_STREAM)
          .setNumPoses(1)
          .setMinPoseDetectionConfidence(DEFAULT_CONFIDENCE)
          .setMinTrackingConfidence(DEFAULT_CONFIDENCE)
          .setMinPosePresenceConfidence(DEFAULT_CONFIDENCE)
          .setResultListener { result, input ->
            handlePoseResult(activeSessionId, result, input.width, input.height)
          }
          .setErrorListener { error ->
            handleProviderError(activeSessionId, error.message ?: "Pose provider error")
          }
          .build(),
      )

      cameraProvider = ProcessCameraProvider.awaitInstance(context)
      bindCameraUseCases(activeSessionId)
      emitStatus()
    } catch (error: Exception) {
      providerLoadFailures.incrementAndGet()
      lastError = error.message ?: "Pose provider failed to initialize"
      emitProviderError(lastError ?: "Pose provider failed to initialize")
      emitStatus()
      shutdownSession()
    }
  }

  @SuppressLint("UnsafeOptInUsageError")
  private fun bindCameraUseCases(sessionId: Long) {
    val provider = cameraProvider ?: return

    val cameraSelector = CameraSelector.Builder()
      .requireLensFacing(
        if (facing == "front") CameraSelector.LENS_FACING_FRONT else CameraSelector.LENS_FACING_BACK,
      )
      .build()

    val resolutionSelector = ResolutionSelector.Builder()
      .setResolutionStrategy(
        ResolutionStrategy(Size(1280, 720), ResolutionStrategy.FALLBACK_RULE_CLOSEST_HIGHER_THEN_LOWER),
      )
      .build()

    preview = Preview.Builder()
      .setResolutionSelector(resolutionSelector)
      .build()
      .also {
        it.surfaceProvider = previewView.surfaceProvider
      }

    imageAnalysis = ImageAnalysis.Builder()
      .setResolutionSelector(resolutionSelector)
      .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
      .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
      .build()
      .also { analyzer ->
        analyzer.setAnalyzer(analysisExecutor) { imageProxy ->
          analyzeImage(sessionId, imageProxy)
        }
      }

    provider.unbindAll()
    camera = provider.bindToLifecycle(
      appContext.throwingActivity,
      cameraSelector,
      UseCaseGroup.Builder()
        .addUseCase(preview!!)
        .addUseCase(imageAnalysis!!)
        .build(),
    )
  }

  private fun analyzeImage(sessionId: Long, imageProxy: ImageProxy) {
    framesReceived.incrementAndGet()

    if (!active || sessionId != activeSessionId) {
      framesDropped.incrementAndGet()
      imageProxy.close()
      return
    }

    if (!inferenceInFlight.compareAndSet(false, true)) {
      framesDropped.incrementAndGet()
      imageProxy.close()
      return
    }

    val localFrameId = framesReceived.get()
    val timestampMs = SystemClock.elapsedRealtime()
    val rotationDegrees = imageProxy.imageInfo.rotationDegrees

    try {
      val bitmapBuffer = android.graphics.Bitmap.createBitmap(
        imageProxy.width,
        imageProxy.height,
        android.graphics.Bitmap.Config.ARGB_8888,
      )
      bitmapBuffer.copyPixelsFromBuffer(imageProxy.planes[0].buffer)
      val mpImage = BitmapImageBuilder(bitmapBuffer).build()
      framesSubmitted.incrementAndGet()
      lastTimestampMs = timestampMs
      lastFrameId = localFrameId
      poseLandmarker?.detectAsync(mpImage, timestampMs)
    } catch (error: Exception) {
      providerErrors.incrementAndGet()
      lastError = error.message ?: "Frame conversion failed"
      emitProviderError(lastError ?: "Frame conversion failed")
      inferenceInFlight.set(false)
    } finally {
      imageProxy.close()
    }
  }

  private fun handlePoseResult(
    sessionId: Long,
    result: PoseLandmarkerResult,
    imageWidth: Int,
    imageHeight: Int,
  ) {
    if (!active || sessionId != activeSessionId) {
      inferenceInFlight.set(false)
      return
    }

    val sequence = ++currentSequence
    if (sequence <= lastEmittedSequence) {
      inferenceInFlight.set(false)
      return
    }

    lastEmittedSequence = sequence
    lastInferenceMs = (SystemClock.elapsedRealtime() - result.timestampMs()).coerceAtLeast(0)
    observationsProduced.incrementAndGet()

    val people = result.landmarks().mapIndexed { index, landmarks ->
      val worldLandmarks = result.worldLandmarks().getOrNull(index)
      mapOf(
        "trackingId" to null,
        "imageLandmarks" to mapNormalizedLandmarks(landmarks),
        "worldLandmarks" to mapWorldLandmarks(worldLandmarks ?: emptyList()),
        "posePresence" to landmarks.firstOrNull()?.presence()?.orElse(0f)?.toDouble(),
      )
    }

    val landmarksAvailable = people.any { person ->
      val imageLandmarks = person["imageLandmarks"] as List<*>
      imageLandmarks.isNotEmpty()
    }

    if (landmarksAvailable) {
      observationsWithLandmarks.incrementAndGet()
    } else {
      observationsWithoutLandmarks.incrementAndGet()
    }

    onPoseObservation(
      mapOf(
        "sequence" to sequence.toDouble(),
        "timestampMs" to result.timestampMs().toDouble(),
        "landmarksAvailable" to landmarksAvailable,
        "landmarkCount" to (people.firstOrNull()?.get("imageLandmarks") as? List<*>)?.size?.toDouble() ?: 0.0,
        "frameId" to lastFrameId.toDouble(),
        "imageSize" to mapOf(
          "width" to imageWidth,
          "height" to imageHeight,
        ),
        "rotationDegrees" to normalizeRotation(0),
        "mirrored" to mirrored,
        "people" to people,
        "provider" to mapOf(
          "name" to PROVIDER_NAME,
          "modelVersion" to modelAssetPath,
          "delegate" to delegateName.uppercase(),
          "inferenceMs" to lastInferenceMs.toDouble(),
        ),
      ),
    )

    emitStatus()
    inferenceInFlight.set(false)
  }

  private fun handleProviderError(sessionId: Long, message: String) {
    if (sessionId != activeSessionId) {
      return
    }

    providerErrors.incrementAndGet()
    trackingLossCount.incrementAndGet()
    lastError = message
    emitProviderError(message)
    emitStatus()
    inferenceInFlight.set(false)
  }

  private fun mapNormalizedLandmarks(landmarks: List<NormalizedLandmark>): List<Map<String, Any?>> {
    return landmarks.mapIndexed { index, landmark ->
      mapOf(
        "name" to CANONICAL_LANDMARK_NAMES[index],
        "x" to landmark.x().toDouble(),
        "y" to landmark.y().toDouble(),
        "z" to landmark.z().toDouble(),
        "visibility" to landmark.visibility().orElse(null)?.toDouble(),
        "presence" to landmark.presence().orElse(null)?.toDouble(),
      )
    }
  }

  private fun mapWorldLandmarks(landmarks: List<Landmark>): List<Map<String, Any?>> {
    return landmarks.mapIndexed { index, landmark ->
      mapOf(
        "name" to CANONICAL_LANDMARK_NAMES[index],
        "x" to landmark.x().toDouble(),
        "y" to landmark.y().toDouble(),
        "z" to landmark.z().toDouble(),
        "visibility" to landmark.visibility().orElse(null)?.toDouble(),
        "presence" to landmark.presence().orElse(null)?.toDouble(),
      )
    }
  }

  private fun normalizeRotation(rotationDegrees: Int): Int {
    val normalized = ((rotationDegrees % 360) + 360) % 360
    return when (normalized) {
      0, 90, 180, 270 -> normalized
      else -> 0
    }
  }

  private fun emitProviderError(message: String) {
    onProviderError(mapOf("message" to message))
  }

  private fun emitStatus() {
    onProviderStatus(
      mapOf(
        "isAvailable" to (poseLandmarker != null),
        "providerName" to PROVIDER_NAME,
        "modelVersion" to modelAssetPath,
        "delegate" to delegateName.uppercase(),
        "isRunning" to (active && poseLandmarker != null),
        "lastError" to lastError,
        "health" to mapOf(
          "providerLoadAttempts" to providerLoadAttempts.get().toDouble(),
          "providerLoadFailures" to providerLoadFailures.get().toDouble(),
          "framesReceived" to framesReceived.get().toDouble(),
          "framesSubmitted" to framesSubmitted.get().toDouble(),
          "framesDropped" to framesDropped.get().toDouble(),
          "observationsProduced" to observationsProduced.get().toDouble(),
          "observationsWithLandmarks" to observationsWithLandmarks.get().toDouble(),
          "observationsWithoutLandmarks" to observationsWithoutLandmarks.get().toDouble(),
          "providerErrors" to providerErrors.get().toDouble(),
          "trackingLossCount" to trackingLossCount.get().toDouble(),
          "lastSequence" to lastEmittedSequence.toDouble(),
          "lastFrameId" to lastFrameId.toDouble(),
          "lastTimestampMs" to lastTimestampMs.toDouble(),
          "lastInferenceMs" to lastInferenceMs.toDouble(),
        ),
      ),
    )
  }

  fun shutdown() {
    active = false
    shutdownSession()
  }

  private fun shutdownSession() {
    activeSessionId = 0
    inferenceInFlight.set(false)
    imageAnalysis?.clearAnalyzer()
    imageAnalysis = null
    cameraProvider?.unbindAll()
    cameraProvider = null
    poseLandmarker?.close()
    poseLandmarker = null
    camera = null
    preview = null
    emitStatus()
  }

  override fun close() {
    shutdown()
    analysisExecutor.shutdownNow()
    setupJob?.cancel()
    scope.cancel()
  }

  companion object {
    const val DEFAULT_CONFIDENCE = 0.5F
    const val DEFAULT_MODEL_ASSET_PATH = "pose_landmarker_lite.task"
    const val DEFAULT_DELEGATE_NAME = "CPU"
    const val PROVIDER_NAME = "mediapipe"
  }
}
