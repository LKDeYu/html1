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
  assert.deepEqual(createHealthPayload("web-replica"), {
    status: "ok",
    replica: "web-replica",
  });
});

test("instance payload includes process metadata", () => {
  const payload = createInstancePayload("web-primary", {
    hostname: "container-a",
    pid: 42,
    uptimeSeconds: 123.8,
  });

  assert.deepEqual(payload, {
    replica: "web-primary",
    hostname: "container-a",
    pid: 42,
    uptimeSeconds: 123,
  });
});
