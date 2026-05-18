import Link from "next/link";
import type { Metadata } from "next";
import { StarfieldCanvas } from "@/components/starfield-canvas";
import { listBlogPosts, listBlogTags, slugify } from "@/lib/cms-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog | NAMRANTA",
  description: "吴志宏的学习笔记、项目复盘和工程记录。",
};

type BlogPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    year?: string;
  }>;
};

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function matchesQuery(post: ReturnType<typeof listBlogPosts>[number], query: string) {
  if (!query) {
    return true;
  }

  const haystack = [post.title, post.summary, post.category, post.tags.join(" "), post.bodyMarkdown].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function filterHref(params: { q?: string; category?: string; year?: string }) {
  const nextParams = new URLSearchParams();

  if (params.q) {
    nextParams.set("q", params.q);
  }

  if (params.category) {
    nextParams.set("category", params.category);
  }

  if (params.year) {
    nextParams.set("year", params.year);
  }

  const query = nextParams.toString();
  return query ? `/blog?${query}` : "/blog";
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const query = String(params?.q ?? "").trim();
  const selectedCategory = String(params?.category ?? "").trim();
  const selectedYear = String(params?.year ?? "").trim();
  const allPosts = listBlogPosts();
  const posts = allPosts.filter((post) => {
    const year = post.date.slice(0, 4);
    return (
      matchesQuery(post, query) &&
      (!selectedCategory || post.category === selectedCategory) &&
      (!selectedYear || year === selectedYear)
    );
  });
  const tags = listBlogTags();
  const categories = uniqueValues(allPosts.map((post) => post.category || "学习笔记"));
  const years = uniqueValues(allPosts.map((post) => post.date.slice(0, 4))).reverse();
  const hasFilters = Boolean(query || selectedCategory || selectedYear);

  return (
    <>
      <StarfieldCanvas />
      <main className="content-page blog-page">
        <header className="content-hero">
          <Link className="content-back-link" href="/">返回首页</Link>
          <p className="section-kicker">Blog / 学习笔记</p>
          <h1>把学习过程写成可以回看的文章。</h1>
          <p>这里记录算法、AI、项目实践和工程运行中的关键笔记，尽量把问题、方法和复盘放在同一篇文章里。</p>
        </header>

        <section className="content-layout">
          <aside className="content-sidebar">
            <form className="blog-filter-form" action="/blog">
              <label htmlFor="blog-search">Search</label>
              <div className="blog-search-row">
                <input id="blog-search" name="q" placeholder="关键词" type="search" defaultValue={query} />
                <button type="submit">搜索</button>
              </div>

              {selectedCategory ? <input name="category" type="hidden" value={selectedCategory} /> : null}
              {selectedYear ? <input name="year" type="hidden" value={selectedYear} /> : null}
            </form>

            <h2>Categories</h2>
            <div className="filter-stack">
              <Link className={!selectedCategory ? "active" : ""} href={filterHref({ q: query, year: selectedYear })}>
                全部分类
              </Link>
              {categories.map((category) => (
                <Link
                  className={selectedCategory === category ? "active" : ""}
                  href={filterHref({ q: query, category, year: selectedYear })}
                  key={category}
                >
                  {category}
                </Link>
              ))}
            </div>

            <h2>Archive</h2>
            <div className="filter-stack">
              <Link className={!selectedYear ? "active" : ""} href={filterHref({ q: query, category: selectedCategory })}>
                全部年份
              </Link>
              {years.map((year) => (
                <Link
                  className={selectedYear === year ? "active" : ""}
                  href={filterHref({ q: query, category: selectedCategory, year })}
                  key={year}
                >
                  {year}
                </Link>
              ))}
            </div>

            <h2>Tags</h2>
            <div className="tag-cloud">
              {tags.map((tag) => (
                <Link href={`/tags/${tag.slug}`} key={tag.slug}>
                  {tag.label}<span>{tag.count}</span>
                </Link>
              ))}
            </div>

            <Link className="rss-link" href="/rss.xml">
              RSS
            </Link>
          </aside>

          <div className="post-list">
            {hasFilters ? (
              <div className="filter-summary">
                <strong>{posts.length}</strong>
                <span>篇文章符合当前筛选</span>
                <Link href="/blog">清除筛选</Link>
              </div>
            ) : null}

            {posts.length > 0 ? (
              posts.map((post) => (
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
              ))
            ) : (
              <article className="post-list-card empty-state">
                <div className="post-list-meta">
                  <span>No results</span>
                </div>
                <h2>没有找到匹配文章。</h2>
                <p>换一个关键词，或清除分类和年份筛选再试一次。</p>
                <Link className="content-back-link" href="/blog">清除筛选</Link>
              </article>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
