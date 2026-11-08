package com.example.aiagent.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val ClayLightScheme = lightColorScheme(
    primary = ClayColors.Primary,
    secondary = ClayColors.Secondary,
    background = ClayColors.Background,
    surface = ClayColors.Surface,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = ClayColors.TextPrimary,
    onSurface = ClayColors.TextPrimary
)

private val ClayDarkScheme = darkColorScheme(
    primary = ClayColors.Primary,
    secondary = ClayColors.Secondary,
    background = Color(0xFF121417),
    surface = Color(0xFF1E2126),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFFE8EAED),
    onSurface = Color(0xFFE8EAED)
)

@Composable
fun ClayTheme(
    isDark: Boolean = false,
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (isDark) ClayDarkScheme else ClayLightScheme,
        typography = ClayTypography,
        content = content
    )
}
