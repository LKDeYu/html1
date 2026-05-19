import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomingListPage } from "@/components/homing-content";
import { listWriting, listWritingTags, slugifyWritingTag } from "@/lib/writing";

const POSTS_PER_PAGE = 5;

type BlogPagedPageProps = {
  params: Promise<{ page: string }>;
};

export const metadata: Metadata = {
  title: "Blog | NAMRANTA",
  description: "分页浏览吴志宏的项目、学习笔记和工程复盘。",
};

export function generateStaticParams() {
  const totalPages = Math.ceil(listWriting().length / POSTS_PER_PAGE);
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({
    page: String(index + 2),
  }));
}

export default async function BlogPagedPage({ params }: BlogPagedPageProps) {
  const { page } = await params;
  const currentPage = Number(page);
  const allPosts = listWriting();
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);

  if (!Number.isInteger(currentPage) || currentPage < 2 || currentPage > totalPages) {
    notFound();
  }

  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const posts = allPosts.slice(start, start + POSTS_PER_PAGE);
  const tags = listWritingTags();

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
      subtitle="项目、学习笔记和工程复盘放在同一种格式里。"
      pagination={{
        currentPage,
        totalPages,
      }}
    />
  );
}
