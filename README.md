# Daily Tracker

A small habit tracker. Define the activities you want to do every day, then
check them off on a calendar. All data stays in your browser's
`localStorage` — nothing is sent anywhere — and you can export or import
your history as a JSON file whenever you like.

## Features

- **Recurring activities** — add activities once (e.g. "Exercise", "Read
  20 pages"); they apply to every day going forward.
- **Three calendar views** — Month, Last 7 Days, and Last 30 Days, so you
  can check a specific date or scan a recent streak at a glance.
- **Per-day checklist** — click any day to open a checklist and tick off
  what you finished. Each day cell shows a dot per activity and a progress
  bar for a quick read of how the day went.
- **Local persistence** — your data is saved automatically to the browser's
  `localStorage`; closing the tab doesn't lose anything.
- **Export / Import JSON** — download your full activity list and history
  as a `.json` file (for backup or moving to another browser), and load it
  back in later.
- **Installable PWA** — has a web app manifest and service worker, so it
  can be added to a phone's home screen and works offline like a native app.

## Built with

UI components (buttons, forms, the day dialog, tabs, badges, toasts) come
from [Oat](https://oat.ink) ([knadh/oat](https://github.com/knadh/oat)), an
~40KB, dependency-free, semantic HTML/CSS/JS component library — vendored
directly in this repo as `oat.min.css` / `oat.min.js` (pinned to `v0.7.1`,
MIT licensed) rather than loaded from a CDN, so the app keeps working
offline as a PWA. The calendar grid itself is custom, since Oat doesn't
have a calendar component. Oat is still pre-1.0 and may have breaking
changes on upgrade — check its changelog before bumping the vendored files.

## Running it

No build step. The web app lives in `public/` — just serve that folder and
open it:

```bash
python3 -m http.server 8000 --directory public
```

Then visit `http://localhost:8000` in your browser. Opening
`public/index.html` directly (`file://`) also works in most browsers.

## Deployment

This is a static site (no build step) hosted on **Cloudflare Pages**
(project name `kalandr`), deployed from the `public/` folder. There's no CI
pipeline — pushing to `main` does **not** auto-deploy. To publish the
current working tree:

```bash
npx wrangler login          # one-time, opens a browser to authenticate
npx wrangler pages deploy public --project-name=kalandr
```

Run the deploy command from the repo root after committing/testing your
changes locally.

## Desktop app (Tauri)

`src-tauri/` wraps the web app in `public/` in a native desktop shell using
[Tauri](https://tauri.app) — no separate frontend build, `frontendDist` in
`src-tauri/tauri.conf.json` points straight at `public/`. It's Cargo-only
(no `package.json`/npm dependency).

### Building via Docker (recommended)

The Rust toolchain and WebKitGTK/GTK system libraries only live inside a
container, so they can't conflict with anything else on your machine. The
`Dockerfile` at the repo root bakes in Rust + those system libs +
`tauri-cli`.

```bash
# One-time: build the builder image
docker build -t kalandr-tauri-builder .

# Compile + bundle a .deb, writing into src-tauri/target/ on the host
docker run --rm \
  -v "$(pwd)":/app \
  -w /app/src-tauri \
  -u "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -e CARGO_HOME=/tmp/.cargo \
  kalandr-tauri-builder \
  cargo tauri build
```

The `.deb` lands in `src-tauri/target/release/bundle/deb/`. The `-u`/`HOME`
flags keep output files owned by you instead of root; `CARGO_HOME=/tmp/.cargo`
is ephemeral (each container run re-fetches crates — not cached between
runs, but `src-tauri/target/` is bind-mounted so compiled objects persist).

This only builds the **Linux** bundle (`.deb`) — Windows/macOS installers
still require building on those OSes (Tauri doesn't cross-compile GUI
targets). `cargo tauri dev` (the live-reload dev window) also isn't
practical this way since it needs a display; iterate on the UI directly in
a browser against `public/` and only reach for Docker to produce the final
bundle.

### Building natively (alternative)

If you'd rather install the toolchain directly on your machine instead of
using Docker:

```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Linux system libraries (Debian/Ubuntu)
sudo apt install build-essential libwebkit2gtk-4.1-dev libgtk-3-dev \
  libayatana-appindicator3-dev librsvg2-dev

# Tauri CLI
cargo install tauri-cli --version "^2" --locked

cargo tauri dev      # launch in a dev window
cargo tauri build    # produce a native installer/binary for this OS
```

### App icons

The committed `src-tauri/icons/icon.png` is just the existing 512px PWA
icon as a placeholder. Regenerate the full platform icon set from it (or a
higher-res source) with:

```bash
cargo tauri icon public/icons/icon-512.png
```

## Usage

1. Add your activities in the box at the top (e.g. "Exercise", "Meditate").
2. Click any day in the calendar to open its checklist and tick off what
   you completed.
3. Switch between **Month**, **Last 7 Days**, and **Last 30 Days** to
   review recent progress.
4. Use **Export JSON** to save a backup file, and **Import JSON** to
   restore it (this replaces your current activities and history).

## Installing on mobile (PWA)

The app has a manifest and service worker, so a browser will offer to
install it as an app. This requires the site to be served over **HTTPS**
(plain `http://localhost` works too, but a phone can't reach your laptop's
`localhost`) — so host the folder somewhere reachable over HTTPS (GitHub
Pages, Netlify, Vercel, Cloudflare Pages, or any static host with TLS), then
open that URL on your phone:

- **Android (Chrome)** — open the site, tap the **⋮** menu, then **"Add to
  Home screen" / "Install app"**.
- **iOS (Safari)** — open the site, tap the **Share** icon, then **"Add to
  Home Screen"**.

Once installed, the app opens full-screen without browser chrome and keeps
working offline (the service worker caches the app shell on first load).
Since all data lives in that browser's `localStorage`, the installed app and
the regular browser tab share the same data only if they're the same origin.

## Screenshots

**Month view** — each day shows a dot per activity and a completion bar.

![Month view](screenshots/month.png)

**Last 30 Days** — a rolling view of recent days, useful for spotting streaks.

![Last 30 days view](screenshots/last30.png)

**Day checklist** — click a day to check off what you finished.

![Day checklist modal](screenshots/modal.png)

## Data & privacy

All data lives only in your browser's `localStorage` for this page's
origin — it is never transmitted anywhere. Clearing your browser's site
data will erase it, so use **Export JSON** periodically if you want a
backup.
