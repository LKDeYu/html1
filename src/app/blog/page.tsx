import Link from "next/link";
import { StarfieldCanvas } from "@/components/starfield-canvas";
import { listBlogPosts, listBlogTags, slugify } from "@/lib/cms-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function BlogPage() {
  const posts = listBlogPosts();
  const tags = listBlogTags();

  return (
    <>
      <StarfieldCanvas />
      <main className="content-page blog-page">
        <header className="content-hero">
          <Link className="content-back-link" href="/">返回首页</Link>
          <p className="section-kicker">Blog / 学习笔记</p>
          <h1>把学习过程写成可以回看的文章。</h1>
          <p>这里会记录算法、AI、项目实践和工程部署中的关键笔记。文章来自后台 Markdown 编辑，发布后会自动出现在这个列表里。</p>
        </header>

        <section className="content-layout">
          <aside className="content-sidebar">
            <h2>Tags</h2>
            <div className="tag-cloud">
              {tags.map((tag) => (
                <Link href={`/tags/${tag.slug}`} key={tag.slug}>
                  {tag.label}<span>{tag.count}</span>
                </Link>
              ))}
            </div>
          </aside>

          <div className="post-list">
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
                  {post.tags.map((tag) => (
                    <Link href={`/tags/${slugify(tag)}`} key={tag}>{tag}</Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
