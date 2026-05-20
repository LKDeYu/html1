import type { Metadata } from "next";
import { HomingListPage } from "@/components/homing-content";
import { blogConfig } from "@/lib/site";
import { listWriting, listWritingTags, slugifyWritingTag } from "@/lib/writing";

const POSTS_PER_PAGE = 5;

export const metadata: Metadata = {
  title: `Blog | ${blogConfig.name}`,
  description: blogConfig.description,
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
  const matchedPosts = allPosts.filter((post) => matchesQuery(post, query));
  const posts = query ? matchedPosts : matchedPosts.slice(0, POSTS_PER_PAGE);
  const tags = listWritingTags();
  const hasFilters = Boolean(query);
  const totalPages = Math.ceil(matchedPosts.length / POSTS_PER_PAGE);

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
      pagination={
        !hasFilters && totalPages > 1
          ? {
              currentPage: 1,
              totalPages,
            }
          : undefined
      }
    />
  );
}
