import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "namranta_admin";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function getPassword() {
  const password = process.env.ADMIN_PASSWORD;
  if (password) {
    return password;
  }

  if (process.env.NODE_ENV !== "production") {
    return "admin";
  }

  return null;
}

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev-session-secret";
  }

  return null;
}

function sign(payload: string) {
  const secret = getSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is required in production.");
  }

  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

export function verifyAdminPassword(password: string) {
  const expected = getPassword();
  if (!expected) {
    return false;
  }

  return safeEqual(password, expected);
}

export function createAdminSessionValue() {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = JSON.stringify({ expires });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function isValidAdminSession(value?: string) {
  if (!value) {
    return false;
  }

  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature || !safeEqual(sign(encodedPayload), signature)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as { expires?: number };
    return typeof payload.expires === "number" && payload.expires > Date.now();
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  const store = await cookies();
  return isValidAdminSession(store.get(COOKIE_NAME)?.value);
}

export function getAdminCookieName() {
  return COOKIE_NAME;
}

export function getAdminCookieMaxAge() {
  return SESSION_TTL_MS / 1000;
}
