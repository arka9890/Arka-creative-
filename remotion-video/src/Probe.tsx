import React from "react";
import { AbsoluteFill, delayRender, continueRender } from "remotion";

export const Probe: React.FC = () => {
  const [handle] = React.useState(() => delayRender("probe"));
  React.useEffect(() => {
    const el = document.getElementById("msg")!;
    try {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 64;
      document.body.appendChild(c);
      const gl = c.getContext("webgl") as WebGLRenderingContext | null;
      if (!gl) {
        el.style.background = "#e53935";
        el.textContent = "NULL";
      } else {
        gl.clearColor(1, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        const px = new Uint8Array(4);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        el.style.background = "#00c853";
        el.textContent = "OK " + Array.from(px).join(",");
      }
    } catch (e: any) {
      el.style.background = "#fb8c00";
      el.textContent = "EXC " + (e?.message ?? "").slice(0, 40);
    }
    continueRender(handle);
  }, []);
  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
      <div
        id="msg"
        style={{
          fontFamily: "monospace",
          fontSize: 40,
          padding: 24,
          color: "#000",
          background: "#ffffff",
          display: "inline-block",
        }}
      >
        PENDING
      </div>
    </AbsoluteFill>
  );
};
