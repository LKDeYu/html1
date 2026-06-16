#!/usr/bin/env python3

from datetime import datetime, timedelta, timezone
import unittest

from collect_ops import (
    AccessEntry,
    build_access_and_security,
    classify_entry,
    cluster_health,
    static_risks,
)


def entry(
    *,
    ip: str = "203.0.113.42",
    method: str = "GET",
    path: str = "/",
    inspection_text: str | None = None,
    status_code: int = 200,
    time: datetime | None = None,
    user_agent: str = "Mozilla/5.0",
) -> AccessEntry:
    return AccessEntry(
        time=time or datetime.now(timezone.utc),
        ip=ip,
        method=method,
        path=path,
        inspection_text=inspection_text or path,
        status_code=status_code,
        referer="-",
        user_agent=user_agent,
    )


class CollectOpsTests(unittest.TestCase):
    def test_keeps_full_admin_ip_addresses_in_summaries(self) -> None:
        now = datetime(2026, 6, 16, 12, 30, tzinfo=timezone.utc)
        access, security = build_access_and_security(
            [
                entry(ip="203.0.113.42", path="/", time=now),
                entry(ip="203.0.113.42", path="/.env", status_code=404, time=now),
                entry(ip="2001:db8:85a3::8a2e:370:7334", path="/blog/home", time=now),
            ],
            now,
            False,
        )

        self.assertEqual(access["topIps"][0]["label"], "203.0.113.42")
        self.assertIn(
            "2001:db8:85a3::8a2e:370:7334",
            {record["ip"] for record in access["recent"]},
        )
        self.assertEqual(security["events"][0]["ip"], "203.0.113.42")

    def test_builds_hourly_request_and_error_series_for_charts(self) -> None:
        now = datetime(2026, 6, 16, 12, 30, tzinfo=timezone.utc)
        access, _ = build_access_and_security(
            [
                entry(path="/", status_code=200, time=now - timedelta(minutes=5)),
                entry(path="/missing", status_code=404, time=now - timedelta(minutes=4)),
                entry(path="/broken", status_code=502, time=now - timedelta(hours=1)),
            ],
            now,
            False,
        )

        self.assertEqual(len(access["requestsByHour"]), 24)
        current_hour = access["requestsByHour"][-1]
        previous_hour = access["requestsByHour"][-2]
        self.assertEqual(current_hour["requests"], 2)
        self.assertEqual(current_hour["notFound"], 1)
        self.assertEqual(current_hour["errors"], 1)
        self.assertEqual(previous_hour["requests"], 1)
        self.assertEqual(previous_hour["serverErrors"], 1)

    def test_classifies_internal_checks_and_search_engines(self) -> None:
        self.assertEqual(
            classify_entry(entry(ip="172.20.0.4", path="/api/health")),
            "internal",
        )
        self.assertEqual(
            classify_entry(
                entry(
                    ip="8.8.8.8",
                    path="/api/health",
                    user_agent="curl/8.5.0",
                )
            ),
            "internal",
        )
        self.assertEqual(
            classify_entry(entry(user_agent="Mozilla/5.0 Googlebot/2.1")),
            "search-engine",
        )

    def test_classifies_scanners_and_suspicious_probes(self) -> None:
        self.assertEqual(classify_entry(entry(path="/wp-admin")), "scanner")
        self.assertEqual(classify_entry(entry(path="/.env")), "suspicious")

    def test_allows_expected_waline_profile_and_2fa_updates(self) -> None:
        profile_update = entry(
            method="PUT",
            path="/waline/api/user",
            inspection_text="/waline/api/user",
        )
        two_factor = entry(
            method="PUT",
            path="/waline/api/user/2fa",
            inspection_text="/waline/api/user/2fa",
        )
        self.assertEqual(static_risks(profile_update), [])
        self.assertEqual(static_risks(two_factor), [])

    def test_derives_cluster_health_from_both_replicas(self) -> None:
        healthy = {"state": "running", "health": "healthy", "restartCount": 0}
        down = {"state": "stopped", "health": "unknown", "restartCount": 0}
        self.assertEqual(cluster_health(healthy, healthy), "healthy")
        self.assertEqual(cluster_health(healthy, down), "degraded")
        self.assertEqual(cluster_health(down, down), "down")


if __name__ == "__main__":
    unittest.main()
