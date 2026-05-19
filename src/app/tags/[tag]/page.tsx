import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomingListPage } from "@/components/homing-content";
import { listWriting, listWritingTags, slugifyWritingTag } from "@/lib/writing";

type TagPageProps = {
  params: Promise<{ tag: string }>;
};

function getTagInfo(slug: string) {
  return listWritingTags().find((tag) => slugifyWritingTag(tag.label) === slug) ?? null;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const tagInfo = getTagInfo(decodeURIComponent(tag));

  if (!tagInfo) {
    return {
      title: "标签不存在 | NAMRANTA",
    };
  }

  return {
    title: `${tagInfo.label} | NAMRANTA`,
    description: `${tagInfo.count} 篇与 ${tagInfo.label} 相关的内容。`,
  };
}

export function generateStaticParams() {
  return listWritingTags().map((tag) => ({ tag: slugifyWritingTag(tag.label) }));
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const tagSlug = decodeURIComponent(tag);
  const tagInfo = getTagInfo(tagSlug);

  if (!tagInfo) {
    notFound();
  }

  const posts = listWriting({ tag: tagSlug });
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
      tags={tags.map((item) => ({
        label: item.label,
        count: item.count,
        href: `/tags/${slugifyWritingTag(item.label)}`,
      }))}
      activeTag={tagInfo.label}
      title={tagInfo.label[0]?.toUpperCase() + tagInfo.label.split(" ").join("-").slice(1)}
      subtitle={`${tagInfo.count} 篇文章`}
    />
  );
}
