//! Omniroute LLM client.
//!
//! Generic chat-completion client for the Omniroute provider. Base URL, API key
//! and model are configurable so the Android UI can point at any Omniroute
//! deployment (set via the WebView config tab in Task 6).
//!
//! The HTTP call shells out to `curl` (already available on Android) rather than
//! pulling a Rust TLS crate, which keeps the cdylib dependency surface small and
//! avoids native-tls/rustls linking issues on the NDK toolchain.

use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone)]
pub struct OmnirouteClient {
    pub base_url: String,
    pub api_key: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
pub struct ChatCompletionRequest<'a> {
    pub model: &'a str,
    pub messages: Vec<ChatMessage>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct ChatCompletionResponse {
    pub choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
pub struct Choice {
    pub message: ChatMessage,
}

impl OmnirouteClient {
    pub fn new(base_url: String, api_key: String, model: String) -> Self {
        Self {
            base_url,
            api_key,
            model,
        }
    }

    /// Send a chat-completion request to Omniroute via `curl` and return the
    /// assistant's text.
    pub fn chat_completion(&self, messages: Vec<ChatMessage>) -> Result<String, String> {
        let url = format!("{}/chat/completions", self.base_url.trim_end_matches('/'));

        let req = ChatCompletionRequest {
            model: &self.model,
            messages,
            temperature: Some(0.7),
            max_tokens: Some(1024),
        };

        let body = serde_json::to_string(&req).map_err(|e| format!("serialize request: {}", e))?;

        // Build the curl command.
        let mut cmd = Command::new("curl");
        cmd.arg("-s")
            .arg("-X")
            .arg("POST")
            .arg(url)
            .arg("-H")
            .arg(format!("Content-Type: application/json"))
            .arg("-H")
            .arg(format!("Authorization: Bearer {}", self.api_key))
            .arg("-d")
            .arg(&body);

        let output = cmd.output().map_err(|e| format!("spawn curl: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "curl failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        let text = String::from_utf8_lossy(&output.stdout).to_string();

        let parsed: ChatCompletionResponse =
            serde_json::from_str(&text).map_err(|e| format!("parse response: {}", e))?;

        parsed
            .choices
            .into_iter()
            .next()
            .map(|c| c.message.content)
            .ok_or_else(|| "no choices in response".to_string())
    }

    /// Convenience: single-turn completion with a system + user message.
    pub fn complete(&self, system: &str, user: &str) -> Result<String, String> {
        self.chat_completion(vec![
            ChatMessage {
                role: "system".to_string(),
                content: system.to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: user.to_string(),
            },
        ])
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn client_new_stores_fields() {
        let c = OmnirouteClient::new(
            "https://api.example.com".to_string(),
            "sk-test".to_string(),
            "model-1".to_string(),
        );
        assert_eq!(c.base_url, "https://api.example.com");
        assert_eq!(c.api_key, "sk-test");
        assert_eq!(c.model, "model-1");
    }
}
