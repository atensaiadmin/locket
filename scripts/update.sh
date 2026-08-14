#!/usr/bin/env bash
# Update Locket to the latest (or a specific) release.
# This is a thin, friendlier wrapper around install.sh — which already handles
# replacing the binary, rewriting the systemd unit, and restarting.
#
#   bash update.sh                    # update to latest release
#   VERSION=0.2.0 bash update.sh      # update to a specific version
set -euo pipefail
cd "$(dirname "$0")"

VERSION="${VERSION:-latest}"

echo "==> Updating Locket"
echo "    target: $VERSION"

# install.sh is idempotent: re-running it replaces the binary + restarts.
DOMAIN="${DOMAIN:-}" bash install.sh "$@" | sed 's/^/    /'

echo ""
echo "Update complete."
echo "Verify:  curl -s http://127.0.0.1:8090/api/version"
