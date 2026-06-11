import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  isOpsAdminConfigured,
  OPS_SESSION_COOKIE,
  verifyOpsSessionValue,
} from "@/lib/ops/auth";
import { readOpsData } from "@/lib/ops/read-ops-data";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  if (!isOpsAdminConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN is not configured." },
      { status: 503, headers: noStoreHeaders },
    );
  }

  const cookieStore = await cookies();
  if (
    !verifyOpsSessionValue(
      cookieStore.get(OPS_SESSION_COOKIE)?.value,
    )
  ) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: noStoreHeaders },
    );
  }

  return NextResponse.json(await readOpsData(), {
    headers: noStoreHeaders,
  });
}
