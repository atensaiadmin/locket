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

## What it does (the plan)

- **Fleet overview** — every instance, its status, at a glance
- **Health** — green/red per instance (`/api/health`)
- **Deploy** — one-click "update this project" (wraps `deploy.sh`)
- **Add project** — register a new instance (wraps `projects.conf` + `generate.sh`)
- **Backup** — run/status of backups (wraps `backup.sh`)
- **Deep-links** — jump straight into each instance's native admin (`/_/`)

## What it deliberately is NOT

- Not a fork of PocketBase
- Not a replacement for PocketBase's admin UI
- Not a hosted SaaS (it's self-hosted, like the thing it manages)

## The story

> *"PocketBase is Supabase in your pocket — it's yours, walk with it. Locket is
> the beautiful case you put it in."*

## Status

Early: Locket v0.1.0 released. See the [README](../README.md) for current capabilities.
