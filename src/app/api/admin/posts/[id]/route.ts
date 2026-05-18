import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteBlogPost, updateBlogPost } from "@/lib/cms-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const post = updateBlogPost(id, body);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update post" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!deleteBlogPost(id)) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
