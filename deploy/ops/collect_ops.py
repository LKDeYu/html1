#!/usr/bin/env python3
"""Convert bounded Docker/Nginx observations into sanitized operations JSON."""

from __future__ import annotations

import argparse
import json
import os
import re
import tempfile
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import unquote, urlsplit, urlunsplit
from zoneinfo import ZoneInfo

COMBINED_LOG_RE = re.compile(
    r'^(?P<ip>\S+) \S+ \S+ \[(?P<time>[^\]]+)\] '
    r'"(?P<request>[^"]*)" (?P<status>\d{3}) \S+ '
    r'"(?P<referer>[^"]*)" "(?P<user_agent>[^"]*)"$'
)
COMPOSE_PREFIX_RE = re.compile(r"^[^|]{1,160}\|\s?")
INJECTION_RE = re.compile(
    r"(?:union(?:\s+all)?\s+select|select\s+.+\s+from|"
    r"sleep\s*\(|benchmark\s*\(|<script|javascript:|"
    r"(?:'|%27|\b)or\s+['\"]?\d+['\"]?\s*=\s*['\"]?\d+)",
    re.IGNORECASE,
)
SCAN_RE = re.compile(
    r"(?:wp-admin|wp-login|wordpress|phpmyadmin|adminer|phpunit|\.php(?:/|$))",
    re.IGNORECASE,
)
RISK_ORDER = {"low": 1, "medium": 2, "high": 3}
SHANGHAI = ZoneInfo("Asia/Shanghai")


@dataclass(frozen=True)
class AccessEntry:
    time: datetime
    ip: str
    method: str
    path: str
    inspection_text: str
    status_code: int
    referer: str
    user_agent: str


def clip(value: Any, limit: int, fallback: str = "") -> str:
    if not isinstance(value, str):
        return fallback
    return value.replace("\x00", "")[:limit]


def iso_utc(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def strip_compose_prefix(line: str) -> str:
    return COMPOSE_PREFIX_RE.sub("", line.rstrip("\r\n"), count=1)


def clean_url(raw: str, limit: int = 300) -> str:
    if not raw or raw == "-":
        return "-"
    try:
        parts = urlsplit(raw)
        if parts.scheme or parts.netloc:
            cleaned = urlunsplit((parts.scheme, parts.netloc, parts.path or "/", "", ""))
        else:
            cleaned = parts.path or "/"
    except ValueError:
        cleaned = raw.split("?", 1)[0].split("#", 1)[0]
    return clip(cleaned, limit, "/")


def parse_access_log(path: Path, now: datetime) -> list[AccessEntry]:
    entries: list[AccessEntry] = []
    cutoff = now - timedelta(hours=24)
    if not path.is_file():
        return entries

    with path.open("r", encoding="utf-8", errors="replace") as stream:
        for raw_line in stream:
            line = strip_compose_prefix(raw_line)
            match = COMBINED_LOG_RE.match(line)
            if not match:
                continue
            try:
                timestamp = datetime.strptime(
                    match.group("time"), "%d/%b/%Y:%H:%M:%S %z"
                )
                status_code = int(match.group("status"))
            except (ValueError, TypeError):
                continue
            if timestamp < cutoff or timestamp > now + timedelta(minutes=5):
                continue

            request_parts = match.group("request").split()
            method = request_parts[0].upper() if request_parts else "UNKNOWN"
            raw_target = request_parts[1] if len(request_parts) >= 2 else "/"
            decoded = unquote(unquote(raw_target))
            entries.append(
                AccessEntry(
                    time=timestamp,
                    ip=clip(match.group("ip"), 64, "unknown"),
                    method=clip(method, 12, "UNKNOWN"),
                    path=clean_url(raw_target),
                    inspection_text=clip(f"{raw_target} {decoded}", 1200).lower(),
                    status_code=status_code,
                    referer=clean_url(match.group("referer"), 240),
                    user_agent=clip(match.group("user_agent"), 160, "unknown"),
                )
            )
    return entries


def read_compose_rows(path: Path) -> list[dict[str, Any]]:
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError:
        return []
    if not raw.strip():
        return []

    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [row for row in parsed if isinstance(row, dict)]
        if isinstance(parsed, dict):
            return [parsed]
    except json.JSONDecodeError:
        pass

    rows: list[dict[str, Any]] = []
    for line in raw.splitlines():
        try:
            parsed_line = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed_line, dict):
            rows.append(parsed_line)
    return rows


