# Locket

> The case you carry your PocketBase fleet in.

**Locket** is a self-hosted control plane / fleet dashboard for PocketBase.
It sits *on top of* running PocketBase instances — it never forks or bundles
PocketBase, and it only works where PocketBase is already running.

- **Not a fork.** Locket reads config, checks health, runs your own scripts.
- **Not a clone.** It's a fleet layer — the native `/_/` admin stays the workbench.
- **Independent.** Built by Atensai; not affiliated with or endorsed by PocketBase (MIT).

## Repo layout

```
locket/
├── wiki/     # dev wiki — architecture, decisions, integration contract (grows with code)
├── docs/     # project documentation — overview, roadmap, user-facing guides (grows with product)
└── (code arrives here as the console is built)
```

## Quick links

- [Dev wiki home](wiki/home.md)
- [Project docs home](docs/overview.md)
- [Milestones](docs/milestones.md) — what's done / planned

## Status

**MVP working** — fleet dashboard, health checks, deploy/restart actions, one
embedded binary. Phase 2 (logs & ops) in progress. See
[wiki/decisions.md](wiki/decisions.md) for the reasoning.
