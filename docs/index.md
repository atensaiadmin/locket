# Locket

> The case you carry your PocketBase fleet in.

**Locket** is a self-hosted control plane / fleet dashboard for [PocketBase](https://pocketbase.io).
It sits *on top of* running PocketBase instances — it never forks or bundles
PocketBase, and it only works where PocketBase is already running.

- **Not a fork.** Locket reads config, checks health, runs your own scripts.
- **Not a clone.** It's a fleet layer — the native `/_/` admin stays the workbench.
- **Independent.** Built by Atensai; not affiliated with or endorsed by PocketBase (MIT).

## What it does

- **Fleet overview** — every PocketBase instance on your server, at a glance
- **Health** — live up/down status per instance
- **Logs** — view `journalctl` logs per instance, with level filter + live follow
- **Actions** — deploy (`git pull` + migrate + restart) and restart, one click
- **Deep-links** — jump straight into each instance's native admin (`/_/`)

## Install (one command)

On the server running PocketBase:

```bash
bash install.sh                                 # localhost only
DOMAIN=locket.example.com bash install.sh       # + public domain via Caddy
DOMAIN=locket.example.com TOKEN=secret bash install.sh  # + pre-set access key
```

See the [Quick start](quickstart.md) for full details.

## Docs

- [Overview](overview.md) — the story
- [Features](features.md) — what it does
- [Quick start](quickstart.md) — get running

## License

MIT. Independent project — not affiliated with or endorsed by PocketBase.
