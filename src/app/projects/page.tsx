import Link from "next/link";
import { StarfieldCanvas } from "@/components/starfield-canvas";
import { listProjects } from "@/lib/cms-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  const projects = listProjects();

  return (
    <>
      <StarfieldCanvas />
      <main className="content-page blog-page">
        <header className="content-hero">
          <Link className="content-back-link" href="/">返回首页</Link>
          <p className="section-kicker">Projects / 项目</p>
          <h1>把项目过程整理成可复查的档案。</h1>
          <p>每个项目都可以记录目标、技术栈、实现过程、问题处理和复盘。以后你只需要在后台更新内容。</p>
        </header>

        <section className="post-list tag-post-list">
          {projects.map((project) => (
            <article className="post-list-card" key={project.id}>
              <div className="post-list-meta">
                <span>{project.type || "项目"}</span>
                <time>{project.time}</time>
              </div>
              <h2>
                <Link href={`/projects/${project.slug}`}>{project.name}</Link>
              </h2>
              <p>{project.summary}</p>
              <div className="post-tags">
                {project.stack.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
