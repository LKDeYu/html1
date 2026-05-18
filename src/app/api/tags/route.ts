import { NextResponse } from "next/server";
import { listBlogTags } from "@/lib/cms-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ tags: listBlogTags() });
}
