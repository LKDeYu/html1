import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownView } from "@/components/markdown-view";
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
    <main className="writing-page">
      <article className="writing-article">
        <aside>
          <Link href="/writing">Back to posts</Link>
          <time dateTime={post.date}>{post.date}</time>
          <div className="writing-tags">
            {post.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </aside>

        <div className="writing-article-main">
          <header>
            <h1>{post.title}</h1>
            <p>{post.summary}</p>
          </header>

          <MarkdownView>{post.body}</MarkdownView>

          <nav className="writing-nav" aria-label="文章导航">
            {prev ? <Link href={`/writing/${prev.slug}`}>Previous: {prev.title}</Link> : <span />}
            {next ? <Link href={`/writing/${next.slug}`}>Next: {next.title}</Link> : <span />}
          </nav>
        </div>
      </article>
    </main>
  );
}
