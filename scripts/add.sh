#!/usr/bin/env bash
# Add a new PocketBase project on this server (the "create instance" step).
#
#   add.sh <name> <port> <domain>
#
# What it does:
#   1. validates the inputs (name / port / domain)
#   2. appends "<name> <port> <domain>" to projects.conf
#   3. scaffolds /opt/pocketbase/<name> from the project template
#   4. re-runs generate.sh (systemd units + Caddyfile, reloads both)
#   5. enables + starts pocketbase-<name>
#
# After this, point DNS for <domain> at this VPS and open https://<domain>/_/
# to create the PocketBase superuser.
set -euo pipefail

PB_HOME="${PB_HOME:-/opt/pocketbase}"
CONF="$PB_HOME/projects.conf"
TEMPLATE_DIR="$PB_HOME/project-template"

NAME="${1:-}"
PORT="${2:-}"
DOMAIN="${3:-}"

# ---- validate inputs -------------------------------------------------------
[[ "$NAME" =~ ^[a-z][a-z0-9-]{1,62}$ ]] || {
  echo "ERROR: invalid name '$NAME' — use 2-63 chars: lowercase letters, digits, hyphens (start with a letter)" >&2
  exit 1
}
[[ "$PORT" =~ ^[0-9]+$ ]] && [ "$PORT" -ge 1024 ] && [ "$PORT" -le 65535 ] || {
  echo "ERROR: invalid port '$PORT' — use a number between 1024 and 65535" >&2
  exit 1
}
[[ "$DOMAIN" =~ ^([a-z0-9-]+\.)+[a-z]{2,}$ ]] || {
  echo "ERROR: invalid domain '$DOMAIN' — use a hostname like app.example.com" >&2
  exit 1
}

[ -f "$CONF" ] || { echo "ERROR: missing $CONF" >&2; exit 1; }

# ---- reject duplicates (skip comment lines — mirrors Go's loadProjects) ----
# Field 1 = name, field 2 = port; only non-comment lines count.
if grep -vE '^[[:space:]]*#' "$CONF" | cut -d' ' -f1 | grep -qx -- "$NAME"; then
  echo "ERROR: project '$NAME' already exists in $CONF" >&2
  exit 1
fi
if grep -vE '^[[:space:]]*#' "$CONF" | cut -d' ' -f2 | grep -qx -- "$PORT"; then
  echo "ERROR: port '$PORT' already used in $CONF" >&2
  exit 1
fi

# ---- register in projects.conf --------------------------------------------
echo "$NAME $PORT $DOMAIN" >> "$CONF"
echo "==> registered $NAME ($DOMAIN -> :$PORT) in $CONF"

# ---- scaffold the project dir ---------------------------------------------
mkdir -p "$PB_HOME/$NAME"
if [ -d "$TEMPLATE_DIR" ]; then
  cp -r "$TEMPLATE_DIR/." "$PB_HOME/$NAME/"
  echo "==> scaffolded from $TEMPLATE_DIR"
fi
mkdir -p "$PB_HOME/$NAME/pb_migrations" "$PB_HOME/$NAME/pb_hooks" "$PB_HOME/$NAME/pb_public"
chown -R pocketbase:pocketbase "$PB_HOME/$NAME" 2>/dev/null || true
echo "==> ready $PB_HOME/$NAME (pb_migrations, pb_hooks, pb_public)"

# ---- regenerate units + Caddyfile, start the service -----------------------
"$PB_HOME/scripts/generate.sh" "$CONF"
systemctl enable --now "pocketbase-$NAME"

echo ""
echo "Done. Next:"
echo "  point DNS for $DOMAIN at this VPS (A record), then"
echo "  open https://$DOMAIN/_/ to create the superuser"
echo "  (or curl http://127.0.0.1:$PORT/_/ to check it's serving)"
