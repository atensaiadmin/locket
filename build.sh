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
(cd server && go build -o ../locket .)

echo "Done → ./locket"
echo "Run it with:  ./locket --config /opt/pocketbase/projects.conf"
