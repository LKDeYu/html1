import { NextResponse } from "next/server";
import {
  getOpsSessionCookieOptions,
  OPS_SESSION_COOKIE,
} from "@/lib/ops/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/ops/login", request.url));
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.cookies.set(OPS_SESSION_COOKIE, "", {
    ...getOpsSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
