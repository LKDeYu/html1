import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { readOpsData } from "./read-ops-data.ts";

async function withOpsDirectory(
  files: Record<string, unknown>,
  assertion: () => Promise<void>,
) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ops-data-"));
  const originalDirectory = process.env.OPS_DATA_DIR;
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.OPS_DATA_DIR = directory;
  process.env.NODE_ENV = "production";

  try {
    await Promise.all(
      Object.entries(files).map(([name, value]) =>
        writeFile(path.join(directory, name), JSON.stringify(value)),
      ),
    );
    await assertion();
  } finally {
    if (originalDirectory === undefined) {
      delete process.env.OPS_DATA_DIR;
    } else {
      process.env.OPS_DATA_DIR = originalDirectory;
    }
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    await rm(directory, { recursive: true, force: true });
  }
}

test("keeps compatibility with the original single-web status JSON", async () => {
  await withOpsDirectory(
    {
      "status.json": {
        checkedAt: "2026-06-12T08:00:00Z",
        website: { status: "healthy", httpStatus: 200 },
        blog: { status: "healthy", httpStatus: 200 },
        waline: { status: "healthy", httpStatus: 200 },
        nginx: { state: "running", health: "unknown" },
        web: { state: "running", health: "unknown" },
        walineContainer: { state: "running", health: "unknown" },
        mysql: { state: "running", health: "healthy" },
      },
    },
    async () => {
      const data = await readOpsData();
      assert.equal(data.source, "runtime");
      assert.equal(data.status.webPrimary.state, "running");
      assert.equal(data.status.webPrimary.restartCount, 0);
      assert.equal(data.status.webReplica.state, "unknown");
      assert.equal(data.status.clusterHealth, "unknown");
      assert.deepEqual(data.missingFiles.sort(), [
        "access-summary.json",
        "backup-status.json",
        "security-events.json",
      ]);
    },
  );
});

test("validates and sanitizes the expanded operations JSON", async () => {
  const generatedAt = "2026-06-12T08:00:00Z";
  await withOpsDirectory(
    {
      "status.json": {
        checkedAt: generatedAt,
        host: {
          cpuPercent: 24.5,
          memoryPercent: 51.2,
          diskPercent: 33.1,
          uptimeSeconds: 90061,
        },
        clusterHealth: "healthy",
        website: { status: "healthy", httpStatus: 200 },
        blog: { status: "healthy", httpStatus: 200 },
        waline: { status: "healthy", httpStatus: 200 },
        nginx: { state: "running", health: "unknown", restartCount: 1 },
        webPrimary: { state: "running", health: "healthy", restartCount: 2 },
        webReplica: { state: "running", health: "healthy", restartCount: 0 },
        walineContainer: { state: "running", health: "unknown", restartCount: 0 },
        mysql: { state: "running", health: "healthy", restartCount: 0 },
        uptimeKuma: { state: "running", health: "unknown", restartCount: 0 },
        goaccess: { state: "running", health: "unknown", restartCount: 0 },
      },
      "access-summary.json": {
        generatedAt,
        estimatedVisitors: 3,
        trafficClasses: [{ label: "visitor", count: 8 }],
        topPaths: [{ label: "/blog/home?token=secret", count: 4 }],
        recent: [
          {
            time: generatedAt,
            ip: "203.0.*.*",
            method: "GET",
            path: "/blog/home?token=secret",
            statusCode: 200,
            referer: "https://example.com/?secret=yes",
            userAgent: "Browser",
            classification: "visitor",
          },
        ],
      },
      "security-events.json": { generatedAt, events: [] },
      "backup-status.json": {
        checkedAt: generatedAt,
        lastBackupAt: generatedAt,
        fileName: "waline.sql.gz",
        sizeBytes: 100,
        success: true,
        retentionCount: 7,
        availableBackups: 1,
        directory: "/var/backups/coordinate-zero/mysql",
        backups: [
          {
            fileName: "waline.sql.gz",
            createdAt: generatedAt,
            sizeBytes: 100,
            gzipValid: true,
          },
        ],
      },
    },
    async () => {
      const data = await readOpsData();
      assert.equal(data.status.clusterHealth, "healthy");
      assert.equal(data.status.webPrimary.restartCount, 2);
      assert.equal(data.access.estimatedVisitors, 3);
      assert.equal(data.access.topPaths[0]?.label, "/blog/home");
      assert.equal(data.access.recent[0]?.referer, "https://example.com/");
      assert.equal(data.backup.backups[0]?.gzipValid, true);
      assert.deepEqual(data.missingFiles, []);
    },
  );
});
