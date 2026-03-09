function Settings() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
        Settings
      </h1>

      <div className="space-y-6">
        {/* System Proxy */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              System Proxy
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Configure Windows system proxy automatically
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
          </label>
        </div>

        {/* TUN Mode */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              TUN Mode
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Transparent proxy via TUN interface (requires admin)
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
          </label>
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
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
          </label>
        </div>

        <hr className="border-zinc-200 dark:border-zinc-700" />

        {/* Theme */}
        <div>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Theme
          </div>
          <div className="flex gap-2">
            {["System", "Light", "Dark"].map((theme) => (
              <button
                key={theme}
                className="px-4 py-1.5 text-sm rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors first:bg-accent first:text-white"
              >
                {theme}
              </button>
            ))}
          </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
