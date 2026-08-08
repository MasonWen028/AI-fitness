package expo.modules.exerciseposecamera

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExercisePoseCameraModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExercisePoseCamera")

    View(ExercisePoseCameraView::class) {
      Events("onProviderStatus", "onPoseObservation", "onProviderError")

      Prop("active") { view: ExercisePoseCameraView, active: Boolean? ->
        view.active = active ?: false
      }

      Prop("facing") { view: ExercisePoseCameraView, facing: String? ->
        view.facing = facing ?: "back"
      }

      Prop("mirrored") { view: ExercisePoseCameraView, mirrored: Boolean? ->
        view.mirrored = mirrored ?: false
      }

      Prop("modelAssetPath") { view: ExercisePoseCameraView, modelAssetPath: String? ->
        view.modelAssetPath = modelAssetPath ?: DEFAULT_MODEL_ASSET_PATH
      }

      Prop("delegate") { view: ExercisePoseCameraView, delegate: String? ->
        view.delegateName = delegate ?: DEFAULT_DELEGATE_NAME
      }

      OnViewDidUpdateProps { view: ExercisePoseCameraView ->
        view.onPropsUpdated()
      }

      OnViewDestroys { view: ExercisePoseCameraView ->
        view.shutdown()
      }
    }
  }
}
