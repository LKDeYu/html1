import { NextResponse } from "next/server";
import {
  createOpsSessionValue,
  getOpsSessionCookieOptions,
  isOpsAdminConfigured,
  OPS_SESSION_COOKIE,
  verifyAdminToken,
} from "@/lib/ops/auth";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function POST(request: Request) {
  if (!isOpsAdminConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN is not configured." },
      { status: 503, headers: noStoreHeaders },
    );
  }

  let token = "";
  try {
    const body = (await request.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token.slice(0, 4096) : "";
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400, headers: noStoreHeaders },
    );
  }

  if (!verifyAdminToken(token)) {
    return NextResponse.json(
      { error: "Invalid administrator token." },
      { status: 401, headers: noStoreHeaders },
    );
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: noStoreHeaders },
  );
  response.cookies.set(
    OPS_SESSION_COOKIE,
    createOpsSessionValue(),
    getOpsSessionCookieOptions(),
  );
  return response;
}
