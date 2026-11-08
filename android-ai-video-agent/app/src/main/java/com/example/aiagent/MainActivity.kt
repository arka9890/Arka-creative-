package com.example.aiagent

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.PasswordVisualTransformation
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.androidView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.aiagent.ui.theme.ClayColors
import com.example.aiagent.ui.theme.ClayTheme
import com.example.aiagent.ui.theme.ClayTypography
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private val nativeLib = NativeLib()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val savedLang = getSharedPreferences("app_prefs", MODE_PRIVATE).getString("lang", "id") ?: "id"
        setLocale(this@MainActivity, savedLang)
        val isDark = getSharedPreferences("app_prefs", MODE_PRIVATE).getBoolean("dark", false)
        setContent { ClayTheme(isDark = isDark) { App(nativeLib = nativeLib, activity = this) } }
    }
}

data class ChatMessage(
    val role: String,
    val text: String,
    val isStreaming: Boolean = false,
    val toolResults: List<String> = emptyList()
)

@Composable
fun App(nativeLib: NativeLib, activity: Activity) {
    val nav = rememberNavController()
    var startupDone by remember { mutableStateOf(false) }
    var startupLogs by remember { mutableStateOf<List<String>>(emptyList()) }
    var startupPhase by remember { mutableStateOf("init") }

    if (!startupDone) {
        StartupScreen(
            logs = startupLogs,
            phase = startupPhase,
            onComplete = { startupDone = true }
        ) { newLogs, newPhase ->
            startupLogs = newLogs
            startupPhase = newPhase
        }
    } else {
        val proot = try { if (nativeLib.isLoaded) (nativeLib.getProotStatus() ?: "proot status unknown") else "native lib not loaded" } catch (e: Exception) { "proot error: ${e.message}" }
        val version = try { nativeLib.safeGetVersion() } catch (_: Exception) { "n/a" }
        val tabs = listOf("home" to "Beranda", "chat" to "Chat", "config" to "Setting")
        Scaffold(
            bottomBar = {
                val entry by nav.currentBackStackEntryAsState()
                val route = entry?.destination?.route
                NavigationBar(containerColor = ClayColors.Surface) {
                    tabs.forEach { (r, label) ->
                        NavigationBarItem(
                            selected = route == r,
                            onClick = { nav.navigate(r) },
                            icon = { Icon(if (r == "home") Icons.Filled.Home else if (r == "chat") Icons.Filled.Chat else Icons.Filled.Settings, contentDescription = label, tint = if (route == r) ClayColors.Primary else ClayColors.TextSecondary) },
                            label = { Text(label) }
                        )
                    }
                }
            }
        ) { padding ->
            NavHost(nav, startDestination = "home", Modifier.padding(padding)) {
                composable("home") { HomeScreen(proot, version, activity) }
                composable("chat") { ChatScreen(nativeLib, activity) }
                composable("config") { ConfigScreen(activity) }
                composable("browser") { BrowserScreen(activity) }
            }
        }
    }
}

