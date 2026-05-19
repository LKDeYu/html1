import Link from "next/link";
import { notFound } from "next/navigation";
import { listBlogPosts, listBlogTags, slugify } from "@/lib/cms-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TagPageProps = {
  params: Promise<{ tag: string }>;
};

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const tagInfo = listBlogTags().find((item) => item.slug === tag);

  if (!tagInfo) {
    notFound();
  }

  const posts = listBlogPosts({ tag });

  return (
      <main className="content-page blog-page">
        <header className="content-hero">
          <Link className="content-back-link" href="/tags">全部标签</Link>
          <p className="section-kicker">Tag / {tagInfo.label}</p>
          <h1>{tagInfo.label}</h1>
          <p>共 {tagInfo.count} 篇文章。</p>
        </header>

        <section className="post-list tag-post-list">
          {posts.map((post) => (
            <article className="post-list-card" key={post.id}>
              <div className="post-list-meta">
                <span>{post.category || "学习笔记"}</span>
                <time dateTime={post.date}>{post.date}</time>
              </div>
              <h2>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p>{post.summary}</p>
              <div className="post-tags">
                {post.tags.map((item) => (
                  <Link href={`/tags/${slugify(item)}`} key={item}>{item}</Link>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>
  );
}
