import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { defaultProjects, defaultSkills } from "@/lib/cms-seed";
import type { ProjectRecord, PublishStatus, SkillRecord } from "@/lib/cms-types";

type ProjectRow = Omit<ProjectRecord, "stack" | "tags"> & {
  stack: string;
  tags: string;
};

type SkillRow = Omit<SkillRecord, "tags"> & {
  tags: string;
};

type ProjectInput = Partial<Omit<ProjectRecord, "id" | "updatedAt">>;
type SkillInput = Partial<Omit<SkillRecord, "id" | "updatedAt">>;

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "site.db");

let db: Database.Database | null = null;

function jsonArray(value: unknown): string {
  if (!Array.isArray(value)) {
    return "[]";
  }

  return JSON.stringify(value.map((item) => String(item).trim()).filter(Boolean));
}

function parseArray(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function normalizeStatus(value: unknown): PublishStatus {
  return value === "draft" ? "draft" : "published";
}

export function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `item-${Date.now()}`;
}

function projectFromRow(row: ProjectRow): ProjectRecord {
  return {
    ...row,
    stack: parseArray(row.stack),
    tags: parseArray(row.tags),
    imageUrl: row.imageUrl || undefined,
  };
}

function skillFromRow(row: SkillRow): SkillRecord {
  return {
    ...row,
    tags: parseArray(row.tags),
    levelLabel: row.levelLabel || undefined,
  };
}

