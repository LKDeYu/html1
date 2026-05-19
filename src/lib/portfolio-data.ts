import { defaultProjects, defaultSkills } from "@/lib/portfolio-seed";
import type { ProjectRecord, SkillRecord } from "@/lib/portfolio-types";

function bySortOrder<T extends { sortOrder: number }>(a: T, b: T) {
  return a.sortOrder - b.sortOrder;
}

export function listProjects(options: { includeDrafts?: boolean } = {}): ProjectRecord[] {
  return defaultProjects
    .filter((project) => options.includeDrafts || project.status === "published")
    .slice()
    .sort(bySortOrder);
}

export function getProjectBySlug(slug: string, options: { includeDrafts?: boolean } = {}) {
  return listProjects(options).find((project) => project.slug === slug) ?? null;
}

export function listSkills(options: { includeDrafts?: boolean } = {}): SkillRecord[] {
  return defaultSkills
    .filter((skill) => options.includeDrafts || skill.status === "published")
    .slice()
    .sort(bySortOrder);
}

export function getSkillBySlug(slug: string, options: { includeDrafts?: boolean } = {}) {
  return listSkills(options).find((skill) => skill.slug === slug) ?? null;
}
