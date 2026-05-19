import fs from "node:fs";
import path from "node:path";

export type WritingRecord = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  body: string;
};

const WRITING_DIR = path.join(process.cwd(), "content", "writing");

function parseArray(value: string | undefined) {
  if (!value) {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed.replaceAll("'", "\""));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function stripQuotes(value: string | undefined) {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}

function parseMdx(raw: string, slug: string): WritingRecord {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const frontmatter = match?.[1] ?? "";
  const body = (match?.[2] ?? raw).trim();
  const meta = new Map<string, string>();

  frontmatter.split(/\r?\n/).forEach((line) => {
    const divider = line.indexOf(":");
    if (divider === -1) {
      return;
    }

    meta.set(line.slice(0, divider).trim(), line.slice(divider + 1).trim());
  });

  return {
    slug,
    title: stripQuotes(meta.get("title")) || slug,
    date: stripQuotes(meta.get("date")) || "2026-05-18",
    summary: stripQuotes(meta.get("summary")),
    tags: parseArray(meta.get("tags")),
    body,
  };
}

export function listWriting() {
  if (!fs.existsSync(WRITING_DIR)) {
    return [];
  }

  return fs
    .readdirSync(WRITING_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(WRITING_DIR, file), "utf8");
      return parseMdx(raw, slug);
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, "zh-CN"));
}

export function getWritingBySlug(slug: string) {
  return listWriting().find((post) => post.slug === slug) ?? null;
}

export function listWritingTags() {
  const counts = new Map<string, number>();

  listWriting().forEach((post) => {
    post.tags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "zh-CN"));
}
