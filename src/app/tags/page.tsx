import type { Metadata } from "next";
import { HomingTagsPage } from "@/components/homing-content";
import { blogConfig } from "@/lib/site";
import { listWritingTags, slugifyWritingTag } from "@/lib/writing";

export const metadata: Metadata = {
  title: `Tags | ${blogConfig.name}`,
  description: blogConfig.description,
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
