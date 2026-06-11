#!/usr/bin/env python3
"""Apply retention and atomically publish a sanitized backup status file."""

from __future__ import annotations

import argparse
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path


def iso_timestamp(epoch: float) -> str:
    return (
        datetime.fromtimestamp(epoch, tz=timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--backup-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--retention", type=int, default=7)
    parser.add_argument("--success", choices=("true", "false"), required=True)
    parser.add_argument("--file", type=Path)
    parser.add_argument("--error", default="")
    parser.add_argument("--prune", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    retention = max(1, min(args.retention, 365))
    args.backup_dir.mkdir(parents=True, exist_ok=True)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    os.chmod(args.output_dir, 0o755)

    backups = sorted(
        args.backup_dir.glob("waline-*.sql.gz"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    if args.prune:
        for stale_path in backups[retention:]:
            stale_path.unlink(missing_ok=True)
        backups = backups[:retention]

    selected = args.file if args.file and args.file.is_file() else None
    if selected is None and backups:
        selected = backups[0]

    payload = {
        "checkedAt": iso_timestamp(datetime.now(tz=timezone.utc).timestamp()),
        "lastBackupAt": iso_timestamp(selected.stat().st_mtime) if selected else None,
        "fileName": selected.name if selected else None,
        "sizeBytes": selected.stat().st_size if selected else None,
        "success": args.success == "true",
        "retentionCount": retention,
        "availableBackups": len(backups),
        "directory": str(args.backup_dir.resolve()),
        "errorSummary": args.error[:240] or None,
    }

    file_descriptor, temp_name = tempfile.mkstemp(
        dir=args.output_dir, prefix=".backup-status.", suffix=".tmp"
    )
    try:
        with os.fdopen(file_descriptor, "w", encoding="utf-8") as stream:
            json.dump(payload, stream, ensure_ascii=True, separators=(",", ":"))
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.chmod(temp_name, 0o644)
        os.replace(temp_name, args.output_dir / "backup-status.json")
    except Exception:
        try:
            os.unlink(temp_name)
        except OSError:
            pass
        raise


if __name__ == "__main__":
    main()
