#!/bin/sh
# Launch a headed Chromium login flow inside the Alpine proot sidecar.
#
# Usage:
#   ROOTFS=/path/to/alpine ./scripts/run-gflow-login.sh
#
# Exposes noVNC/VNC on 127.0.0.1:5900 (via x11vnc) so the Android app's
# WebView can surface it. gflow writes the authenticated profile to ~/.gflow.

set -e
ROOTFS="${ROOTFS:-/tmp/alpine-rootfs}"
PROOT="${PROOT:-proot}"

if [ ! -d "$ROOTFS" ]; then
    echo "rootfs not found at $ROOTFS; run scripts/setup-alpine.sh first"
    exit 1
fi

exec "$PROOT" -r "$ROOTFS" -b /proc -b /sys -b /dev -b /tmp -w /root sh -c '
    Xvfb :1 -screen 0 1280x800x24 &
    sleep 2
    x11vnc -display :1 -rfbport 5900 -forever -shared -nopw &
    DISPLAY=:1 gflow auth login --browser chrome
'
