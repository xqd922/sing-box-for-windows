use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::sync::OnceLock;
use std::thread;
use tauri::{AppHandle, Emitter, Manager};

struct SingBoxProcess {
    child: Child,
}

static PROCESS: OnceLock<Mutex<Option<SingBoxProcess>>> = OnceLock::new();

fn process_lock() -> &'static Mutex<Option<SingBoxProcess>> {
    PROCESS.get_or_init(|| Mutex::new(None))
}

pub fn get_status() -> String {
    let mut lock = process_lock().lock().unwrap();
    if let Some(ref mut proc) = *lock {
        // Check if process is still alive
        match proc.child.try_wait() {
            Ok(Some(_)) => {
                // Process exited
                *lock = None;
                "stopped".to_string()
            }
            Ok(None) => "started".to_string(),
            Err(_) => {
                *lock = None;
                "stopped".to_string()
            }
        }
    } else {
        "stopped".to_string()
    }
}

pub fn find_singbox_binary(app: &AppHandle) -> Result<PathBuf, String> {
    // 1. Check bundled resources
    if let Ok(resource_dir) = app.path().resource_dir() {
        let bundled = resource_dir.join("resources").join("sing-box.exe");
        if bundled.exists() {
            return Ok(bundled);
        }
    }

    // 2. Check app config dir
    if let Ok(config_dir) = app.path().app_config_dir() {
        let in_config = config_dir.join("sing-box.exe");
        if in_config.exists() {
            return Ok(in_config);
        }
    }

    // 3. Check PATH
    if let Ok(output) = Command::new("where").arg("sing-box.exe").output() {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout)
                .lines()
                .next()
                .unwrap_or("")
                .trim()
                .to_string();
            if !path.is_empty() {
                return Ok(PathBuf::from(path));
            }
        }
    }

    Err("sing-box.exe not found. Place it in the app config directory or add to PATH.".to_string())
}

pub fn get_config_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get config dir: {}", e))?;
    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config dir: {}", e))?;
    Ok(config_dir)
}

pub fn start(app: &AppHandle, config_path: Option<String>) -> Result<String, String> {
    let mut lock = process_lock().lock().unwrap();

    // Check if already running
    if let Some(ref mut proc) = *lock {
        if proc.child.try_wait().map_or(false, |s| s.is_none()) {
            return Err("Service already running".to_string());
        }
    }

    let singbox_path = find_singbox_binary(app)?;

    // Determine config path
    let cfg_path = if let Some(p) = config_path {
        PathBuf::from(p)
    } else {
        let config_dir = get_config_dir(app)?;
        config_dir.join("config.json")
    };

    if !cfg_path.exists() {
        return Err(format!(
            "Config not found: {}. Add a profile first.",
            cfg_path.display()
        ));
    }

    let mut child = Command::new(&singbox_path)
        .arg("run")
        .arg("-c")
        .arg(&cfg_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start sing-box: {}", e))?;

    // Stream stdout logs to frontend
    if let Some(stdout) = child.stdout.take() {
        let app_handle = app.clone();
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                if let Ok(line) = line {
                    let _ = app_handle.emit("singbox-log", &line);
                }
            }
        });
    }

    // Stream stderr logs to frontend
    if let Some(stderr) = child.stderr.take() {
        let app_handle = app.clone();
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(line) = line {
                    let _ = app_handle.emit("singbox-log", &line);
                }
            }
        });
    }

    // Monitor process exit
    let pid = child.id();
    let app_handle = app.clone();
    let monitor_lock = process_lock();
    thread::spawn(move || {
        loop {
            thread::sleep(std::time::Duration::from_secs(1));
            let mut lock = monitor_lock.lock().unwrap();
            if let Some(ref mut proc) = *lock {
                if proc.child.id() == pid {
                    match proc.child.try_wait() {
                        Ok(Some(status)) => {
                            let code = status.code().unwrap_or(-1);
                            let _ = app_handle.emit("singbox-exit", code);
                            *lock = None;
                            break;
                        }
                        Ok(None) => {} // Still running
                        Err(_) => {
                            *lock = None;
                            break;
                        }
                    }
                } else {
                    break; // Different process, stop monitoring
                }
            } else {
                break;
            }
        }
    });

    *lock = Some(SingBoxProcess {
        child,
    });

    Ok(format!("Started with {}", singbox_path.display()))
}

pub fn stop() -> Result<String, String> {
    let mut lock = process_lock().lock().unwrap();
    match lock.take() {
        Some(mut proc) => {
            // Try graceful kill first, then force
            let pid = proc.child.id();
            let _ = Command::new("taskkill")
                .args(["/PID", &pid.to_string()])
                .output();

            // Wait briefly for graceful shutdown
            thread::sleep(std::time::Duration::from_millis(500));

            // Force kill if still running
            match proc.child.try_wait() {
                Ok(Some(_)) => {}
                _ => {
                    let _ = Command::new("taskkill")
                        .args(["/F", "/PID", &pid.to_string()])
                        .output();
                    let _ = proc.child.wait();
                }
            }

            Ok("Service stopped".to_string())
        }
        None => Err("Service is not running".to_string()),
    }
}
