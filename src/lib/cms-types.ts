export type PublishStatus = "draft" | "published";

export type ProjectRecord = {
  id: string;
  slug: string;
  name: string;
  type: string;
  time: string;
  summary: string;
  bodyMarkdown: string;
  takeaway: string;
  stack: string[];
  tags: string[];
  imageUrl?: string;
  status: PublishStatus;
  sortOrder: number;
  updatedAt: string;
};

export type SkillRecord = {
  id: string;
  slug: string;
  name: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  tags: string[];
  levelLabel?: string;
  status: PublishStatus;
  sortOrder: number;
  updatedAt: string;
};

export type BlogPostRecord = {
  id: string;
  slug: string;
  title: string;
  date: string;
  summary: string;
  bodyMarkdown: string;
  tags: string[];
  category: string;
  imageUrl?: string;
  status: PublishStatus;
  sortOrder: number;
  updatedAt: string;
};

export type CmsContent = {
  projects: ProjectRecord[];
  skills: SkillRecord[];
  posts: BlogPostRecord[];
};
