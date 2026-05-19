import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownView } from "@/components/markdown-view";
import { getSkillBySlug } from "@/lib/cms-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SkillPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SkillPage({ params }: SkillPageProps) {
  const { slug } = await params;
  const skill = getSkillBySlug(slug);

  if (!skill) {
    notFound();
  }

  return (
      <main className="content-page article-page">
        <article className="article-shell">
          <aside className="article-aside">
            <Link className="content-back-link" href="/">返回首页</Link>
            <div>
              <span>Group</span>
              <strong>{skill.name}</strong>
            </div>
            {skill.levelLabel ? (
              <div>
                <span>Level</span>
                <strong>{skill.levelLabel}</strong>
              </div>
            ) : null}
            <div className="post-tags">
              {skill.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </aside>

          <div className="article-main">
            <header className="article-header">
              <p className="section-kicker">Skill</p>
              <h1>{skill.title}</h1>
              <p>{skill.summary}</p>
            </header>
            <MarkdownView>{skill.bodyMarkdown}</MarkdownView>
          </div>
        </article>
      </main>
  );
}
