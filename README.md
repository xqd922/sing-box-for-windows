# sing-box for Windows

A Windows GUI client for [sing-box](https://github.com/SagerNet/sing-box), built with Tauri 2 + React. Designed to mirror the official macOS client (SFM) experience.

## Features

- **Dashboard** — Service start/stop, connection status
- **Profiles** — Local config import, remote subscription with auto-update
- **Groups** — Proxy group selection, per-node delay testing
- **Logs** — Real-time log streaming from sing-box
- **Settings** — System proxy toggle, autostart, TUN mode
- **System Tray** — Minimize to tray, quick controls

## Screenshots

> Coming soon

## Install

Download the latest installer from [Releases](https://github.com/xqd922/sing-box-for-windows/releases):

- **`sing-box_x.x.x_x64-setup.exe`** — NSIS installer (recommended)
- **`sing-box_x.x.x_x64_en-US.msi`** — MSI installer

### Requirements

- Windows 10/11 (x64)
- [sing-box](https://github.com/SagerNet/sing-box/releases) binary — place in app config directory or add to PATH

## Usage

1. Download and install sing-box for Windows
2. Download [sing-box core](https://github.com/SagerNet/sing-box/releases) (Windows amd64) and add `sing-box.exe` to your PATH
3. Open the app, go to **Profiles** and import your sing-box JSON config
4. Go to **Dashboard** and click **Start**
5. (Optional) Enable **System Proxy** in Settings

### Clash API

To use the Groups page (proxy selection & delay testing), add this to your sing-box config:

```json
{
  "experimental": {
    "clash_api": {
      "external_controller": "127.0.0.1:9090"
    }
  }
}
```

## Development

### Prerequisites

- [Rust](https://rustup.rs/)
- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+

### Setup

```bash
pnpm install
pnpm tauri dev
```

### Build

```bash
pnpm tauri build
```

Output: `src-tauri/target/release/bundle/`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Tauri 2.0 |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS 3 |
| State | Zustand |
| Backend | Rust |
| Core | sing-box (subprocess) |

## License

MIT
