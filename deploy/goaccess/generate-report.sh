#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-/var/www/coordinate-zero}"
ACCESS_LOG="$PROJECT_DIR/runtime/nginx/access.log"

if [[ ! -s "$ACCESS_LOG" ]]; then
  echo "Nginx access log is missing or empty: $ACCESS_LOG" >&2
  exit 1
fi

docker compose --project-directory "$PROJECT_DIR" \
  -f "$PROJECT_DIR/docker-compose.yml" exec -T goaccess /bin/sh -c '
    set -eu
    umask 022
    output_dir=/var/www/goaccess
    target="$output_dir/report.html"
    temporary="$output_dir/.report.tmp.$$.html"
    trap "rm -f \"$temporary\"" EXIT

    /usr/bin/goaccess /var/log/nginx/access.log \
      --log-format=COMBINED \
      --no-query-string \
      --html-report-title="Coordinate Zero Traffic" \
      --output="$temporary"

    chmod 0644 "$temporary"
    mv -f "$temporary" "$target"
    trap - EXIT
  '

echo "GoAccess report updated: $PROJECT_DIR/runtime/goaccess/report.html"
