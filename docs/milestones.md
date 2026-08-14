# Locket — Milestones

Single source of truth for what's done, in progress, and planned.
Update this as features ship. Status legend: ✅ done · 🔨 in progress · ⬜ planned

---

## Phase 0 — Foundation ✅ (complete)

- [x] Architecture defined: overlay, not fork (see `wiki/architecture.md`)
- [x] Scope rule: manage ACROSS instances, not WITHIN one (ADR-002)
- [x] Naming + org: **Locket** @ Atensai (ADR-004)
- [x] Tech stack chosen: Go backend + React/TS + Vite + Tailwind + shadcn-style UI
- [x] Distribution decided: single embedded binary (ADR-003), Docker later
- [x] `locket/` repo scaffolded: `server/`, `web/`, `wiki/`, `docs/`, `build.sh`

## Phase 1 — MVP ✅ (working)

- [x] Go backend reads `projects.conf` (name, port, domain)
- [x] Health check per instance via public `/api/health`
- [x] Fleet dashboard UI (table: project · status · port · domain · actions)
- [x] Deep-link "Open admin" → `https://<domain>/_/`
- [x] Restart action → `systemctl restart pocketbase-<name>`
- [x] Deploy action → `deploy.sh <name>` (git pull + migrate + restart)
- [x] Action whitelist + project validation (safety boundary)
- [x] Single embedded binary via `build.sh` (`./locket`)
- [x] Local dev loop proven (SSH tunnel → real instance shows "healthy")

## Phase 2 — Troubleshooting & ops (next)

- [x] **Instance logs viewer** — `journalctl -u pocketbase-<name>`, last N lines
- [x] Log **level filter** (error / warn / info)
- [x] Log **live tail / follow**
- [x] **Graceful fallback** for server-only features when running locally (logs/deploy/restart return a clear "not available on this host" message, not a crash) — so the UI is testable on the Mac before server deploy
- [ ] Per-instance **version + uptime**
- [ ] **Status history** (health sparkline — was it up 10 min ago?)
- [ ] **Backup status** (last run ok/fail, from `backup.sh` log)
- [ ] **Disk usage** per project (`du -sh`)

## Phase 3 — Polish

- [ ] **Console auth** (who can open Locket)
- [ ] Add-project flow (edit `projects.conf` + `generate.sh`)
- [ ] Auto-discovery of new instances (scan `/opt/pocketbase/*/`)
- [ ] **Alerts** (instance down → webhook/email)
- [ ] One-click snapshot (via `vultr-cli`)
- [ ] Pending-migrations indicator
- [ ] **Screenshots** captured → added to `docs/features.md` (proof of concept, once UI stabilizes)

## Phase 4 — Community / distribution

- [ ] **Git setup:** push `locket/` to GitHub (`atensai/locket`); decide public vs private (public recommended — Locket is meant to be MIT OSS)
- [ ] **Server git access:** clone on server (public repo = zero credentials; else SSH deploy key)
- [ ] Deploy Locket to the server as a systemd service (unlocks real testing of logs/deploy/restart)
- [ ] `deploy-locket.sh` — build on Mac → push → pull + rebuild on server
- [ ] Docker image (secondary distribution)
- [ ] Publish as MIT open source at `atensai/locket`
- [ ] README + quickstart polished for other users
- [ ] Multi-box support (manage instances across several servers — stretch goal)
- [ ] Gather feedback from PocketBase self-hosters

---

*Last updated: 2026-08-14.*
