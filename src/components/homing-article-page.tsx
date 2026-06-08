import Image from "next/image";
import Link from "next/link";
import { MarkdownView } from "@/components/markdown-view";
import { WalineComments } from "@/components/waline-comments";
import { blogConfig, siteConfig } from "@/lib/site";
import { slugifyTag } from "@/components/homing-content";

type HomingArticle = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category?: string;
  body: string;
  imageUrl?: string;
};

type HomingArticlePageProps = {
  post: HomingArticle;
  backHref: string;
  commentPath?: string;
  prev?: { title: string; href: string };
  next?: { title: string; href: string };
};

export function HomingArticlePage({ post, backHref, commentPath, prev, next }: HomingArticlePageProps) {
  return (
    <main className="homing-page">
      <section className="homing-container">
        <header className="homing-header">
          <Link href="/blog/home" prefetch={false}>
            {blogConfig.name}
          </Link>
          <nav aria-label="Content navigation">
            <Link href="/blog" prefetch={false}>
              Blog
            </Link>
            <Link href="/tags" prefetch={false}>
              Tags
            </Link>
            <Link href="/" prefetch={false}>
              Visual
            </Link>
          </nav>
        </header>

        <article className="homing-article">
          <header className="homing-article-header">
            <dl>
              <dt>Published on</dt>
              <dd>
                <time dateTime={post.date}>{formatDate(post.date)}</time>
              </dd>
            </dl>
            <h1>{post.title}</h1>
          </header>

          <div className="homing-article-grid">
            <aside className="homing-article-side">
              <div className="homing-author">
                <Image src={siteConfig.avatar} alt="Zhihong Wu" width={64} height={64} />
                <dl>
                  <dt>Author</dt>
                  <dd>{siteConfig.author}</dd>
                  <dd>Student of Artificial Intelligence</dd>
                </dl>
              </div>

              <dl>
                <dt>Tags</dt>
                <dd className="homing-tags">
                  {(post.tags.length > 0 ? post.tags : [post.category ?? "note"]).map((tag) => (
                    <Link href={`/tags/${slugifyTag(tag)}`} prefetch={false} key={tag}>
                      {tag}
                    </Link>
                  ))}
                </dd>
              </dl>

              {(prev || next) && (
                <nav aria-label="Article navigation">
                  {prev ? (
                    <div>
                      <h2>Previous Article</h2>
                      <Link href={prev.href} prefetch={false}>
                        {prev.title}
                      </Link>
                    </div>
                  ) : null}
                  {next ? (
                    <div>
                      <h2>Next Article</h2>
                      <Link href={next.href} prefetch={false}>
                        {next.title}
                      </Link>
                    </div>
                  ) : null}
                </nav>
              )}

              <Link className="homing-back" href={backHref} aria-label="Back to the blog" prefetch={false}>
                Back to the blog
              </Link>
            </aside>

            <div className="homing-article-main">
              {post.imageUrl ? (
                <Image
                  className="homing-cover"
                  src={post.imageUrl}
                  alt=""
                  width={1200}
                  height={720}
                  sizes="(max-width: 900px) 100vw, 760px"
                />
              ) : null}
              <MarkdownView>{post.body}</MarkdownView>
              {commentPath ? <WalineComments path={commentPath} /> : null}
              <div className="homing-article-actions">
                <Link href={`mailto:${siteConfig.email}?subject=${encodeURIComponent(post.title)}`} prefetch={false}>
                  Discuss by Email
                </Link>
                <span>/</span>
                <Link href={`${siteConfig.siteRepo}/tree/main/content/writing`} prefetch={false}>
                  View on GitHub
                </Link>
              </div>
            </div>
          </div>
        </article>

        <footer className="homing-footer">
          <p>
            {siteConfig.author} <span>/</span> {new Date().getFullYear()} <span>/</span>{" "}
            <Link href="/blog/home" prefetch={false}>
              {blogConfig.name}
            </Link>
          </p>
        </footer>
      </section>
    </main>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}
