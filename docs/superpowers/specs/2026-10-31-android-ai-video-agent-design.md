# Android AI Video Agent — Design

> **Status:** Final — approved 2026-10-31.

## Intent and Why

The user wants an Android application that hosts an AI agent capable of editing videos end to end. The agent should plan a video, generate assets, edit/compose, and render an MP4 — not merely chat. The design covers the agent orchestration, asset generation, editing, rendering, provider configuration, and UI concerns.

## Goals

- End-to-end agent-driven video creation/editing pipeline.
- Hyperframes as the HTML → MP4 rendering engine.
- gflow-cli as the image generation backend (Google Flow / Imagen).
- `/hyperframes` creative skill as the agent creative loop.
- Omniroute as the LLM provider, configurable via the in-app WebView tab.
- Browser surface for gflow auth via noVNC → VNC server → WebView.
- Linux runtime on Android via proot + Alpine.
- Native engine in Rust with JNI bridge to Kotlin UI.
- i18n: Indonesian and English, auto-switch by user selection.
- Theme: light and dark.
- UI: Skeuomorphism with neat, structured components.

## Non-Goals

- Hyperframes Studio as the primary editor UI in the initial scope.

## Constraints

- gflow-cli requires a headed Chromium (Playwright persistent profile); Google auth and reCAPTCHA require a headed browser; a plain WebView cannot serve this — hence noVNC + VNC server in the Linux environment, surfaced in the WebView.
- Hyperframes requires Node.js 22+, FFmpeg, and headless Chrome; rendering is deterministic (frame capture + FFmpeg encode).
- Android Linux runtime: proot + Alpine.
- Rust native engine: JNI bridge to Kotlin UI layer.
- i18n and theme are UI-layer concerns.

## Approaches Considered and Decisions

- Editing engine: Remotion (React components) vs Hyperframes (HTML-native, no build step, agent-friendly, deterministic, CLI non-interactive) → **Hyperframes**.
- Creative skill: gflow-cli `creative-director` vs HyperFrames `/hyperframes` → **`/hyperframes`** (with `creative-director` as a potential sub-step for prompt rewriting before generation).
- Image generation: gflow-cli only.
- Browser surface: noVNC + VNC server → WebView.
- Language: Rust.
- UI/UX: Skeuomorphism + neat structured components.
- i18n: Indonesian + English, auto-switch.
- Theme: light + dark.

## Open Questions

- Where the agent loop executes (on-device via proot vs backend).
- How the agent invokes gflow-cli and Hyperframes (subprocess / MCP).
- Omniroute integration details.
- Asset storage.
