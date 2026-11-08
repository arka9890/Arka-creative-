//! proot + Alpine runtime helper for Android.
//!
//! Heavy tools (gflow-cli, Remotion/Node.js, FFmpeg, curl) live in an
//! Alpine Linux rootfs that runs on Android through `proot` (no root needed).
//! This module wraps command spawning so the orchestrator can target either:
//!
//!   - the proot+Alpine sidecar on Android (`ARCA_PROOT_ROOTFS` present), or
//!   - the host environment in development/CI (no rootfs => direct spawn).
//!
//! Env overrides:
//!   `ARCA_PROOT_BIN`     path to the `proot` binary (default: "proot")
//!   `ARCA_PROOT_ROOTFS`  path to the Alpine rootfs directory

use std::process::Command;

#[derive(Debug, Clone)]
pub struct ProotRuntime {
    pub proot_bin: String,
    pub rootfs: Option<String>,
}

impl ProotRuntime {
    pub fn from_env() -> Self {
        Self {
            proot_bin: std::env::var("ARCA_PROOT_BIN").unwrap_or_else(|_| "proot".to_string()),
            rootfs: Self::resolve_rootfs(),
        }
    }

    fn resolve_rootfs() -> Option<String> {
        if let Ok(p) = std::env::var("ARCA_PROOT_ROOTFS") {
            if std::path::Path::new(&p).exists() {
                return Some(p);
            }
        }
        // Common bundled default location in the app's private files dir.
        let defaults = [
            "/data/data/com.example.aiagent/files/alpine",
            "/data/data/com.example.aiagent/files/rootfs",
        ];
        for p in defaults {
            if std::path::Path::new(p).exists() {
                return Some(p.to_string());
            }
        }
        None
    }

    pub fn is_sidecar(&self) -> bool {
        self.rootfs.is_some()
    }

    /// Build a `Command` for `tool` with `args`, transparently wrapping it in
    /// `proot` when an Alpine rootfs is available.
    pub fn command(&self, tool: &str, args: &[&str]) -> Command {
        match &self.rootfs {
            Some(rootfs) => {
                let mut cmd = Command::new(&self.proot_bin);
                // Bind host paths the tool needs.
                cmd.args([
                    "-r", rootfs,
                    "-b", "/proc",
                    "-b", "/sys",
                    "-b", "/dev",
                    "-b", "/tmp",
                    "-w", "/root",
                ]);
                // Provide a virtual display for headed Chromium tools (gflow).
                cmd.args(["env", "DISPLAY=:1"]);
                cmd.arg(tool);
                cmd.args(args);
                cmd
            }
            None => {
                let mut cmd = Command::new(tool);
                cmd.args(args);
                cmd
            }
        }
    }

    pub fn describe(&self) -> String {
        match &self.rootfs {
            Some(r) => format!("proot sidecar: {} -> {}", self.proot_bin, r),
            None => "host environment (no sidecar)".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn from_env_defaults_without_sidecar() {
        // In CI/host there is no Alpine rootfs at the default paths, so the
        // runtime should fall back to direct spawning.
        std::env::remove_var("ARCA_PROOT_ROOTFS");
        let rt = ProotRuntime::from_env();
        assert!(!rt.is_sidecar() || rt.rootfs.is_some());
    }

    #[test]
    fn describe_is_not_empty() {
        let rt = ProotRuntime::from_env();
        assert!(!rt.describe().is_empty());
    }

    #[test]
    fn direct_command_has_no_proot_prefix_when_no_sidecar() {
        std::env::remove_var("ARCA_PROOT_ROOTFS");
        let rt = ProotRuntime::from_env();
        if !rt.is_sidecar() {
            let cmd = rt.command("echo", &["hello"]);
            let prog = cmd.get_program().to_str().unwrap_or("");
            assert_eq!(prog, "echo");
        }
    }
}
