/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { ProjectRecord } from "@/lib/cms-types";
import { MarkdownView } from "@/components/markdown-view";

type ProjectDetailOverlayProps = {
  project: ProjectRecord | null;
  onClose: () => void;
};

export function ProjectDetailOverlay({ project, onClose }: ProjectDetailOverlayProps) {
  useEffect(() => {
    if (!project) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, project]);

  if (!project) {
    return null;
  }

  return (
    <div className="detail-overlay" role="dialog" aria-modal="true" aria-label={`${project.name} 项目详情`}>
      <button className="detail-backdrop" type="button" aria-label="关闭详情" onClick={onClose} />
      <article className="detail-panel project-detail-panel">
        <button className="detail-close" type="button" onClick={onClose} aria-label="关闭详情">
          <X size={18} />
        </button>

        <header className="detail-header">
          <p className="section-kicker">{project.type || "Project"}</p>
          <h2>{project.name}</h2>
          <p>{project.summary}</p>
          <div className="detail-meta">
            {project.time ? <span>{project.time}</span> : null}
            {project.stack.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </header>

        {project.imageUrl ? (
          <img className="detail-hero-image" src={project.imageUrl} alt={`${project.name} preview`} />
        ) : null}

        <MarkdownView>{project.bodyMarkdown}</MarkdownView>

        {project.takeaway ? (
          <aside className="detail-takeaway">
            <strong>Takeaway</strong>
            <p>{project.takeaway}</p>
          </aside>
        ) : null}

        <footer className="detail-tags">
          {project.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </footer>
      </article>
    </div>
  );
}
