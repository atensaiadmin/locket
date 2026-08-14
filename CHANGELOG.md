# Changelog

All notable changes to Locket. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

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
[0.1.0]: https://github.com/atensaiadmin/locket/releases/tag/v0.1.0
