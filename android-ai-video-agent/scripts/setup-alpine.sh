#!/bin/sh
# One-shot bootstrap for the proot runtime (Alpine/musl).
#
# Run this INSIDE the proot container (Alpine rootfs), after first boot.
# Idempotent: safe to run multiple times.
#
# Notes:
#  - Google's official Chrome binary requires glibc, so on Alpine we install
#    the Open Source `chromium` package. gflow-cli can use it; for maximum
#    reCAPTCHA tolerance on hardened accounts prefer a Debian/glibc rootfs with
#    `google-chrome-stable` (see plan under `docs/`).
#  - After this completes, verify with: `sh setup-alpine.sh --check`.

set -e

CHECK_ONLY=0
[ "${1:-}" = "--check" ] && CHECK_ONLY=1

need() { command -v "$1" >/dev/null 2>&1; }

install_pkgs() {
    apk update
    apk add --no-cache \
        bash python3 py3-pip nodejs npm \
        ffmpeg curl git cmake make g++ pkgconfig \
        chromium xrandr \
        tigervnc x11vnc xvfb \
        font-noto
}

if [ "$CHECK_ONLY" = 0 ]; then
    install_pkgs

    # Python / gflow-cli (pinned; bump via manifest update)
    python3 -m pip install --upgrade pip
    python3 -m pip install "gflow-cli==0.92" "playwright==1.59.0"
    python3 -m playwright install chromium

    # Node / Remotion (pinned)
    npm install -g "remotion@4.0.250" "concurrently" 2>/dev/null || true

    # whisper.cpp (build)
    if [ ! -d /opt/whisper.cpp ]; then
        git clone https://github.com/ggerganov/whisper.cpp /opt/whisper.cpp
        cd /opt/whisper.cpp
        cmake -B build -DWHISPER_BUILD_TESTS=OFF
        cmake --build build -j"$(nproc)"
        # medium.en model
        sh ./models/download-ggml-model.sh medium.en
    fi

    # Kokoro model path (mount/link from host or download separately)
    mkdir -p /opt/kokoro-models
fi

echo "=== Health check ==="
for bin in node python3 ffmpeg curl chromium Xvfb vncserver; do
    if need "$bin"; then echo "OK   $bin"; else echo "MISS $bin"; fi
done
echo "gflow:  $(gflow --version 2>/dev/null || echo 'not installed')"
echo "npx:    $(npx --version 2>/dev/null || echo 'not installed')"
echo "Rootfs: $(uname -s) $(uname -m)"
echo "Done."
