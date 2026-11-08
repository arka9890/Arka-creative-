package com.example.aiagent

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.example.aiagent.ui.theme.ClayTheme

class BrowserActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val isDark = getSharedPreferences("app_prefs", MODE_PRIVATE).getBoolean("dark", false)
        setContent {
            ClayTheme(isDark = isDark) {
                BrowserScreen(this)
            }
        }
    }
}
