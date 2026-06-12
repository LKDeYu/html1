#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/coordinate-zero}"
BASE_URL="${BASE_URL:-http://127.0.0.1}"
BACKUP_DIR="${OPS_BACKUP_DIR:-/var/backups/coordinate-zero/mysql}"
failures=0

pass() {
  printf '[PASS] %s\n' "$1"
}

fail() {
  printf '[FAIL] %s\n' "$1" >&2
  failures=$((failures + 1))
}

compose() {
  docker compose --project-directory "${PROJECT_DIR}" \
    -f "${PROJECT_DIR}/docker-compose.yml" "$@"
}

container_health() {
  local service="$1"
  local container_id
  container_id="$(compose ps -q "${service}")"
  if [[ -z "${container_id}" ]]; then
    printf 'missing'
    return
  fi
  docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
    "${container_id}"
}

check_http() {
  local path="$1"
  local code
  code="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
    --connect-timeout 5 --max-time 15 "${BASE_URL}${path}" || true)"
  if [[ "${code}" =~ ^(200|301|302|307|308)$ ]]; then
    pass "${path} returned HTTP ${code}"
  else
    fail "${path} returned HTTP ${code:-000}"
  fi
}

cd -- "${PROJECT_DIR}"

services=(nginx web web-replica waline mysql uptime-kuma goaccess)
running_services="$(compose ps --status running --services)"
for service in "${services[@]}"; do
  if grep -qx "${service}" <<< "${running_services}"; then
    pass "${service} is running"
  else
    fail "${service} is not running"
  fi
done

for service in mysql web web-replica; do
  health="$(container_health "${service}")"
  if [[ "${health}" == "healthy" ]]; then
    pass "${service} healthcheck is healthy"
  else
    fail "${service} healthcheck is ${health}"
  fi
done

check_http "/"
check_http "/blog/home"
check_http "/waline/"
check_http "/api/health"

declare -A replicas=()
for _ in {1..12}; do
  replica="$(
    curl --silent --show-error --max-time 10 "${BASE_URL}/api/instance" \
      | sed -n 's/.*"replica":"\([^"]*\)".*/\1/p' || true
  )"
  [[ -n "${replica}" ]] && replicas["${replica}"]=1
done
if [[ -n "${replicas[web-primary]:-}" && -n "${replicas[web-replica]:-}" ]]; then
  pass "/api/instance reached both web replicas"
else
  fail "/api/instance did not reach both replicas: ${!replicas[*]:-none}"
fi

if [[ -s "${PROJECT_DIR}/runtime/goaccess/report.html" ]]; then
  pass "GoAccess report exists"
else
  fail "GoAccess report is missing"
fi

for timer in coordinate-zero-collect.timer coordinate-zero-backup.timer coordinate-zero-goaccess.timer; do
  if systemctl is-enabled --quiet "${timer}" && systemctl is-active --quiet "${timer}"; then
    pass "${timer} is enabled and active"
  else
    fail "${timer} is not enabled and active"
  fi
done

latest_backup="$(find "${BACKUP_DIR}" -maxdepth 1 -type f -name 'waline-*.sql.gz' \
  -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n 1 | cut -d' ' -f2-)"
if [[ -n "${latest_backup}" ]] && gzip -t -- "${latest_backup}"; then
  pass "Latest backup passes gzip validation: ${latest_backup}"
else
  fail "No valid MySQL backup was found"
fi

echo
echo "Resource snapshot:"
docker stats --no-stream
free -h
df -h /

if ((failures > 0)); then
  printf '\nVerification completed with %d failure(s).\n' "${failures}" >&2
  exit 1
fi

echo
echo "All read-only stack checks passed."
