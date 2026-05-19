import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomingArticlePage } from "@/components/homing-content";
import { getWritingBySlug, listWriting } from "@/lib/writing";

type WritingPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: WritingPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getWritingBySlug(slug);

  if (!post) {
    return {
      title: "内容不存在 | NAMRANTA",
    };
  }

  return {
    title: `${post.title} | NAMRANTA`,
    description: post.summary,
  };
}

export function generateStaticParams() {
  return listWriting().map((post) => ({ slug: post.slug }));
}

export default async function WritingPostPage({ params }: WritingPostPageProps) {
  const { slug } = await params;
  const post = getWritingBySlug(slug);

  if (!post) {
    notFound();
  }

  const posts = listWriting();
  const index = posts.findIndex((item) => item.slug === post.slug);
  const prev = posts[index + 1];
  const next = posts[index - 1];

  return (
    <HomingArticlePage
      post={{
        title: post.title,
        date: post.date,
        summary: post.summary,
        tags: post.tags,
        body: post.body,
      }}
      backHref="/writing"
      prev={prev ? { title: prev.title, href: `/writing/${prev.slug}` } : undefined}
      next={next ? { title: next.title, href: `/writing/${next.slug}` } : undefined}
    />
  );
}
