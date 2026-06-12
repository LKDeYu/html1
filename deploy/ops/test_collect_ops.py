#!/usr/bin/env python3

from datetime import datetime, timezone
import unittest

from collect_ops import (
    AccessEntry,
    classify_entry,
    cluster_health,
    mask_ip,
    static_risks,
)


def entry(
    *,
    ip: str = "203.0.113.42",
    method: str = "GET",
    path: str = "/",
    inspection_text: str | None = None,
    user_agent: str = "Mozilla/5.0",
) -> AccessEntry:
    return AccessEntry(
        time=datetime.now(timezone.utc),
        ip=ip,
        method=method,
        path=path,
        inspection_text=inspection_text or path,
        status_code=200,
        referer="-",
        user_agent=user_agent,
    )


class CollectOpsTests(unittest.TestCase):
    def test_masks_public_addresses_before_output(self) -> None:
        self.assertEqual(mask_ip("203.0.113.42"), "203.0.*.*")
        self.assertEqual(mask_ip("2001:db8:85a3::8a2e:370:7334"), "2001:db8:85a3::*")

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
