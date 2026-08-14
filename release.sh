#!/usr/bin/env bash
# Build Locket release binaries for all common platforms.
# Produces ./dist/locket_<version>_<os>_<arch>.zip  (matching PocketBase's layout)
#
#   VERSION=0.1.0 ./release.sh      # set version explicitly
#   ./release.sh                    # defaults to git describe / 0.0.0-dev
set -euo pipefail
cd "$(dirname "$0")"

VERSION="${VERSION:-$(git describe --tags --always 2>/dev/null || echo '0.0.0-dev')}"
DIST="dist"
rm -rf "$DIST"
mkdir -p "$DIST"

echo "==> Building embedded UI once"
if [ -d web/node_modules ]; then
  echo "    node_modules exists — skipping npm install"
else
  (cd web && npm install)
fi
(cd web && npm run build)
rm -rf server/static
mkdir -p server/static
cp -a web/dist/. server/static/

# (os, arch) pairs to ship. Add more here as needed.
TARGETS=(
  "linux amd64"
  "linux arm64"
  "darwin amd64"
  "darwin arm64"
  "windows amd64"
)

for pair in "${TARGETS[@]}"; do
  os="${pair% *}"
  arch="${pair#* }"
  name="locket_${VERSION}_${os}_${arch}"
  out="dist/${name}"

  echo "==> Building ${os}/${arch}"
  mkdir -p "$out"
  # GOOS/GOARCH env override makes Go produce a binary for another platform.
  bin="locket"
  if [ "$os" = "windows" ]; then
    bin="locket.exe"
  fi
  (cd server && GOOS="$os" GOARCH="$arch" go build -ldflags "-X main.Version=v$VERSION" -o "../${out}/${bin}" .)
  # Include a per-version README + config example so a download is self-contained.
  cp README.md "$out/README.md" 2>/dev/null || true
  cp projects.conf.example "$out/projects.conf.example" 2>/dev/null || true

  (cd "$DIST" && zip -qr "${name}.zip" "$(basename "$out")")
  rm -rf "$out"
  echo "    → $DIST/${name}.zip"
done

echo ""
echo "Done. Release zips in $DIST/ :"
ls -lh "$DIST"/*.zip
