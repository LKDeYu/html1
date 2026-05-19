import type { Metadata } from "next";
import { HomingListPage } from "@/components/homing-content";
import { listWriting, listWritingTags } from "@/lib/writing";

export const metadata: Metadata = {
  title: "Writing | NAMRANTA",
  description: "吴志宏的项目、笔记和复盘内容归档。",
};

export default function WritingPage() {
  const posts = listWriting();
  const tags = listWritingTags();

  return (
    <HomingListPage
      posts={posts.map((post) => ({
        slug: post.slug,
        title: post.title,
        date: post.date,
        summary: post.summary,
        tags: post.tags,
        href: `/writing/${post.slug}`,
      }))}
      tags={tags.map((tag) => ({ label: tag.label, count: tag.count }))}
      title="All Posts"
      subtitle="项目、学习笔记和工程复盘放在同一种格式里。"
    />
  );
}
