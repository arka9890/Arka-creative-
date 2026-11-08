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
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.aiagent.ui.theme.ClayColors
import com.example.aiagent.ui.theme.ClayTheme
import com.example.aiagent.ui.theme.ClayTypography

class MainActivity : ComponentActivity() {
    private val nativeLib = NativeLib()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val proot = try { if (nativeLib.isLoaded) (nativeLib.getProotStatus() ?: "proot status unknown") else "native lib not loaded" } catch (e: Exception) { "proot error: ${e.message}" }
        val version = try { nativeLib.safeGetVersion() } catch (_: Exception) { "n/a" }
        setContent {
            ClayTheme {
                MainScreen(proot = proot, rustVersion = version)
            }
        }
        if (nativeLib.isLoaded) {
            Updater.checkLatest(this) { tag, url ->
                runOnUiThread {
                    if (tag != null) {
                        // informational only
                    }
                }
            }
        }
    }
}

@Composable
private fun MainScreen(proot: String, rustVersion: String) {
    val context = androidx.compose.ui.platform.LocalContext.current
    var prompt by remember { mutableStateOf("") }
    var baseUrl by remember { mutableStateOf("https://api.omniroute.example.com") }
    var apiKey by remember { mutableStateOf("") }
    var model by remember { mutableStateOf("default") }
    var status by remember { mutableStateOf("Idle") }
    var result by remember { mutableStateOf("Rust engine: $rustVersion\nProot: $proot") }
    var busy by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(text = "AI Video Agent", style = ClayTypography.headlineMedium, color = ClayColors.TextPrimary)
        Text(text = "Clay UI · Rust engine · Proot sidecar", color = ClayColors.TextSecondary, style = ClayTypography.bodyMedium)

        ClayCard {
            Text("Prompt", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            OutlinedTextField(value = prompt, onValueChange = { prompt = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Video prompt") })
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ClayButton("Plan") {
                    busy = true; status = "Planning..."
                    result = try { NativeLib().planVideo(prompt) ?: "No result" } catch (e: Exception) { "Error: ${e.message}" }
                    status = "Done"; busy = false
                }
                ClayButton("Generate Image") {
                    busy = true; status = "Generating..."
                    result = try { NativeLib().generateImage(prompt) ?: "No result" } catch (e: Exception) { "Error: ${e.message}" }
                    status = "Done"; busy = false
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ClayButton("Edit Video") {
                    busy = true; status = "Editing..."
                    result = try { NativeLib().editVideo(prompt) ?: "No result" } catch (e: Exception) { "Error: ${e.message}" }
                    status = "Done"; busy = false
                }
                ClayButton("Render") {
                    busy = true; status = "Rendering..."
                    result = try { NativeLib().renderVideo(prompt) ?: "No result" } catch (e: Exception) { "Error: ${e.message}" }
                    status = "Done"; busy = false
                }
            }
            ClayButton("Run Pipeline") {
                RenderService.start(context)
                busy = true; status = "Running pipeline..."
                result = try { NativeLib().runPipeline(prompt) ?: "No result" } finally { RenderService.stop(context); busy = false }
                status = "Done"
            }
        }

        ClayCard {
            Text("Omniroute Config", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            OutlinedTextField(value = baseUrl, onValueChange = { baseUrl = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Base URL") })
            OutlinedTextField(value = apiKey, onValueChange = { apiKey = it }, modifier = Modifier.fillMaxWidth(), label = { Text("API Key") })
            OutlinedTextField(value = model, onValueChange = { model = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Model") })
            ClayButton("Save Config") {
                if (baseUrl.isBlank()) result = "Enter base URL" else {
                    result = try { NativeLib().configureOmniroute(baseUrl, apiKey, model) ?: "saved" } catch (e: Exception) { "Error: ${e.message}" }
                }
            }
        }

        ClayCard {
            Text("Status: $status", style = ClayTypography.titleMedium, color = ClayColors.TextPrimary)
            if (busy) CircularProgressIndicator()
            Text(result, style = ClayTypography.bodyMedium, color = ClayColors.TextSecondary, modifier = Modifier.padding(top = 8.dp))
        }
    }
}

@Composable
private fun ClayCard(content: @Composable () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = ClayColors.Surface),
        modifier = Modifier.fillMaxWidth(),
        shape = androidx.compose.foundation.shape.RoundedCornerShape(24.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { content() }
    }
}

@Composable
private fun ClayButton(label: String, onClick: () -> Unit) {
    Button(onClick = onClick, shape = androidx.compose.foundation.shape.RoundedCornerShape(20.dp), colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = ClayColors.Primary)) {
        Text(label, color = androidx.compose.ui.graphics.Color.White)
    }
}
