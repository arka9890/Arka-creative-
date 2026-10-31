//! Pipeline orchestration: LLM plan → gflow-cli generate → Hyperframes edit → render.
//!
//! gflow-cli drives Google Flow (Veo/Imagen) through a **headed Chromium** (Playwright
//! persistent profile). Google auth + reCAPTCHA require a headed browser, so the browser
//! surface is provided by noVNC → VNC server → WebView (see design doc). gflow-cli itself
//! must be installed in the proot+Alpine Linux environment on Android.

use crate::omniroute::OmnirouteClient;
use std::process::Command;

pub struct Orchestrator {
    pub client: OmnirouteClient,
}

impl Orchestrator {
    pub fn new(client: OmnirouteClient) -> Self {
        Self { client }
    }

    /// Run an end-to-end video creation pipeline from a user prompt.
    ///
    /// Steps:
    ///   1. Plan with Omniroute LLM (scene breakdown, visual style).
    ///   2. Generate key image via gflow-cli (`gflow image t2i`).
    ///   3. Compose/edit via Hyperframes HTML composition.
    ///   4. Render MP4 via Hyperframes (headless Chrome + FFmpeg).
    pub fn run_pipeline(&self, prompt: &str) -> Result<String, String> {
        let plan = self.plan(prompt)?;
        let image_path = self.generate_image(&plan)?;
        let html_path = self.edit_video(&plan, &image_path)?;
        let mp4_path = self.render_video(&html_path)?;
        Ok(mp4_path)
    }

    fn plan(&self, prompt: &str) -> Result<String, String> {
        self.client.complete(
            "You are a video production planner. Given a user prompt, produce a concise video plan (scenes, shots, visual style) as plain text.",
            prompt,
        )
    }

    /// Step 2: generate a key image via gflow-cli (`gflow image t2i <prompt>`).
    ///
    /// gflow writes the generated image under `$GFLOW_CLI_OUTPUT_DIR` (or cwd) and prints
    /// the written path on stdout. We capture stdout and trim it to the image path.
    pub fn generate_image(&self, prompt: &str) -> Result<String, String> {
        // Sanity-check that gflow is installed and authenticated before spending credits.
        let auth = Command::new("gflow")
            .args(["auth", "status"])
            .output();

        match auth {
            Ok(out) if out.status.success() => {}
            _ => {
                return Err(
                    "gflow not installed or not authenticated. Run 'gflow auth login' via headed Chromium (noVNC/VNC) first."
                        .to_string(),
                );
            }
        }

        let output = Command::new("gflow")
            .args(["image", "t2i", prompt])
            .output()
            .map_err(|e| format!("spawn gflow: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "gflow image t2i failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        // gflow prints the written image path; take the last non-empty line as the path.
        let path = stdout
            .lines()
            .filter(|l| !l.is_empty())
            .last()
            .unwrap_or("")
            .trim()
            .to_string();

        if path.is_empty() {
            return Err("gflow produced no image path".to_string());
        }

        Ok(path)
    }

    /// Step 3: write a Hyperframes composition HTML referencing the generated image.
    fn edit_video(&self, plan: &str, image_path: &str) -> Result<String, String> {
        let html = format!(
            r#"<div id="stage" data-composition-id="video" data-start="0" data-width="1920" data-height="1080">
  <img class="clip" data-start="0" data-duration="6" data-track-index="0" src="{}" />
</div>"#,
            image_path
        );

        let html_path = "/tmp/video.html";
        std::fs::write(html_path, html).map_err(|e| format!("write html: {}", e))?;

        Ok(html_path.to_string())
    }

    /// Step 4: render MP4 via Hyperframes (headless Chrome + FFmpeg).
    fn render_video(&self, html_path: &str) -> Result<String, String> {
        let output = Command::new("npx")
            .args(["hyperframes", "render", html_path, "-o", "/tmp/output.mp4"])
            .output()
            .map_err(|e| format!("spawn hyperframes: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "hyperframes render failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        Ok("/tmp/output.mp4".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn orchestrator_new_stores_client() {
        let client = crate::omniroute::OmnirouteClient::new(
            "https://api.example.com".to_string(),
            "sk-test".to_string(),
            "model-1".to_string(),
        );
        let o = Orchestrator::new(client);
        assert_eq!(o.client.model, "model-1");
    }
}
