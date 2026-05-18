/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownView } from "@/components/markdown-view";
import { StarfieldCanvas } from "@/components/starfield-canvas";
import { getBlogPostBySlug, listBlogPosts, slugify } from "@/lib/cms-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const posts = listBlogPosts();
  const index = posts.findIndex((item) => item.slug === post.slug);
  const prev = posts[index + 1];
  const next = posts[index - 1];

  return (
    <>
      <StarfieldCanvas />
      <main className="content-page article-page">
        <article className="article-shell">
          <aside className="article-aside">
            <Link className="content-back-link" href="/blog">返回博客</Link>
            <div>
              <span>Category</span>
              <strong>{post.category || "学习笔记"}</strong>
            </div>
            <div>
              <span>Date</span>
              <time dateTime={post.date}>{post.date}</time>
            </div>
            <div className="post-tags">
              {post.tags.map((tag) => (
                <Link href={`/tags/${slugify(tag)}`} key={tag}>{tag}</Link>
              ))}
            </div>
          </aside>

          <div className="article-main">
            <header className="article-header">
              <p className="section-kicker">Blog</p>
              <h1>{post.title}</h1>
              <p>{post.summary}</p>
            </header>

            {post.imageUrl ? <img className="article-cover" src={post.imageUrl} alt="" /> : null}
            <MarkdownView>{post.bodyMarkdown}</MarkdownView>

            <nav className="article-nav" aria-label="文章导航">
              {prev ? <Link href={`/blog/${prev.slug}`}>上一篇：{prev.title}</Link> : <span />}
              {next ? <Link href={`/blog/${next.slug}`}>下一篇：{next.title}</Link> : <span />}
            </nav>
          </div>
        </article>
      </main>
    </>
  );
}
