import assert from "node:assert/strict";
import test from "node:test";

import {
  createHealthPayload,
  createInstancePayload,
  normalizeReplicaId,
} from "./instance.ts";

test("normalizes a configured replica id", () => {
  assert.equal(normalizeReplicaId(" web-primary "), "web-primary");
});

test("falls back when the replica id is missing or unsafe", () => {
  assert.equal(normalizeReplicaId(undefined), "web-unknown");
  assert.equal(normalizeReplicaId(""), "web-unknown");
  assert.equal(normalizeReplicaId("<script>"), "web-unknown");
});

test("health payload stays small and deterministic", () => {
  assert.deepEqual(
    createHealthPayload(
      "web-replica",
      new Date("2026-06-12T10:30:00.000Z"),
    ),
    {
      status: "ok",
      replica: "web-replica",
      checkedAt: "2026-06-12T10:30:00.000Z",
    },
  );
});

test("instance payload exposes only the replica and response time", () => {
  const payload = createInstancePayload(
    "web-primary",
    new Date("2026-06-12T10:31:00.000Z"),
  );

  assert.deepEqual(payload, {
    replica: "web-primary",
    time: "2026-06-12T10:31:00.000Z",
  });
});
