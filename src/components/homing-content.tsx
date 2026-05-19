/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { GitBranch, Mail } from "lucide-react";
import { MarkdownView } from "@/components/markdown-view";
import { siteConfig } from "@/lib/site";

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

type HomingPagination = {
  currentPage: number;
  totalPages: number;
  basePath?: string;
};

const HOME_DISPLAY_LIMIT = 5;

export function HomingHomePage({ posts }: { posts: HomingPostItem[] }) {
  const latestPosts = posts.slice(0, HOME_DISPLAY_LIMIT);

  return (
    <main className="homing-page">
      <section className="homing-container">
        <HomingHeader />

        <section className="homing-hero">
          <div className="homing-hero-copy">
            <h1>Hi, I&apos;m Zhihong Wu</h1>
            <p>
              A student of Artificial Intelligence, writing about projects, learning notes, campus life, and small
              experiments that are worth keeping.
            </p>
          </div>
          <img className="homing-avatar" src={siteConfig.avatar} alt="Zhihong Wu" />
        </section>

        <section className="homing-latest">
          <div className="homing-latest-head">
            <h2>Latest</h2>
            <p>Every note is a small checkpoint.</p>
          </div>

          <ul className="homing-list homing-home-list">
            {latestPosts.length === 0 ? <li className="homing-empty">No posts found.</li> : null}
            {latestPosts.map((post) => (
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
                    <Link className="homing-read-more" href={post.href}>
                      Read more -&gt;
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>

          {posts.length > HOME_DISPLAY_LIMIT ? (
            <div className="homing-all-posts">
              <Link href="/blog">All Posts -&gt;</Link>
            </div>
          ) : null}
        </section>

        <HomingFooter />
      </section>
    </main>
  );
}

export function HomingListPage({
  posts,
  tags,
  title,
  subtitle,
  activeTag,
  pagination,
}: {
  posts: HomingPostItem[];
  tags: HomingTagItem[];
  title: string;
  subtitle: string;
  activeTag?: string;
  pagination?: HomingPagination;
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
            {posts.length === 0 ? <li className="homing-empty">No posts found.</li> : null}
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

        {pagination && pagination.totalPages > 1 ? <HomingPagination {...pagination} /> : null}

        <HomingFooter />
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
        <HomingFooter />
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
          </header>

          <div className="homing-article-grid">
            <aside className="homing-article-side">
              <div className="homing-author">
                <img src={siteConfig.avatar} alt="Zhihong Wu" />
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
              <div className="homing-article-actions">
                <Link href={`mailto:${siteConfig.email}?subject=${encodeURIComponent(post.title)}`}>Discuss by Email</Link>
                <span>·</span>
                <Link href={`${siteConfig.siteRepo}/tree/main/content/writing`}>View on GitHub</Link>
              </div>
            </div>
          </div>
        </article>
        <HomingFooter />
      </section>
    </main>
  );
}

function HomingHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className={`homing-header ${compact ? "compact" : ""}`}>
      <Link href="/blog/home">Namranta</Link>
      <nav aria-label="内容导航">
        <Link href="/blog">Blog</Link>
        <Link href="/tags">Tags</Link>
        <Link href="/">Visual</Link>
      </nav>
    </header>
  );
}

function HomingFooter() {
  return (
    <footer className="homing-footer">
      <div className="homing-socials">
        <Link href={`mailto:${siteConfig.email}`} aria-label="Email">
          <Mail size={24} strokeWidth={2.4} />
        </Link>
        <Link href={siteConfig.github} aria-label="GitHub">
          <GitBranch size={24} strokeWidth={2.4} />
        </Link>
      </div>
      <p>
        {siteConfig.author} <span>·</span> © {new Date().getFullYear()} <span>·</span>{" "}
        <Link href="/blog/home">Namranta</Link>
      </p>
    </footer>
  );
}

function HomingPagination({ currentPage, totalPages, basePath = "/blog" }: HomingPagination) {
  const prevPage = currentPage - 1;
  const nextPage = currentPage + 1;
  const pageHref = (page: number) => (page <= 1 ? basePath : `${basePath}/page/${page}`);

  return (
    <nav className="homing-pagination" aria-label="Blog pagination">
      {prevPage >= 1 ? <Link href={pageHref(prevPage)}>Previous</Link> : <span aria-disabled="true">Previous</span>}
      <small>
        {currentPage} of {totalPages}
      </small>
      {nextPage <= totalPages ? <Link href={pageHref(nextPage)}>Next</Link> : <span aria-disabled="true">Next</span>}
    </nav>
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