@Composable
fun StartupScreen(
    logs: List<String>,
    phase: String,
    onComplete: () -> Unit,
    onUpdate: (List<String>, String) -> Unit
) {
    LaunchedEffect(true) {
        runStartupChecks(onUpdate, onComplete)
    }

    Column(Modifier.fillMaxSize().background(Color.Black), verticalArrangement = Arrangement.spacedBy(0.dp)) {
        Text("ARKA CREATIVE — STARTUP", style = ClayTypography.headlineMedium.copy(color = Color.Green, fontWeight = FontWeight.Bold), modifier = Modifier.padding(16.dp).fillMaxWidth())
        Box(
            Modifier
                .fillMaxSize()
                .padding(16.dp)
                .background(Color.Black, RoundedCornerShape(8.dp))
        ) {
            androidView(
                factory = { ctx ->
                    TextView(ctx).apply {
                        setTextColor(Color.Green)
                        setTextSize(12f)
                        typeface = android.graphics.Typeface.MONOSPACE
                        setPadding(8, 8, 8, 8)
                        gravity = android.view.Gravity.TOP or android.view.Gravity.START
                        movementMethod = android.text.method.ScrollingMovementMethod()
                    }
                },
                update = { (tv: TextView) ->
                    val text = logs.joinToString("\n") { "> $it" }
                    tv.text = text
                    tv.scrollTo(0, tv.lineCount * tv.lineHeight)
                },
                modifier = Modifier.fillMaxSize()
            )
        }
        if (phase == "complete") {
            Row(Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                Button(onClick = onComplete, colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = Color.Green)) {
                    Text("MASUK KE APLIKASI", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

suspend fun runStartupChecks(
    onUpdate: (List<String>, String) -> Unit,
    onComplete: () -> Unit
) {
    val logs = mutableListOf<String>()
    fun log(msg: String) {
        logs.add(msg)
        onUpdate(logs.toList(), "checking")
    }

    log("Memulai pemeriksaan runtime...")
    log("[1/6] Cek native library...")

    val nativeLib = NativeLib()
    if (!nativeLib.isLoaded) {
        log("ERROR: Native library tidak termuat!")
        onUpdate(logs.toList(), "error")
        return
    }
    log("OK: Native library termuat")

    log("[2/6] Cek proot binary...")
    val filesDir = "/data/data/com.example.aiagent/files"
    val prootBin = java.io.File("$filesDir/proot")
    if (!prootBin.exists()) {
        log("proot tidak ditemukan, akan di-download")
    } else {
        log("OK: proot ditemukan di $filesDir/proot")
    }

    log("[3/6] Cek Debian rootfs...")
    val debianRootfs = java.io.File("$filesDir/debian")
    if (!debianRootfs.exists()) {
        log("Debian rootfs tidak ditemukan, akan di-download & extract")
    } else {
        log("OK: Debian rootfs ditemukan di $filesDir/debian")
    }

    log("[4/6] Cek tools di dalam rootfs...")
    if (debianRootfs.exists()) {
        val tools = listOf("gflow", "node", "npm", "npx", "chromium", "xvfb-run", "x11vnc", "ffmpeg", "python3", "pip3")
        for (tool in tools) {
            try {
                val result = nativeLib.checkToolInRootfs(tool)
                if (result?.contains("found") == true) {
                    log("OK: $tool tersedia")
                } else {
                    log("MISSING: $tool (akan di-install)")
                }
            } catch (e: Exception) {
                log("ERROR cek $tool: ${e.message}")
            }
        }
    } else {
        log("Skip cek tools (rootfs belum ada)")
    }

    log("[5/6] Install otomatis jika diperlukan...")
    if (!prootBin.exists() || !debianRootfs.exists()) {
        onUpdate(logs.toList(), "installing")
        log("Memulai install proot + Debian + tools...")
        val res = nativeLib.installProotDebian(filesDir)
        if (res?.contains("success") == true) {
            log("SUKSES: Install selesai")
        } else {
            log("GAGAL: $res")
            onUpdate(logs.toList(), "error")
            return
        }
    } else {
        log("Semua sudah terpasang, skip install")
    }

    log("[6/6] Verifikasi final...")
    val status = nativeLib.getProotStatus()
    log("Status: $status")
    log("STARTUP SELESAI")
    onUpdate(logs.toList(), "complete")
    onComplete()
}

@Composable
fun HomeScreen(proot: String, rustVersion: String, activity: Activity) {
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Beranda / Monitoring", style = ClayTypography.headlineMedium, color = ClayColors.TextPrimary)
        ClayCard {
            Text("Runtime Proot", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            Text(proot, color = ClayColors.TextSecondary, style = ClayTypography.bodyMedium)
            Text("Rust engine: ${rustVersion}", color = ClayColors.TextSecondary, style = ClayTypography.bodyMedium)
        }
        ClayCard {
            Text("Quick Actions", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ClayButton("Buka Google Login (noVNC)") {
                    activity.startActivity(Intent(activity, BrowserActivity::class.java))
                }
                ClayButton("Cek Update") {
                    Updater.checkLatest(activity) { tag, url ->
                        activity.runOnUiThread {
                            android.widget.Toast.makeText(activity, (if (tag != null) "Latest: ${tag}" else "Update check failed"), android.widget.Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ChatScreen(nativeLib: NativeLib, activity: Activity) {
    val context = activity.applicationContext
    val messages = remember { mutableStateListOf<ChatMessage>(
        ChatMessage("assistant", "Halo! Saya agent AI video. Masukkan prompt lalu pilih aksi atau ketik langsung."),
        ChatMessage("assistant", "Perintah: plan / generate / edit / render / pipeline", isStreaming = false)
    )}
    var prompt by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()
    var expandedToolIndex by remember { mutableStateOf(-1) }

    Column(Modifier.fillMaxSize().padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Chat Agent", style = ClayTypography.headlineMedium, color = ClayColors.TextPrimary)
        LazyColumn(state = listState, modifier = Modifier.height(280.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(messages) { msg ->
                val index = messages.indexOf(msg)
                ChatBubble(msg, index, expandedToolIndex) { newIdx ->
                    expandedToolIndex = if (expandedToolIndex == newIdx) -1 else newIdx
                }
            }
        }
        ClayCard {
            OutlinedTextField(
                value = prompt,
                onValueChange = { prompt = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Prompt / pesan") },
                minLines = 2,
                maxLines = 5
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 4.dp)) {
                ClayButton("Plan") { dispatch(messages, "Plan", prompt, busy = { busy = it }) { nativeLib.planVideo(prompt) } }
                ClayButton("Generate") { dispatch(messages, "Generate", prompt, busy = { busy = it }) { nativeLib.generateImage(prompt) } }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ClayButton("Edit") { dispatch(messages, "Edit", prompt, busy = { busy = it }) { nativeLib.editVideo(prompt) } }
                ClayButton("Render") { dispatch(messages, "Render", prompt, busy = { busy = it }) { nativeLib.renderVideo(prompt) } }
                ClayButton("Pipeline") { RenderService.start(context); dispatch(messages, "Pipeline", prompt, busy = { busy = it }, finallyAction = { RenderService.stop(context) }) { nativeLib.runPipeline(prompt) } }
            }
            if (busy) Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                CircularProgressIndicator(modifier = Modifier.size(18.dp))
                Text("Bekerja...", color = ClayColors.TextSecondary, style = ClayTypography.bodyMedium)
            }
        }
    }
}

@Composable
fun ChatBubble(msg: ChatMessage, index: Int, expandedIndex: Int, onToggle: (Int) -> Unit) {
    val isUser = msg.role == "user"
    val isExpanded = expandedIndex == index
    val hasTools = msg.toolResults.isNotEmpty()

    Row(Modifier.fillMaxWidth(), horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start) {
        Box(
            Modifier
                .padding(horizontal = 4.dp, vertical = 2.dp)
                .background(if (isUser) ClayColors.Primary else ClayColors.Surface, RoundedCornerShape(16.dp))
                .padding(12.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                if (msg.isStreaming) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        CircularProgressIndicator(modifier = Modifier.size(14.dp))
                        Text(msg.text, color = if (isUser) Color.White else ClayColors.TextPrimary, style = ClayTypography.bodyMedium)
                    }
                } else {
                    Text(msg.text, color = if (isUser) Color.White else ClayColors.TextPrimary, style = ClayTypography.bodyMedium)
                }
                if (hasTools) {
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        ClayButton(if (isExpanded) "▲ Tool Results" else "▼ Tool Results") {
                            onToggle(index)
                        }
                    }
                    if (isExpanded) {
                        Column(modifier = Modifier.padding(top = 8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            msg.toolResults.forEach { result ->
                                Text(result, color = ClayColors.TextSecondary, style = ClayTypography.bodySmall.copy(fontSize = 12.sp))
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun dispatch(
    messages: androidx.compose.runtime.snapshots.SnapshotStateList<ChatMessage>,
    type: String,
    prompt: String,
    busy: (Boolean) -> Unit,
    finallyAction: (() -> Unit)? = null,
    call: () -> String?
) {
    if (prompt.isBlank()) {
        messages.add(ChatMessage("assistant", "Silakan masukkan prompt dulu."))
        return
    }
    messages.add(ChatMessage("user", prompt))
    messages.add(ChatMessage("assistant", "Bekerja: $type...", isStreaming = true))
    busy(true)
    Thread {
        val res = try { call() ?: "No result" } catch (e: Exception) { "Error: ${e.message}" }
        val toolLines = res.lines().filter { it.startsWith("[TOOL]") }.map { it.substringAfter("[TOOL]").trim() }
        val cleanRes = res.lines().filter { !it.startsWith("[TOOL]") }.joinToString("\n")
        Thread.sleep(100)
        val lastIdx = messages.lastIndex
        if (lastIdx >= 0 && messages[lastIdx].isStreaming) {
            messages[lastIdx] = ChatMessage("assistant", "[$type] $cleanRes", toolResults = toolLines)
        } else {
            messages.add(ChatMessage("assistant", "[$type] $cleanRes", toolResults = toolLines))
        }
        finallyAction?.invoke()
        busy(false)
    }.start()
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConfigScreen(activity: Activity) {
    val prefs = activity.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
    var baseUrl by remember { mutableStateOf(prefs.getString("baseUrl", "https://api.omniroute.example.com") ?: "https://api.omniroute.example.com") }
    var apiKey by remember { mutableStateOf(prefs.getString("apiKey", "") ?: "") }
    var model by remember { mutableStateOf(prefs.getString("model", "default") ?: "default") }
    var result by remember { mutableStateOf("") }
    var expanded by remember { mutableStateOf(false) }
    val providers = listOf("OpenAI", "Anthropic", "Gemini", "OpenRouter", "Custom")
    var provider by remember { mutableStateOf(prefs.getString("provider", providers.first()) ?: providers.first()) }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Konfigurasi", style = ClayTypography.headlineMedium, color = ClayColors.TextPrimary)
        ClayCard {
            Text("Provider AI", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                OutlinedTextField(
                    value = provider,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Provider") },
                    modifier = Modifier.fillMaxWidth(),
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) }
                )
                DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                    providers.forEach { p ->
                        DropdownMenuItem(text = { Text(p) }, onClick = {
                            provider = p
                            expanded = false
                            if (p != "Custom") baseUrl = defaultBaseUrl(p)
                        })
                    }
                }
            }
            OutlinedTextField(value = baseUrl, onValueChange = { baseUrl = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Base URL") })
            OutlinedTextField(value = apiKey, onValueChange = { apiKey = it }, modifier = Modifier.fillMaxWidth(), label = { Text("API Key") }, visualTransformation = PasswordVisualTransformation())
            OutlinedTextField(value = model, onValueChange = { model = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Model") })
            ClayButton("Simpan Provider") {
                val res = try { NativeLib().configureOmniroute(baseUrl, apiKey, model) ?: "Tersimpan" } catch (e: Exception) { "Error: ${e.message}" }
                result = res
                prefs.edit()
                    .putString("provider", provider)
                    .putString("baseUrl", baseUrl)
                    .putString("apiKey", apiKey)
                    .putString("model", model)
                    .apply()
            }
            if (result.isNotBlank()) Text(result, color = ClayColors.TextSecondary, style = ClayTypography.bodyMedium)
        }
        ClayCard {
            Text("Browser Google Login", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            Text("Embedded noVNC untuk gflow auth (headless Chrome via proot + Xvfb + x11vnc).", color = ClayColors.TextSecondary, style = ClayTypography.bodyMedium)
            ClayButton("Buka Browser noVNC") {
                activity.startActivity(Intent(activity, BrowserActivity::class.java))
            }
            ClayButton("Buka di Chrome Custom Tab") {
                try { activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://novnc.com/noVNC/vnc.html?host=127.0.0.1&port=5900&autoconnect=1"))) } catch (_: Exception) { }
            }
        }
        ClayCard {
            Text("Bahasa & Tema", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ClayButton("English") { setLocale(activity, "en"); prefs.edit().putString("lang", "en").apply(); activity.recreate() }
                ClayButton("Bahasa") { setLocale(activity, "id"); prefs.edit().putString("lang", "id").apply(); activity.recreate() }
                ClayButton("Terang") { prefs.edit().putBoolean("dark", false).apply(); AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO); activity.recreate() }
                ClayButton("Gelap") { prefs.edit().putBoolean("dark", true).apply(); AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES); activity.recreate() }
            }
        }
        ClayCard {
            ClayButton("Cek Update") {
                Updater.checkLatest(activity) { tag, url ->
                    activity.runOnUiThread {
                        android.widget.Toast.makeText(activity, if (tag != null) "Latest: ${tag}" else "Update check failed", android.widget.Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }
}

@Composable
fun BrowserScreen(activity: Activity) {
    val webView = remember { WebView(activity).apply {
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.setSupportZoom(true)
        settings.builtInZoomControls = true
        settings.displayZoomControls = false
        webViewClient = WebViewClient()
        webChromeClient = WebChromeClient()
        loadUrl("https://novnc.com/noVNC/vnc.html?host=127.0.0.1&port=5900&autoconnect=1")
    } }
    androidView(
        factory = { webView },
        update = {},
        modifier = Modifier.fillMaxSize()
    )
}

private fun defaultBaseUrl(provider: String): String {
    return when (provider) {
        "OpenAI" -> "https://api.openai.com/v1"
        "Anthropic" -> "https://api.anthropic.com/v1"
        "Gemini" -> "https://generativelanguage.googleapis.com/v1beta"
        "OpenRouter" -> "https://openrouter.ai/api/v1"
        else -> "https://api.openai.com/v1"
    }
}

private fun setLocale(activity: Activity, lang: String) {
    val locale = java.util.Locale(lang)
    java.util.Locale.setDefault(locale)
    val config = activity.resources.configuration
    config.setLocale(locale)
    activity.createConfigurationContext(config)
    val prefs = activity.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
    prefs.edit().putString("lang", lang).apply()
}

@Composable
private fun ClayCard(content: @Composable () -> Unit) {
    Card(colors = CardDefaults.cardColors(containerColor = ClayColors.Surface), modifier = Modifier.fillMaxWidth(), shape = androidx.compose.foundation.shape.RoundedCornerShape(24.dp), elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { content() }
    }
}

@Composable
private fun ClayButton(label: String, onClick: () -> Unit) {
    Button(onClick = onClick, shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp), colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = ClayColors.Primary), modifier = Modifier.padding(2.dp)) {
        Text(label, color = androidx.compose.ui.graphics.Color.White)
    }
}