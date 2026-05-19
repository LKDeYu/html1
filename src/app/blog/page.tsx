import type { Metadata } from "next";
import { HomingListPage } from "@/components/homing-content";
import { listBlogPosts, listBlogTags } from "@/lib/cms-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog | NAMRANTA",
  description: "吴志宏的学习笔记、项目复盘和工程记录。",
};

type BlogPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    year?: string;
  }>;
};

function matchesQuery(post: ReturnType<typeof listBlogPosts>[number], query: string) {
  if (!query) {
    return true;
  }

  const haystack = [post.title, post.summary, post.category, post.tags.join(" "), post.bodyMarkdown].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const query = String(params?.q ?? "").trim();
  const selectedCategory = String(params?.category ?? "").trim();
  const selectedYear = String(params?.year ?? "").trim();
  const allPosts = listBlogPosts();
  const posts = allPosts.filter((post) => {
    const year = post.date.slice(0, 4);
    return (
      matchesQuery(post, query) &&
      (!selectedCategory || post.category === selectedCategory) &&
      (!selectedYear || year === selectedYear)
    );
  });
  const tags = listBlogTags();
  const hasFilters = Boolean(query || selectedCategory || selectedYear);

  return (
    <HomingListPage
      posts={posts.map((post) => ({
        slug: post.slug,
        title: post.title,
        date: post.date,
        summary: post.summary,
        tags: post.tags,
        category: post.category || "学习笔记",
        href: `/blog/${post.slug}`,
      }))}
      tags={tags.map((tag) => ({ label: tag.label, count: tag.count, href: `/tags/${tag.slug}` }))}
      title="All Posts"
      subtitle={hasFilters ? `${posts.length} 篇文章符合当前筛选` : "项目、学习笔记和工程复盘放在同一种格式里。"}
    />
  );
}
