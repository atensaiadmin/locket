# Locket — Integration Contract

Exactly how Locket talks to PocketBase. This is the *only* surface Locket depends
on, so it stays small and stable.

## 1. Discovery — find instances

Reads `/opt/pocketbase/projects.conf`:

```
<project-name>  <port>  <domain>
```

| Field | Meaning |
|---|---|
| project-name | e.g. `prodlogonline` |
| port | local port the instance listens on (e.g. `8091`) |
| domain | public HTTPS domain (e.g. `prodlogonline.atensai.com`) |

*Future (ADR): optional auto-scan of `/opt/pocketbase/*/` folders + running
`pocketbase-*.service` units.*

## 2. Status — health check

`GET http://127.0.0.1:<port>/api/health` → **public, no auth**

Expected 200 JSON:
```json
{ "code": 200, "message": "API is healthy.", "data": {} }
```

## 3. Actions — run existing scripts

| Action | Script | What it does |
|---|---|---|
| Deploy | `deploy.sh <name>` | git pull + migrate + restart |
| Add project | edit `projects.conf` + `generate.sh` | new systemd unit + Caddy entry |
| Backup | `backup.sh` | SQLite snapshots, prune, optional offsite |

Locket shells out to these (local process execution).

## 4. Deep-link — open native admin

`https://<domain>/_/` — Locket links out; it does not render the admin.

---

## Implementation status (2026-08-14)

- [x] Discovery: reads `projects.conf` via `--config` flag
- [x] Status: `GET /api/instances` returns every project + health
- [x] Actions: `POST /api/instances/<name>/deploy|restart` (whitelisted + validated)
- [x] Local dev: run `./locket --config ./projects.conf.example` and reach a real
  instance through an SSH tunnel (`ssh -L 8091:127.0.0.1:8091 root@<ip>`)

Planned:
- [ ] Logs: `GET /api/instances/<name>/logs` → `journalctl -u pocketbase-<name>`

---

## Stability guarantees (why this survives PB updates)

| Locket depends on | Stability |
|---|---|
| `projects.conf` | Ours — we control the format |
| `/api/health` | Stable public endpoint |
| Our scripts | Ours — we control them |

Locket deliberately does **not** depend on PocketBase internal APIs, the admin
UI structure, or the binary.
