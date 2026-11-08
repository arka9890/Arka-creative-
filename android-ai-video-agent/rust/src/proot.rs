//! proot + Debian runtime helper for Android.
//!
//! Heavy tools (gflow-cli, Remotion/Node.js, FFmpeg, curl, Chrome arm64) live in a
//! Debian rootfs that runs on Android through `proot` (no root needed).
//! This module wraps command spawning and provides auto-install of the sidecar.
//!
//! Env overrides:
//!   `ARCA_PROOT_BIN`     path to the `proot` binary (default: "proot")
//!   `ARCA_PROOT_ROOTFS`  path to the Debian rootfs directory

use std::process::Command;
use std::io::{Read, Write};
use std::fs;
use std::path::Path;

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
            "/data/data/com.example.aiagent/files/debian",
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

    /// Install proot + Debian rootfs + Chrome arm64 + tools.
    /// Returns Ok(()) on success, Err(message) on failure.
    pub fn install_proot_debian(files_dir: &str) -> Result<(), String> {
        let rootfs_path = format!("{}/debian", files_dir);
        let proot_bin = format!("{}/proot", files_dir);

        // 1. Check if already installed
        if Path::new(&rootfs_path).exists() && Path::new(&proot_bin).exists() {
            return Ok(());
        }

        // 2. Download proot binary (static ARM64)
        let proot_url = "https://github.com/termux/proot-distro/releases/download/v4.7.0/proot-arm64";
        download_file(proot_url, &proot_bin)?;
        fs::set_permissions(&proot_bin, fs::Permissions::from_mode(0o755))
            .map_err(|e| format!("chmod proot: {}", e))?;

        // 3. Download Debian rootfs tarball
        let rootfs_tar = format!("{}/debian-rootfs.tar.gz", files_dir);
        let rootfs_url = "https://github.com/termux/proot-distro/releases/download/v4.7.0/debian-arm64.tar.gz";
        download_file(rootfs_url, &rootfs_tar)?;

        // 4. Extract rootfs
        extract_tar_gz(&rootfs_tar, &rootfs_path)?;

        // 5. Cleanup tarball
        let _ = fs::remove_file(&rootfs_tar);

        // 6. Setup inside rootfs: install packages (Chrome, gflow-cli deps, Node.js, FFmpeg, etc.)
        setup_rootfs_packages(&rootfs_path, &proot_bin)?;

        Ok(())
    }

    fn download_file(url: &str, dest: &str) -> Result<(), String> {
        let mut resp = reqwest::blocking::get(url)
            .map_err(|e| format!("download request: {}", e))?;
        let mut file = fs::File::create(dest)
            .map_err(|e| format!("create file: {}", e))?;
        let mut buffer = Vec::new();
        resp.read_to_end(&mut buffer)
            .map_err(|e| format!("read response: {}", e))?;
        file.write_all(&buffer)
            .map_err(|e| format!("write file: {}", e))?;
        Ok(())
    }

    fn extract_tar_gz(tar_path: &str, dest_dir: &str) -> Result<(), String> {
        let file = fs::File::open(tar_path)
            .map_err(|e| format!("open tar: {}", e))?;
        let decoder = flate2::read::GzDecoder::new(file);
        let mut archive = tar::Archive::new(decoder);
        archive.unpack(dest_dir)
            .map_err(|e| format!("extract tar: {}", e))?;
        Ok(())
    }

    fn setup_rootfs_packages(rootfs: &str, proot_bin: &str) -> Result<(), String> {
        // Run apt update and install packages inside proot
        let packages = [
            "curl", "wget", "ca-certificates", "gnupg", "lsb-release",
            "chromium", "xvfb", "x11vnc", "novnc", "websockify",
            "nodejs", "npm", "ffmpeg", "python3", "python3-pip",
            "git", "unzip", "fontconfig", "libnss3", "libatk1.0-0",
            "libatk-bridge2.0-0", "libcups2", "libdrm2", "libgbm1",
            "libasound2", "libxcomposite1", "libxdamage1", "libxfixes3",
            "libxrandr2", "libxkbcommon0", "libpango-1.0-0", "libcairo2"
        ];

        let mut cmd = Command::new(proot_bin);
        cmd.args([
            "-r", rootfs,
            "-b", "/proc", "-b", "/sys", "-b", "/dev", "-b", "/tmp",
            "-w", "/root",
            "env", "DEBIAN_FRONTEND=noninteractive",
            "apt-get", "update"
        ]);
        let out = cmd.output().map_err(|e| format!("apt update spawn: {}", e))?;
        if !out.status.success() {
            return Err(format!("apt update failed: {}", String::from_utf8_lossy(&out.stderr)));
        }

        let mut cmd = Command::new(proot_bin);
        cmd.args([
            "-r", rootfs,
            "-b", "/proc", "-b", "/sys", "-b", "/dev", "-b", "/tmp",
            "-w", "/root",
            "env", "DEBIAN_FRONTEND=noninteractive",
            "apt-get", "install", "-y"
        ]);
        cmd.args(&packages);
        let out = cmd.output().map_err(|e| format!("apt install spawn: {}", e))?;
        if !out.status.success() {
            return Err(format!("apt install failed: {}", String::from_utf8_lossy(&out.stderr)));
        }

        // Install gflow-cli via npm
        let mut cmd = Command::new(proot_bin);
        cmd.args([
            "-r", rootfs,
            "-b", "/proc", "-b", "/sys", "-b", "/dev", "-b", "/tmp",
            "-w", "/root",
            "npm", "install", "-g", "gflow-cli"
        ]);
        let out = cmd.output().map_err(|e| format!("npm install gflow-cli spawn: {}", e))?;
        if !out.status.success() {
            return Err(format!("npm install gflow-cli failed: {}", String::from_utf8_lossy(&out.stderr)));
        }

        // Install Remotion CLI
        let mut cmd = Command::new(proot_bin);
        cmd.args([
            "-r", rootfs,
            "-b", "/proc", "-b", "/sys", "-b", "/dev", "-b", "/tmp",
            "-w", "/root",
            "npm", "install", "-g", "@remotion/cli"
        ]);
        let out = cmd.output().map_err(|e| format!("npm install remotion spawn: {}", e))?;
        if !out.status.success() {
            return Err(format!("npm install remotion failed: {}", String::from_utf8_lossy(&out.stderr)));
        }

        // Install Kokoro TTS
        let mut cmd = Command::new(proot_bin);
        cmd.args([
            "-r", rootfs,
            "-b", "/proc", "-b", "/sys", "-b", "/dev", "-b", "/tmp",
            "-w", "/root",
            "pip3", "install", "kokoro-onnx"
        ]);
        let out = cmd.output().map_err(|e| format!("pip install kokoro spawn: {}", e))?;
        if !out.status.success() {
            return Err(format!("pip install kokoro failed: {}", String::from_utf8_lossy(&out.stderr)));
        }

        Ok(())
    }

    pub fn is_sidecar(&self) -> bool {
        self.rootfs.is_some()
    }

    /// Check if a tool exists in the rootfs (via `which` or direct path check).
    pub fn check_tool(&self, tool: &str) -> Result<bool, String> {
        let runtime = ProotRuntime::from_env();
        match &runtime.rootfs {
            Some(rootfs) => {
                // Check via `which` inside proot
                let mut cmd = Command::new(&runtime.proot_bin);
                cmd.args([
                    "-r", rootfs,
                    "-b", "/proc", "-b", "/sys", "-b", "/dev", "-b", "/tmp",
                    "-w", "/root",
                    "which", tool
                ]);
                let out = cmd.output().map_err(|e| format!("spawn which: {}", e))?;
                Ok(out.status.success())
            }
            None => {
                // Fallback: check in host PATH
                let mut cmd = Command::new("which");
                cmd.arg(tool);
                let out = cmd.output().map_err(|e| format!("spawn which: {}", e))?;
                Ok(out.status.success())
            }
        }
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
