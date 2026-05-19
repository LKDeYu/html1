import { NextResponse } from "next/server";
import { listWritingTags, slugifyWritingTag } from "@/lib/writing";

export function GET() {
  return NextResponse.json({
    tags: listWritingTags().map((tag) => ({
      ...tag,
      slug: slugifyWritingTag(tag.label),
    })),
  });
}
