"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import type { BlogPostRecord, ProjectRecord, PublishStatus, SkillRecord } from "@/lib/cms-types";
import { MarkdownView } from "@/components/markdown-view";

type AdminCmsClientProps = {
  initialProjects: ProjectRecord[];
  initialSkills: SkillRecord[];
  initialPosts: BlogPostRecord[];
};

type AdminTab = "projects" | "skills" | "posts";

type ProjectForm = Omit<ProjectRecord, "stack" | "tags"> & {
  stackText: string;
  tagsText: string;
};

type SkillForm = Omit<SkillRecord, "tags"> & {
  tagsText: string;
};

type BlogPostForm = Omit<BlogPostRecord, "tags"> & {
  tagsText: string;
};

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const projectToForm = (project: ProjectRecord): ProjectForm => ({
  ...project,
  stackText: project.stack.join(", "),
  tagsText: project.tags.join(", "),
});

const skillToForm = (skill: SkillRecord): SkillForm => ({
  ...skill,
  tagsText: skill.tags.join(", "),
});

const postToForm = (post: BlogPostRecord): BlogPostForm => ({
  ...post,
  tagsText: post.tags.join(", "),
});

const emptyProject = (): ProjectForm => ({
  id: "",
  slug: "",
  name: "新项目",
  type: "学习项目",
  time: "待补充",
  summary: "",
  bodyMarkdown: "## 项目说明\n\n在这里写项目目标、实现过程、技术栈和复盘。",
  takeaway: "",
  stackText: "",
  tagsText: "",
  imageUrl: "",
  status: "draft",
  sortOrder: 100,
  updatedAt: "",
});

const emptySkill = (): SkillForm => ({
  id: "",
  slug: "",
  name: "Skill Group",
  title: "New Skill",
  summary: "",
  bodyMarkdown: "## 技能说明\n\n在这里写学习重点、使用场景和相关项目。",
  tagsText: "",
  levelLabel: "",
  status: "draft",
  sortOrder: 100,
  updatedAt: "",
});

const emptyPost = (): BlogPostForm => ({
  id: "",
  slug: "",
  title: "新文章",
  date: new Date().toISOString().slice(0, 10),
  summary: "",
  bodyMarkdown: "## 标题\n\n在这里写博客正文。",
  tagsText: "",
  category: "学习笔记",
  imageUrl: "",
  status: "draft",
  sortOrder: 100,
  updatedAt: "",
});

