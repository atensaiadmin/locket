# Locket — Decisions (ADRs)

Lightweight record of decisions and *why*, so future-us doesn't relitigate them.

## ADR-001: Locket is an overlay, not a fork (2026-08)

**Context:** We manage many PocketBase instances and want a central dashboard.

**Decision:** Build a separate app that sits on top of running PocketBase
instances. No bundled binary, no fork, pure API/config consumer.

**Why:** MIT-safe, survives PocketBase updates, far less to maintain. "It only
works where PocketBase is already running" is a feature, not a limitation.

## ADR-002: Scope = manage ACROSS instances, not WITHIN one (2026-08)

**Decision:** Locket does fleet-level things (list, health, deploy, add, backup,
deep-links). It never reimplements record/collection editing.

**Why:** The native `/_/` admin is already good and maintained by PocketBase.
Reimplementing it means competing with the thing we wrap — a losing game.

## ADR-003: Ship as a single binary first (2026-08)

**Decision:** Distribution is a static Go binary (like PocketBase itself), with a
Docker image as a secondary option later. No Kubernetes.

**Why:** Most PocketBase users self-host a single binary under systemd. Matching
their distribution model makes adoption frictionless.

## ADR-004: Naming — "Locket" (2026-08)

**Context:** "PocketBase = Supabase in your pocket. Locket = the case you carry
it in."

**Decision:** Name the project Locket, released under the Atensai org.

**Why:** On-theme, memorable, tells the "what it sits on top of" story.

## ADR-005: Domain corrections & DNS must match exactly (2026-08)

**Lesson from deploy:** a one-character typo between `projects.conf` and the DNS
record breaks HTTPS (525). Decision: exact-match discipline + always verify with
`cat` before trusting generated config.

*More decisions to be added as we build.*
