import Link from "next/link";
import type { Metadata } from "next";
import { listWriting, listWritingTags } from "@/lib/writing";

export const metadata: Metadata = {
  title: "Writing | NAMRANTA",
  description: "吴志宏的项目、笔记和复盘内容归档。",
};

export default function WritingPage() {
  const posts = listWriting();
  const tags = listWritingTags();

  return (
    <main className="writing-page">
      <section className="writing-container">
        <header className="writing-header">
          <Link href="/">Namranta</Link>
          <nav aria-label="内容导航">
            <Link href="/writing">Blog</Link>
            <Link href="/">Visual</Link>
          </nav>
        </header>

        <div className="writing-layout">
          <aside className="writing-sidebar" aria-label="Tags">
            <h1>All Posts</h1>
            <div>
              <strong>Tags</strong>
              <ul>
                {tags.map((tag) => (
                  <li key={tag.label}>
                    <span>{tag.label}</span>
                    <em>{tag.count}</em>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <ul className="writing-list">
            {posts.map((post) => (
              <li key={post.slug}>
                <article>
                  <time dateTime={post.date}>{post.date}</time>
                  <div>
                    <h2>
                      <Link href={`/writing/${post.slug}`}>{post.title}</Link>
                    </h2>
                    <div className="writing-tags">
                      {post.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <p>{post.summary}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
