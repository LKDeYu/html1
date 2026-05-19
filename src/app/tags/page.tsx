import type { Metadata } from "next";
import { HomingTagsPage } from "@/components/homing-content";
import { listWritingTags, slugifyWritingTag } from "@/lib/writing";

export const metadata: Metadata = {
  title: "Tags | NAMRANTA",
  description: "按标签浏览吴志宏的项目、学习笔记和工程复盘。",
};

export default function TagsPage() {
  const tags = listWritingTags();

  return (
    <HomingTagsPage
      tags={tags.map((tag) => ({
        label: tag.label,
        count: tag.count,
        href: `/tags/${slugifyWritingTag(tag.label)}`,
      }))}
    />
  );
}
