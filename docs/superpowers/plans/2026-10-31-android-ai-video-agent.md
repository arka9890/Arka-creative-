# Android AI Video Agent — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Android AI video-editing agent app end to end (agent → generate images via gflow-cli → edit via Hyperframes → render MP4), with provider config via WebView, i18n, and themes.

**Architecture:** The app pairs a Kotlin UI layer (Skeuomorphism-styled, i18n-aware, theme-aware) with a Rust native engine (JNI bridge) hosting the AI agent orchestration: LLM via Omniroute → generate image via gflow-cli → edit via Hyperframes → render via headless Chrome + FFmpeg; browser surface via noVNC/VNC inside WebView; Linux runtime via proot+Alpine.

**Tech Stack:** Kotlin (UI), Rust (native engine), Hyperframes, gflow-cli, noVNC, proot + Alpine, Omniroute, FFmpeg, headless Chrome, i18n (id/en), theme (light/dark).

**Spec:** `docs/superpowers/specs/2026-10-31-android-ai-video-agent-design.md`

## Global Constraints

- gflow requires headed Chromium (Playwright persistent profile); Google auth via headed Chrome; WebView alone insufficient; browser surfaced via noVNC+VNC.
- Hyperframes requires Node.js 22+, FFmpeg, headless Chrome; deterministic render.
- Android runtime: proot + Alpine.
- Rust via JNI bridge.
- i18n/theme UI concerns.

## Review Focus

- Headed Chromium requirement for gflow auth/generation (noVNC+VNC correctness).
- Deterministic rendering correctness (frame capture + FFmpeg).
- JNI bridge correctness between Rust engine and Kotlin UI.
- i18n key coverage (id/en) and theme switching.

---

### Task 1: Scaffold Android project and Rust native bridge

**Files:**
- Create: Android project scaffolding (Gradle wrapper, app module, AndroidManifest), Rust crate (cdylib) with JNI entry points callable from Kotlin, cargo-ndk wiring.

**Interfaces:**
- Consumes: none.
- Produces: Rust cdylib with JNI entry points callable from Kotlin.

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement minimal code to make the test pass**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

### Task 2: Implement Rust agent host: Omniroute LLM client + orchestration

**Files:**
- Create: Rust agent host module (LLM client via Omniroute; orchestration: generate → edit → render).

**Interfaces:**
- Consumes: Rust cdylib bridge from Task 1.
- Produces: Rust functions callable from Kotlin that orchestrate the pipeline.

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement minimal code to make the test pass**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

### Task 3: Integrate gflow-cli image generation via headed Chromium

**Files:**
- Create: Integration layer invoking gflow-cli image generation (Google Flow / Imagen) via headed Chromium under proot+Alpine, surfaced via noVNC/VNC in WebView.

**Interfaces:**
- Consumes: Rust agent host from Task 2; noVNC/VNC browser surface.
- Produces: Image generation capability exposed to agent.

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement minimal code to make the test pass**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

### Task 4: Integrate Hyperframes rendering

**Files:**
- Create: Integration layer invoking Hyperframes render (HTML → MP4 via headless Chrome + FFmpeg).

**Interfaces:**
- Consumes: Rust agent host from Task 2.
- Produces: MP4 render capability.

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement minimal code to make the test pass**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

### Task 5: Implement UI layer (Skeuomorphism, i18n, theme)

**Files:**
- Create: Kotlin UI components with Skeuomorphism styling, i18n (id/en) keys, light/dark theme support.

**Interfaces:**
- Consumes: Rust agent host from Task 2 (via JNI).
- Produces: UI screens (agent chat, video preview, controls, Omniroute config WebView tab).

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement minimal code to make the test pass**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

### Task 6: Wire Omniroute config via WebView tab

**Files:**
- Create: WebView-based configuration UI for Omniroute (base URL, API key, model), surfaced per design.

**Interfaces:**
- Consumes: UI from Task 5.
- Produces: Configurable Omniroute provider.

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement minimal code to make the test pass**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

### Task 7: End-to-end integration and verification

**Files:**
- Create: End-to-end flow wiring (agent → images → edit → render → UI).

**Interfaces:**
- Consumes: Tasks 2–6.
- Produces: Working end-to-end pipeline.

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement minimal code to make the test pass**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

## Self-Review

(Per writing-plans self-review: spec coverage, step scan, type consistency, review focus, proportion.)

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-10-31-android-ai-video-agent.md`. Please review the plan. Which execution approach would you prefer?**

- **Subagent-driven** - A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** - I implement every task myself in this session, the way this harness runs work, then one fresh reviewer on the most capable model checks the whole branch. Cheapest and fastest; no independent review until the end. Runs well with a mid-tier session model, since the plan carries the design.

**For this plan I recommend <one of the two>, because <one sentence from the plan: how much the tasks depend on each other's interfaces, how many there are, what a shipped mistake would cost>. Does the plan capture what you want, and which approach should we use?**
