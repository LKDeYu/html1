import { NextResponse } from "next/server";
import { getBlogPostBySlug } from "@/lib/cms-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ post });
}
