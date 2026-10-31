# Arka Creative — Android AI Video Agent

Android app with an AI agent that edits/creates videos end-to-end:
agent plans → generates images (gflow-cli / Google Flow-Imagen) → edits/composes → renders MP4 (Hyperframes).

See `docs/superpowers/specs/2026-10-31-android-ai-video-agent-design.md` for the design and
`docs/superpowers/plans/2026-10-31-android-ai-video-agent.md` for the implementation plan.

## Stack

- Kotlin UI (Skeuomorphism, i18n id/en, light/dark theme)
- Rust native engine (JNI bridge)
- Hyperframes (HTML → MP4 via headless Chrome + FFmpeg)
- gflow-cli (image generation via Google Flow)
- Omniroute (LLM provider, configured via WebView)
- proot + Alpine runtime on Android
- noVNC + VNC server for browser surface in WebView

## Build

APK is built via GitHub Actions (`.github/workflows/build-apk.yml`) on push to `main`/`master`.
Scaffold is verified by `.github/workflows/scaffold-check.yml`.

### Upgradeable APK (seamless update)

The app is configured for **in-place upgrade** — you don't need to uninstall the old version before installing a new one:

1. **Same package name**: `applicationId = "com.example.aiagent"` stays constant across releases.
2. **Same signing certificate**: release builds are signed with the same keystore, so Android allows overwriting the installed app.
3. **Increasing versionCode**: each release bumps `versionCode` (e.g. `2`, `3`, `4`...) in `app/build.gradle.kts`. Android requires the new APK's `versionCode` to be higher than the installed one.
4. **Release signing secrets** (set in repo Settings → Secrets and variables → Actions):
   - `ANDROID_KEYSTORE_BASE64`: base64-encoded release keystore (`.jks`)
   - `ANDROID_KEYSTORE_PASSWORD`: keystore password
   - `ANDROID_KEY_ALIAS`: key alias
   - `ANDROID_KEY_PASSWORD`: key password

   When these secrets are set, CI builds a **signed release APK** (`app-release-apk`). Otherwise it falls back to debug.
5. **Install**: just install the new APK over the old one — Android upgrades in place (data preserved).

### Creating the release keystore (one-time)

```sh
keytool -genkey -v -keystore release-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias aiagent -storepass <storepass> -keypass <keypass>
```

Then encode it: `base64 -w 0 release-keystore.jks > keystore.b64` and paste the contents into the `ANDROID_KEYSTORE_BASE64` secret.

### Quick check (local)

```sh
cd android-ai-video-agent && sh scripts/check-scaffold.sh
```