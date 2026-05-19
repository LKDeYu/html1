import type { Metadata } from "next";
import { HomingHomePage } from "@/components/homing-content";
import { listWriting } from "@/lib/writing";

export const metadata: Metadata = {
  title: "Namranta | Blog Home",
  description: "吴志宏的内容主页，汇总最近的项目、学习笔记和生活记录。",
};

export default function BlogHomePage() {
  const posts = listWriting();

  return (
    <HomingHomePage
      posts={posts.map((post) => ({
        slug: post.slug,
        title: post.title,
        date: post.date,
        summary: post.summary,
        tags: post.tags,
        href: `/blog/${post.slug}`,
      }))}
    />
  );
}
