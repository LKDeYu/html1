/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownView } from "@/components/markdown-view";
import { getProjectBySlug } from "@/lib/portfolio-data";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
      <main className="content-page article-page">
        <article className="article-shell">
          <aside className="article-aside">
            <Link className="content-back-link" href="/projects">全部项目</Link>
            <div>
              <span>Type</span>
              <strong>{project.type || "项目"}</strong>
            </div>
            <div>
              <span>Time</span>
              <strong>{project.time || "待补充"}</strong>
            </div>
            <div className="post-tags">
              {project.stack.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </aside>

          <div className="article-main">
            <header className="article-header">
              <p className="section-kicker">Project</p>
              <h1>{project.name}</h1>
              <p>{project.summary}</p>
            </header>

            {project.imageUrl ? <img className="article-cover" src={project.imageUrl} alt="" /> : null}
            <MarkdownView>{project.bodyMarkdown}</MarkdownView>

            {project.takeaway ? (
              <aside className="detail-takeaway">
                <strong>Takeaway</strong>
                <p>{project.takeaway}</p>
              </aside>
            ) : null}
          </div>
        </article>
      </main>
  );
}
