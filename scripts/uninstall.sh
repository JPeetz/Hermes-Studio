#!/usr/bin/env bash
# uninstall.sh — Remove Hermes Studio from this machine
# Usage: bash scripts/uninstall.sh [--purge-data]
#
# Without --purge-data: stops the service, removes the unit file, and deletes
#   the project folder. The .runtime/ data dir lives inside the project folder
#   so it is removed automatically.
#
# With --purge-data: also clears browser localStorage cannot be done server-side,
#   but we remind the user to do it manually.

set -euo pipefail

PURGE_DATA=false
for arg in "$@"; do
  [[ "$arg" == "--purge-data" ]] && PURGE_DATA=true
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$(dirname "$SCRIPT_DIR")"

echo "Hermes Studio uninstaller"
echo "Install dir: $INSTALL_DIR"
echo ""

# ── 1. Stop + disable systemd service ────────────────────────────────────────
UNIT_FILE="$HOME/.config/systemd/user/hermes-studio.service"

if systemctl --user is-active --quiet hermes-studio 2>/dev/null; then
  echo "Stopping hermes-studio service..."
  systemctl --user stop hermes-studio
fi

if systemctl --user is-enabled --quiet hermes-studio 2>/dev/null; then
  echo "Disabling hermes-studio service..."
  systemctl --user disable hermes-studio
fi

if [[ -f "$UNIT_FILE" ]]; then
  echo "Removing unit file: $UNIT_FILE"
  rm -f "$UNIT_FILE"
  systemctl --user daemon-reload
fi

# ── 2. Kill any stray node process ───────────────────────────────────────────
pkill -f 'node.*server-entry.js' 2>/dev/null && echo "Stopped running server process." || true

# ── 3. Remove project folder ─────────────────────────────────────────────────
echo ""
echo "About to delete: $INSTALL_DIR"
read -r -p "Are you sure? This cannot be undone. [y/N] " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

rm -rf "$INSTALL_DIR"
echo "Project folder removed."

# ── 4. Remind about browser data ─────────────────────────────────────────────
echo ""
echo "Done. One manual step remaining:"
echo "  Clear browser localStorage for http://localhost:<port>"
echo "  (DevTools → Application → Storage → Local Storage → Clear all)"

if [[ "$PURGE_DATA" == true ]]; then
  echo ""
  echo "Note: ~/.hermes/ was NOT touched — it belongs to Hermes Agent, not Hermes Studio."
fi

echo ""
echo "Hermes Studio has been uninstalled."