function getDb() {
  if (db) {
    return db;
  }

  mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT '',
      time TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      bodyMarkdown TEXT NOT NULL DEFAULT '',
      takeaway TEXT NOT NULL DEFAULT '',
      stack TEXT NOT NULL DEFAULT '[]',
      tags TEXT NOT NULL DEFAULT '[]',
      imageUrl TEXT,
      status TEXT NOT NULL DEFAULT 'published',
      sortOrder INTEGER NOT NULL DEFAULT 0,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      bodyMarkdown TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      levelLabel TEXT,
      status TEXT NOT NULL DEFAULT 'published',
      sortOrder INTEGER NOT NULL DEFAULT 0,
      updatedAt TEXT NOT NULL
    );
  `);
  seedIfEmpty(db);
  return db;
}

function seedIfEmpty(database: Database.Database) {
  const projectCount = database.prepare("SELECT COUNT(*) as count FROM projects").get() as { count: number };
  const skillCount = database.prepare("SELECT COUNT(*) as count FROM skills").get() as { count: number };

  if (projectCount.count === 0) {
    const insertProject = database.prepare(`
      INSERT INTO projects (
        id, slug, name, type, time, summary, bodyMarkdown, takeaway, stack, tags,
        imageUrl, status, sortOrder, updatedAt
      ) VALUES (
        @id, @slug, @name, @type, @time, @summary, @bodyMarkdown, @takeaway, @stack, @tags,
        @imageUrl, @status, @sortOrder, @updatedAt
      )
    `);
    const seedProjects = database.transaction(() => {
      defaultProjects.forEach((project) => {
        insertProject.run({
          ...project,
          stack: jsonArray(project.stack),
          tags: jsonArray(project.tags),
          imageUrl: project.imageUrl ?? null,
        });
      });
    });
    seedProjects();
  }

  if (skillCount.count === 0) {
    const insertSkill = database.prepare(`
      INSERT INTO skills (
        id, slug, name, title, summary, bodyMarkdown, tags, levelLabel, status, sortOrder, updatedAt
      ) VALUES (
        @id, @slug, @name, @title, @summary, @bodyMarkdown, @tags, @levelLabel, @status, @sortOrder, @updatedAt
      )
    `);
    const seedSkills = database.transaction(() => {
      defaultSkills.forEach((skill) => {
        insertSkill.run({
          ...skill,
          tags: jsonArray(skill.tags),
          levelLabel: skill.levelLabel ?? null,
        });
      });
    });
    seedSkills();
  }
}

export function listProjects(options: { includeDrafts?: boolean } = {}) {
  const database = getDb();
  const sql = options.includeDrafts
    ? "SELECT * FROM projects ORDER BY sortOrder ASC, updatedAt DESC"
    : "SELECT * FROM projects WHERE status = 'published' ORDER BY sortOrder ASC, updatedAt DESC";
  return (database.prepare(sql).all() as ProjectRow[]).map(projectFromRow);
}

export function getProjectBySlug(slug: string, options: { includeDrafts?: boolean } = {}) {
  const database = getDb();
  const sql = options.includeDrafts
    ? "SELECT * FROM projects WHERE slug = ?"
    : "SELECT * FROM projects WHERE slug = ? AND status = 'published'";
  const row = database.prepare(sql).get(slug) as ProjectRow | undefined;
  return row ? projectFromRow(row) : null;
}

export function createProject(input: ProjectInput) {
  const database = getDb();
  const now = new Date().toISOString();
  const name = String(input.name ?? "Untitled Project").trim() || "Untitled Project";
  const project: ProjectRecord = {
    id: randomUUID(),
    slug: slugify(String(input.slug ?? name)),
    name,
    type: String(input.type ?? "Project"),
    time: String(input.time ?? ""),
    summary: String(input.summary ?? ""),
    bodyMarkdown: String(input.bodyMarkdown ?? ""),
    takeaway: String(input.takeaway ?? ""),
    stack: Array.isArray(input.stack) ? input.stack.map(String).filter(Boolean) : [],
    tags: Array.isArray(input.tags) ? input.tags.map(String).filter(Boolean) : [],
    imageUrl: input.imageUrl ? String(input.imageUrl) : undefined,
    status: normalizeStatus(input.status),
    sortOrder: Number(input.sortOrder ?? 100),
    updatedAt: now,
  };

  database
    .prepare(`
      INSERT INTO projects (
        id, slug, name, type, time, summary, bodyMarkdown, takeaway, stack, tags,
        imageUrl, status, sortOrder, updatedAt
      ) VALUES (
        @id, @slug, @name, @type, @time, @summary, @bodyMarkdown, @takeaway, @stack, @tags,
        @imageUrl, @status, @sortOrder, @updatedAt
      )
    `)
    .run({
      ...project,
      stack: jsonArray(project.stack),
      tags: jsonArray(project.tags),
      imageUrl: project.imageUrl ?? null,
    });

  return project;
}

export function updateProject(id: string, input: ProjectInput) {
  const database = getDb();
  const current = database.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
  if (!current) {
    return null;
  }

  const updated: ProjectRecord = {
    ...projectFromRow(current),
    ...input,
    slug: slugify(String(input.slug ?? current.slug)),
    stack: Array.isArray(input.stack) ? input.stack.map(String).filter(Boolean) : parseArray(current.stack),
    tags: Array.isArray(input.tags) ? input.tags.map(String).filter(Boolean) : parseArray(current.tags),
    imageUrl: input.imageUrl ? String(input.imageUrl) : undefined,
    status: normalizeStatus(input.status ?? current.status),
    sortOrder: Number(input.sortOrder ?? current.sortOrder),
    updatedAt: new Date().toISOString(),
  };

  database
    .prepare(`
      UPDATE projects SET
        slug = @slug,
        name = @name,
        type = @type,
        time = @time,
        summary = @summary,
        bodyMarkdown = @bodyMarkdown,
        takeaway = @takeaway,
        stack = @stack,
        tags = @tags,
        imageUrl = @imageUrl,
        status = @status,
        sortOrder = @sortOrder,
        updatedAt = @updatedAt
      WHERE id = @id
    `)
    .run({
      ...updated,
      stack: jsonArray(updated.stack),
      tags: jsonArray(updated.tags),
      imageUrl: updated.imageUrl ?? null,
    });

  return updated;
}

export function deleteProject(id: string) {
  const database = getDb();
  const result = database.prepare("DELETE FROM projects WHERE id = ?").run(id);
  return result.changes > 0;
}

export function listSkills(options: { includeDrafts?: boolean } = {}) {
  const database = getDb();
  const sql = options.includeDrafts
    ? "SELECT * FROM skills ORDER BY sortOrder ASC, updatedAt DESC"
    : "SELECT * FROM skills WHERE status = 'published' ORDER BY sortOrder ASC, updatedAt DESC";
  return (database.prepare(sql).all() as SkillRow[]).map(skillFromRow);
}

export function getSkillBySlug(slug: string, options: { includeDrafts?: boolean } = {}) {
  const database = getDb();
  const sql = options.includeDrafts
    ? "SELECT * FROM skills WHERE slug = ?"
    : "SELECT * FROM skills WHERE slug = ? AND status = 'published'";
  const row = database.prepare(sql).get(slug) as SkillRow | undefined;
  return row ? skillFromRow(row) : null;
}

export function createSkill(input: SkillInput) {
  const database = getDb();
  const now = new Date().toISOString();
  const title = String(input.title ?? "Skill").trim() || "Skill";
  const skill: SkillRecord = {
    id: randomUUID(),
    slug: slugify(String(input.slug ?? title)),
    name: String(input.name ?? title),
    title,
    summary: String(input.summary ?? ""),
    bodyMarkdown: String(input.bodyMarkdown ?? ""),
    tags: Array.isArray(input.tags) ? input.tags.map(String).filter(Boolean) : [],
    levelLabel: input.levelLabel ? String(input.levelLabel) : undefined,
    status: normalizeStatus(input.status),
    sortOrder: Number(input.sortOrder ?? 100),
    updatedAt: now,
  };

  database
    .prepare(`
      INSERT INTO skills (
        id, slug, name, title, summary, bodyMarkdown, tags, levelLabel, status, sortOrder, updatedAt
      ) VALUES (
        @id, @slug, @name, @title, @summary, @bodyMarkdown, @tags, @levelLabel, @status, @sortOrder, @updatedAt
      )
    `)
    .run({
      ...skill,
      tags: jsonArray(skill.tags),
      levelLabel: skill.levelLabel ?? null,
    });

  return skill;
}

export function updateSkill(id: string, input: SkillInput) {
  const database = getDb();
  const current = database.prepare("SELECT * FROM skills WHERE id = ?").get(id) as SkillRow | undefined;
  if (!current) {
    return null;
  }

  const updated: SkillRecord = {
    ...skillFromRow(current),
    ...input,
    slug: slugify(String(input.slug ?? current.slug)),
    tags: Array.isArray(input.tags) ? input.tags.map(String).filter(Boolean) : parseArray(current.tags),
    levelLabel: input.levelLabel ? String(input.levelLabel) : undefined,
    status: normalizeStatus(input.status ?? current.status),
    sortOrder: Number(input.sortOrder ?? current.sortOrder),
    updatedAt: new Date().toISOString(),
  };

  database
    .prepare(`
      UPDATE skills SET
        slug = @slug,
        name = @name,
        title = @title,
        summary = @summary,
        bodyMarkdown = @bodyMarkdown,
        tags = @tags,
        levelLabel = @levelLabel,
        status = @status,
        sortOrder = @sortOrder,
        updatedAt = @updatedAt
      WHERE id = @id
    `)
    .run({
      ...updated,
      tags: jsonArray(updated.tags),
      levelLabel: updated.levelLabel ?? null,
    });

  return updated;
}

export function deleteSkill(id: string) {
  const database = getDb();
  const result = database.prepare("DELETE FROM skills WHERE id = ?").run(id);
  return result.changes > 0;
}
