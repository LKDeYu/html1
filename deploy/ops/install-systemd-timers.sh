#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/coordinate-zero}"
BACKUP_DIR="${OPS_BACKUP_DIR:-/var/backups/coordinate-zero/mysql}"
SYSTEMD_DIR="${SYSTEMD_DIR:-/etc/systemd/system}"
LOGROTATE_DIR="${LOGROTATE_DIR:-/etc/logrotate.d}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
TEMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf -- "${TEMP_DIR}"
}
trap cleanup EXIT

if [[ "${EUID}" -ne 0 ]]; then
  echo "install-systemd-timers.sh must run as root." >&2
  exit 1
fi

if [[ ! -f "${PROJECT_DIR}/docker-compose.yml" ]]; then
  echo "Project not found at ${PROJECT_DIR}." >&2
  exit 1
fi

while IFS= read -r -d '' script; do
  bash -n "${script}"
done < <(find "${DEPLOY_DIR}" -type f -name '*.sh' -print0)

while IFS= read -r -d '' module; do
  PYTHONPYCACHEPREFIX="${TEMP_DIR}/pycache" python3 -m py_compile "${module}"
done < <(find "${DEPLOY_DIR}/ops" -maxdepth 1 -type f -name '*.py' -print0)

PROJECT_DIR="${PROJECT_DIR}" OPS_BACKUP_DIR="${BACKUP_DIR}" \
  "${PROJECT_DIR}/deploy/full-stack/prepare-runtime.sh"

for template in "${DEPLOY_DIR}/systemd/"coordinate-zero-*; do
  unit_name="$(basename -- "${template}")"
  sed \
    -e "s|@PROJECT_DIR@|${PROJECT_DIR}|g" \
    -e "s|@BACKUP_DIR@|${BACKUP_DIR}|g" \
    "${template}" > "${TEMP_DIR}/${unit_name}"
  install -m 0644 "${TEMP_DIR}/${unit_name}" "${SYSTEMD_DIR}/${unit_name}"
done

sed "s|/var/www/coordinate-zero|${PROJECT_DIR}|g" \
  "${DEPLOY_DIR}/nginx/coordinate-zero-logrotate.conf" \
  > "${TEMP_DIR}/coordinate-zero-nginx"
install -m 0644 \
  "${TEMP_DIR}/coordinate-zero-nginx" \
  "${LOGROTATE_DIR}/coordinate-zero-nginx"

systemctl daemon-reload
systemctl enable --now \
  coordinate-zero-collect.timer \
  coordinate-zero-backup.timer \
  coordinate-zero-goaccess.timer

systemctl list-timers \
  coordinate-zero-collect.timer \
  coordinate-zero-backup.timer \
  coordinate-zero-goaccess.timer \
  --no-pager
