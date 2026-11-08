package com.example.aiagent.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val ClayScheme = lightColorScheme(
    primary = ClayColors.Primary,
    secondary = ClayColors.Secondary,
    background = ClayColors.Background,
    surface = ClayColors.Surface,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = ClayColors.TextPrimary,
    onSurface = ClayColors.TextPrimary
)

@Composable
fun ClayTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = ClayScheme,
        typography = ClayTypography,
        content = content
    )
}
