use std::collections::HashMap;

mod clash_api;
mod config;
mod proxy;
mod singbox;
mod tray;

// === Service commands ===

#[tauri::command]
fn get_service_status() -> String {
    singbox::get_status()
}

#[tauri::command]
fn start_service(app: tauri::AppHandle, config_path: Option<String>) -> Result<String, String> {
    let path = if config_path.is_some() {
        config_path
    } else {
        config::get_active_config_path(&app)?
            .map(|p| p.display().to_string())
    };
    singbox::start(&app, path)
}

#[tauri::command]
fn stop_service() -> Result<String, String> {
    singbox::stop()
}

// === Profile commands ===

#[tauri::command]
fn list_profiles(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let (profiles, active) = config::list_profiles(&app)?;
    Ok(serde_json::json!({ "profiles": profiles, "active": active }))
}

#[tauri::command]
fn add_local_profile(app: tauri::AppHandle, name: String, content: String) -> Result<config::Profile, String> {
    config::add_local_profile(&app, &name, &content)
}

#[tauri::command]
fn add_remote_profile(app: tauri::AppHandle, name: String, url: String) -> Result<config::Profile, String> {
    config::add_remote_profile(&app, &name, &url)
}

#[tauri::command]
fn update_remote_profile(app: tauri::AppHandle, id: String) -> Result<String, String> {
    config::update_remote_profile(&app, &id)
}

#[tauri::command]
fn set_active_profile(app: tauri::AppHandle, id: String) -> Result<(), String> {
    config::set_active_profile(&app, &id)
}

#[tauri::command]
fn delete_profile(app: tauri::AppHandle, id: String) -> Result<(), String> {
    config::delete_profile(&app, &id)
}

#[tauri::command]
fn get_config_dir(app: tauri::AppHandle) -> Result<String, String> {
    config::get_config_dir_path(&app)
}

// === Clash API / Groups commands ===

#[tauri::command]
fn get_proxy_groups() -> Result<Vec<clash_api::ProxyGroup>, String> {
    clash_api::get_proxies()
}

#[tauri::command]
fn select_proxy(group: String, name: String) -> Result<(), String> {
    clash_api::select_proxy(&group, &name)
}

#[tauri::command]
fn test_proxy_delay(name: String) -> Result<u32, String> {
    clash_api::test_delay(&name)
}

#[tauri::command]
fn get_all_delays() -> Result<HashMap<String, u32>, String> {
    clash_api::get_all_delays()
}

// === System commands ===

#[tauri::command]
fn set_system_proxy(addr: String) -> Result<(), String> {
    proxy::set_system_proxy(&addr)
}

#[tauri::command]
fn clear_system_proxy() -> Result<(), String> {
    proxy::clear_system_proxy()
}

#[tauri::command]
fn get_proxy_status() -> serde_json::Value {
    serde_json::json!({
        "enabled": proxy::is_proxy_enabled(),
        "address": proxy::get_proxy_address(),
    })
}

#[tauri::command]
fn set_autostart(app: tauri::AppHandle, enable: bool) -> Result<(), String> {
    let exe = std::env::current_exe()
        .map_err(|e| format!("Failed to get exe path: {}", e))?;
    let _ = &app; // satisfy unused warning
    proxy::set_autostart(&exe.display().to_string(), enable)
}

#[tauri::command]
fn get_autostart_status() -> bool {
    proxy::is_autostart_enabled()
}

// === App entry ===

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            tray::create_tray(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_service_status,
            start_service,
            stop_service,
            list_profiles,
            add_local_profile,
            add_remote_profile,
            update_remote_profile,
            set_active_profile,
            delete_profile,
            get_config_dir,
            get_proxy_groups,
            select_proxy,
            test_proxy_delay,
            get_all_delays,
            set_system_proxy,
            clear_system_proxy,
            get_proxy_status,
            set_autostart,
            get_autostart_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
