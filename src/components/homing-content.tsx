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
  activeTag,
}: {
  posts: HomingPostItem[];
  tags: HomingTagItem[];
  title: string;
  subtitle: string;
  activeTag?: string;
}) {
  return (
    <main className="homing-page">
      <section className="homing-container">
        <HomingHeader />

        <div className="homing-mobile-title">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <div className="homing-layout">
          <aside className="homing-sidebar" aria-label="Tags">
            <div className="homing-sidebar-inner">
              {!activeTag ? (
                <h3>All Posts</h3>
              ) : (
                <Link className="homing-sidebar-all" href="/blog">
                  All Posts
                </Link>
              )}
              <ul>
                {tags.map((tag) => (
                  <li key={tag.label}>
                    {activeTag === tag.label ? (
                      <h3>{`${tag.label} (${tag.count})`}</h3>
                    ) : tag.href ? (
                      <Link href={tag.href} aria-label={`View posts tagged ${tag.label}`}>
                        {`${tag.label} (${tag.count})`}
                      </Link>
                    ) : (
                      <span>{`${tag.label} (${tag.count})`}</span>
                    )}
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
                        <Link href={`/tags/${slugifyTag(tag)}`} key={tag}>
                          {tag}
                        </Link>
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

export function HomingTagsPage({ tags }: { tags: HomingTagItem[] }) {
  return (
    <main className="homing-page">
      <section className="homing-container">
        <HomingHeader />
        <div className="homing-tags-index">
          <div>
            <h1>Tags</h1>
          </div>
          <div className="homing-tags-cloud">
            {tags.length === 0 ? <p>No tags found.</p> : null}
            {tags.map((tag) => (
              <div key={tag.label}>
                <Link href={tag.href ?? `/tags/${slugifyTag(tag.label)}`}>{tag.label}</Link>
                <Link
                  className="homing-tag-count"
                  href={tag.href ?? `/tags/${slugifyTag(tag.label)}`}
                  aria-label={`View posts tagged ${tag.label}`}
                >
                  {` (${tag.count})`}
                </Link>
              </div>
            ))}
          </div>
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
      <section className="homing-container">
        <HomingHeader />
        <article className="homing-article">
          <header className="homing-article-header">
            <dl>
              <dt>Published on</dt>
              <dd>
                <time dateTime={post.date}>{formatDate(post.date)}</time>
              </dd>
            </dl>
            <h1>{post.title}</h1>
            {post.summary ? <p>{post.summary}</p> : null}
          </header>

          <div className="homing-article-grid">
            <aside className="homing-article-side">
              <dl>
                <dt>Tags</dt>
                <dd className="homing-tags">
                  {(post.tags.length > 0 ? post.tags : [post.category ?? "note"]).map((tag) => (
                    <Link href={`/tags/${slugifyTag(tag)}`} key={tag}>
                      {tag}
                    </Link>
                  ))}
                </dd>
              </dl>

              {(prev || next) && (
                <nav aria-label="文章导航">
                  {prev ? (
                    <div>
                      <h2>Previous Article</h2>
                      <Link href={prev.href}>{prev.title}</Link>
                    </div>
                  ) : null}
                  {next ? (
                    <div>
                      <h2>Next Article</h2>
                      <Link href={next.href}>{next.title}</Link>
                    </div>
                  ) : null}
                </nav>
              )}

              <Link className="homing-back" href={backHref} aria-label="Back to the blog">
                Back to the blog
              </Link>
            </aside>

            <div className="homing-article-main">
              {post.imageUrl ? <img className="homing-cover" src={post.imageUrl} alt="" /> : null}
              <MarkdownView>{post.body}</MarkdownView>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

function HomingHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className={`homing-header ${compact ? "compact" : ""}`}>
      <Link href="/">Namranta</Link>
      <nav aria-label="内容导航">
        <Link href="/blog">Blog</Link>
        <Link href="/tags">Tags</Link>
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

function slugifyTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
