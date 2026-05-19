import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomingArticlePage } from "@/components/homing-content";
import { getWritingBySlug, listWriting } from "@/lib/writing";
import { absoluteUrl, siteConfig } from "@/lib/site";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getWritingBySlug(slug);

  if (!post) {
    return {
      title: "文章不存在 | NAMRANTA",
    };
  }

  const url = absoluteUrl(`/blog/${post.slug}`);

  return {
    title: `${post.title} | NAMRANTA`,
    description: post.summary || siteConfig.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.summary || siteConfig.description,
      type: "article",
      url,
      publishedTime: post.date,
      authors: [siteConfig.author],
      tags: post.tags,
    },
  };
}

export function generateStaticParams() {
  return listWriting().map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
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
        category: post.tags[0] || "学习笔记",
        body: post.body,
      }}
      backHref="/blog"
      prev={prev ? { title: prev.title, href: `/blog/${prev.slug}` } : undefined}
      next={next ? { title: next.title, href: `/blog/${next.slug}` } : undefined}
    />
  );
}
