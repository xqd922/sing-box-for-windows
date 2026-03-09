use tauri::Manager;

mod config;
mod singbox;
mod tray;

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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
