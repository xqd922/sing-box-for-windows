import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef } from "react";
import { useStore } from "../store";

let logIdCounter = 0;

export function useSingBox() {
  const setStatus = useStore((s) => s.setServiceStatus);
  const addLog = useStore((s) => s.addLog);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Listen for log events from Rust backend
    const unlistenLog = listen<string>("singbox-log", (event) => {
      const line = event.payload;
      const parsed = parseLogLine(line);
      addLog({
        id: ++logIdCounter,
        level: parsed.level,
        message: parsed.message,
        timestamp: parsed.timestamp,
      });
    });

    // Listen for process exit
    const unlistenExit = listen<number>("singbox-exit", (event) => {
      setStatus("stopped");
      addLog({
        id: ++logIdCounter,
        level: "warn",
        message: `sing-box exited with code ${event.payload}`,
        timestamp: new Date().toLocaleTimeString(),
      });
    });

    // Check initial status
    invoke<string>("get_service_status").then((status) => {
      setStatus(status as "stopped" | "started");
    });

    return () => {
      unlistenLog.then((fn) => fn());
      unlistenExit.then((fn) => fn());
    };
  }, [setStatus, addLog]);

  const start = async (configPath?: string) => {
    setStatus("starting");
    try {
      await invoke("start_service", { configPath: configPath ?? null });
      setStatus("started");
    } catch (e) {
      setStatus("stopped");
      throw e;
    }
  };

  const stop = async () => {
    setStatus("stopping");
    try {
      await invoke("stop_service");
      setStatus("stopped");
    } catch (e) {
      setStatus("started");
      throw e;
    }
  };

  return { start, stop };
}

function parseLogLine(line: string): {
  level: string;
  message: string;
  timestamp: string;
} {
  // sing-box log format: LEVEL[TIMESTAMP] message
  // or just plain text
  const match = line.match(
    /^(TRACE|DEBUG|INFO|WARN|ERROR|FATAL|PANIC)\[([^\]]+)\]\s*(.*)/i
  );
  if (match) {
    return {
      level: match[1].toLowerCase(),
      timestamp: match[2],
      message: match[3],
    };
  }

  return {
    level: "info",
    message: line,
    timestamp: new Date().toLocaleTimeString(),
  };
}
