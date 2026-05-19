import Link from "next/link";
import { MarkdownView } from "@/components/markdown-view";

type HomingPostItem = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category?: string;
  href: string;
};

type HomingTagItem = {
  label: string;
  count: number;
  href?: string;
};

type HomingArticle = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category?: string;
  body: string;
  imageUrl?: string;
};

export function HomingListPage({
  posts,
  tags,
  title,
  subtitle,
}: {
  posts: HomingPostItem[];
  tags: HomingTagItem[];
  title: string;
  subtitle: string;
}) {
  return (
    <main className="homing-page">
      <section className="homing-container">
        <HomingHeader />

        <form className="homing-search" action="/blog">
          <label>
            <span>Search articles</span>
            <input aria-label="Search articles" name="q" placeholder="Search articles" type="search" />
          </label>
        </form>

        <div className="homing-layout">
          <aside className="homing-sidebar" aria-label="Tags">
            <h1>{title}</h1>
            <p>{subtitle}</p>
            <div>
              <strong>Tags</strong>
              <ul>
                {tags.map((tag) => (
                  <li key={tag.label}>
                    {tag.href ? <Link href={tag.href}>{tag.label}</Link> : <span>{tag.label}</span>}
                    <em>{tag.count}</em>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <ul className="homing-list">
            {posts.map((post) => (
              <li key={post.slug}>
                <article>
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <div>
                    <h2>
                      <Link href={post.href}>{post.title}</Link>
                    </h2>
                    <div className="homing-tags">
                      {(post.tags.length > 0 ? post.tags : [post.category ?? "note"]).map((tag) => (
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

export function HomingArticlePage({
  post,
  backHref,
  prev,
  next,
}: {
  post: HomingArticle;
  backHref: string;
  prev?: { title: string; href: string };
  next?: { title: string; href: string };
}) {
  return (
    <main className="homing-page">
      <article className="homing-article">
        <aside>
          <Link href={backHref}>Back to posts</Link>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <div className="homing-tags">
            {(post.tags.length > 0 ? post.tags : [post.category ?? "note"]).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </aside>

        <div className="homing-article-main">
          <HomingHeader compact />
          <header>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <h1>{post.title}</h1>
            <p>{post.summary}</p>
          </header>

          {post.imageUrl ? <img className="homing-cover" src={post.imageUrl} alt="" /> : null}
          <MarkdownView>{post.body}</MarkdownView>

          <nav className="homing-nav" aria-label="文章导航">
            {prev ? <Link href={prev.href}>Previous: {prev.title}</Link> : <span />}
            {next ? <Link href={next.href}>Next: {next.title}</Link> : <span />}
          </nav>
        </div>
      </article>
    </main>
  );
}

function HomingHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className={`homing-header ${compact ? "compact" : ""}`}>
      <Link href="/">Namranta</Link>
      <nav aria-label="内容导航">
        <Link href="/blog">Blog</Link>
        <Link href="/writing">Writing</Link>
        <Link href="/">Visual</Link>
      </nav>
    </header>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}
