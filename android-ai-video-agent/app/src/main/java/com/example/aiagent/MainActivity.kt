package com.example.aiagent

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
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
    private var prootStatus: String = "native lib not loaded"
    private var rustVersion: String = "n/a"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prootStatus = try { if (nativeLib.isLoaded) nativeLib.getProotStatus() ?: "proot status unknown" else "native lib not loaded" } catch (e: Exception) { "proot error: ${e.message}" }
        rustVersion = try { nativeLib.safeGetVersion() } catch (_: Exception) { "n/a" }
        setContent { ClayTheme { App(proot = prootStatus, rustVersion = rustVersion) } }
        if (nativeLib.isLoaded) { Updater.checkLatest(this) { _, _ -> } }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun App(proot: String, rustVersion: String) {
    val nav = rememberNavController()
    val items = listOf("home" to "Beranda", "agent" to "Agent", "config" to "Konfigurasi")
    Scaffold(
        topBar = { TopAppBar(title = { Text("AI Video Agent", style = ClayTypography.headlineMedium, color = ClayColors.TextPrimary) }) },
        bottomBar = {
            val entry by nav.currentBackStackEntryAsState()
            val route = entry?.destination?.route
            NavigationBar(containerColor = ClayColors.Surface) {
                items.forEach { (routeKey, label) ->
                    NavigationBarItem(
                        selected = route == routeKey,
                        onClick = { nav.navigate(routeKey) },
                        icon = { Icon(if (routeKey == "home") Icons.Filled.Home else if (routeKey == "agent") Icons.Filled.Build else Icons.Filled.Settings, contentDescription = label, tint = if (route == routeKey) ClayColors.Primary else ClayColors.TextSecondary) },
                        label = { Text(label) }
                    )
                }
            }
        }
    ) { padding ->
        NavHost(nav, startDestination = "home", Modifier.padding(padding)) {
            composable("home") { DashboardScreen(proot = proot, rustVersion = rustVersion) }
            composable("agent") { AgentScreen() }
            composable("config") { ConfigScreen() }
        }
    }
}

@Composable
fun DashboardScreen(proot: String, rustVersion: String) {
    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Beranda / Monitoring", style = ClayTypography.headlineMedium, color = ClayColors.TextPrimary)
        ClayCard {
            Text("Runtime Proot", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            Text(proot, color = ClayColors.TextSecondary, style = ClayTypography.bodyMedium)
            Text("Rust engine: $rustVersion", color = ClayColors.TextSecondary, style = ClayTypography.bodyMedium)
        }
        ClayCard {
            Text("Quick Actions", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ClayButton("Jalankan Pipeline") { }
            }
        }
    }
}

@Composable
fun AgentScreen() {
    val context = androidx.compose.ui.platform.LocalContext.current
    var prompt by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("Idle") }
    var result by remember { mutableStateOf("Siap.") }
    var busy by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Agent", style = ClayTypography.headlineMedium, color = ClayColors.TextPrimary)
        ClayCard {
            Text("Prompt Video", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            OutlinedTextField(value = prompt, onValueChange = { prompt = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Masukkan prompt") })
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ClayButton("Plan") { busy = true; status = "Planning..."; result = try { NativeLib().planVideo(prompt) ?: "No result" } catch (e: Exception) { "Error: ${e.message}" }; status = "Done"; busy = false }
                ClayButton("Generate") { busy = true; status = "Generating..."; result = try { NativeLib().generateImage(prompt) ?: "No result" } catch (e: Exception) { "Error: ${e.message}" }; status = "Done"; busy = false }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ClayButton("Edit") { busy = true; status = "Editing..."; result = try { NativeLib().editVideo(prompt) ?: "No result" } catch (e: Exception) { "Error: ${e.message}" }; status = "Done"; busy = false }
                ClayButton("Render") { busy = true; status = "Rendering..."; result = try { NativeLib().renderVideo(prompt) ?: "No result" } catch (e: Exception) { "Error: ${e.message}" }; status = "Done"; busy = false }
            }
            ClayButton("Run Pipeline") {
                RenderService.start(context)
                busy = true; status = "Running pipeline..."
                result = try { NativeLib().runPipeline(prompt) ?: "No result" } finally { RenderService.stop(context); busy = false }
                status = "Done"
            }
        }
        ClayCard {
            Text("Status: $status", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            if (busy) androidx.compose.material3.CircularProgressIndicator()
            Text(result, style = ClayTypography.bodyMedium, color = ClayColors.TextSecondary, modifier = Modifier.padding(top = 8.dp))
        }
    }
}

@Composable
fun ConfigScreen() {
    var baseUrl by remember { mutableStateOf("https://api.omniroute.example.com") }
    var apiKey by remember { mutableStateOf("") }
    var model by remember { mutableStateOf("default") }
    var result by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Konfigurasi", style = ClayTypography.headlineMedium, color = ClayColors.TextPrimary)
        ClayCard {
            OutlinedTextField(value = baseUrl, onValueChange = { baseUrl = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Base URL") })
            OutlinedTextField(value = apiKey, onValueChange = { apiKey = it }, modifier = Modifier.fillMaxWidth(), label = { Text("API Key") })
            OutlinedTextField(value = model, onValueChange = { model = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Model") })
            ClayButton("Simpan") { result = try { NativeLib().configureOmniroute(baseUrl, apiKey, model) ?: "saved" } catch (e: Exception) { "Error: ${e.message}" } }
            if (result.isNotBlank()) Text(result, color = ClayColors.TextSecondary, style = ClayTypography.bodyMedium)
        }
    }
}

@Composable
private fun ClayCard(content: @Composable () -> Unit) {
    Card(colors = CardDefaults.cardColors(containerColor = ClayColors.Surface), modifier = Modifier.fillMaxWidth(), shape = androidx.compose.foundation.shape.RoundedCornerShape(24.dp), elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { content() }
    }
}

@Composable
private fun ClayButton(label: String, onClick: () -> Unit) {
    Button(onClick = onClick, shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp), colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = ClayColors.Primary)) {
        Text(label, color = androidx.compose.ui.graphics.Color.White)
    }
}
