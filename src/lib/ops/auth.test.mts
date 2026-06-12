import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import {
  getOpsSessionCookieOptions,
  isOpsInsecureHttpMode,
} from "./auth.ts";

const originalNodeEnv = process.env.NODE_ENV;
const originalAllowInsecureHttp = process.env.OPS_ALLOW_INSECURE_HTTP;

afterEach(() => {
  if (originalNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalNodeEnv;
  }

  if (originalAllowInsecureHttp === undefined) {
    delete process.env.OPS_ALLOW_INSECURE_HTTP;
  } else {
    process.env.OPS_ALLOW_INSECURE_HTTP = originalAllowInsecureHttp;
  }
});

describe("operations session cookie security", () => {
  test("uses Secure cookies in production by default", () => {
    process.env.NODE_ENV = "production";
    delete process.env.OPS_ALLOW_INSECURE_HTTP;

    assert.equal(getOpsSessionCookieOptions().secure, true);
    assert.equal(isOpsInsecureHttpMode(), false);
  });

  test("allows an explicitly enabled production HTTP test mode", () => {
    process.env.NODE_ENV = "production";
    process.env.OPS_ALLOW_INSECURE_HTTP = "true";

    assert.equal(getOpsSessionCookieOptions().secure, false);
    assert.equal(isOpsInsecureHttpMode(), true);
  });

  test("keeps Secure cookies when the flag is false or any other value", () => {
    process.env.NODE_ENV = "production";

    for (const value of ["false", "TRUE", "1", "yes", ""]) {
      process.env.OPS_ALLOW_INSECURE_HTTP = value;
      assert.equal(getOpsSessionCookieOptions().secure, true);
      assert.equal(isOpsInsecureHttpMode(), false);
    }
  });

  test("keeps HttpOnly, SameSite=Lax, path and 12-hour lifetime", () => {
    process.env.NODE_ENV = "production";
    process.env.OPS_ALLOW_INSECURE_HTTP = "true";

    const options = getOpsSessionCookieOptions();
    assert.equal(options.httpOnly, true);
    assert.equal(options.sameSite, "lax");
    assert.equal(options.path, "/");
    assert.equal(options.maxAge, 12 * 60 * 60);
  });
});
