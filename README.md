<p align="center">
  <img src="web/src/assets/icon2.svg" alt="Locket logo" width="96" height="96" />
</p>

<h1 align="center">Locket</h1>

<p align="center">
  <em>The case you carry your PocketBase fleet in.</em>
</p>

<p align="center">
  <a href="https://github.com/atensaiadmin/locket/releases"><img alt="Release" src="https://img.shields.io/github/v/release/atensaiadmin/locket?style=flat-square" /></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green?style=flat-square" /></a>
  <a href="https://github.com/atensaiadmin/locket/actions"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/atensaiadmin/locket/release.yml?style=flat-square" /></a>
</p>

**Locket** is a self-hosted control plane / fleet dashboard for PocketBase.
It sits *on top of* running PocketBase instances — it never forks or bundles
PocketBase, and it only works where PocketBase is already running.

- **Not a fork.** Locket reads config, checks health, runs your own scripts.
- **Not a clone.** It's a fleet layer — the native `/_/` admin stays the workbench.
- **Independent.** Built by Atensai; not affiliated with or endorsed by PocketBase (MIT).

## What it does

- **Fleet overview** — every PocketBase instance on your server, at a glance
- **Health** — live up/down status per instance
- **Ops at a glance** — uptime, disk usage, backups, and PocketBase version per instance
- **Status history** — a rolling sparkline of each instance's health
- **Logs** — view `journalctl` logs per instance, with level filter + live follow
- **Actions** — deploy (`git pull` + migrate + restart) and restart, one click
- **Add project** — create a new instance (name/port/domain) from the dashboard
- **Deep-links** — jump straight into each instance's native admin (`/_/`)
- **Access-key auth** — first-run setup, login, hashed keys, update checker

## Installation (one command)

On the server running PocketBase:

```bash
# localhost only (access via SSH tunnel)
bash install.sh

# expose publicly via Caddy (adds auto-HTTPS; point the domain at this server in DNS)
DOMAIN=locket.example.com bash install.sh

# optionally pre-set the access key at install
DOMAIN=locket.example.com TOKEN=mylongsecret bash install.sh
```

That downloads the matching release binary, installs it to `/opt/locket`,
creates a systemd service, and (optionally) wires it into Caddy.

**Requirements:** a server running PocketBase with a `projects.conf`
(`/opt/pocketbase/projects.conf`), and systemd (any modern Linux).

> **No domain?** Skip `DOMAIN` and reach Locket via an SSH tunnel — you can add a
> domain later without reinstalling. See [docs/quickstart.md](docs/quickstart.md).

## Quick start

1. Install (above)
2. Open `http://<server>:8090` (or your configured domain)
3. See your fleet; click **Logs** to troubleshoot, **Deploy** to ship updates

Full guide: [docs/quickstart.md](docs/quickstart.md)

## Updating

Locket ships a self-updater for the server:

```bash
bash update.sh                  # to the latest release
VERSION=0.4.0 bash update.sh    # to a specific version
```

It downloads the matching release zip from GitHub, replaces the binary,
rewrites the systemd unit (preserving your access key), and restarts. Needs a
published release — see [releases](https://github.com/atensaiadmin/locket/releases).

## Documentation

- **Docs site:** https://atensaiadmin.github.io/locket/
- [Overview](docs/overview.md)
- [Features](docs/features.md)
- [Quick start](docs/quickstart.md)

## Credits

Locket manages [PocketBase](https://pocketbase.io) instances — the open-source
backend-as-a-service by [Gani Georgiev](https://github.com/ganigeorgiev)
(MIT). PocketBase runs standalone; Locket is an independent companion tool that
works only where PocketBase is already running.

## License

MIT. Independent project — not affiliated with or endorsed by PocketBase.
