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

No build step. Just serve the folder and open it:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000` in your browser. Opening `index.html`
directly (`file://`) also works in most browsers.

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
