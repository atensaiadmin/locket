#!/usr/bin/env bash
# Install / update Locket on a server running PocketBase.
# Downloads the latest release binary, installs it, creates a systemd service,
# and (optionally) wires it into Caddy so it's reachable from the web.
#
# Usage:
#   bash install.sh                          # latest release, localhost only
#   VERSION=0.1.0 bash install.sh            # specific version
#   DOMAIN=locket.example.com bash install.sh  # + add Caddy reverse proxy
#   TOKEN=mysecret bash install.sh           # pre-configure the access key
set -euo pipefail

# ---- config ---------------------------------------------------------------
VERSION="${VERSION:-latest}"
DOMAIN="${DOMAIN:-}"                       # e.g. locket.atensai.com (empty = localhost only)
ADDR="${ADDR:-:8090}"
CONFIG="${CONFIG:-/opt/pocketbase/projects.conf}"
TOKEN="${TOKEN:-}"                          # optional access key (see note below)
INSTALL_DIR="/opt/locket"

# Preserve an existing access key so updates never reset it (an explicit
# TOKEN=... always wins).
if [ -z "$TOKEN" ]; then
  EXISTING="$(sed -n 's/^Environment=LOCKET_TOKEN=//p' /etc/systemd/system/locket.service 2>/dev/null | head -1)"
  if [ -n "$EXISTING" ]; then
    TOKEN="$EXISTING"
    echo "==> Preserving existing LOCKET_TOKEN"
  fi
fi

# If ADDR binds all interfaces (starts with ':') and no token is given, generate
# one so Locket can start and stays protected from first boot. To set your own
# key later, open the dashboard and use Settings, or re-run with TOKEN=...
if [ -z "$TOKEN" ] && [ "${ADDR#:}" != "$ADDR" ]; then
  TOKEN="$(head -c 24 /dev/urandom | base64 | tr -d '+/=' | head -c 32)"
  echo "==> No TOKEN given and $ADDR is public — generated one:"
  echo "    LOCKET_TOKEN=$TOKEN   (save this!)"
fi

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

# The release zip may contain the binary at the root OR inside a folder
# (e.g. locket_0.2.0_linux_amd64/locket). Find it either way:
BIN="$(find "_tmp_$VERSION" -type f \( -name locket -o -name locket.exe \) | head -1)"
[ -n "$BIN" ] || { echo "ERROR: locket binary not found in the release zip"; exit 1; }

mv "$BIN" ./locket
chmod +x ./locket

echo "==> Installed: $INSTALL_DIR/locket"
"$INSTALL_DIR/locket" --version 2>/dev/null || true

# ---- deploy the bundled scripts (version-matched, from this release) -------
# Provisioning scripts (add.sh / generate.sh / deploy.sh) go to PB_SCRIPTS so
# the running server uses them.
#
# The installer scripts (install.sh / update.sh / uninstall.sh) are ALSO copied
# to $INSTALL_DIR/scripts so FUTURE updates run the latest installer. Without
# this, a stale copy of update.sh left on the server from an older release keeps
# running the old (no-restart) installer — which is why updates previously
# "downloaded the new binary but never restarted the service".
# Prefer the scripts bundled in the release zip (version-matched); fall back to
# raw.githubusercontent.com in case an older zip lacks them.
PB_SCRIPTS="/opt/pocketbase/scripts"
mkdir -p "$PB_SCRIPTS" "$INSTALL_DIR/scripts"
# The release zip wraps everything in a folder (locket_<v>_<os>_<arch>/), so the
# bundled scripts live BELOW the extraction root. Resolve them recursively (the
# same way the binary is found above) — a root-relative `[ -f "_tmp_$VERSION/$s" ]`
# check missed the wrapped files, fell back to raw.githubusercontent.com, and got
# HTTP 429 (rate-limited), which silently left add.sh / generate.sh / deploy.sh
# uninstalled → "New Project / Deploy may not work".
for s in add.sh generate.sh deploy.sh; do
  if SRC="$(find "_tmp_$VERSION" -type f -name "$s" -print -quit)" && [ -n "$SRC" ]; then
    install -m 755 "$SRC" "$PB_SCRIPTS/$s"
    echo "  installed provisioning script: $s (from release)"
  elif curl -fsSL -o "$PB_SCRIPTS/$s" "https://raw.githubusercontent.com/$REPO/main/scripts/$s"; then
    chmod +x "$PB_SCRIPTS/$s"
    echo "  installed provisioning script: $s (from GitHub)"
  else
    echo "  WARN: could not fetch $s — New Project / Deploy may not work"
  fi
done
for s in install.sh update.sh uninstall.sh; do
  if SRC="$(find "_tmp_$VERSION" -type f -name "$s" -print -quit)" && [ -n "$SRC" ]; then
    install -m 755 "$SRC" "$INSTALL_DIR/scripts/$s"
    echo "  installed installer script: $s (from release)"
  elif curl -fsSL -o "$INSTALL_DIR/scripts/$s" "https://raw.githubusercontent.com/$REPO/main/scripts/$s"; then
    chmod +x "$INSTALL_DIR/scripts/$s"
    echo "  installed installer script: $s (from GitHub)"
  else
    echo "  WARN: could not fetch $s — future updates won't auto-restart"
  fi
done

rm -rf "_tmp_$VERSION" "$ZIP"

# ---- systemd service ------------------------------------------------------
echo "==> Creating systemd service"
ENV_LINES=""
if [ -n "$TOKEN" ]; then
  ENV_LINES="Environment=LOCKET_TOKEN=$TOKEN"
fi
cat > /etc/systemd/system/locket.service <<EOF
[Unit]
Description=Locket — PocketBase control plane
After=network.target

[Service]
Type=simple
ExecStart=$INSTALL_DIR/locket --config $CONFIG --addr $ADDR
$ENV_LINES
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable locket
# Always (re)start so a freshly installed binary is actually loaded.
# NOTE: `enable --now` alone does NOT restart an already-running service, which
# previously caused updates to silently keep the old process running.
systemctl restart locket
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
echo "Update it later with:  bash $INSTALL_DIR/scripts/update.sh"
