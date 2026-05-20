export const siteConfig = {
  name: "Coordinate Zero",
  title: "Coordinate Zero",
  author: "Namranta",
  description: "探索数字花园",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3001",
  email: "yuany257093418@gmail.com",
  github: "https://github.com/LKDeYu",
  siteRepo: "https://github.com/LKDeYu/website_draft",
  avatar: "/avatar.png",
};

export const blogConfig = {
  name: "止水无波",
  description: "平静如水，深邃如海",
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}