def container_state(row: dict[str, Any] | None) -> dict[str, str]:
    if not row:
        return {"state": "unknown", "health": "unknown"}
    raw_state = str(row.get("State") or row.get("state") or "").lower()
    raw_health = str(row.get("Health") or row.get("health") or "").lower()
    state = "running" if raw_state == "running" else "stopped"
    if raw_health == "healthy":
        health = "healthy"
    elif raw_health == "unhealthy":
        health = "unhealthy"
    else:
        health = "unknown"
    return {"state": state, "health": health}


def endpoint_status(raw_code: str) -> dict[str, Any]:
    try:
        code = int(raw_code)
    except ValueError:
        code = 0
    valid_code = code if 100 <= code <= 599 else None
    status = "healthy" if valid_code is not None and 200 <= valid_code < 400 else "unhealthy"
    return {"status": status, "httpStatus": valid_code}


def add_event(
    event_map: dict[tuple[str, str, str, str], dict[str, Any]],
    *,
    ip: str,
    path: str,
    rule: str,
    level: str,
    timestamp: datetime,
    count: int = 1,
) -> None:
    key = (ip, path, rule, level)
    event = event_map.get(key)
    if event is None:
        event_map[key] = {
            "ip": ip,
            "path": clip(path, 300, "/"),
            "rule": clip(rule, 120),
            "count": count,
            "lastSeenAt": iso_utc(timestamp),
            "level": level,
        }
        return
    event["count"] += count
    if timestamp > datetime.fromisoformat(event["lastSeenAt"].replace("Z", "+00:00")):
        event["lastSeenAt"] = iso_utc(timestamp)


def static_risks(entry: AccessEntry) -> list[tuple[str, str]]:
    risks: list[tuple[str, str]] = []
    target = entry.inspection_text
    if "/.env" in target:
        risks.append(("high", "Sensitive .env probe"))
    if "/.git" in target:
        risks.append(("high", "Sensitive .git probe"))
    if "../" in target or "..\\" in target:
        risks.append(("high", "Directory traversal pattern"))
    if INJECTION_RE.search(target):
        risks.append(("high", "Injection keyword pattern"))
    if entry.method in {"CONNECT", "TRACE"}:
        risks.append(("high", f"Disallowed {entry.method} method"))
    if SCAN_RE.search(target):
        risks.append(("medium", "Common admin/CMS scan"))
    if entry.method in {"PUT", "DELETE"}:
        risks.append(("medium", f"Unexpected {entry.method} method"))
    return risks


def window_key(entry: AccessEntry) -> tuple[str, int]:
    return entry.ip, int(entry.time.timestamp()) // 300


def add_rate_events(
    event_map: dict[tuple[str, str, str, str], dict[str, Any]],
    entries: Iterable[AccessEntry],
) -> None:
    all_requests: dict[tuple[str, int], list[AccessEntry]] = defaultdict(list)
    not_found: dict[tuple[str, int], list[AccessEntry]] = defaultdict(list)
    waline_api: dict[tuple[str, int], list[AccessEntry]] = defaultdict(list)

    for entry in entries:
        key = window_key(entry)
        all_requests[key].append(entry)
        if entry.status_code == 404:
            not_found[key].append(entry)
        if entry.path.startswith("/waline/api"):
            waline_api[key].append(entry)

    rate_rules = (
        (not_found, 20, 50, "5-minute 404 burst"),
        (all_requests, 120, 300, "5-minute request burst"),
        (waline_api, 60, 150, "5-minute Waline API burst"),
    )
    for buckets, medium_threshold, high_threshold, rule in rate_rules:
        for (ip, _), bucket_entries in buckets.items():
            total = len(bucket_entries)
            if total < medium_threshold:
                continue
            level = "high" if total >= high_threshold else "medium"
            latest = max(bucket_entries, key=lambda entry: entry.time)
            add_event(
                event_map,
                ip=ip,
                path=latest.path,
                rule=rule,
                level=level,
                timestamp=latest.time,
                count=total,
            )


def count_items(counter: Counter[Any], limit: int) -> list[dict[str, Any]]:
    return [
        {"label": str(label)[:300], "count": count}
        for label, count in counter.most_common(limit)
    ]


