#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/coordinate-zero}"
IMAGE_ARCHIVE_DIR="${IMAGE_ARCHIVE_DIR:-${PROJECT_DIR}/deploy/images}"
failures=0
warnings=0

required_services=(
  nginx
  web
  web-replica
  waline
  mysql
  uptime-kuma
  goaccess
)

required_images=(
  nginx:1.27-alpine
  lizheming/waline:1.40.3
  mysql:8.0.43
  louislam/uptime-kuma:2.4.0-slim
  allinurl/goaccess:1.10.2
)

timers=(
  coordinate-zero-collect.timer
  coordinate-zero-backup.timer
  coordinate-zero-goaccess.timer
)

pass() {
  printf '[PASS] %s\n' "$1"
}

info() {
  printf '[INFO] %s\n' "$1"
}

warn() {
  printf '[WARN] %s\n' "$1" >&2
  warnings=$((warnings + 1))
}

fail() {
  printf '[FAIL] %s\n' "$1" >&2
  failures=$((failures + 1))
}

compose() {
  docker compose --project-directory "${PROJECT_DIR}" \
    -f "${PROJECT_DIR}/docker-compose.yml" "$@"
}

has_line() {
  local needle="$1"
  local haystack="$2"
  grep -qx -- "${needle}" <<< "${haystack}"
}

archive_name_for() {
  local image="$1"
  local name
  name="${image//\//-}"
  name="${name//:/-}"
  printf '%s.tar' "${name}"
}

print_offline_image_help() {
  local image="$1"
  local archive_name
  archive_name="$(archive_name_for "${image}")"

  cat >&2 <<HELP

Missing required Docker image: ${image}

Because the deployment uses --pull never, this image must exist on ECS before
the first seven-service rollout. If the ECS cannot pull it directly, export it
from a machine that already has the image and upload it:

  docker save ${image} -o ${archive_name}
  scp ${archive_name} root@ECS_PUBLIC_IP:${PROJECT_DIR}/deploy/images/

Then on ECS:

  mkdir -p ${PROJECT_DIR}/deploy/images
  docker load -i ${PROJECT_DIR}/deploy/images/${archive_name}
  docker image inspect ${image} >/dev/null

HELP
}

if [[ ! -f "${PROJECT_DIR}/docker-compose.yml" ]]; then
  fail "Project not found at ${PROJECT_DIR}; docker-compose.yml is missing."
else
  pass "Project directory exists: ${PROJECT_DIR}"
fi

if ((failures == 0)); then
  if compose config --quiet; then
    pass "docker compose config is valid"
  else
    fail "docker compose config failed"
  fi
fi

if ((failures == 0)); then
  declared_services="$(compose config --services)"
  for service in "${required_services[@]}"; do
    if has_line "${service}" "${declared_services}"; then
      pass "compose declares ${service}"
    else
      fail "compose does not declare required service ${service}"
    fi
  done
fi

missing_images=()
for image in "${required_images[@]}"; do
  if docker image inspect "${image}" >/dev/null 2>&1; then
    pass "image is available locally: ${image}"
  else
    fail "image is missing locally: ${image}"
    missing_images+=("${image}")
  fi
done

if ((${#missing_images[@]} > 0)); then
  warn "Image archive directory for manual uploads: ${IMAGE_ARCHIVE_DIR}"
  warn "Create it when uploading archives: mkdir -p ${IMAGE_ARCHIVE_DIR}"
  for image in "${missing_images[@]}"; do
    archive="${IMAGE_ARCHIVE_DIR}/$(archive_name_for "${image}")"
    if [[ -f "${archive}" ]]; then
      warn "Archive exists but is not loaded yet: ${archive}"
      warn "Run: docker load -i ${archive}"
    fi
    print_offline_image_help "${image}"
  done
fi

if ((failures == 0)); then
  running_services="$(compose ps --status running --services 2>/dev/null || true)"
  missing_running=()
  for service in "${required_services[@]}"; do
    if has_line "${service}" "${running_services}"; then
      pass "${service} is already running"
    else
      missing_running+=("${service}")
    fi
  done

  if ((${#missing_running[@]} == 0)); then
    info "Detected routine update state: all seven services are already running."
    info "Routine update command: docker compose up -d --build --pull never web web-replica nginx"
  else
    info "Detected first seven-service rollout state: missing running services: ${missing_running[*]}"
    info "First rollout command after images are ready: docker compose up -d --pull never"
  fi
fi

if command -v systemctl >/dev/null 2>&1; then
  for timer in "${timers[@]}"; do
    if systemctl is-enabled --quiet "${timer}" && systemctl is-active --quiet "${timer}"; then
      pass "${timer} is enabled and active"
    else
      warn "${timer} is not enabled and active"
    fi
  done
else
  warn "systemctl is unavailable; timer preflight skipped"
fi

if ((failures > 0)); then
  printf '\nPreflight failed with %d failure(s) and %d warning(s).\n' \
    "${failures}" "${warnings}" >&2
  exit 1
fi

printf '\nPreflight passed with %d warning(s).\n' "${warnings}"
info "Before verify-stack.sh, install timers with: sudo PROJECT_DIR=\$PWD OPS_BACKUP_DIR=/var/backups/coordinate-zero/mysql ./deploy/ops/install-systemd-timers.sh"
