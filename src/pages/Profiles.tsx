import { useEffect, useState, useRef } from "react";
import {
  listProfiles,
  addLocalProfile,
  addRemoteProfile,
  updateRemoteProfile,
  setActiveProfile,
  deleteProfile,
  getConfigDir,
  type Profile,
} from "../hooks/useProfiles";

function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<"local" | "remote">("local");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [configContent, setConfigContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [configDir, setConfigDir] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try {
      const data = await listProfiles();
      setProfiles(data.profiles);
      setActiveId(data.active);
    } catch (e) {
      console.error("Failed to load profiles:", e);
    }
  };

  useEffect(() => {
    refresh();
    getConfigDir().then(setConfigDir).catch(console.error);
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (addType === "local") {
        if (!configContent.trim()) {
          setError("Config content is required");
          setLoading(false);
          return;
        }
        await addLocalProfile(name, configContent);
      } else {
        if (!url.trim()) {
          setError("URL is required");
          setLoading(false);
          return;
        }
        const profile = await addRemoteProfile(name, url);
        // Auto-fetch remote config
        try {
          await updateRemoteProfile(profile.id);
        } catch (e) {
          console.warn("Auto-fetch failed:", e);
        }
      }
      setShowAdd(false);
      setName("");
      setUrl("");
      setConfigContent("");
      await refresh();
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setConfigContent(ev.target?.result as string);
      if (!name) setName(file.name.replace(/\.json$/, ""));
    };
    reader.readAsText(file);
  };

  const handleActivate = async (id: string) => {
    try {
      await setActiveProfile(id);
      setActiveId(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProfile(id);
      await refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (id: string) => {
    setLoading(true);
    try {
      await updateRemoteProfile(id);
      await refresh();
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Profiles
        </h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-1.5 text-sm bg-accent hover:bg-accent-hover text-white rounded-md transition-colors"
        >
          {showAdd ? "Cancel" : "+ Add Profile"}
        </button>
      </div>

      {configDir && (
        <p className="text-[10px] text-zinc-400 mb-4 break-all">
          Config dir: {configDir}
        </p>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Add profile form */}
      {showAdd && (
        <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setAddType("local")}
              className={`px-3 py-1 text-xs rounded ${addType === "local" ? "bg-accent text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"}`}
            >
              Local
            </button>
            <button
              onClick={() => setAddType("remote")}
              className={`px-3 py-1 text-xs rounded ${addType === "remote" ? "bg-accent text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"}`}
            >
              Remote
            </button>
          </div>
          <input
            type="text"
            placeholder="Profile name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:border-accent"
          />
          {addType === "remote" ? (
            <input
              type="text"
              placeholder="Subscription URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:border-accent"
            />
          ) : (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
                >
                  Import JSON file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </div>
              <textarea
                placeholder="Paste sing-box JSON config here..."
                value={configContent}
                onChange={(e) => setConfigContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md focus:outline-none focus:border-accent resize-none"
              />
            </>
          )}
          <button
            onClick={handleAdd}
            disabled={loading}
            className="px-4 py-2 text-sm bg-accent hover:bg-accent-hover text-white rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      )}

      {/* Profiles list */}
      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <svg
            className="w-12 h-12 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
          <p className="text-sm">No profiles yet</p>
          <p className="text-xs mt-1">
            Add a local or remote profile to get started
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                activeId === p.id
                  ? "border-accent bg-blue-50 dark:bg-blue-900/10"
                  : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
              onClick={() => handleActivate(p.id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${activeId === p.id ? "bg-accent" : "bg-zinc-300"}`}
                />
                <div>
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {p.profile_type === "remote" && p.url
                      ? p.url.substring(0, 50) + "..."
                      : "Local config"}
                    {p.last_updated &&
                      ` · Updated ${new Date(p.last_updated).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                {p.profile_type === "remote" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdate(p.id);
                    }}
                    className="p-1.5 text-zinc-400 hover:text-accent rounded transition-colors"
                    title="Update"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                      />
                    </svg>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                  className="p-1.5 text-zinc-400 hover:text-red-500 rounded transition-colors"
                  title="Delete"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Profiles;
