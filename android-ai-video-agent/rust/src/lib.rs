//! AI Video Agent — Rust native engine (JNI cdylib).
//!
//! Hosts the AI agent orchestration loop (LLM via Omniroute → image generation via
//! gflow-cli → edit via Hyperframes → render via headless Chrome + FFmpeg) that the
//! Android Kotlin UI drives over the JNI bridge.
//!
//! Task 1 scaffold: JNI entry points callable from Kotlin. Engine capabilities land
//! in later tasks (see implementation plan).

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
    JString::new(env, VERSION).into_raw()
}
