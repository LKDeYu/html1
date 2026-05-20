import type { Metadata } from "next";
import { HomingHomePage } from "@/components/homing-content";
import { blogConfig } from "@/lib/site";
import { listWriting } from "@/lib/writing";

export const metadata: Metadata = {
  title: `${blogConfig.name} | Blog Home`,
  description: blogConfig.description,
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
