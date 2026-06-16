from pathlib import Path
import unittest


SCRIPT = Path(__file__).with_name("preflight-seven-service.sh")


class SevenServicePreflightScriptTest(unittest.TestCase):
    def test_script_exists(self):
        self.assertTrue(SCRIPT.exists(), "preflight-seven-service.sh should exist")

    def test_checks_every_required_service_and_image(self):
        text = SCRIPT.read_text(encoding="utf-8")

        for service in [
            "nginx",
            "web",
            "web-replica",
            "waline",
            "mysql",
            "uptime-kuma",
            "goaccess",
        ]:
            self.assertIn(service, text)

        for image in [
            "nginx:1.27-alpine",
            "lizheming/waline:1.40.3",
            "mysql:8.0.43",
            "louislam/uptime-kuma:2.4.0-slim",
            "allinurl/goaccess:1.10.2",
        ]:
            self.assertIn(image, text)

    def test_missing_images_get_offline_transfer_instructions(self):
        text = SCRIPT.read_text(encoding="utf-8")

        for required_hint in [
            "docker save",
            "scp",
            "docker load",
            "deploy/images",
            "--pull never",
        ]:
            self.assertIn(required_hint, text)

    def test_distinguishes_first_rollout_from_routine_update(self):
        text = SCRIPT.read_text(encoding="utf-8")

        self.assertIn("first seven-service rollout", text)
        self.assertIn("routine update", text)


if __name__ == "__main__":
    unittest.main()
