package com.example.aiagent

import android.content.Context
import android.os.Bundle
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate

class MainActivity : AppCompatActivity() {

    private lateinit var inputPrompt: EditText
    private lateinit var inputBaseUrl: EditText
    private lateinit var inputApiKey: EditText
    private lateinit var inputModel: EditText
    private lateinit var textStatus: TextView
    private lateinit var textResult: TextView
    private lateinit var webView: WebView

    private val nativeLib = NativeLib()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val toolbar = findViewById<androidx.appcompat.widget.Toolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)

        inputPrompt = findViewById(R.id.input_prompt)
        inputBaseUrl = findViewById(R.id.input_base_url)
        inputApiKey = findViewById(R.id.input_api_key)
        inputModel = findViewById(R.id.input_model)
        textStatus = findViewById(R.id.text_status)
        textResult = findViewById(R.id.text_result)
        webView = findViewById(R.id.webview_omniroute)

        setupWebView()

        if (!nativeLib.isLoaded) {
            showStatus("Native library not loaded")
            showResult("Warning: Rust native engine could not be loaded. JNI calls will fail.")
        }

        // Language switcher
        findViewById<Button>(R.id.btn_lang_en).setOnClickListener {
            setLocale("en")
            recreate()
        }
        findViewById<Button>(R.id.btn_lang_id).setOnClickListener {
            setLocale("id")
            recreate()
        }

        // Theme switcher
        findViewById<Button>(R.id.btn_theme_light).setOnClickListener {
            AppCompatDelegate.setDefaultNightMode(
                AppCompatDelegate.MODE_NIGHT_NO
            )
            recreate()
        }
        findViewById<Button>(R.id.btn_theme_dark).setOnClickListener {
            AppCompatDelegate.setDefaultNightMode(
                AppCompatDelegate.MODE_NIGHT_YES
            )
            recreate()
        }

        // Save Omniroute config (native EditText path)
        findViewById<Button>(R.id.btn_save_config).setOnClickListener {
            val baseUrl = inputBaseUrl.text.toString()
            val apiKey = inputApiKey.text.toString()
            val model = inputModel.text.toString()
            if (baseUrl.isBlank()) {
                showResult(getString(R.string.msg_enter_prompt))
                return@setOnClickListener
            }
            if (!nativeLib.isLoaded) {
                showResult("Native lib not loaded — cannot configure")
                return@setOnClickListener
            }
            saveConfigAndApply(baseUrl, apiKey, model)
            showResult(getString(R.string.msg_config_saved))
        }

        // Plan
        findViewById<Button>(R.id.btn_plan).setOnClickListener {
            val prompt = inputPrompt.text.toString()
            if (prompt.isBlank()) {
                showResult(getString(R.string.msg_enter_prompt))
                return@setOnClickListener
            }
            if (!nativeLib.isLoaded) {
                showResult("Native lib not loaded")
                return@setOnClickListener
            }
            showStatus(getString(R.string.status_planning))
            val result = nativeLib.planVideo(prompt)
            showStatus(getString(R.string.status_done))
            showResult(result ?: "")
        }

        // Generate image
        findViewById<Button>(R.id.btn_generate_image).setOnClickListener {
            val prompt = inputPrompt.text.toString()
            if (prompt.isBlank()) {
                showResult(getString(R.string.msg_enter_prompt))
                return@setOnClickListener
            }
            if (!nativeLib.isLoaded) {
                showResult("Native lib not loaded")
                return@setOnClickListener
            }
            showStatus(getString(R.string.status_generating))
            val result = nativeLib.generateImage(prompt)
            showStatus(getString(R.string.status_done))
            showResult(result ?: "")
        }

        // Edit video
        findViewById<Button>(R.id.btn_edit_video).setOnClickListener {
            val prompt = inputPrompt.text.toString()
            if (prompt.isBlank()) {
                showResult(getString(R.string.msg_enter_prompt))
                return@setOnClickListener
            }
            if (!nativeLib.isLoaded) {
                showResult("Native lib not loaded")
                return@setOnClickListener
            }
            showStatus(getString(R.string.status_editing))
            val result = nativeLib.editVideo(prompt)
            showStatus(getString(R.string.status_done))
            showResult(result ?: "")
        }

        // Render video
        findViewById<Button>(R.id.btn_render_video).setOnClickListener {
            val html = inputPrompt.text.toString()
            if (html.isBlank()) {
                showResult(getString(R.string.msg_enter_prompt))
                return@setOnClickListener
            }
            if (!nativeLib.isLoaded) {
                showResult("Native lib not loaded")
                return@setOnClickListener
            }
            showStatus(getString(R.string.status_rendering))
            val result = nativeLib.renderVideo(html)
            showStatus(getString(R.string.status_done))
            showResult(result ?: "")
        }

        // Run pipeline
        findViewById<Button>(R.id.btn_run_pipeline).setOnClickListener {
            val prompt = inputPrompt.text.toString()
            if (prompt.isBlank()) {
                showResult(getString(R.string.msg_enter_prompt))
                return@setOnClickListener
            }
            if (!nativeLib.isLoaded) {
                showResult("Native lib not loaded")
                return@setOnClickListener
            }
            showStatus(getString(R.string.status_planning))
            val result = nativeLib.runPipeline(prompt)
            showStatus(getString(R.string.status_done))
            showResult(getString(R.string.msg_pipeline_complete, result ?: ""))
        }
    }

    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            cacheMode = WebSettings.LOAD_NO_CACHE
        }
        webView.webViewClient = WebViewClient()
        webView.addJavascriptInterface(AndroidConfigInterface(this), "androidConfig")
        webView.loadUrl("file:///android_asset/omniroute_config.html")
    }

    private fun saveConfigAndApply(baseUrl: String, apiKey: String, model: String) {
        val prefs = getSharedPreferences("omniroute_config", Context.MODE_PRIVATE)
        prefs.edit()
            .putString("base_url", baseUrl)
            .putString("api_key", apiKey)
            .putString("model", model)
            .apply()

        // Push to native Rust engine via JNI
        val result = nativeLib.configureOmniroute(baseUrl, apiKey, model)
        showStatus(getString(R.string.status_done))
        showResult(result ?: getString(R.string.msg_config_saved))
    }

    inner class AndroidConfigInterface(private val context: Context) {
        @JavascriptInterface
        fun saveConfig(baseUrl: String, apiKey: String, model: String) {
            runOnUiThread {
                saveConfigAndApply(baseUrl, apiKey, model)
            }
        }

        @JavascriptInterface
        fun getSavedConfig(): String? {
            val prefs = context.getSharedPreferences("omniroute_config", Context.MODE_PRIVATE)
            val baseUrl = prefs.getString("base_url", "")
            val apiKey = prefs.getString("api_key", "")
            val model = prefs.getString("model", "")
            return """{"baseUrl":"$baseUrl","apiKey":"$apiKey","model":"$model"}"""
        }
    }

    private fun setLocale(lang: String) {
        val locale = java.util.Locale(lang)
        java.util.Locale.setDefault(locale)
        val config = android.content.res.Resources.getSystem().configuration
        config.setLocale(locale)
        val context = createConfigurationContext(config)
        context.resources.updateConfiguration(config, context.resources.displayMetrics)
        val prefs = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        prefs.edit().putString("lang", lang).apply()
    }

    private fun showStatus(msg: String) {
        textStatus.text = msg
    }

    private fun showResult(msg: String) {
        textResult.text = msg
    }
}
