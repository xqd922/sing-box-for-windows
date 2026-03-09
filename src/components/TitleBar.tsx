import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

function TitleBar() {
  return (
    <div
      data-tauri-drag-region
      className="h-8 flex items-center justify-between bg-sidebar-bg dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 shrink-0"
    >
      <div data-tauri-drag-region className="flex-1 pl-3">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          sing-box
        </span>
      </div>
      <div className="flex">
        <button
          onClick={() => appWindow.minimize()}
          className="w-12 h-8 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect
              width="10"
              height="1"
              className="fill-zinc-500 dark:fill-zinc-400"
            />
          </svg>
        </button>
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="w-12 h-8 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect
              width="9"
              height="9"
              x="0.5"
              y="0.5"
              className="fill-none stroke-zinc-500 dark:stroke-zinc-400"
              strokeWidth="1"
            />
          </svg>
        </button>
        <button
          onClick={() => appWindow.close()}
          className="w-12 h-8 flex items-center justify-center hover:bg-red-500 group transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line
              x1="1"
              y1="1"
              x2="9"
              y2="9"
              className="stroke-zinc-500 dark:stroke-zinc-400 group-hover:stroke-white"
              strokeWidth="1.2"
            />
            <line
              x1="9"
              y1="1"
              x2="1"
              y2="9"
              className="stroke-zinc-500 dark:stroke-zinc-400 group-hover:stroke-white"
              strokeWidth="1.2"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default TitleBar;
