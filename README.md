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

## Quick check (local)
```sh
cd android-ai-video-agent && sh scripts/check-scaffold.sh
```
