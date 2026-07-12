package com.labigo.app

import android.net.Uri
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

class NativeFileReaderModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "NativeFileReader"

  @ReactMethod
  fun readText(uriString: String, promise: Promise) {
    try {
      val uri = Uri.parse(uriString)
      val bytes = when (uri.scheme) {
        "content" -> reactContext.contentResolver.openInputStream(uri)?.use { it.readBytes() }
        "file" -> {
          val path = uri.path ?: throw IllegalArgumentException("File URI has no path")
          File(path).readBytes()
        }
        null, "" -> File(uriString).readBytes()
        else -> reactContext.contentResolver.openInputStream(uri)?.use { it.readBytes() }
      } ?: throw IllegalArgumentException("Unable to open selected file")

      promise.resolve(bytes.toString(Charsets.UTF_8))
    } catch (error: Exception) {
      promise.reject("FILE_READ_FAILED", error.message ?: "Unable to read selected file", error)
    }
  }
}
