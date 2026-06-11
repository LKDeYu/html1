#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/coordinate-zero}"
BACKUP_DIR="${OPS_BACKUP_DIR:-/var/backups/coordinate-zero/mysql}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  printf 'Usage: %s --check FILE | --confirm FILE\n' "$0" >&2
  exit 2
}

[[ "$#" -eq 2 ]] || usage
MODE="$1"
REQUESTED_FILE="$2"
[[ "${MODE}" == "--check" || "${MODE}" == "--confirm" ]] || usage
[[ -f "${REQUESTED_FILE}" ]] || {
  printf 'Backup file not found: %s\n' "${REQUESTED_FILE}" >&2
  exit 1
}

BACKUP_ROOT="$(realpath -- "${BACKUP_DIR}")"
BACKUP_FILE="$(realpath -- "${REQUESTED_FILE}")"
case "${BACKUP_FILE}" in
  "${BACKUP_ROOT}"/*.sql.gz) ;;
  *)
    printf 'Backup file must be a .sql.gz file inside %s\n' "${BACKUP_ROOT}" >&2
    exit 1
    ;;
esac

gzip -t -- "${BACKUP_FILE}"
printf 'Backup validation passed: %s\n' "${BACKUP_FILE}"

if [[ "${MODE}" == "--check" ]]; then
  exit 0
fi

printf 'Creating a fresh pre-restore backup...\n'
"${SCRIPT_DIR}/backup-mysql.sh"

cd -- "${PROJECT_DIR}"
printf 'Restoring Waline database from %s\n' "${BACKUP_FILE}"
gzip -cd -- "${BACKUP_FILE}" \
  | docker compose exec -T mysql sh -c \
    'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql --user="$MYSQL_USER" "$MYSQL_DATABASE"'

printf 'Restore completed. Verify Waline login and comments before ending the SSH session.\n'
