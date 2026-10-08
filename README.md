# ARISE SYSTEM V10

A local-first personal progress system with a futuristic HUD interface. The app uses vanilla JavaScript modules and browser storage; it has no runtime dependencies or build step.

## Run in VS Code

1. Open this folder in VS Code.
2. Run `npm run dev` in the integrated terminal.
3. Open the local address printed by the server (default: `http://127.0.0.1:4173`).

Opening `index.html` directly is not recommended because browsers restrict JavaScript modules on `file://` URLs.

## Open on a phone

1. Connect the phone and computer to the same Wi-Fi network.
2. In VS Code, run `npm run dev:lan` and leave the terminal running.
3. On Windows, run `ipconfig` and find the computer's IPv4 address for its Wi-Fi adapter (usually starts with `192.168.` or `10.`).
4. On the phone, open `http://<computer-ip>:4173`, replacing `<computer-ip>` with that address. For example: `http://192.168.1.23:4173`.
5. If Windows asks, allow access on private networks.

The LAN server only serves the app's HTML, CSS, and JavaScript files. Save data remains in each browser's local storage, so the phone starts its own player save; use EXPORT SAVE and IMPORT SAVE to move a profile between devices.

## Project layout

- `index.html` — boot sequence and persistent navigation shell.
- `style.css` — HUD visual system, screen components, motion, and responsive layouts.
- `src/domain.js` — save schema, migration, XP, ranks, history, streaks, progress, and achievements.
- `src/storage.js` — local storage, save normalization, import/export, and anti-cheat preservation on import.
- `src/app.js` — screen rendering, user interactions, notifications, and navigation.
- `scripts/serve.mjs` — dependency-free local development server.
- `tests/domain.test.mjs` — built-in Node tests for system rules and save handling.

## Save data

The active save is stored in `localStorage` under `ARISE_SAVE_V10`. Existing `ARISE_SAVE_V2` data is migrated on first launch where possible. Daily history remains separated by local date. Export creates a JSON snapshot; import validates and normalizes it before replacing the current save. A same-day study violation is carried through an import.

A core day is complete when the player finishes all four non-study daily quests and logs at least one legitimate study minute. Custom quests count toward quest totals but are not required for the daily streak.

On a profile's first launch, the system asks for a player name and saves it with the local profile. The Progress screen includes a seven-day XP line graph. The Events screen lists five local-time buff and debuff windows; XP from actions completed during a window is adjusted immediately, while previously earned XP is never changed. The 45 achievements cover XP, quests, study, streaks, active days, and rank progression. Each newly completed achievement immediately awards its listed XP reward; rank milestones award larger rewards.

The interface uses layered HUD lighting, an animated player-core reactor, scanline and energy sweeps, and hover-responsive panels. Interface animation respects the device's reduced-motion preference.

## Commands

- `npm run dev` — start the local development server on port 4173 (`PORT` can override it).
- `npm run dev:lan` — start the same server on the local network for phone access.
- `npm test` — run the built-in domain and save validation tests.
