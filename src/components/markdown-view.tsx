"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownViewProps = {
  children: string;
};

export function MarkdownView({ children }: MarkdownViewProps) {
  return (
    <div className="markdown-view">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children || "暂无详细内容。"}</ReactMarkdown>
    </div>
  );
}
