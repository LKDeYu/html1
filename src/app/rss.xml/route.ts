import { listBlogPosts } from "@/lib/cms-db";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRssDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

export function GET() {
  const posts = listBlogPosts();
  const latestDate = posts[0]?.date ? toRssDate(posts[0].date) : new Date().toUTCString();
  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`);
      const categories = post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("");

      return `
        <item>
          <title>${escapeXml(post.title)}</title>
          <link>${url}</link>
          <guid>${url}</guid>
          <pubDate>${toRssDate(post.date)}</pubDate>
          <description>${escapeXml(post.summary)}</description>
          ${categories}
        </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>${escapeXml(siteConfig.title)}</title>
        <link>${absoluteUrl("/")}</link>
        <description>${escapeXml(siteConfig.description)}</description>
        <language>zh-CN</language>
        <lastBuildDate>${latestDate}</lastBuildDate>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
