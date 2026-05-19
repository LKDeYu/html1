import type { Metadata } from "next";
import { HomingListPage } from "@/components/homing-content";
import { listWriting, listWritingTags, slugifyWritingTag } from "@/lib/writing";

export const metadata: Metadata = {
  title: "Blog | NAMRANTA",
  description: "吴志宏的学习笔记、项目复盘和工程记录。",
};

type BlogPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

function matchesQuery(post: ReturnType<typeof listWriting>[number], query: string) {
  if (!query) {
    return true;
  }

  const haystack = [post.title, post.summary, post.tags.join(" "), post.body].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const query = String(params?.q ?? "").trim();
  const allPosts = listWriting();
  const posts = allPosts.filter((post) => matchesQuery(post, query));
  const tags = listWritingTags();
  const hasFilters = Boolean(query);

  return (
    <HomingListPage
      posts={posts.map((post) => ({
        slug: post.slug,
        title: post.title,
        date: post.date,
        summary: post.summary,
        tags: post.tags,
        href: `/blog/${post.slug}`,
      }))}
      tags={tags.map((tag) => ({ label: tag.label, count: tag.count, href: `/tags/${slugifyWritingTag(tag.label)}` }))}
      title="All Posts"
      subtitle={hasFilters ? `${posts.length} 篇文章符合当前筛选` : "项目、学习笔记和工程复盘放在同一种格式里。"}
    />
  );
}
