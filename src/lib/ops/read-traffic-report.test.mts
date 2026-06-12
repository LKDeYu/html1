import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  readTrafficReport,
  sanitizeTrafficReport,
} from "./read-traffic-report.ts";

test("removes unresolved Glyphicons font references from GoAccess HTML", () => {
  const html =
    "<style>@font-face{font-family:'Glyphicons Halflings';src:url(../fonts/glyphicons-halflings-regular.woff2) format('woff2')}body{color:#fff}</style><script>window.reportReady=true</script>";

  const sanitized = sanitizeTrafficReport(html);

  assert.equal(sanitized.includes("glyphicons-halflings-regular"), false);
  assert.equal(sanitized.includes("body{color:#fff}"), true);
  assert.equal(
    sanitized.includes("<script>window.reportReady=true</script>"),
    true,
  );
});

test("returns a missing result when the report does not exist", async () => {
  const result = await readTrafficReport("Z:/missing/report.html");
  assert.deepEqual(result, { status: "missing" });
});

test("reads a bounded HTML report", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ops-traffic-"));
  const reportPath = path.join(directory, "report.html");
  await writeFile(reportPath, "<!doctype html><title>Traffic</title>");

  try {
    assert.deepEqual(await readTrafficReport(reportPath), {
      status: "ready",
      html: "<!doctype html><title>Traffic</title>",
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("rejects a report larger than the configured limit", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ops-traffic-"));
  const reportPath = path.join(directory, "report.html");
  await writeFile(reportPath, "x".repeat(33));

  try {
    assert.deepEqual(await readTrafficReport(reportPath, 32), {
      status: "too-large",
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
