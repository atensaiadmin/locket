# Locket — Quick Start

Get Locket running on a server that already has PocketBase (with a
`projects.conf` at `/opt/pocketbase/projects.conf`).

## 1. Install (one command)

```bash
# On the server. Localhost only (access via SSH tunnel):
bash install.sh

# Or with a public domain (adds Caddy reverse proxy + auto-HTTPS):
DOMAIN=locket.example.com bash install.sh

# Optionally pre-set your access key at install:
DOMAIN=locket.example.com TOKEN=mylongsecret bash install.sh
```

`install.sh` downloads the matching release binary to `/opt/locket`, creates a
systemd service (`locket.service`), starts it, and (optionally) wires Caddy.

> **No domain? No problem.** Skip `DOMAIN` — Locket runs on localhost and you
> reach it via an SSH tunnel. The SSH key + access key are your security. You can
> add a domain later (see below) without reinstalling.

## 2. Open the dashboard

- **Localhost-only:** tunnel to it, then open the URL:
  ```bash
  ssh -L 8090:127.0.0.1:8090 root@<your-server>
  # then open http://127.0.0.1:8090 on your machine
  ```
- **With a domain:** open `https://locket.example.com` (after DNS points at the
  server).

## 3. Set your access key (first visit)

The first time you open Locket it shows **"Set your access key"** — mirroring
PocketBase's "create first admin" flow. Pick a key, and you're in. Future visits
ask for that key.

- If you set `TOKEN=...` at install, skip this — it's already configured.
- Keys are stored **hashed** on the server (SHA-256, owner-only file).

## 4. See your fleet

The dashboard lists every instance in `projects.conf`: live health, ops
(uptime / disk / backups / PocketBase version), a status-history sparkline,
logs (`journalctl` per instance), and **Deploy / Restart** actions.

## 5. Add a project

Hit **＋ New Project**, enter a name, port and domain. Locket appends it to
`projects.conf`, scaffolds the project folder from the template, regenerates
the systemd + Caddy configs, and starts the service. Point the domain's DNS at
the server, then open `https://<domain>/_/` to create the PocketBase superuser.

## Updating

On the server:

```bash
bash update.sh                 # to the latest release
VERSION=0.4.0 bash update.sh   # to a specific version
```

`update.sh` downloads the matching release zip, replaces the binary, rewrites
the systemd unit (**preserving your access key**), and restarts.

## Adding a domain later (no reinstall)

Locket doesn't care about the domain — **Caddy** does. To expose it later:

```bash
# 1. Add a Caddy site (append to /etc/caddy/Caddyfile):
#    locket.example.com {
#        reverse_proxy 127.0.0.1:8090
#    }
# 2. Reload Caddy:
systemctl reload caddy
# 3. At your DNS provider: A record  locket  →  <server IP>  (grey cloud / DNS-only)
```

Or simply re-run `DOMAIN=locket.example.com bash install.sh` — it's idempotent.

## Updating

```bash
bash update.sh               # latest release
VERSION=0.2.0 bash update.sh # specific version
```

Locket shows an "update available" banner when a newer release exists.

## Removing

```bash
bash uninstall.sh
```

Removes the service, binary, and Caddy entry. **Never touches your PocketBase
instances** in `/opt/pocketbase`.

