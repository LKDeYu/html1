import assert from "node:assert/strict";
import test from "node:test";

import { formatOpsTime } from "./format-time.ts";

test("formats operations timestamps in Asia/Shanghai on every runtime", () => {
  assert.equal(
    formatOpsTime("2026-06-14T06:42:47.000Z"),
    "2026年6月14日 14:42:47",
  );
});

test("returns the unknown-state label for missing timestamps", () => {
  assert.equal(formatOpsTime(null), "未检测");
});
