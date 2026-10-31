package com.example.aiagent

/**
 * JNI facade over the Rust native engine (cdylib `ai_agent`).
 *
 * The native library is built with cargo-ndk (`cargo ndk -t arm64-v8a --android-platform 35 -o <out-dir> ...`) producing
 * `libai_agent.so` for Android; the Gradle build wiring places it in the app's nativeLibraryDir
 * and `System.loadLibrary` binds it here. Engine capabilities (agent host: generate → edit →
 * render orchestration) are exposed as native methods from the Rust crate (see `rust/`).
 */
class NativeLib {
    init {
        System.loadLibrary("ai_agent")
    }

    external fun init(): Int

    external fun getVersion(): String?
}
