package com.example.aiagent

import android.content.Context
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

object Updater {
    private const val REPO = "arka9890/Arka-creative-"

    fun checkLatest(context: Context, onResult: (tag: String?, downloadUrl: String?) -> Unit) {
        Thread {
            try {
                val connection = (URL("https://api.github.com/repos/$REPO/releases/latest").openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    setRequestProperty("Accept", "application/vnd.github+json")
                    connectTimeout = 10_000
                    readTimeout = 10_000
                }
                if (connection.responseCode !in 200..299) {
                    onResult(null, null); return@Thread
                }
                val body = connection.inputStream.bufferedReader().readText()
                val json = JSONObject(body)
                val tag = json.optString("tag_name", null)
                val assets = json.optJSONArray("assets")
                val url = if (assets != null && assets.length() > 0) assets.getJSONObject(0).optString("browser_download_url", null) else null
                onResult(tag, url)
            } catch (_: Exception) {
                onResult(null, null)
            }
        }.start()
    }
}
