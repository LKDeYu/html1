import { NextResponse } from "next/server";
import { listWriting } from "@/lib/writing";

export function GET() {
  return NextResponse.json({ posts: listWriting() });
}
