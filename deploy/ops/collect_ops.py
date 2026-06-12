#!/usr/bin/env python3
"""Convert bounded Docker/Nginx observations into sanitized operations JSON."""

from __future__ import annotations

import argparse
import ipaddress
import json
import os
import re
import shutil
import tempfile
import time
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
TRAFFIC_CLASSES = (
    "visitor",
    "search-engine",
    "scanner",
    "internal",
    "suspicious",
)
SEARCH_ENGINE_RE = re.compile(
    r"(?:googlebot|bingbot|baiduspider|duckduckbot|yandexbot|sogou)",
    re.IGNORECASE,
)
SCANNER_AGENT_RE = re.compile(
    r"(?:masscan|nmap|nikto|sqlmap|zgrab|acunetix|nessus)",
    re.IGNORECASE,
)


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


def mask_ip(raw: str) -> str:
    try:
        address = ipaddress.ip_address(raw)
    except ValueError:
        return "unknown"
    if isinstance(address, ipaddress.IPv4Address):
        first, second, _, _ = str(address).split(".")
        return f"{first}.{second}.*.*"
    groups = [
        format(int(group, 16), "x")
        for group in address.exploded.split(":")[:3]
    ]
    return f"{groups[0]}:{groups[1]}:{groups[2]}::*"


def is_internal_ip(raw: str) -> bool:
    try:
        address = ipaddress.ip_address(raw)
    except ValueError:
        return False
    internal_networks = (
        ipaddress.ip_network("10.0.0.0/8"),
        ipaddress.ip_network("172.16.0.0/12"),
        ipaddress.ip_network("192.168.0.0/16"),
        ipaddress.ip_network("127.0.0.0/8"),
        ipaddress.ip_network("fc00::/7"),
        ipaddress.ip_network("fe80::/10"),
        ipaddress.ip_network("::1/128"),
    )
    return any(address in network for network in internal_networks)


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


def read_inspect_rows(path: Path) -> dict[str, dict[str, Any]]:
    try:
        parsed = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    if not isinstance(parsed, list):
        return {}

    rows: dict[str, dict[str, Any]] = {}
    for item in parsed:
        if not isinstance(item, dict):
            continue
        config = item.get("Config")
        labels = config.get("Labels") if isinstance(config, dict) else None
        service = (
            labels.get("com.docker.compose.service")
            if isinstance(labels, dict)
            else None
        )
        if isinstance(service, str) and service:
            rows[service] = item
    return rows


