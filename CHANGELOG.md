# Changelog

All notable changes to Locket. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [0.5.2] — 2026-08-16

### Changed
- **Installer is now self-installing** — `install.sh` copies the latest
  `install.sh` / `update.sh` / `uninstall.sh` to `/opt/locket/scripts/`, so
  future updates always run the newest installer. A stale copy of `update.sh`
  left on the server (from an older release) previously kept running the old
  no-restart installer — that's why updates "downloaded but never restarted".
  Canonical update command is now: `bash /opt/locket/scripts/update.sh`.
- Bundled provisioning scripts are now actually deployed **from the release
  zip** (version-matched) instead of always falling back to GitHub raw — the
  temp extraction dir was being deleted before they were copied.

## [0.5.1] — 2026-08-16

### Fixed
- **Updates now actually take effect** — `install.sh` restarts `locket.service`
  after installing a new binary (`enable --now` alone never restarted an
  already-running service, so the old process kept running in memory after
  `update.sh`). One-time fix for already-updated servers:
  `systemctl restart locket`.
- **Stay logged in across refreshes** — `/api/auth/status` now sends the stored
  access key, so reloading or restarting the page no longer drops you back to
  the login screen.
- **Deploy/Restart output no longer sticks around** — output is cleared when a
  new action starts and can be dismissed with an ✕ button. Failed actions now
  show the script's real output (styled red) instead of a bare "exit status 1".

## [0.5.0] — 2026-08-16

### Changed
- **Logs open in a side drawer** instead of a modal (`LogsDrawer` replaces
  `LogsModal`) — easier to read logs while keeping the fleet table in view.
- Dashboard polish: refreshed fleet table layout and button styling.

## [0.4.1] — 2026-08-14

### Added
- **Self-contained releases** — release zips now bundle the provisioning
  scripts (`add.sh`, `generate.sh`, `deploy.sh`) and the installer scripts
  (`install.sh`, `update.sh`, `uninstall.sh`), so a download installs
  version-matched scripts with no dependency on the live repo.
- Runtime scripts ship in the repo (`scripts/`) and `install.sh` deploys them
  to `/opt/pocketbase/scripts/` automatically (chmod +x).

### Fixed
- **New Project works without Caddy** — `generate.sh` warns instead of failing
  if Caddy isn't running, so the instance is still created and serves on its
  port (just no https subdomain).
- **New Project modal shows the script's real output on failure**, so errors
  are visible in the UI instead of a bare "add.sh failed: exit status 1".

## [0.4.0] — 2026-08-14

### Added
- **New Project button** — create a PocketBase instance straight from the
  dashboard (`＋ New Project`). Enter a name, port and domain; Locket appends it
  to `projects.conf`, scaffolds `/opt/pocketbase/<name>` from the project
  template, regenerates the systemd + Caddy configs, and starts the new service.
  - `POST /api/projects` (auth required) with server-side validation
    (name / port / domain format, duplicate checks against the live config).
  - New `add.sh` provisioning script (ships alongside `deploy.sh`).
  - Port field auto-suggests the next free port.
- The server now passes `PB_HOME` explicitly to provisioning scripts, so the
  script home and `--pbhome` can never drift.

### Fixed
- **Update banner compared versions by string.** It could claim a newer release
  existed when the running build was actually ahead of the latest published
  release (e.g. running v0.4.0 while v0.3.0 was the newest tag). It now compares
  numerically (semver), so it only appears for genuinely newer releases.
- **`install.sh` / `update.sh` no longer reset your access key.** The installer
  now preserves an existing `LOCKET_TOKEN` from the current systemd unit when
  re-run; an explicit `TOKEN=...` still wins.

## [0.3.0] — 2026-08-14

### Added
- **Ops dashboard columns** — per-instance **uptime** (systemd), **disk usage**
  (`du`), and **backup count/last-run** (from `/var/backups/pocketbase`).
- **Status history + sparkline** — Locket passively records health checks and
  shows a rolling 60-observation sparkline per instance (`/api/history/<name>`).
- `ops.go` + `history.go` backends; all values degrade gracefully when not on a
  systemd/PocketBase host (e.g. local dev on macOS).

### Changed
- `GET /api/instances` now includes an `ops` object per instance.

## [0.2.1] — 2026-08-14

### Fixed
- **Logo rendering in production builds.** The logo was referenced as a hardcoded
  path, which Vite doesn't rewrite in built assets — the bundled app showed a
  broken image (and the server build still showed the old padlock emoji). Now
  imported properly (`vite-env.d.ts` added).
- Logo now shows in the header, login/setup screens, and favicon.

## [0.2.0] — 2026-08-14

### Added
- **Access-key auth** — first-run "set your access key" screen (mirrors PocketBase's first-admin flow), login screen, logout. Keys stored hashed (SHA-256, owner-only file).
- **Update checker** — `/api/version` reports the running version + latest release; the dashboard shows an amber "new version available" banner with a link to releases.
- **Bind guard** — Locket refuses to start on a public interface if no access key is configured (prevents an unauthenticated dashboard being exposed).
- `install.sh` supports `TOKEN=...` to pre-configure the key; auto-generates one on public installs.
- `scripts/update.sh` — thin wrapper around `install.sh` for easy updates.
- Proper user-guide docs (`docs/quickstart.md`), rewritten `README.md`.

### Changed
- Version is now baked into the binary at build time via `-ldflags`.

## [0.1.0] — 2026-08-14

### Added
- Fleet dashboard: lists every instance from `projects.conf` with live health.
- Actions: **Deploy** (`deploy.sh <name>`) and **Restart** (`systemctl restart`), whitelisted + validated.
- **Logs viewer** — `journalctl` per instance with level filter and live follow (graceful fallback when not on a systemd host).
- Deep-links into each instance's native admin (`/_/`).
- Single embedded binary (`build.sh`), cross-platform release builds (`release.sh`), automated GitHub Releases.
- One-command install (`scripts/install.sh`), uninstaller (`scripts/uninstall.sh`).
- Dev wiki (private, local-only) + public docs.

[0.2.0]: https://github.com/atensaiadmin/locket/compare/v0.1.0...v0.2.0
[0.3.0]: https://github.com/atensaiadmin/locket/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/atensaiadmin/locket/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/atensaiadmin/locket/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/atensaiadmin/locket/releases/tag/v0.1.0
