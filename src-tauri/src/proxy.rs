use std::process::Command;

/// Set Windows system proxy via registry
pub fn set_system_proxy(addr: &str) -> Result<(), String> {
    // Enable proxy
    reg_set(
        r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings",
        "ProxyEnable",
        "1",
        "REG_DWORD",
    )?;

    // Set proxy address
    reg_set(
        r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings",
        "ProxyServer",
        addr,
        "REG_SZ",
    )?;

    refresh_proxy_settings();
    Ok(())
}

/// Clear Windows system proxy
pub fn clear_system_proxy() -> Result<(), String> {
    reg_set(
        r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings",
        "ProxyEnable",
        "0",
        "REG_DWORD",
    )?;

    refresh_proxy_settings();
    Ok(())
}

/// Check if system proxy is enabled
pub fn is_proxy_enabled() -> bool {
    let output = Command::new("reg")
        .args([
            "query",
            r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings",
            "/v",
            "ProxyEnable",
        ])
        .output();

    match output {
        Ok(o) => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            stdout.contains("0x1")
        }
        Err(_) => false,
    }
}

/// Get current proxy address
pub fn get_proxy_address() -> Option<String> {
    let output = Command::new("reg")
        .args([
            "query",
            r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings",
            "/v",
            "ProxyServer",
        ])
        .output()
        .ok()?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        if line.contains("ProxyServer") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            return parts.last().map(|s| s.to_string());
        }
    }
    None
}

/// Set autostart via registry
pub fn set_autostart(exe_path: &str, enable: bool) -> Result<(), String> {
    let key = r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run";
    if enable {
        reg_set(key, "sing-box", exe_path, "REG_SZ")
    } else {
        reg_delete(key, "sing-box")
    }
}

/// Check if autostart is enabled
pub fn is_autostart_enabled() -> bool {
    let output = Command::new("reg")
        .args([
            "query",
            r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
            "/v",
            "sing-box",
        ])
        .output();

    match output {
        Ok(o) => o.status.success(),
        Err(_) => false,
    }
}

fn reg_set(key: &str, name: &str, value: &str, reg_type: &str) -> Result<(), String> {
    let output = Command::new("reg")
        .args(["add", key, "/v", name, "/t", reg_type, "/d", value, "/f"])
        .output()
        .map_err(|e| format!("Failed to run reg: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        Err(format!(
            "reg add failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ))
    }
}

fn reg_delete(key: &str, name: &str) -> Result<(), String> {
    let _ = Command::new("reg")
        .args(["delete", key, "/v", name, "/f"])
        .output();
    Ok(())
}

fn refresh_proxy_settings() {
    // Notify Windows to refresh proxy settings
    // This calls InternetSetOption via a small PowerShell snippet
    let _ = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            r#"
            $source = @"
            [DllImport("wininet.dll", SetLastError=true)]
            public static extern bool InternetSetOption(IntPtr hInternet, int dwOption, IntPtr lpBuffer, int dwBufferLength);
            "@
            $type = Add-Type -MemberDefinition $source -Name WinInet -Namespace Proxy -PassThru
            $type::InternetSetOption([IntPtr]::Zero, 39, [IntPtr]::Zero, 0) | Out-Null
            $type::InternetSetOption([IntPtr]::Zero, 37, [IntPtr]::Zero, 0) | Out-Null
            "#,
        ])
        .output();
}