def container_state(
    row: dict[str, Any] | None,
    inspect_row: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if not row:
        return {"state": "unknown", "health": "unknown", "restartCount": 0}
    raw_state = str(row.get("State") or row.get("state") or "").lower()
    raw_health = str(row.get("Health") or row.get("health") or "").lower()
    state = "running" if raw_state == "running" else "stopped"
    if raw_health == "healthy":
        health = "healthy"
    elif raw_health == "unhealthy":
        health = "unhealthy"
    else:
        health = "unknown"
    restart_count = 0
    if inspect_row:
        raw_restart_count = inspect_row.get("RestartCount")
        if isinstance(raw_restart_count, int):
            restart_count = max(0, raw_restart_count)
    return {
        "state": state,
        "health": health,
        "restartCount": restart_count,
    }


def cluster_health(
    primary: dict[str, Any],
    replica: dict[str, Any],
) -> str:
    def available(container: dict[str, Any]) -> bool:
        return (
            container.get("state") == "running"
            and container.get("health") == "healthy"
        )

    available_count = sum((available(primary), available(replica)))
    if available_count == 2:
        return "healthy"
    if available_count == 1:
        return "degraded"
    if primary.get("state") == "unknown" and replica.get("state") == "unknown":
        return "unknown"
    return "down"


def read_cpu_times() -> tuple[int, int] | None:
    try:
        values = Path("/proc/stat").read_text(encoding="utf-8").splitlines()[0].split()
        ticks = [int(value) for value in values[1:]]
    except (OSError, ValueError, IndexError):
        return None
    idle = ticks[3] + (ticks[4] if len(ticks) > 4 else 0)
    return sum(ticks), idle


def host_metrics() -> dict[str, Any]:
    first = read_cpu_times()
    time.sleep(0.2)
    second = read_cpu_times()
    cpu_percent = None
    if first and second:
        total_delta = second[0] - first[0]
        idle_delta = second[1] - first[1]
        if total_delta > 0:
            cpu_percent = round(
                max(0.0, min(100.0, (1 - idle_delta / total_delta) * 100)),
                1,
            )

    memory_percent = None
    try:
        memory_values: dict[str, int] = {}
        for line in Path("/proc/meminfo").read_text(encoding="utf-8").splitlines():
            key, value = line.split(":", 1)
            memory_values[key] = int(value.strip().split()[0])
        total = memory_values["MemTotal"]
        available = memory_values["MemAvailable"]
        memory_percent = round((1 - available / total) * 100, 1)
    except (OSError, ValueError, KeyError, ZeroDivisionError):
        pass

    disk_percent = None
    try:
        disk = shutil.disk_usage("/")
        disk_percent = round(disk.used / disk.total * 100, 1)
    except (OSError, ZeroDivisionError):
        pass

    uptime_seconds = None
    try:
        uptime_seconds = int(
            float(Path("/proc/uptime").read_text(encoding="utf-8").split()[0])
        )
    except (OSError, ValueError, IndexError):
        pass

    return {
        "cpuPercent": cpu_percent,
        "memoryPercent": memory_percent,
        "diskPercent": disk_percent,
        "uptimeSeconds": uptime_seconds,
    }


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
            "ip": mask_ip(ip),
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


def is_expected_waline_write(entry: AccessEntry) -> bool:
    if not entry.path.startswith("/waline/api/"):
        return False
    if entry.method in {"GET", "POST", "OPTIONS"}:
        return True
    if entry.method != "PUT":
        return False
    return (
        entry.path == "/waline/api/user"
        or any(marker in entry.path for marker in ("/2fa", "/mfa", "/otp"))
    )


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
    if entry.method in {"PUT", "DELETE"} and not is_expected_waline_write(entry):
        risks.append(("medium", f"Unexpected {entry.method} method"))
    return risks


def classify_entry(entry: AccessEntry) -> str:
    risks = static_risks(entry)
    if any(level == "high" for level, _ in risks):
        return "suspicious"
    if SCAN_RE.search(entry.inspection_text) or SCANNER_AGENT_RE.search(
        entry.user_agent
    ):
        return "scanner"
    if risks:
        return "suspicious"
    health_paths = {"/", "/blog/home", "/waline/", "/api/health", "/api/instance"}
    is_curl_health_check = (
        entry.user_agent.lower().startswith("curl/")
        and entry.path in health_paths
    )
    if is_internal_ip(entry.ip) or is_curl_health_check:
        return "internal"
    if SEARCH_ENGINE_RE.search(entry.user_agent):
        return "search-engine"
    return "visitor"


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
    classifications = {entry: classify_entry(entry) for entry in entries}
    recent = [
        {
            "time": iso_utc(entry.time),
            "ip": mask_ip(entry.ip),
            "method": entry.method,
            "path": entry.path,
            "statusCode": entry.status_code,
            "referer": entry.referer,
            "userAgent": entry.user_agent,
            "risk": entry_risks.get(entry),
            "classification": classifications[entry],
        }
        for entry in sorted_entries[:50]
    ]
    visitor_keys = {
        (entry.ip, entry.user_agent)
        for entry in entries
        if classifications[entry] == "visitor"
    }
    access = {
        "generatedAt": iso_utc(now),
        "todayRequests": sum(
            1 for entry in entries if entry.time.astimezone(SHANGHAI).date() == today
        ),
        "last24hRequests": len(entries),
        "notFoundCount": sum(1 for entry in entries if entry.status_code == 404),
        "serverErrorCount": sum(1 for entry in entries if entry.status_code >= 500),
        "sampleTruncated": sample_truncated,
        "estimatedVisitors": len(visitor_keys),
        "trafficClasses": count_items(Counter(classifications.values()), 10),
        "topPaths": count_items(Counter(entry.path for entry in entries), 10),
        "statusCodes": count_items(
            Counter(str(entry.status_code) for entry in entries), 20
        ),
        "topIps": count_items(Counter(mask_ip(entry.ip) for entry in entries), 10),
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
    parser.add_argument("--docker-inspect", type=Path, required=True)
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
    inspect_rows = read_inspect_rows(args.docker_inspect)
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

    web_primary = container_state(
        rows_by_service.get("web"), inspect_rows.get("web")
    )
    web_replica = container_state(
        rows_by_service.get("web-replica"), inspect_rows.get("web-replica")
    )
    status = {
        "checkedAt": iso_utc(now),
        "website": endpoint_status(args.website_code),
        "blog": endpoint_status(args.blog_code),
        "waline": endpoint_status(args.waline_code),
        "host": host_metrics(),
        "clusterHealth": cluster_health(web_primary, web_replica),
        "nginx": container_state(
            rows_by_service.get("nginx"), inspect_rows.get("nginx")
        ),
        "web": web_primary,
        "webPrimary": web_primary,
        "webReplica": web_replica,
        "walineContainer": container_state(
            rows_by_service.get("waline"), inspect_rows.get("waline")
        ),
        "mysql": container_state(
            rows_by_service.get("mysql"), inspect_rows.get("mysql")
        ),
        "uptimeKuma": container_state(
            rows_by_service.get("uptime-kuma"), inspect_rows.get("uptime-kuma")
        ),
        "goaccess": container_state(
            rows_by_service.get("goaccess"), inspect_rows.get("goaccess")
        ),
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
