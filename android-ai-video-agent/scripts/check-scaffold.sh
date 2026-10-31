#!/bin/sh
# Task 1 scaffold verification — Android AI Video Agent.
#
# Checks the deliverables of implementation-plan task 1:
#   * Android project scaffolding (Gradle wrapper, settings/build scripts, app module,
#     AndroidManifest, strings, Kotlin JNI facade)
#   * Rust cdylib crate (crate-type = cdylib) with JNI entry points callable from Kotlin
#     + cargo-ndk wiring
#
# Usage: scripts/check-scaffold.sh
# Exit 0 = scaffold complete, Exit 1 = scaffold incomplete.

cd "$(dirname "$0")/.."

fail=0

ok() { echo "ok   - $*"; }
err() { echo "FAIL - $*"; fail=1; }

echo "== Task 1 scaffold check =="

[ -f settings.gradle.kts ] && ok "settings.gradle.kts exists" || err "settings.gradle.kts missing"
grep -q 'include(":app")' settings.gradle.kts && ok "settings include :app" || err "settings.gradle.kts must include(\":app\")"

grep -q 'com.android.application' build.gradle.kts && ok "root build.gradle.kts applies com.android.application" || err "root build.gradle.kts must apply com.android.application"

grep -q 'namespace = "com.example.aiagent"' app/build.gradle.kts && ok "app namespace com.example.aiagent" || err "app/build.gradle.kts must set namespace = \"com.example.aiagent\""
grep -q 'applicationId = "com.example.aiagent"' app/build.gradle.kts && ok "app applicationId com.example.aiagent" || err "app/build.gradle.kts must set applicationId = \"com.example.aiagent\""
grep -q 'minSdk = 26' app/build.gradle.kts && ok "minSdk 26" || err "app/build.gradle.kts must set minSdk = 26"
grep -q 'targetSdk = 35' app/build.gradle.kts && ok "targetSdk 35" || err "app/build.gradle.kts must set targetSdk = 35"
grep -q 'compileSdk = 35' app/build.gradle.kts && ok "compileSdk 35" || err "app/build.gradle.kts must set compileSdk = 35"

grep -q 'android.permission.INTERNET' app/src/main/AndroidManifest.xml && ok "AndroidManifest INTERNET permission" || err "AndroidManifest must declare INTERNET permission"
grep -q '<application' app/src/main/AndroidManifest.xml && ok "AndroidManifest <application>" || err "AndroidManifest must declare <application>"

grep -q 'System.loadLibrary("ai_agent")' app/src/main/java/com/example/aiagent/NativeLib.kt && ok "NativeLib System.loadLibrary" || err "NativeLib.kt must call System.loadLibrary(\"ai_agent\")"
grep -q 'external fun init(): Int' app/src/main/java/com/example/aiagent/NativeLib.kt && ok "NativeLib init external fun" || err "NativeLib.kt must declare external fun init(): Int"

grep -q 'crate-type = \["cdylib"\]' rust/Cargo.toml && ok "rust crate-type cdylib" || err "rust/Cargo.toml must set crate-type = [\"cdylib\"]"
grep -q 'name = "ai_agent"' rust/Cargo.toml && ok "rust crate ai_agent" || err "rust/Cargo.toml must set lib name = \"ai_agent\""

grep -q 'Java_com_example_aiagent_NativeLib_init' rust/src/lib.rs && ok "JNI init entry point" || err "rust/src/lib.rs must export Java_com_example_aiagent_NativeLib_init"
grep -q 'Java_com_example_aiagent_NativeLib_getVersion' rust/src/lib.rs && ok "JNI getVersion entry point" || err "rust/src/lib.rs must export Java_com_example_aiagent_NativeLib_getVersion"

grep -q '\[target.aarch64-linux-android\]' rust/.cargo/config.toml && ok "cargo-ndk target aarch64-linux-android" || err "rust/.cargo/config.toml must set [target.aarch64-linux-android]"

grep -q 'gradle-8.13' gradle/wrapper/gradle-wrapper.properties && ok "gradle wrapper 8.13" || err "gradle/wrapper/gradle-wrapper.properties must pin gradle-8.13"
[ -x ./gradlew ] && ok "gradlew executable" || err "gradlew must be executable"

echo
if [ "$fail" -eq 0 ]; then
  echo "Scaffold check: PASS"
  exit 0
else
  echo "Scaffold check: FAIL"
  exit 1
fi
