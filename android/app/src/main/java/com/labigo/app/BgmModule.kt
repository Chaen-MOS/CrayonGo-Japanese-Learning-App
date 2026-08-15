package com.labigo.app

import android.media.MediaPlayer
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class BgmModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val tracks = intArrayOf(
    R.raw.bgm_01,
    R.raw.bgm_02,
    R.raw.bgm_03,
    R.raw.bgm_04,
    R.raw.bgm_05,
    R.raw.bgm_06,
    R.raw.bgm_07,
  )
  private var player: MediaPlayer? = null
  private var trackIndex = 0
  private var enabled = true
  private var appActive = true
  private var volume = 0.5f
  private var ducked = false

  override fun getName(): String = "BgmPlayer"

  private fun effectiveVolume(): Float =
    if (ducked) minOf(volume, 0.16f) else volume

  private fun applyVolume() {
    val nextVolume = effectiveVolume()
    player?.setVolume(nextVolume, nextVolume)
  }

  private fun releasePlayer() {
    player?.setOnCompletionListener(null)
    player?.stop()
    player?.release()
    player = null
  }

  private fun playTrack(index: Int) {
    if (!enabled || !appActive || tracks.isEmpty()) {
      return
    }
    releasePlayer()
    trackIndex = ((index % tracks.size) + tracks.size) % tracks.size
    val nextPlayer = MediaPlayer.create(reactContext, tracks[trackIndex]) ?: return
    player = nextPlayer
    applyVolume()
    nextPlayer.setOnCompletionListener {
      trackIndex = (trackIndex + 1) % tracks.size
      playTrack(trackIndex)
    }
    nextPlayer.start()
  }

  @ReactMethod
  fun configure(nextEnabled: Boolean, nextVolume: Double, promise: Promise) {
    enabled = nextEnabled
    volume = nextVolume.coerceIn(0.0, 1.0).toFloat()
    try {
      applyVolume()
      if (enabled && appActive) {
        if (player == null) {
          playTrack(trackIndex)
        } else if (player?.isPlaying != true) {
          player?.start()
        }
      } else {
        player?.pause()
      }
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("BGM_CONFIGURE_FAILED", error.message ?: "Unable to configure BGM", error)
    }
  }

  @ReactMethod
  fun setEnabled(nextEnabled: Boolean, promise: Promise) {
    enabled = nextEnabled
    try {
      if (enabled && appActive) {
        if (player == null) {
          playTrack(trackIndex)
        } else {
          player?.start()
        }
      } else {
        player?.pause()
      }
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("BGM_ENABLED_FAILED", error.message ?: "Unable to update BGM enabled", error)
    }
  }

  @ReactMethod
  fun setVolume(nextVolume: Double, promise: Promise) {
    volume = nextVolume.coerceIn(0.0, 1.0).toFloat()
    try {
      applyVolume()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("BGM_VOLUME_FAILED", error.message ?: "Unable to update BGM volume", error)
    }
  }

  @ReactMethod
  fun setAppActive(nextActive: Boolean, promise: Promise) {
    appActive = nextActive
    try {
      if (appActive && enabled) {
        if (player == null) {
          playTrack(trackIndex)
        } else {
          player?.start()
        }
      } else {
        player?.pause()
      }
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("BGM_APP_STATE_FAILED", error.message ?: "Unable to update BGM app state", error)
    }
  }

  @ReactMethod
  fun setDucked(nextDucked: Boolean, promise: Promise) {
    ducked = nextDucked
    try {
      applyVolume()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("BGM_DUCK_FAILED", error.message ?: "Unable to duck BGM", error)
    }
  }

  @ReactMethod
  fun release(promise: Promise) {
    try {
      releasePlayer()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("BGM_RELEASE_FAILED", error.message ?: "Unable to release BGM", error)
    }
  }

  override fun invalidate() {
    releasePlayer()
    super.invalidate()
  }
}
