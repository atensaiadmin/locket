# Locket — Overview

## The one-liner

**Locket is the case you carry your PocketBase fleet in.**

PocketBase gives you "Supabase in your pocket" — a self-hosted backend that's
yours to walk with. ([PocketBase](https://pocketbase.io) is the open-source
backend-as-a-service this tool builds on — an independent project, not
affiliated with Locket or Atensai.) But once you have several projects, each
with its own admin at its own subdomain, there's no single place to see them
all. Locket fills that gap: a beautiful, self-hosted dashboard for managing
*all* your PocketBase instances at a glance.

## What it does

- **Fleet overview** — every instance, its status, at a glance
- **Health** — green/red per instance (`/api/health`)
- **Ops at a glance** — uptime, disk usage, backups, and PocketBase version
- **Status history** — a rolling sparkline of each instance's health
- **Logs** — `journalctl` per instance, with level filter + live follow
- **Deploy / Restart** — one-click per project (wraps `deploy.sh` / systemd)
- **Add project** — create a new instance from the dashboard (name/port/domain)
- **Deep-links** — jump straight into each instance's native admin (`/_/`)
- **Access-key auth** — first-run setup + login, hashed keys, update checker

## What it deliberately is NOT

- Not a fork of PocketBase
- Not a replacement for PocketBase's admin UI
- Not a hosted SaaS (it's self-hosted, like the thing it manages)

## The story

> *"PocketBase is Supabase in your pocket — it's yours, walk with it. Locket is
> the beautiful case you put it in."*

## Status

v0.4.0 — active development. See the [README](../README.md) and
[CHANGELOG](../CHANGELOG.md) for the current feature set.
