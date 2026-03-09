import { useStore } from "../store";

function Logs() {
  const logs = useStore((s) => s.logs);
  const clearLogs = useStore((s) => s.clearLogs);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Logs
        </h1>
        <div className="flex gap-2">
          <button
            onClick={clearLogs}
            className="px-3 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400">
            <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <p className="text-sm">No logs yet</p>
            <p className="text-xs mt-1">Logs will appear here when the service is running</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex gap-2 py-0.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded px-1"
              >
                <span className="text-zinc-400 shrink-0">{log.timestamp}</span>
                <span
                  className={`shrink-0 w-12 text-right ${
                    log.level === "error"
                      ? "text-red-500"
                      : log.level === "warn"
                        ? "text-yellow-500"
                        : log.level === "info"
                          ? "text-blue-500"
                          : "text-zinc-500"
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-zinc-700 dark:text-zinc-300 break-all">
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Logs;