def build_access_and_security(
    entries: list[AccessEntry], now: datetime, sample_truncated: bool
) -> tuple[dict[str, Any], dict[str, Any]]:
    event_map: dict[tuple[str, str, str, str], dict[str, Any]] = {}
    entry_risks: dict[AccessEntry, str] = {}

    for entry in entries:
        for level, rule in static_risks(entry):
            add_event(
                event_map,
                ip=entry.ip,
                path=entry.path,
                rule=rule,
                level=level,
                timestamp=entry.time,
            )
            current = entry_risks.get(entry)
            if current is None or RISK_ORDER[level] > RISK_ORDER[current]:
                entry_risks[entry] = level

    add_rate_events(event_map, entries)

    today = now.astimezone(SHANGHAI).date()
    sorted_entries = sorted(entries, key=lambda entry: entry.time, reverse=True)
    recent = [
        {
            "time": iso_utc(entry.time),
            "ip": entry.ip,
            "method": entry.method,
            "path": entry.path,
            "statusCode": entry.status_code,
            "referer": entry.referer,
            "userAgent": entry.user_agent,
            "risk": entry_risks.get(entry),
        }
        for entry in sorted_entries[:50]
    ]
    access = {
        "generatedAt": iso_utc(now),
        "todayRequests": sum(
            1 for entry in entries if entry.time.astimezone(SHANGHAI).date() == today
        ),
        "last24hRequests": len(entries),
        "notFoundCount": sum(1 for entry in entries if entry.status_code == 404),
        "serverErrorCount": sum(1 for entry in entries if entry.status_code >= 500),
        "sampleTruncated": sample_truncated,
        "topPaths": count_items(Counter(entry.path for entry in entries), 10),
        "statusCodes": count_items(
            Counter(str(entry.status_code) for entry in entries), 20
        ),
        "topIps": count_items(Counter(entry.ip for entry in entries), 10),
        "recent": recent,
    }
    events = sorted(
        event_map.values(),
        key=lambda event: (
            -RISK_ORDER[event["level"]],
            -event["count"],
            event["lastSeenAt"],
        ),
    )[:100]
    security = {"generatedAt": iso_utc(now), "events": events}
    return access, security


def write_json_atomic(output_dir: Path, name: str, payload: dict[str, Any]) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    os.chmod(output_dir, 0o755)
    file_descriptor, temp_name = tempfile.mkstemp(
        dir=output_dir, prefix=f".{name}.", suffix=".tmp"
    )
    try:
        with os.fdopen(file_descriptor, "w", encoding="utf-8") as stream:
            json.dump(payload, stream, ensure_ascii=True, separators=(",", ":"))
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.chmod(temp_name, 0o644)
        os.replace(temp_name, output_dir / name)
    except Exception:
        try:
            os.unlink(temp_name)
        except OSError:
            pass
        raise


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--compose-ps", type=Path, required=True)
    parser.add_argument("--access-log", type=Path, required=True)
    parser.add_argument("--waline-log", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--website-code", default="000")
    parser.add_argument("--blog-code", default="000")
    parser.add_argument("--waline-code", default="000")
    parser.add_argument("--sample-truncated", choices=("true", "false"), default="false")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    now = datetime.now(timezone.utc)
    compose_rows = read_compose_rows(args.compose_ps)
    rows_by_service = {
        str(row.get("Service") or row.get("service") or ""): row
        for row in compose_rows
    }

    # Read the bounded Waline tail so collection failure is observable without
    # exposing raw application logs through the dashboard.
    try:
        args.waline_log.read_text(encoding="utf-8", errors="replace")
    except OSError:
        pass

    status = {
        "checkedAt": iso_utc(now),
        "website": endpoint_status(args.website_code),
        "blog": endpoint_status(args.blog_code),
        "waline": endpoint_status(args.waline_code),
        "nginx": container_state(rows_by_service.get("nginx")),
        "web": container_state(rows_by_service.get("web")),
        "walineContainer": container_state(rows_by_service.get("waline")),
        "mysql": container_state(rows_by_service.get("mysql")),
    }
    entries = parse_access_log(args.access_log, now)
    access, security = build_access_and_security(
        entries, now, args.sample_truncated == "true"
    )

    write_json_atomic(args.output_dir, "status.json", status)
    write_json_atomic(args.output_dir, "access-summary.json", access)
    write_json_atomic(args.output_dir, "security-events.json", security)


if __name__ == "__main__":
    main()
