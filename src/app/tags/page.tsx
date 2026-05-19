import Link from "next/link";
import { listBlogTags } from "@/lib/cms-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function TagsPage() {
  const tags = listBlogTags();

  return (
      <main className="content-page tags-page">
        <header className="content-hero">
          <Link className="content-back-link" href="/blog">返回博客</Link>
          <p className="section-kicker">Tags / 标签</p>
          <h1>按主题回看文章。</h1>
          <p>标签会根据已发布文章自动聚合，适合把算法、AI、项目和工程记录分开阅读。</p>
        </header>

        <section className="tag-index">
          {tags.map((tag) => (
            <Link href={`/tags/${tag.slug}`} key={tag.slug}>
              <strong>{tag.label}</strong>
              <span>{tag.count} 篇</span>
            </Link>
          ))}
        </section>
      </main>
  );
}
