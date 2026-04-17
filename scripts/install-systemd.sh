#!/usr/bin/env bash
# install-systemd.sh — install Hermes Studio as a systemd user service
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UNIT_NAME="hermes-studio"
UNIT_FILE="$HOME/.config/systemd/user/${UNIT_NAME}.service"
TEMPLATE="$ROOT/scripts/hermes-studio.service"

cmd="${1:-install}"

case "$cmd" in
  install)
    mkdir -p "$HOME/.config/systemd/user"
    sed "s|HERMES_INSTALL_DIR|$ROOT|g" "$TEMPLATE" > "$UNIT_FILE"
    systemctl --user daemon-reload
    echo "[systemd] installed $UNIT_FILE"
    echo "[systemd] run: systemctl --user enable --now $UNIT_NAME"
    ;;
  uninstall)
    systemctl --user stop "$UNIT_NAME" 2>/dev/null || true
    systemctl --user disable "$UNIT_NAME" 2>/dev/null || true
    rm -f "$UNIT_FILE"
    systemctl --user daemon-reload
    echo "[systemd] uninstalled $UNIT_NAME"
    ;;
  enable)
    systemctl --user enable "$UNIT_NAME"
    echo "[systemd] enabled $UNIT_NAME (starts at login)"
    ;;
  disable)
    systemctl --user disable "$UNIT_NAME"
    echo "[systemd] disabled $UNIT_NAME"
    ;;
  start)
    systemctl --user start "$UNIT_NAME"
    echo "[systemd] started $UNIT_NAME"
    ;;
  stop)
    systemctl --user stop "$UNIT_NAME"
    echo "[systemd] stopped $UNIT_NAME"
    ;;
  status)
    systemctl --user status "$UNIT_NAME" --no-pager || true
    ;;
  *)
    echo "Usage: $0 {install|uninstall|enable|disable|start|stop|status}" >&2
    exit 1
    ;;
esac
