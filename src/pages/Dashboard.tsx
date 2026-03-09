import { useState } from "react";
import { useStore } from "../store";
import { useSingBox } from "../hooks/useSingBox";

function Dashboard() {
  const status = useStore((s) => s.serviceStatus);
  const { start, stop } = useSingBox();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState("Rule");

  const handleToggle = async () => {
    setError(null);
    try {
      if (status === "stopped") {
        await start();
      } else if (status === "started") {
        await stop();
      }
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
        Dashboard
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            Status
          </div>
          <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {status === "started" ? (
              <span className="text-green-500">Connected</span>
            ) : status === "starting" ? (
              <span className="text-yellow-500">Connecting...</span>
            ) : status === "stopping" ? (
              <span className="text-yellow-500">Stopping...</span>
            ) : (
              <span className="text-zinc-400">Disconnected</span>
            )}
          </div>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            Connections
          </div>
          <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {status === "started" ? "0" : "--"}
          </div>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            Traffic
          </div>
          <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {status === "started" ? "↑ 0 B ↓ 0 B" : "--"}
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="mb-6">
        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Mode
        </div>
        <div className="flex gap-2">
          {["Rule", "Global", "Direct"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                mode === m
                  ? "bg-accent text-white hover:bg-accent-hover"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Start/Stop Button */}
      <button
        onClick={handleToggle}
        disabled={status === "starting" || status === "stopping"}
        className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
          status === "started"
            ? "bg-red-500 hover:bg-red-600 text-white"
            : status === "stopped"
              ? "bg-accent hover:bg-accent-hover text-white"
              : "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 cursor-not-allowed"
        }`}
      >
        {status === "stopped" && "Start"}
        {status === "starting" && "Starting..."}
        {status === "started" && "Stop"}
        {status === "stopping" && "Stopping..."}
      </button>
    </div>
  );
}

export default Dashboard;
