//! Omniroute LLM client.
//!
//! Generic chat-completion client for the Omniroute provider. Base URL, API key
//! and model are configurable so the Android UI can point at any Omniroute
//! deployment (set via the WebView config tab in Task 6).

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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

    /// Send a chat-completion request to Omniroute and return the assistant's text.
    pub fn chat_completion(&self, messages: Vec<ChatMessage>) -> Result<String, String> {
        let url = format!("{}/chat/completions", self.base_url.trim_end_matches('/'));

        let req = ChatCompletionRequest {
            model: &self.model,
            messages,
            temperature: Some(0.7),
            max_tokens: Some(1024),
        };

        let body = serde_json::to_string(&req).map_err(|e| format!("serialize request: {}", e))?;

        let resp = ureq::post(&url)
            .set("Content-Type", "application/json")
            .set("Authorization", &format!("Bearer {}", self.api_key))
            .send_string(&body)
            .map_err(|e| format!("http request: {}", e))?;

        let status = resp.status();
        let text = resp.into_string().map_err(|e| format!("read response: {}", e))?;

        if !(200..300).contains(&status) {
            return Err(format!("Omniroute HTTP {}: {}", status, text));
        }

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
