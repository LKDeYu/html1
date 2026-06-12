#!/usr/bin/env bash
set -Eeuo pipefail

SYSTEMD_DIR="${SYSTEMD_DIR:-/etc/systemd/system}"
LOGROTATE_DIR="${LOGROTATE_DIR:-/etc/logrotate.d}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "uninstall-systemd-timers.sh must run as root." >&2
  exit 1
fi

timers=(
  coordinate-zero-collect.timer
  coordinate-zero-backup.timer
  coordinate-zero-goaccess.timer
)
services=(
  coordinate-zero-collect.service
  coordinate-zero-backup.service
  coordinate-zero-goaccess.service
)

systemctl disable --now "${timers[@]}" 2>/dev/null || true
rm -f -- \
  "${timers[@]/#/${SYSTEMD_DIR}/}" \
  "${services[@]/#/${SYSTEMD_DIR}/}" \
  "${LOGROTATE_DIR}/coordinate-zero-nginx"
systemctl daemon-reload
systemctl reset-failed

echo "Coordinate Zero timers were removed."
echo "Runtime data, backups, Docker volumes, and containers were not changed."
