export const siteConfig = {
  name: "NAMRANTA",
  title: "NAMRANTA | Zhihong Wu",
  author: "Zhihong Wu",
  description: "吴志宏的 AI 学习、项目作品集、博客笔记与校园生活记录。",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3001",
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
