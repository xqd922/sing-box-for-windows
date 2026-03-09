import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

function Settings() {
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [autostart, setAutostart] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load initial states
    invoke<{ enabled: boolean; address: string | null }>("get_proxy_status")
      .then((data) => setProxyEnabled(data.enabled))
      .catch(console.error);

    invoke<boolean>("get_autostart_status")
      .then(setAutostart)
      .catch(console.error);
  }, []);

  const toggleProxy = async () => {
    setLoading("proxy");
    setError(null);
    try {
      if (proxyEnabled) {
        await invoke("clear_system_proxy");
        setProxyEnabled(false);
      } else {
        await invoke("set_system_proxy", { addr: "127.0.0.1:2080" });
        setProxyEnabled(true);
      }
    } catch (e) {
      setError(String(e));
    }
    setLoading(null);
  };

  const toggleAutostart = async () => {
    setLoading("autostart");
    setError(null);
    try {
      await invoke("set_autostart", { enable: !autostart });
      setAutostart(!autostart);
    } catch (e) {
      setError(String(e));
    }
    setLoading(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
        Settings
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* System Proxy */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              System Proxy
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Set Windows system proxy to 127.0.0.1:2080
            </div>
          </div>
          <Toggle
            checked={proxyEnabled}
            onChange={toggleProxy}
            disabled={loading === "proxy"}
          />
        </div>

        {/* TUN Mode */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              TUN Mode
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Transparent proxy via TUN interface (configure in profile)
            </div>
          </div>
          <Toggle checked={false} onChange={() => {}} disabled />
        </div>

        {/* Auto Start */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Start at Login
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Automatically start sing-box when Windows starts
            </div>
          </div>
          <Toggle
            checked={autostart}
            onChange={toggleAutostart}
            disabled={loading === "autostart"}
          />
        </div>

        <hr className="border-zinc-200 dark:border-zinc-700" />

        {/* About */}
        <div>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
            About
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
            <p>sing-box for Windows v1.0.0</p>
            <p>Core: sing-box v1.13.3</p>
            <p>Framework: Tauri 2 + React</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${checked ? "bg-accent" : "bg-zinc-300 dark:bg-zinc-600"}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default Settings;
