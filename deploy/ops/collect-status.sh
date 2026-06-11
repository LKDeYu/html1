#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/coordinate-zero}"
OPS_DATA_DIR="${OPS_DATA_DIR:-${PROJECT_DIR}/runtime/ops}"
OPS_BASE_URL="${OPS_BASE_URL:-http://127.0.0.1}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
MAX_ACCESS_LINES="${OPS_MAX_ACCESS_LINES:-20000}"
WALINE_LOG_LINES="${OPS_WALINE_LOG_LINES:-300}"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TEMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf -- "${TEMP_DIR}"
}
trap cleanup EXIT

mkdir -p -- "${OPS_DATA_DIR}"
chmod 755 -- "${OPS_DATA_DIR}"

http_status() {
  local path="$1"
  local result
  result="$(curl \
    --silent \
    --show-error \
    --output /dev/null \
    --connect-timeout 5 \
    --max-time 12 \
    --write-out '%{http_code}' \
    "${OPS_BASE_URL}${path}" 2>/dev/null || true)"
  if [[ "${result}" =~ ^[0-9]{3}$ ]]; then
    printf '%s' "${result}"
  else
    printf '000'
  fi
}

cd -- "${PROJECT_DIR}"

website_code="$(http_status "/")"
blog_code="$(http_status "/blog/home")"
waline_code="$(http_status "/waline/")"

if ! docker compose ps --format json > "${TEMP_DIR}/compose-ps.json" 2>/dev/null; then
  printf '[]\n' > "${TEMP_DIR}/compose-ps.json"
fi

if ! docker compose logs --no-color --since 24h --tail "${MAX_ACCESS_LINES}" nginx \
  > "${TEMP_DIR}/nginx.log" 2>/dev/null; then
  : > "${TEMP_DIR}/nginx.log"
fi

if ! docker compose logs --no-color --tail "${WALINE_LOG_LINES}" waline \
  > "${TEMP_DIR}/waline.log" 2>/dev/null; then
  : > "${TEMP_DIR}/waline.log"
fi

access_line_count="$(wc -l < "${TEMP_DIR}/nginx.log" | tr -d '[:space:]')"
sample_truncated=false
if [[ "${access_line_count:-0}" -ge "${MAX_ACCESS_LINES}" ]]; then
  sample_truncated=true
fi

"${PYTHON_BIN}" "${SCRIPT_DIR}/collect_ops.py" \
  --compose-ps "${TEMP_DIR}/compose-ps.json" \
  --access-log "${TEMP_DIR}/nginx.log" \
  --waline-log "${TEMP_DIR}/waline.log" \
  --output-dir "${OPS_DATA_DIR}" \
  --website-code "${website_code}" \
  --blog-code "${blog_code}" \
  --waline-code "${waline_code}" \
  --sample-truncated "${sample_truncated}"

printf 'Operations data updated in %s\n' "${OPS_DATA_DIR}"
