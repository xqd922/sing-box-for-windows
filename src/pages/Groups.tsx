import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState, useCallback } from "react";
import { useStore } from "../store";

interface ProxyGroup {
  name: string;
  group_type: string;
  all: string[];
  now: string;
}

function Groups() {
  const status = useStore((s) => s.serviceStatus);
  const [groups, setGroups] = useState<ProxyGroup[]>([]);
  const [delays, setDelays] = useState<Record<string, number>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (status !== "started") {
      setGroups([]);
      return;
    }
    try {
      const data = await invoke<ProxyGroup[]>("get_proxy_groups");
      setGroups(data);
      setError(null);
      // Also fetch cached delays
      try {
        const d = await invoke<Record<string, number>>("get_all_delays");
        setDelays(d);
      } catch {
        // Delays may not be available yet
      }
    } catch (e) {
      setError(String(e));
    }
  }, [status]);

  useEffect(() => {
    refresh();
    if (status === "started") {
      const interval = setInterval(refresh, 5000);
      return () => clearInterval(interval);
    }
  }, [refresh, status]);

  const handleSelect = async (group: string, name: string) => {
    try {
      await invoke("select_proxy", { group, name });
      setGroups((prev) =>
        prev.map((g) => (g.name === group ? { ...g, now: name } : g))
      );
    } catch (e) {
      setError(String(e));
    }
  };

  const handleTestDelay = async (name: string) => {
    setTesting(name);
    try {
      const delay = await invoke<number>("test_proxy_delay", { name });
      setDelays((prev) => ({ ...prev, [name]: delay }));
    } catch {
      setDelays((prev) => ({ ...prev, [name]: 0 }));
    }
    setTesting(null);
  };

  const handleTestAll = async (group: ProxyGroup) => {
    for (const node of group.all) {
      handleTestDelay(node);
    }
  };

  const formatDelay = (ms: number | undefined) => {
    if (ms === undefined) return "";
    if (ms === 0) return "timeout";
    return `${ms}ms`;
  };

  const delayColor = (ms: number | undefined) => {
    if (ms === undefined) return "text-zinc-400";
    if (ms === 0) return "text-red-500";
    if (ms < 200) return "text-green-500";
    if (ms < 500) return "text-yellow-500";
    return "text-orange-500";
  };

  if (status !== "started") {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
          Groups
        </h1>
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
          </svg>
          <p className="text-sm">No groups available</p>
          <p className="text-xs mt-1">Start the service to see proxy groups</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Groups
        </h1>
        <button
          onClick={refresh}
          className="p-1.5 text-zinc-400 hover:text-accent rounded transition-colors"
          title="Refresh"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {groups.length === 0 && !error ? (
        <div className="text-center py-8 text-zinc-400 text-sm">
          No proxy groups found. Make sure your config has outbound groups.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.name}
              className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
            >
              {/* Group Header */}
              <button
                onClick={() =>
                  setExpandedGroup(
                    expandedGroup === group.name ? null : group.name
                  )
                }
                className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {group.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded">
                    {group.group_type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-accent">{group.now}</span>
                  <svg
                    className={`w-4 h-4 text-zinc-400 transition-transform ${expandedGroup === group.name ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </button>

              {/* Expanded Node List */}
              {expandedGroup === group.name && (
                <div className="border-t border-zinc-200 dark:border-zinc-700">
                  {/* Test All button */}
                  <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end">
                    <button
                      onClick={() => handleTestAll(group)}
                      className="text-[10px] px-2 py-1 text-accent hover:bg-accent/10 rounded transition-colors"
                    >
                      Test All
                    </button>
                  </div>

                  <div className="max-h-64 overflow-auto">
                    {group.all.map((node) => (
                      <button
                        key={node}
                        onClick={() => handleSelect(group.name, node)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${
                          group.now === node
                            ? "bg-blue-50 dark:bg-blue-900/10"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${group.now === node ? "bg-accent" : "bg-transparent"}`}
                          />
                          <span
                            className={`text-xs ${group.now === node ? "text-accent font-medium" : "text-zinc-700 dark:text-zinc-300"}`}
                          >
                            {node}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] ${delayColor(delays[node])}`}
                          >
                            {testing === node ? "..." : formatDelay(delays[node])}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestDelay(node);
                            }}
                            className="p-1 text-zinc-300 hover:text-accent rounded transition-colors"
                            title="Test delay"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                            </svg>
                          </button>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Groups;
