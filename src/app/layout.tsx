import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NAMRANTA | Zhihong Wu",
  description: "吴志宏的 AI 学习、项目作品集与云计算部署个人网站。",
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
