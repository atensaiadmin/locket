#!/usr/bin/env bash
# Deploy one PocketBase project on the server (the "CI/CD" loop).
#
# The project folder /opt/pocketbase/<name> is a git repo containing
# pb_migrations/, pb_hooks/, pb_public/ (see deploy/project-template/).
# This script: pulls latest -> syncs files -> runs pending migrations -> restarts.
#
# Usage (on server, as root):
#   deploy.sh <project-name>
set -euo pipefail

NAME="${1:?usage: deploy.sh <project-name>}"
PB_HOME="/opt/pocketbase"
DIR="$PB_HOME/$NAME"

[ -d "$DIR/.git" ] || {
  echo "No git repo at $DIR — nothing to pull."
  echo "If you manage schema in the admin UI, just restart: systemctl restart pocketbase-$NAME"
  exit 0
}

echo "==> git pull ($NAME)"
git -C "$DIR" pull --ff-only

echo "==> sync pb_migrations / pb_hooks / pb_public"
for sub in pb_migrations pb_hooks pb_public; do
  mkdir -p "$DIR/$sub"
done
chown -R pocketbase:pocketbase "$DIR"

echo "==> apply migrations"
if [ -n "$(ls -A "$DIR/pb_migrations" 2>/dev/null)" ]; then
  sudo -u pocketbase "$PB_HOME/pocketbase" migrate up \
    --dir="$DIR/data" \
    --migrationsDir="$DIR/pb_migrations"
else
  echo "    no migrations to apply"
fi

echo "==> restart service"
systemctl restart "pocketbase-$NAME"

echo "Deployed $NAME. Check: systemctl status pocketbase-$NAME"
