#!/usr/bin/env bash
# Install / update Locket on a server running PocketBase.
# Downloads the latest release binary, installs it, creates a systemd service,
# and (optionally) wires it into Caddy so it's reachable from the web.
#
# Usage:
#   bash install.sh                          # latest release, localhost only
#   VERSION=0.1.0 bash install.sh            # specific version
#   DOMAIN=locket.example.com bash install.sh  # + add Caddy reverse proxy
set -euo pipefail

# ---- config ---------------------------------------------------------------
VERSION="${VERSION:-latest}"
DOMAIN="${DOMAIN:-}"                       # e.g. locket.atensai.com (empty = localhost only)
ADDR="${ADDR:-:8090}"
CONFIG="${CONFIG:-/opt/pocketbase/projects.conf}"
INSTALL_DIR="/opt/locket"

REPO="atensaiadmin/locket"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64)  ARCH="amd64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "Unsupported arch: $ARCH"; exit 1 ;;
esac

# ---- resolve version ------------------------------------------------------
if [ "$VERSION" = "latest" ]; then
  echo "==> Resolving latest release"
  VERSION="$(curl -s "https://api.github.com/repos/${REPO}/releases/latest" | sed -n 's/.*"tag_name": *"v\([0-9.]*\)".*/\1/p' | head -1)"
  [ -n "$VERSION" ] || { echo "Could not resolve latest version"; exit 1; }
fi
echo "    version: v$VERSION (linux/$ARCH)"

# ---- download + install binary --------------------------------------------
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

ZIP="locket_${VERSION}_linux_${ARCH}.zip"
echo "==> Downloading $ZIP"
curl -sL -o "$ZIP" "https://github.com/${REPO}/releases/download/v${VERSION}/${ZIP}"
unzip -o "$ZIP" -d "_tmp_$VERSION"
mv "_tmp_$VERSION/locket" ./locket
chmod +x ./locket
rm -rf "_tmp_$VERSION" "$ZIP"

echo "==> Installed: $INSTALL_DIR/locket"
"$INSTALL_DIR/locket" --version 2>/dev/null || true

# ---- systemd service ------------------------------------------------------
echo "==> Creating systemd service"
cat > /etc/systemd/system/locket.service <<EOF
[Unit]
Description=Locket — PocketBase control plane
After=network.target

[Service]
Type=simple
ExecStart=$INSTALL_DIR/locket --config $CONFIG --addr $ADDR
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now locket
systemctl status locket --no-pager | head -8

# ---- optional: Caddy reverse proxy ----------------------------------------
if [ -n "$DOMAIN" ]; then
  echo "==> Adding Caddy site for $DOMAIN"
  # Strip the port from ADDR (e.g. ":8090" -> "127.0.0.1:8090")
  UPSTREAM="127.0.0.1${ADDR#:}"
  mkdir -p /etc/caddy
  cat >> /etc/caddy/Caddyfile <<EOF

$DOMAIN {
	reverse_proxy $UPSTREAM
}
EOF
  systemctl reload caddy 2>/dev/null || echo "    (caddy not running — reload skipped)"
  echo "    Remember: point $DOMAIN -> this server in DNS (A record, DNS-only/grey cloud)."
fi

echo ""
echo "Done. Locket is running at $ADDR"
[ -n "$DOMAIN" ] && echo "Dashboard: https://$DOMAIN"
echo "Check it:  curl -s http://127.0.0.1${ADDR#:}/api/health"
