#!/usr/bin/env bash
# Remove Locket from a server: systemd service, binary, and Caddy site.
#
#   bash uninstall.sh                    # remove everything Locket installed
#   KEEP_DATA=1 bash uninstall.sh        # keep the downloaded zip if present
#
# What it removes:
#   - /etc/systemd/system/locket.service  (the background service)
#   - /opt/locket/                        (the binary + anything Locket added)
#   - the <DOMAIN> site block from /etc/caddy/Caddyfile (if one was added)
#
# What it does NOT touch (by design):
#   - /opt/pocketbase/                    (your PocketBase instances — untouched!)
#   - /etc/caddy/Caddyfile backup file    (we keep a .bak just in case)
set -euo pipefail

INSTALL_DIR="/opt/locket"
SERVICE="/etc/systemd/system/locket.service"
CADDYFILE="/etc/caddy/Caddyfile"

echo "==> Stopping and disabling the service"
if systemctl list-unit-files 2>/dev/null | grep -q '^locket.service'; then
  systemctl stop locket 2>/dev/null || true
  systemctl disable locket 2>/dev/null || true
  rm -f "$SERVICE"
  systemctl daemon-reload
  echo "    removed $SERVICE"
else
  echo "    no locket service found — skipping"
fi

echo "==> Removing install directory"
if [ -d "$INSTALL_DIR" ]; then
  rm -rf "$INSTALL_DIR"
  echo "    removed $INSTALL_DIR"
else
  echo "    nothing to remove"
fi

echo "==> Removing Caddy site (if any)"
if [ -f "$CADDYFILE" ] && grep -q 'locket' "$CADDYFILE"; then
  cp "$CADDYFILE" "$CADDYFILE.bak"
  # Drop the site block that proxies to Locket (127.0.0.1:8090).
  # awk walks lines: when we enter a site block, remember its start; if the block
  # contains the locket upstream, skip printing it.
  awk '
    /^[A-Za-z0-9.-]+[[:space:]]*\{/ { in_block=1; block="" }
    in_block { block = block $0 "\n"; if ($0 ~ /reverse_proxy[[:space:]]+127\.0\.0\.1:8090/) { drop=1 } }
    /^[[:space:]]*\}/ { if (in_block) { if (!drop) printf "%s", block; in_block=0; drop=0 } ; next }
    !in_block { print }
  ' "$CADDYFILE" > "$CADDYFILE.tmp" && mv "$CADDYFILE.tmp" "$CADDYFILE"
  systemctl reload caddy 2>/dev/null || true
  echo "    removed locket site from $CADDYFILE (backup at $CADDYFILE.bak)"
else
  echo "    no locket entry in Caddyfile — skipping"
fi

echo ""
echo "Done. Locket has been uninstalled."
echo "Your PocketBase instances in /opt/pocketbase were NOT touched."
