use serde::{Deserialize, Serialize};
use std::collections::HashMap;

const DEFAULT_API_URL: &str = "http://127.0.0.1:9090";

fn api_url() -> String {
    // TODO: read from active config's experimental.clash_api.external_controller
    DEFAULT_API_URL.to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyGroup {
    pub name: String,
    #[serde(rename = "type")]
    pub group_type: String,
    #[serde(default)]
    pub all: Vec<String>,
    #[serde(default)]
    pub now: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyInfo {
    pub name: String,
    #[serde(rename = "type")]
    pub proxy_type: String,
    #[serde(default)]
    pub all: Option<Vec<String>>,
    #[serde(default)]
    pub now: Option<String>,
    #[serde(default)]
    pub history: Vec<DelayHistory>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelayHistory {
    #[serde(default)]
    pub delay: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelayResult {
    pub delay: u32,
}

pub fn get_proxies() -> Result<Vec<ProxyGroup>, String> {
    let url = format!("{}/proxies", api_url());
    let response = ureq::get(&url)
        .call()
        .map_err(|e| format!("Failed to connect to Clash API: {}. Make sure experimental.clash_api is configured.", e))?;

    let text = response
        .into_body()
        .read_to_string()
        .map_err(|e| format!("Failed to read response: {}", e))?;
    let body: serde_json::Value =
        serde_json::from_str(&text).map_err(|e| format!("Failed to parse response: {}", e))?;

    let proxies = body
        .get("proxies")
        .and_then(|p| p.as_object())
        .ok_or_else(|| "Invalid proxies response".to_string())?;

    let group_types = ["Selector", "URLTest", "Fallback"];

    let mut groups: Vec<ProxyGroup> = proxies
        .iter()
        .filter_map(|(name, info)| {
            let proxy_type = info.get("type")?.as_str()?;
            if group_types.iter().any(|t| *t == proxy_type) {
                let all: Vec<String> = info
                    .get("all")
                    .and_then(|a| a.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_str().map(|s| s.to_string()))
                            .collect()
                    })
                    .unwrap_or_default();

                let now = info
                    .get("now")
                    .and_then(|n| n.as_str())
                    .unwrap_or("")
                    .to_string();

                Some(ProxyGroup {
                    name: name.clone(),
                    group_type: proxy_type.to_string(),
                    all,
                    now,
                })
            } else {
                None
            }
        })
        .collect();

    groups.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(groups)
}

pub fn select_proxy(group: &str, name: &str) -> Result<(), String> {
    let url = format!("{}/proxies/{}", api_url(), urlencoding_encode(group));
    let body = serde_json::json!({ "name": name });

    let json_str = serde_json::to_string(&body)
        .map_err(|e| format!("Failed to serialize: {}", e))?;

    ureq::put(&url)
        .content_type("application/json")
        .send(json_str.as_bytes())
        .map_err(|e| format!("Failed to select proxy: {}", e))?;

    Ok(())
}

pub fn test_delay(name: &str) -> Result<u32, String> {
    let url = format!(
        "{}/proxies/{}/delay?timeout=5000&url=https://www.gstatic.com/generate_204",
        api_url(),
        urlencoding_encode(name)
    );

    let response = ureq::get(&url)
        .call()
        .map_err(|e| format!("Delay test failed: {}", e))?;

    let text = response
        .into_body()
        .read_to_string()
        .map_err(|e| format!("Failed to parse delay: {}", e))?;
    let body: HashMap<String, serde_json::Value> =
        serde_json::from_str(&text).map_err(|e| format!("Failed to parse delay: {}", e))?;

    let delay = body
        .get("delay")
        .and_then(|d| d.as_u64())
        .unwrap_or(0) as u32;

    Ok(delay)
}

pub fn get_all_delays() -> Result<HashMap<String, u32>, String> {
    let url = format!("{}/proxies", api_url());
    let response = ureq::get(&url)
        .call()
        .map_err(|e| format!("Failed to connect: {}", e))?;

    let text = response
        .into_body()
        .read_to_string()
        .map_err(|e| format!("Failed to read: {}", e))?;
    let body: serde_json::Value =
        serde_json::from_str(&text).map_err(|e| format!("Failed to parse: {}", e))?;

    let proxies = body
        .get("proxies")
        .and_then(|p| p.as_object())
        .ok_or_else(|| "Invalid response".to_string())?;

    let mut delays = HashMap::new();
    for (name, info) in proxies {
        if let Some(history) = info.get("history").and_then(|h| h.as_array()) {
            if let Some(last) = history.last() {
                if let Some(delay) = last.get("delay").and_then(|d| d.as_u64()) {
                    if delay > 0 {
                        delays.insert(name.clone(), delay as u32);
                    }
                }
            }
        }
    }

    Ok(delays)
}

fn urlencoding_encode(s: &str) -> String {
    s.chars()
        .map(|c| match c {
            'A'..='Z' | 'a'..='z' | '0'..='9' | '-' | '_' | '.' | '~' => c.to_string(),
            _ => format!("%{:02X}", c as u32),
        })
        .collect()
}
