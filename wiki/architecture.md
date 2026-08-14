# Locket — Architecture (draft)

## The core idea

Locket is an **overlay** on PocketBase, not a fork and not a bundled binary.

```
┌──────────────────────────────┐
│        Locket (Go binary)    │  ← the "purse": fleet dashboard + controls
│   reads config · health ·    │
│   runs your scripts · links  │
└──────────────┬───────────────┘
               │ reads              │ pings               │ runs
               ▼                    ▼                     ▼
      /opt/pocketbase/       /api/health           deploy.sh / generate.sh
      projects.conf          (per instance)        / backup.sh
               │
               ▼
   N × PocketBase instances (each with its own native /_/ admin)
```

## Layers

1. **Discovery** — reads `projects.conf` (name, port, domain) to know what exists.
   *Future:* optional auto-scan of `/opt/pocketbase/*/` + `pocketbase-*.service`.
2. **Status** — pings each instance's public `GET /api/health` (no auth needed).
3. **Actions** — shells out to the existing deploy scripts (`deploy.sh`,
   `generate.sh`, `backup.sh`) for deploy / add / backup.
4. **Deep-links** — "Open admin" jumps to `https://<domain>/_/` (native admin).

## Explicit non-goals (scope discipline)

- ❌ **Never** reimplement record/collection editing — that's the native admin's job.
- ❌ **Never** bundle or manage the PocketBase binary.
- ❌ **No Kubernetes.** Matches how PocketBase users actually deploy.

## Why this survives PocketBase updates

Locket depends only on:
- `projects.conf` (our own file)
- `/api/health` (stable public endpoint)
- our own scripts

So PocketBase can update its binary / internals / admin UI freely and Locket is
unaffected. This is the payoff of the overlay architecture.

*Status: draft — being refined as we build.*
