import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NAMRANTA | Zhihong Wu",
  description: "吴志宏的 AI 学习、项目作品集、博客笔记与校园生活记录。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full scroll-smooth">
      <body>{children}</body>
    </html>
  );
}
