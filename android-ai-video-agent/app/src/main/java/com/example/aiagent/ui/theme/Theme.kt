package com.example.aiagent.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val ClayLight = lightColorScheme(
    primary = ClayColors.Primary,
    secondary = ClayColors.Secondary,
    background = ClayColors.Background,
    surface = ClayColors.Surface,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = ClayColors.TextPrimary,
    onSurface = ClayColors.TextPrimary
)

private val ClayDark = darkColorScheme(
    primary = ClayColors.Primary,
    secondary = ClayColors.Secondary,
    background = Color(0xFF1E1B18),
    surface = Color(0xFF2B2723),
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFFD7CCC8),
    onSurface = Color(0xFFD7CCC8)
)

@Composable
fun ClayTheme(isDark: Boolean = false, content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (isDark) ClayDark else ClayLight,
        typography = ClayTypography,
        content = content
    )
}
