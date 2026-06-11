#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/coordinate-zero}"
OPS_DATA_DIR="${OPS_DATA_DIR:-${PROJECT_DIR}/runtime/ops}"
BACKUP_DIR="${OPS_BACKUP_DIR:-/var/backups/coordinate-zero/mysql}"
RETENTION="${OPS_BACKUP_RETENTION:-7}"
PYTHON_BIN="${PYTHON_BIN:-python3}"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP="$(TZ=Asia/Shanghai date '+%Y%m%d-%H%M%S')"
FINAL_FILE="${BACKUP_DIR}/waline-${TIMESTAMP}.sql.gz"
TEMP_FILE="${BACKUP_DIR}/.waline-${TIMESTAMP}.sql.gz.tmp"
SUCCESS=false
ERROR_SUMMARY="MySQL backup did not complete"

publish_status() {
  local exit_code=$?
  local status_args=(
    --backup-dir "${BACKUP_DIR}"
    --output-dir "${OPS_DATA_DIR}"
    --retention "${RETENTION}"
    --success "${SUCCESS}"
    --error "${ERROR_SUMMARY}"
  )
  if [[ "${SUCCESS}" == "true" ]]; then
    status_args+=(--file "${FINAL_FILE}" --prune)
  fi
  "${PYTHON_BIN}" "${SCRIPT_DIR}/write_backup_status.py" "${status_args[@]}" || true
  rm -f -- "${TEMP_FILE}"
  return "${exit_code}"
}
trap publish_status EXIT

mkdir -p -- "${BACKUP_DIR}" "${OPS_DATA_DIR}"
chmod 700 -- "${BACKUP_DIR}"
chmod 755 -- "${OPS_DATA_DIR}"

cd -- "${PROJECT_DIR}"

if ! docker compose exec -T mysql sh -c \
  'MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump --user="$MYSQL_USER" --single-transaction --quick --lock-tables=false --set-gtid-purged=OFF --no-tablespaces "$MYSQL_DATABASE"' \
  | gzip -c > "${TEMP_FILE}"; then
  ERROR_SUMMARY="mysqldump or gzip failed; inspect the host journal"
  exit 1
fi

if [[ ! -s "${TEMP_FILE}" ]] || ! gzip -t -- "${TEMP_FILE}"; then
  ERROR_SUMMARY="Generated backup failed size or gzip validation"
  exit 1
fi

chmod 600 -- "${TEMP_FILE}"
mv -- "${TEMP_FILE}" "${FINAL_FILE}"

SUCCESS=true
ERROR_SUMMARY=""
printf 'MySQL backup created: %s\n' "${FINAL_FILE}"
