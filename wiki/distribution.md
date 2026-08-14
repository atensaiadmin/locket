# Locket — Distribution

## Primary: a single static binary (Go)

Matches PocketBase's own distribution model. One file, zero dependencies, runs
under systemd next to `/opt/pocketbase`.

```bash
locket serve --config /opt/pocketbase/projects.conf --addr :8090
```

## Secondary: Docker image (later)

For PocketBase users who run the official Docker image, ship a `locket` image
that mounts the same config/volumes.

## Out of scope: Kubernetes

PocketBase users almost never run it on K8s; a control plane for it shouldn't
either. Revisit only if the audience demands it.

*Status: draft.*
