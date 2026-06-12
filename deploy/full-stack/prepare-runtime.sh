#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/coordinate-zero}"
BACKUP_DIR="${OPS_BACKUP_DIR:-/var/backups/coordinate-zero/mysql}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "prepare-runtime.sh must run as root." >&2
  exit 1
fi

if [[ ! -f "${PROJECT_DIR}/docker-compose.yml" ]]; then
  echo "Project not found at ${PROJECT_DIR}." >&2
  exit 1
fi

install -d -m 0755 \
  "${PROJECT_DIR}/runtime" \
  "${PROJECT_DIR}/runtime/ops" \
  "${PROJECT_DIR}/runtime/nginx" \
  "${PROJECT_DIR}/runtime/goaccess"
install -d -m 0700 "${BACKUP_DIR}"

touch \
  "${PROJECT_DIR}/runtime/nginx/access.log" \
  "${PROJECT_DIR}/runtime/nginx/error.log"
chmod 0644 \
  "${PROJECT_DIR}/runtime/nginx/access.log" \
  "${PROJECT_DIR}/runtime/nginx/error.log"

echo "Runtime directories are ready."
printf '  ops:      %s\n' "${PROJECT_DIR}/runtime/ops"
printf '  nginx:    %s\n' "${PROJECT_DIR}/runtime/nginx"
printf '  goaccess: %s\n' "${PROJECT_DIR}/runtime/goaccess"
printf '  backups:  %s\n' "${BACKUP_DIR}"