export function AdminCmsClient({ initialProjects, initialSkills, initialPosts }: AdminCmsClientProps) {
  const [tab, setTab] = useState<AdminTab>("projects");
  const [projects, setProjects] = useState(initialProjects);
  const [skills, setSkills] = useState(initialSkills);
  const [posts, setPosts] = useState(initialPosts);
  const [projectForm, setProjectForm] = useState<ProjectForm>(() => projectToForm(initialProjects[0] ?? emptyProject()));
  const [skillForm, setSkillForm] = useState<SkillForm>(() => skillToForm(initialSkills[0] ?? emptySkill()));
  const [postForm, setPostForm] = useState<BlogPostForm>(() => postToForm(initialPosts[0] ?? emptyPost()));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const sortedProjects = useMemo(() => [...projects].sort((a, b) => a.sortOrder - b.sortOrder), [projects]);
  const sortedSkills = useMemo(() => [...skills].sort((a, b) => a.sortOrder - b.sortOrder), [skills]);
  const sortedPosts = useMemo(() => [...posts].sort((a, b) => a.sortOrder - b.sortOrder), [posts]);

  const saveProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      slug: projectForm.slug,
      name: projectForm.name,
      type: projectForm.type,
      time: projectForm.time,
      summary: projectForm.summary,
      bodyMarkdown: projectForm.bodyMarkdown,
      takeaway: projectForm.takeaway,
      stack: splitList(projectForm.stackText),
      tags: splitList(projectForm.tagsText),
      imageUrl: projectForm.imageUrl || undefined,
      status: projectForm.status,
      sortOrder: Number(projectForm.sortOrder),
    };
    const isUpdate = Boolean(projectForm.id);
    const response = await fetch(isUpdate ? `/api/admin/projects/${projectForm.id}` : "/api/admin/projects", {
      method: isUpdate ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as { project?: ProjectRecord; error?: string } | null;
    setSaving(false);

    if (!response.ok || !data?.project) {
      setMessage(data?.error ?? "保存项目失败");
      return;
    }

    setProjects((current) => {
      const next = isUpdate ? current.map((item) => (item.id === data.project?.id ? data.project : item)) : [...current, data.project!];
      return next.filter(Boolean);
    });
    setProjectForm(projectToForm(data.project));
    setMessage("项目已保存。");
  };

  const saveSkill = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      slug: skillForm.slug,
      name: skillForm.name,
      title: skillForm.title,
      summary: skillForm.summary,
      bodyMarkdown: skillForm.bodyMarkdown,
      tags: splitList(skillForm.tagsText),
      levelLabel: skillForm.levelLabel || undefined,
      status: skillForm.status,
      sortOrder: Number(skillForm.sortOrder),
    };
    const isUpdate = Boolean(skillForm.id);
    const response = await fetch(isUpdate ? `/api/admin/skills/${skillForm.id}` : "/api/admin/skills", {
      method: isUpdate ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as { skill?: SkillRecord; error?: string } | null;
    setSaving(false);

    if (!response.ok || !data?.skill) {
      setMessage(data?.error ?? "保存技能失败");
      return;
    }

    setSkills((current) => {
      const next = isUpdate ? current.map((item) => (item.id === data.skill?.id ? data.skill : item)) : [...current, data.skill!];
      return next.filter(Boolean);
    });
    setSkillForm(skillToForm(data.skill));
    setMessage("技能已保存。");
  };

  const savePost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      slug: postForm.slug,
      title: postForm.title,
      date: postForm.date,
      summary: postForm.summary,
      bodyMarkdown: postForm.bodyMarkdown,
      tags: splitList(postForm.tagsText),
      category: postForm.category,
      imageUrl: postForm.imageUrl || undefined,
      status: postForm.status,
      sortOrder: Number(postForm.sortOrder),
    };
    const isUpdate = Boolean(postForm.id);
    const response = await fetch(isUpdate ? `/api/admin/posts/${postForm.id}` : "/api/admin/posts", {
      method: isUpdate ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as { post?: BlogPostRecord; error?: string } | null;
    setSaving(false);

    if (!response.ok || !data?.post) {
      setMessage(data?.error ?? "保存文章失败");
      return;
    }

    setPosts((current) => {
      const next = isUpdate ? current.map((item) => (item.id === data.post?.id ? data.post : item)) : [...current, data.post!];
      return next.filter(Boolean);
    });
    setPostForm(postToForm(data.post));
    setMessage("文章已保存。");
  };

  const deleteCurrentProject = async () => {
    if (!projectForm.id || !window.confirm("确定删除这个项目吗？")) {
      return;
    }

    const response = await fetch(`/api/admin/projects/${projectForm.id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("删除项目失败");
      return;
    }

    const next = projects.filter((project) => project.id !== projectForm.id);
    setProjects(next);
    setProjectForm(next[0] ? projectToForm(next[0]) : emptyProject());
    setMessage("项目已删除。");
  };

  const deleteCurrentSkill = async () => {
    if (!skillForm.id || !window.confirm("确定删除这个技能吗？")) {
      return;
    }

    const response = await fetch(`/api/admin/skills/${skillForm.id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("删除技能失败");
      return;
    }

    const next = skills.filter((skill) => skill.id !== skillForm.id);
    setSkills(next);
    setSkillForm(next[0] ? skillToForm(next[0]) : emptySkill());
    setMessage("技能已删除。");
  };

  const deleteCurrentPost = async () => {
    if (!postForm.id || !window.confirm("确定删除这篇文章吗？")) {
      return;
    }

    const response = await fetch(`/api/admin/posts/${postForm.id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("删除文章失败");
      return;
    }

    const next = posts.filter((post) => post.id !== postForm.id);
    setPosts(next);
    setPostForm(next[0] ? postToForm(next[0]) : emptyPost());
    setMessage("文章已删除。");
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="section-kicker">Namranta CMS</p>
          <h1>Content Studio</h1>
        </div>
        <div className="admin-actions">
          <a href="/" target="_blank" rel="noreferrer">查看网站</a>
          <a href="/blog" target="_blank" rel="noreferrer">查看博客</a>
          <button type="button" onClick={logout}>退出</button>
        </div>
      </header>

      <nav className="admin-tabs" aria-label="内容类型">
        <TabButton active={tab === "projects"} onClick={() => setTab("projects")}>Projects</TabButton>
        <TabButton active={tab === "skills"} onClick={() => setTab("skills")}>Skills</TabButton>
        <TabButton active={tab === "posts"} onClick={() => setTab("posts")}>Blog</TabButton>
      </nav>

      {message ? <p className="admin-message">{message}</p> : null}

      {tab === "projects" ? (
        <section className="admin-grid">
          <ContentList
            items={sortedProjects.map((project) => ({
              id: project.id,
              title: project.name,
              meta: `${project.status} / ${project.tags.join(", ") || "no tags"}`,
            }))}
            activeId={projectForm.id}
            onNew={() => setProjectForm(emptyProject())}
            onSelect={(id) => {
              const project = projects.find((item) => item.id === id);
              if (project) setProjectForm(projectToForm(project));
            }}
          />
          <form className="admin-editor" onSubmit={saveProject}>
            <ProjectFields form={projectForm} setForm={setProjectForm} />
            <EditorActions saving={saving} canDelete={Boolean(projectForm.id)} onDelete={deleteCurrentProject} />
          </form>
          <Preview title={projectForm.name} markdown={projectForm.bodyMarkdown} tags={splitList(projectForm.tagsText)} />
        </section>
      ) : null}

      {tab === "skills" ? (
        <section className="admin-grid">
          <ContentList
            items={sortedSkills.map((skill) => ({
              id: skill.id,
              title: skill.title,
              meta: `${skill.status} / ${skill.tags.join(", ") || "no tags"}`,
            }))}
            activeId={skillForm.id}
            onNew={() => setSkillForm(emptySkill())}
            onSelect={(id) => {
              const skill = skills.find((item) => item.id === id);
              if (skill) setSkillForm(skillToForm(skill));
            }}
          />
          <form className="admin-editor" onSubmit={saveSkill}>
            <SkillFields form={skillForm} setForm={setSkillForm} />
            <EditorActions saving={saving} canDelete={Boolean(skillForm.id)} onDelete={deleteCurrentSkill} />
          </form>
          <Preview title={skillForm.title} markdown={skillForm.bodyMarkdown} tags={splitList(skillForm.tagsText)} />
        </section>
      ) : null}

      {tab === "posts" ? (
        <section className="admin-grid">
          <ContentList
            items={sortedPosts.map((post) => ({
              id: post.id,
              title: post.title,
              meta: `${post.status} / ${post.date || "no date"} / ${post.tags.join(", ") || "no tags"}`,
            }))}
            activeId={postForm.id}
            onNew={() => setPostForm(emptyPost())}
            onSelect={(id) => {
              const post = posts.find((item) => item.id === id);
              if (post) setPostForm(postToForm(post));
            }}
          />
          <form className="admin-editor" onSubmit={savePost}>
            <BlogPostFields form={postForm} setForm={setPostForm} />
            <EditorActions saving={saving} canDelete={Boolean(postForm.id)} onDelete={deleteCurrentPost} />
          </form>
          <Preview title={postForm.title} markdown={postForm.bodyMarkdown} tags={splitList(postForm.tagsText)} />
        </section>
      ) : null}
    </main>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button className={active ? "active" : ""} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function ContentList({
  items,
  activeId,
  onNew,
  onSelect,
}: {
  items: Array<{ id: string; title: string; meta: string }>;
  activeId: string;
  onNew: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="admin-list">
      <button className="admin-new-button" type="button" onClick={onNew}>新建</button>
      {items.map((item) => (
        <button className={item.id === activeId ? "active" : ""} type="button" key={item.id} onClick={() => onSelect(item.id)}>
          <strong>{item.title}</strong>
          <span>{item.meta}</span>
        </button>
      ))}
    </aside>
  );
}

function ProjectFields({ form, setForm }: { form: ProjectForm; setForm: (form: ProjectForm) => void }) {
  return (
    <>
      <Field label="项目名称" value={form.name} onChange={(name) => setForm({ ...form, name })} />
      <Field label="Slug" value={form.slug} onChange={(slug) => setForm({ ...form, slug })} placeholder="留空会自动生成" />
      <Field label="类型" value={form.type} onChange={(type) => setForm({ ...form, type })} />
      <Field label="时间" value={form.time} onChange={(time) => setForm({ ...form, time })} />
      <Field label="技术栈，逗号分隔" value={form.stackText} onChange={(stackText) => setForm({ ...form, stackText })} />
      <Field label="标签，逗号分隔" value={form.tagsText} onChange={(tagsText) => setForm({ ...form, tagsText })} />
      <Field label="图片 URL" value={form.imageUrl ?? ""} onChange={(imageUrl) => setForm({ ...form, imageUrl })} />
      <Field label="排序" type="number" value={String(form.sortOrder)} onChange={(sortOrder) => setForm({ ...form, sortOrder: Number(sortOrder) })} />
      <StatusField value={form.status} onChange={(status) => setForm({ ...form, status })} />
      <TextArea label="摘要" value={form.summary} onChange={(summary) => setForm({ ...form, summary })} rows={3} />
      <TextArea label="Markdown 正文" value={form.bodyMarkdown} onChange={(bodyMarkdown) => setForm({ ...form, bodyMarkdown })} rows={16} />
      <TextArea label="Takeaway" value={form.takeaway} onChange={(takeaway) => setForm({ ...form, takeaway })} rows={3} />
    </>
  );
}

function SkillFields({ form, setForm }: { form: SkillForm; setForm: (form: SkillForm) => void }) {
  return (
    <>
      <Field label="技能标题" value={form.title} onChange={(title) => setForm({ ...form, title })} />
      <Field label="Slug" value={form.slug} onChange={(slug) => setForm({ ...form, slug })} placeholder="留空会自动生成" />
      <Field label="分组/名称" value={form.name} onChange={(name) => setForm({ ...form, name })} />
      <Field label="水平标签" value={form.levelLabel ?? ""} onChange={(levelLabel) => setForm({ ...form, levelLabel })} />
      <Field label="标签，逗号分隔" value={form.tagsText} onChange={(tagsText) => setForm({ ...form, tagsText })} />
      <Field label="排序" type="number" value={String(form.sortOrder)} onChange={(sortOrder) => setForm({ ...form, sortOrder: Number(sortOrder) })} />
      <StatusField value={form.status} onChange={(status) => setForm({ ...form, status })} />
      <TextArea label="摘要" value={form.summary} onChange={(summary) => setForm({ ...form, summary })} rows={3} />
      <TextArea label="Markdown 正文" value={form.bodyMarkdown} onChange={(bodyMarkdown) => setForm({ ...form, bodyMarkdown })} rows={16} />
    </>
  );
}

function BlogPostFields({ form, setForm }: { form: BlogPostForm; setForm: (form: BlogPostForm) => void }) {
  return (
    <>
      <Field label="文章标题" value={form.title} onChange={(title) => setForm({ ...form, title })} />
      <Field label="Slug" value={form.slug} onChange={(slug) => setForm({ ...form, slug })} placeholder="留空会自动生成" />
      <Field label="日期" type="date" value={form.date} onChange={(date) => setForm({ ...form, date })} />
      <Field label="分类" value={form.category} onChange={(category) => setForm({ ...form, category })} />
      <Field label="标签，逗号分隔" value={form.tagsText} onChange={(tagsText) => setForm({ ...form, tagsText })} />
      <Field label="封面图片 URL" value={form.imageUrl ?? ""} onChange={(imageUrl) => setForm({ ...form, imageUrl })} />
      <Field label="排序" type="number" value={String(form.sortOrder)} onChange={(sortOrder) => setForm({ ...form, sortOrder: Number(sortOrder) })} />
      <StatusField value={form.status} onChange={(status) => setForm({ ...form, status })} />
      <TextArea label="摘要" value={form.summary} onChange={(summary) => setForm({ ...form, summary })} rows={3} />
      <TextArea label="Markdown 正文" value={form.bodyMarkdown} onChange={(bodyMarkdown) => setForm({ ...form, bodyMarkdown })} rows={18} />
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function StatusField({ value, onChange }: { value: PublishStatus; onChange: (value: PublishStatus) => void }) {
  return (
    <label className="admin-field">
      <span>状态</span>
      <select value={value} onChange={(event) => onChange(event.target.value as PublishStatus)}>
        <option value="published">published</option>
        <option value="draft">draft</option>
      </select>
    </label>
  );
}

function EditorActions({ saving, canDelete, onDelete }: { saving: boolean; canDelete: boolean; onDelete: () => void }) {
  return (
    <div className="admin-editor-actions">
      <button type="submit" disabled={saving}>{saving ? "保存中..." : "保存"}</button>
      <button type="button" disabled={!canDelete} onClick={onDelete}>删除</button>
    </div>
  );
}

function Preview({ title, markdown, tags }: { title: string; markdown: string; tags: string[] }) {
  return (
    <aside className="admin-preview">
      <p className="section-kicker">Preview</p>
      <h2>{title}</h2>
      <div className="detail-tags">
        {tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <MarkdownView>{markdown}</MarkdownView>
    </aside>
  );
}
