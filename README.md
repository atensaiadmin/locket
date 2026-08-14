# Locket

> The case you carry your PocketBase fleet in.

**Locket** is a self-hosted control plane / fleet dashboard for PocketBase.
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

## Installation (one command)

On the server running PocketBase:

```bash
# latest release, reachable on localhost only
bash install.sh

# or, to also expose it publicly via Caddy (point the domain at this server in DNS)
DOMAIN=locket.example.com bash install.sh
```

That downloads the matching release binary, installs it to `/opt/locket`,
creates a systemd service, and (optionally) wires it into Caddy.

**Requirements:** a server running PocketBase with a `projects.conf`
(`/opt/pocketbase/projects.conf`), and systemd (any modern Linux).

## Quick start

1. Install (above)
2. Open `http://<server>:8090` (or your configured domain)
3. See your fleet; click **Logs** to troubleshoot, **Deploy** to ship updates

Full guide: [docs/quickstart.md](docs/quickstart.md)

## Documentation

- [Overview](docs/overview.md)
- [Features](docs/features.md)
- [Quick start](docs/quickstart.md)
- [Roadmap](docs/roadmap.md)

## License

MIT. Independent project — not affiliated with or endorsed by PocketBase.
