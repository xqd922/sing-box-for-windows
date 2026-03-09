import { useStore } from "../store";

function StatusBadge() {
  const status = useStore((s) => s.serviceStatus);

  const statusConfig = {
    stopped: { label: "Stopped", color: "bg-zinc-400" },
    starting: { label: "Starting", color: "bg-yellow-400 animate-pulse" },
    started: { label: "Connected", color: "bg-green-500" },
    stopping: { label: "Stopping", color: "bg-yellow-400 animate-pulse" },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 px-1">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
        {config.label}
      </span>
    </div>
  );
}

export default StatusBadge;
