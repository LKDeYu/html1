import Link from "next/link";
import type { Metadata } from "next";
import { listWriting } from "@/lib/writing";

export const metadata: Metadata = {
  title: "Writing | NAMRANTA",
  description: "吴志宏的项目、笔记和复盘内容归档。",
};

export default function WritingPage() {
  const posts = listWriting();

  return (
    <main className="writing-page">
      <section className="writing-container">
        <header className="writing-header">
          <Link href="/">NAMRANTA</Link>
          <h1>All Posts</h1>
          <p>项目、学习笔记和工程复盘放在同一种格式里，作为视觉首页之外的文字内容站。</p>
        </header>

        <ul className="writing-list">
          {posts.map((post) => (
            <li key={post.slug}>
              <article>
                <time dateTime={post.date}>{post.date}</time>
                <div>
                  <h2>
                    <Link href={`/writing/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p>{post.summary}</p>
                  <div className="writing-tags">
                    {post.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
