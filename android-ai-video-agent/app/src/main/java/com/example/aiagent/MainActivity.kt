package com.example.aiagent

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
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
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.aiagent.ui.theme.ClayColors
import com.example.aiagent.ui.theme.ClayTheme
import com.example.aiagent.ui.theme.ClayTypography

class MainActivity : ComponentActivity() {
    private val nativeLib = NativeLib()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val proot = try { if (nativeLib.isLoaded) (nativeLib.getProotStatus() ?: "proot status unknown") else "native lib not loaded" } catch (e: Exception) { "proot error: ${e.message}" }
        val version = try { nativeLib.safeGetVersion() } catch (_: Exception) { "n/a" }
        setContent { ClayTheme { App(proot = proot, rustVersion = version, activity = this) } }
        if (nativeLib.isLoaded) { Updater.checkLatest(this) { _, _ -> } }
    }
}

data class ChatMessage(val role: String, val text: String)

@Composable
fun App(proot: String, rustVersion: String, activity: Activity) {
    val nav = rememberNavController()
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
            composable("home") { HomeScreen(proot, rustVersion, activity) }
            composable("chat") { ChatScreen(activity) }
            composable("config") { ConfigScreen(activity) }
        }
    }
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
            Text("Status", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            Text("Service render: idle", color = ClayColors.TextSecondary, style = ClayTypography.bodyMedium)
            Text("Auto-install rootfs akan dilewati bila sudah ada.", color = ClayColors.TextSecondary, style = ClayTypography.bodyMedium)
        }
        ClayCard {
            Text("Quick Actions", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ClayButton("Open Google Login") {
                    try { activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://novnc.com/noVNC/vnc.html?host=127.0.0.1&port=5900&autoconnect=1"))) } catch (_: Exception) { }
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
fun ChatScreen(activity: Activity) {
    val context = activity.applicationContext
    val messages = remember { mutableStateListOf<ChatMessage>(ChatMessage("assistant", "Halo! Saya agent AI video. Masukkan prompt lalu pilih aksi.")) }
    var prompt by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()
    Column(Modifier.fillMaxSize().padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Chat Agent", style = ClayTypography.headlineMedium, color = ClayColors.TextPrimary)
        LazyColumn(state = listState, modifier = Modifier.weight(1f).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(messages) { msg -> ChatBubble(msg) }
        }
        ClayCard {
            OutlinedTextField(value = prompt, onValueChange = { prompt = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Prompt / pesan") }, minLines = 2)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 4.dp)) {
                ClayButton("Plan") { dispatch(messages, "Plan", prompt, busy = { busy = it }) { NativeLib().planVideo(prompt) } }
                ClayButton("Generate") { dispatch(messages, "Generate", prompt, busy = { busy = it }) { NativeLib().generateImage(prompt) } }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ClayButton("Edit") { dispatch(messages, "Edit", prompt, busy = { busy = it }) { NativeLib().editVideo(prompt) } }
                ClayButton("Render") { dispatch(messages, "Render", prompt, busy = { busy = it }) { NativeLib().renderVideo(prompt) } }
                ClayButton("Pipeline") { RenderService.start(context); dispatch(messages, "Pipeline", prompt, busy = { busy = it }, finallyAction = { RenderService.stop(context) }) { NativeLib().runPipeline(prompt) } }
            }
            if (busy) Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                CircularProgressIndicator(modifier = Modifier.size(18.dp))
                Text("Bekerja...", color = ClayColors.TextSecondary, style = ClayTypography.bodyMedium)
            }
        }
    }
}

private fun dispatch(messages: androidx.compose.runtime.snapshots.SnapshotStateList<ChatMessage>, type: String, prompt: String, busy: (Boolean) -> Unit, finallyAction: (() -> Unit)? = null, call: () -> String?) {
    if (prompt.isBlank()) { messages.add(ChatMessage("assistant", "Silakan masukkan prompt dulu.")); return }
    messages.add(ChatMessage("user", prompt))
    messages.add(ChatMessage("assistant", "Bekerja: $type..."))
    busy(true)
    Thread {
        val res = try { call() ?: "No result" } catch (e: Exception) { "Error: ${e.message}" }
        val lastIdx = messages.lastIndex
        if (lastIdx >= 0 && messages[lastIdx].text.startsWith("Bekerja:")) messages[lastIdx] = ChatMessage("assistant", "[$type] $res") else messages.add(ChatMessage("assistant", "[$type] $res"))
        finallyAction?.invoke()
        busy(false)
    }.start()
}

@Composable
fun ChatBubble(msg: ChatMessage) {
    val isUser = msg.role == "user"
    Row(Modifier.fillMaxWidth(), horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start) {
        Box(Modifier.padding(horizontal = 4.dp, vertical = 2.dp).background(if (isUser) ClayColors.Primary else ClayColors.Surface, RoundedCornerShape(16.dp)).padding(12.dp)) {
            Text(msg.text, color = if (isUser) Color.White else ClayColors.TextPrimary, style = ClayTypography.bodyMedium)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConfigScreen(activity: Activity) {
    var baseUrl by remember { mutableStateOf("https://api.omniroute.example.com") }
    var apiKey by remember { mutableStateOf("") }
    var model by remember { mutableStateOf("default") }
    var result by remember { mutableStateOf("") }
    var expanded by remember { mutableStateOf(false) }
    val providers = listOf("OpenAI", "Anthropic", "Gemini", "OpenRouter", "Custom")
    var provider by remember { mutableStateOf(providers.first()) }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Konfigurasi", style = ClayTypography.headlineMedium, color = ClayColors.TextPrimary)
        ClayCard {
            Text("Provider AI", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                OutlinedTextField(value = provider, onValueChange = {}, readOnly = true, label = { Text("Provider") }, modifier = Modifier.fillMaxWidth().menuAnchor(), trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) })
                DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                    providers.forEach { p ->
                        DropdownMenuItem(text = { Text(p) }, onClick = { provider = p; expanded = false; if (p != "Custom") baseUrl = defaultBaseUrl(p) })
                    }
                }
            }
            OutlinedTextField(value = baseUrl, onValueChange = { baseUrl = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Base URL") })
            OutlinedTextField(value = apiKey, onValueChange = { apiKey = it }, modifier = Modifier.fillMaxWidth(), label = { Text("API Key") })
            OutlinedTextField(value = model, onValueChange = { model = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Model") })
            ClayButton("Simpan Provider") { result = try { NativeLib().configureOmniroute(baseUrl, apiKey, model) ?: "Tersimpan" } catch (e: Exception) { "Error: ${e.message}" } }
            if (result.isNotBlank()) Text(result, color = ClayColors.TextSecondary, style = ClayTypography.bodyMedium)
        }
        ClayCard {
            Text("Browser Google", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            Text("Untuk gflow auth via noVNC/VNC.", color = ClayColors.TextSecondary, style = ClayTypography.bodyMedium)
            ClayButton("Buka noVNC Google Login") {
                try { activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://novnc.com/noVNC/vnc.html?host=127.0.0.1&port=5900&autoconnect=1"))) } catch (_: Exception) { }
            }
        }
        ClayCard {
            Text("Bahasa & Tema", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ClayButton("English") { setLocale(activity, "en"); activity.recreate() }
                ClayButton("Bahasa") { setLocale(activity, "id"); activity.recreate() }
                ClayButton("Terang") { AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO); activity.recreate() }
                ClayButton("Gelap") { AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES); activity.recreate() }
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
