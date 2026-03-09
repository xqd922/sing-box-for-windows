use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub profile_type: String, // "local" or "remote"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_updated: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ProfilesData {
    profiles: Vec<Profile>,
    active: Option<String>,
}

fn profiles_path(app: &AppHandle) -> Result<PathBuf, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config dir: {}", e))?;
    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config dir: {}", e))?;
    Ok(config_dir.join("profiles.json"))
}

fn profiles_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config dir: {}", e))?;
    let dir = config_dir.join("profiles");
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create profiles dir: {}", e))?;
    Ok(dir)
}

fn load_profiles_data(app: &AppHandle) -> Result<ProfilesData, String> {
    let path = profiles_path(app)?;
    if path.exists() {
        let data = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read profiles: {}", e))?;
        serde_json::from_str(&data)
            .map_err(|e| format!("Failed to parse profiles: {}", e))
    } else {
        Ok(ProfilesData {
            profiles: vec![],
            active: None,
        })
    }
}

fn save_profiles_data(app: &AppHandle, data: &ProfilesData) -> Result<(), String> {
    let path = profiles_path(app)?;
    let json = serde_json::to_string_pretty(data)
        .map_err(|e| format!("Failed to serialize profiles: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("Failed to write profiles: {}", e))
}

pub fn list_profiles(app: &AppHandle) -> Result<(Vec<Profile>, Option<String>), String> {
    let data = load_profiles_data(app)?;
    Ok((data.profiles, data.active))
}

pub fn add_local_profile(app: &AppHandle, name: &str, config_content: &str) -> Result<Profile, String> {
    let mut data = load_profiles_data(app)?;
    let id = format!("local_{}", chrono::Utc::now().timestamp_millis());
    let dir = profiles_dir(app)?;
    let config_path = dir.join(format!("{}.json", &id));

    // Validate JSON
    serde_json::from_str::<serde_json::Value>(config_content)
        .map_err(|e| format!("Invalid JSON config: {}", e))?;

    fs::write(&config_path, config_content)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    let profile = Profile {
        id: id.clone(),
        name: name.to_string(),
        profile_type: "local".to_string(),
        url: None,
        last_updated: Some(chrono::Utc::now().to_rfc3339()),
    };

    data.profiles.push(profile.clone());

    // Auto-activate if first profile
    if data.active.is_none() {
        data.active = Some(id);
    }

    save_profiles_data(app, &data)?;
    Ok(profile)
}

pub fn add_remote_profile(app: &AppHandle, name: &str, url: &str) -> Result<Profile, String> {
    let mut data = load_profiles_data(app)?;
    let id = format!("remote_{}", chrono::Utc::now().timestamp_millis());

    let profile = Profile {
        id: id.clone(),
        name: name.to_string(),
        profile_type: "remote".to_string(),
        url: Some(url.to_string()),
        last_updated: None,
    };

    data.profiles.push(profile.clone());

    if data.active.is_none() {
        data.active = Some(id);
    }

    save_profiles_data(app, &data)?;
    Ok(profile)
}

pub fn update_remote_profile(app: &AppHandle, id: &str) -> Result<String, String> {
    let data = load_profiles_data(app)?;
    let profile = data
        .profiles
        .iter()
        .find(|p| p.id == id)
        .ok_or_else(|| "Profile not found".to_string())?;

    let url = profile
        .url
        .as_ref()
        .ok_or_else(|| "Not a remote profile".to_string())?;

    // Download config synchronously (called from async context)
    let response = ureq::get(url)
        .call()
        .map_err(|e| format!("Failed to download: {}", e))?;

    let content = response
        .into_body()
        .read_to_string()
        .map_err(|e| format!("Failed to read response: {}", e))?;

    // Validate JSON
    serde_json::from_str::<serde_json::Value>(&content)
        .map_err(|e| format!("Invalid JSON config: {}", e))?;

    let dir = profiles_dir(app)?;
    let config_path = dir.join(format!("{}.json", id));
    fs::write(&config_path, &content)
        .map_err(|e| format!("Failed to save config: {}", e))?;

    // Update timestamp
    let mut data = load_profiles_data(app)?;
    if let Some(p) = data.profiles.iter_mut().find(|p| p.id == id) {
        p.last_updated = Some(chrono::Utc::now().to_rfc3339());
    }
    save_profiles_data(app, &data)?;

    Ok("Profile updated".to_string())
}

pub fn set_active_profile(app: &AppHandle, id: &str) -> Result<(), String> {
    let mut data = load_profiles_data(app)?;
    if !data.profiles.iter().any(|p| p.id == id) {
        return Err("Profile not found".to_string());
    }
    data.active = Some(id.to_string());
    save_profiles_data(app, &data)?;

    // Symlink active config to config.json
    let dir = profiles_dir(app)?;
    let source = dir.join(format!("{}.json", id));
    if source.exists() {
        let config_dir = app
            .path()
            .app_config_dir()
            .map_err(|e| format!("Failed to get config dir: {}", e))?;
        let dest = config_dir.join("config.json");
        let content = fs::read_to_string(&source)
            .map_err(|e| format!("Failed to read profile config: {}", e))?;
        fs::write(&dest, content)
            .map_err(|e| format!("Failed to write active config: {}", e))?;
    }

    Ok(())
}

pub fn delete_profile(app: &AppHandle, id: &str) -> Result<(), String> {
    let mut data = load_profiles_data(app)?;
    data.profiles.retain(|p| p.id != id);
    if data.active.as_deref() == Some(id) {
        data.active = data.profiles.first().map(|p| p.id.clone());
    }
    save_profiles_data(app, &data)?;

    // Delete config file
    let dir = profiles_dir(app)?;
    let config_path = dir.join(format!("{}.json", id));
    let _ = fs::remove_file(config_path);

    Ok(())
}

pub fn get_active_config_path(app: &AppHandle) -> Result<Option<PathBuf>, String> {
    let data = load_profiles_data(app)?;
    if let Some(id) = data.active {
        let dir = profiles_dir(app)?;
        let path = dir.join(format!("{}.json", &id));
        if path.exists() {
            return Ok(Some(path));
        }
    }
    Ok(None)
}

pub fn get_config_dir_path(app: &AppHandle) -> Result<String, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config dir: {}", e))?;
    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config dir: {}", e))?;
    Ok(config_dir.display().to_string())
}
