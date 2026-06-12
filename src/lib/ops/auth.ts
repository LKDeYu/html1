import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";

export const OPS_SESSION_COOKIE = "coordinate_zero_ops_session";
export const OPS_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

const SESSION_VERSION = "v1";
const MIN_TOKEN_LENGTH = 32;

function getAdminToken() {
  const token = process.env.ADMIN_TOKEN?.trim();
  return token && token.length >= MIN_TOKEN_LENGTH ? token : null;
}

function hash(value: string) {
  return createHash("sha256").update(value).digest();
}

function sign(expiresAt: number, token: string) {
  return createHmac("sha256", token)
    .update(`ops-session:${SESSION_VERSION}:${expiresAt}`)
    .digest("base64url");
}

export function isOpsAdminConfigured() {
  return getAdminToken() !== null;
}

export function isOpsInsecureHttpMode() {
  return process.env.OPS_ALLOW_INSECURE_HTTP === "true";
}

export function verifyAdminToken(candidate: string) {
  const token = getAdminToken();
  if (!token) {
    return false;
  }

  return timingSafeEqual(hash(candidate), hash(token));
}

export function createOpsSessionValue(now = Date.now()) {
  const token = getAdminToken();
  if (!token) {
    throw new Error("ADMIN_TOKEN is not configured.");
  }

  const expiresAt =
    Math.floor(now / 1000) + OPS_SESSION_MAX_AGE_SECONDS;
  return `${SESSION_VERSION}.${expiresAt}.${sign(expiresAt, token)}`;
}

export function verifyOpsSessionValue(
  value: string | undefined,
  now = Date.now(),
) {
  const token = getAdminToken();
  if (!token || !value) {
    return false;
  }

  const [version, expiresRaw, signature] = value.split(".");
  const expiresAt = Number(expiresRaw);
  if (
    version !== SESSION_VERSION ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(now / 1000) ||
    !signature
  ) {
    return false;
  }

  const expected = Buffer.from(sign(expiresAt, token), "base64url");
  const received = Buffer.from(signature, "base64url");
  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}

export function getOpsSessionCookieOptions() {
  const secure =
    process.env.NODE_ENV === "production" &&
    !isOpsInsecureHttpMode();

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: OPS_SESSION_MAX_AGE_SECONDS,
  };
}
