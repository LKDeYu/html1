#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/coordinate-zero}"
BASE_URL="${BASE_URL:-http://127.0.0.1}"
STOPPED_SERVICE=""

compose() {
  docker compose --project-directory "$PROJECT_DIR" -f "$PROJECT_DIR/docker-compose.yml" "$@"
}

wait_for_health() {
  local service="$1"
  local attempts=30

  while ((attempts > 0)); do
    if compose ps --format json "$service" | grep -q '"Health":"healthy"'; then
      return 0
    fi
    sleep 2
    attempts=$((attempts - 1))
  done

  echo "Timed out waiting for $service to become healthy." >&2
  return 1
}

restore_service() {
  if [[ -n "$STOPPED_SERVICE" ]]; then
    echo "Restoring $STOPPED_SERVICE..."
    compose start "$STOPPED_SERVICE" >/dev/null
    wait_for_health "$STOPPED_SERVICE"
    STOPPED_SERVICE=""
  fi
}

trap restore_service EXIT INT TERM

assert_http() {
  local path="$1"
  local status
  status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
    --max-time 15 "$BASE_URL$path")"
  if [[ ! "$status" =~ ^(200|301|302|307|308)$ ]]; then
    echo "$path returned HTTP $status" >&2
    return 1
  fi
}

assert_replica() {
  local expected="$1"
  local actual
  actual="$(curl --silent --show-error --max-time 15 "$BASE_URL/api/instance" \
    | sed -n 's/.*"replica":"\([^"]*\)".*/\1/p')"
  if [[ "$actual" != "$expected" ]]; then
    echo "Expected $expected but received ${actual:-no replica id}." >&2
    return 1
  fi
}

assert_stack_paths() {
  assert_http "/"
  assert_http "/blog/home"
  assert_http "/waline/"
  assert_http "/admin/ops/login"
  assert_http "/api/health"
}

echo "Checking the complete stack before the drill..."
assert_stack_paths
wait_for_health web
wait_for_health web-replica

echo "Stopping the primary web service..."
STOPPED_SERVICE="web"
compose stop web >/dev/null
assert_stack_paths
assert_replica web-replica
restore_service

echo "Stopping the replica web service..."
STOPPED_SERVICE="web-replica"
compose stop web-replica >/dev/null
assert_stack_paths
assert_replica web-primary
restore_service

echo "Web failover drill passed; both services are healthy again."
