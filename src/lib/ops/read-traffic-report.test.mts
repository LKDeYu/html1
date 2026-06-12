import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { readTrafficReport } from "./read-traffic-report.ts";

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
