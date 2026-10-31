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

    /// Configure Omniroute provider (base URL, API key, model).
    external fun configureOmniroute(baseUrl: String, apiKey: String, model: String): String?

    /// Plan a video from a user prompt via Omniroute LLM.
    external fun planVideo(prompt: String): String?

    /// Generate a key image via gflow-cli.
    external fun generateImage(prompt: String): String?

    /// Edit/compose video via Hyperframes HTML composition.
    external fun editVideo(plan: String): String?

    /// Render MP4 via Hyperframes (headless Chrome + FFmpeg).
    external fun renderVideo(html: String): String?

    /// End-to-end pipeline: plan → generate image → edit → render.
    external fun runPipeline(prompt: String): String?
}
