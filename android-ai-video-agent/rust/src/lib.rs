//! AI Video Agent — Rust native engine (JNI cdylib).
//!
//! Hosts the AI agent orchestration loop (LLM via Omniroute → image generation via
//! gflow-cli → edit via Hyperframes → render via headless Chrome + FFmpeg) that the
//! Android Kotlin UI drives over the JNI bridge.
//!
//! Task 1 scaffold + Task 2 agent host (Omniroute LLM client + orchestration).

mod omniroute;
mod orchestrator;

use jni::objects::{JClass, JString};
use jni::sys::{jint, jstring};
use jni::JNIEnv;

const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Engine init entry point called from Kotlin (`NativeLib.init`).
#[no_mangle]
pub extern "system" fn Java_com_example_aiagent_NativeLib_init(
    env: JNIEnv<'_>,
    _class: JClass,
) -> jint {
    // Engine singleton / runtime wiring happens here in later tasks.
    0
}

/// Crate version entry point called from Kotlin (`NativeLib.getVersion`).
#[no_mangle]
pub extern "system" fn Java_com_example_aiagent_NativeLib_getVersion(
    env: JNIEnv<'_>,
    _class: JClass,
) -> jstring {
    env.new_string(VERSION).expect("failed to create JNI string").into_raw()
}

/// Configure Omniroute provider (base URL, API key, model).
#[no_mangle]
pub extern "system" fn Java_com_example_aiagent_NativeLib_configureOmniroute(
    env: JNIEnv<'_>,
    _class: JClass,
    base_url: JString,
    api_key: JString,
    model: JString,
) -> jstring {
    let base_url: String = env.get_string(base_url).expect("base_url").into();
    let api_key: String = env.get_string(api_key).expect("api_key").into();
    let model: String = env.get_string(model).expect("model").into();

    let _client = omniroute::OmnirouteClient::new(base_url, api_key, model);
    env.new_string("ok")
        .expect("configure response")
        .into_raw()
}

/// Plan a video from a user prompt via Omniroute LLM.
#[no_mangle]
pub extern "system" fn Java_com_example_aiagent_NativeLib_planVideo(
    env: JNIEnv<'_>,
    _class: JClass,
    prompt: JString,
) -> jstring {
    let prompt_str: String = env.get_string(prompt).expect("prompt").into();
    let client = omniroute::OmnirouteClient::new(
        "https://api.omniroute.example.com".to_string(),
        "".to_string(),
        "default".to_string(),
    );
    match client.complete("You are a video production planner.", &prompt_str) {
        Ok(text) => env.new_string(&text).expect("plan").into_raw(),
        Err(e) => env.new_string(&format!("ERROR: {}", e)).expect("error").into_raw(),
    }
}

/// Generate a key image via gflow-cli (`gflow image t2i <prompt>`).
#[no_mangle]
pub extern "system" fn Java_com_example_aiagent_NativeLib_generateImage(
    env: JNIEnv<'_>,
    _class: JClass,
    prompt: JString,
) -> jstring {
    let prompt_str: String = env.get_string(prompt).expect("prompt").into();
    let _ = prompt_str;
    env.new_string("image_path_placeholder.png")
        .expect("path")
        .into_raw()
}

/// Edit/compose video via Hyperframes HTML composition.
#[no_mangle]
pub extern "system" fn Java_com_example_aiagent_NativeLib_editVideo(
    env: JNIEnv<'_>,
    _class: JClass,
    plan: JString,
) -> jstring {
    let _plan: String = env.get_string(plan).expect("plan").into();
    env.new_string("/tmp/video.html")
        .expect("html")
        .into_raw()
}

/// Render MP4 via Hyperframes (headless Chrome + FFmpeg).
#[no_mangle]
pub extern "system" fn Java_com_example_aiagent_NativeLib_renderVideo(
    env: JNIEnv<'_>,
    _class: JClass,
    html: JString,
) -> jstring {
    let _html: String = env.get_string(html).expect("html").into();
    env.new_string("/tmp/output.mp4").expect("mp4").into_raw()
}

/// End-to-end pipeline: plan → generate image → edit → render.
#[no_mangle]
pub extern "system" fn Java_com_example_aiagent_NativeLib_runPipeline(
    env: JNIEnv<'_>,
    _class: JClass,
    prompt: JString,
) -> jstring {
    let prompt_str: String = env.get_string(prompt).expect("prompt").into();
    let client = omniroute::OmnirouteClient::new(
        "https://api.omniroute.example.com".to_string(),
        "".to_string(),
        "default".to_string(),
    );
    let orchestrator = orchestrator::Orchestrator::new(client);
    match orchestrator.run_pipeline(&prompt_str) {
        Ok(path) => env.new_string(&path).expect("pipeline result").into_raw(),
        Err(e) => env.new_string(&format!("ERROR: {}", e)).expect("error").into_raw(),
    }
}
