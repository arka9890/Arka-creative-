package com.example.aiagent

import android.app.Activity
import android.os.Bundle
import android.widget.TextView

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val tv = TextView(this).apply {
            text = "AI Video Agent — Task 1 scaffold"
            textSize = 18f
        }
        setContentView(tv)
    }
}
