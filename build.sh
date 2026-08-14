#!/usr/bin/env bash
# Build Locket into a single binary (UI embedded inside the Go server).
#
#   ./build.sh
#   → ./locket   (one file: API + dashboard)
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Building frontend (web/)"
if [ -d web/node_modules ]; then
  echo "    node_modules exists — skipping npm install (remove it to reinstall)"
else
  (cd web && npm install)
fi
(cd web && npm run build)

echo "==> Copying UI into server/static (embedded)"
rm -rf server/static
mkdir -p server/static
cp -a web/dist/. server/static/

echo "==> Building Go binary"
VERSION="$(git describe --tags --always 2>/dev/null || echo dev)"
(cd server && go build -ldflags "-X main.Version=$VERSION" -o ../locket .)

echo "Done → ./locket (version: $VERSION)"
echo "Run it with:  ./locket --config /opt/pocketbase/projects.conf"
