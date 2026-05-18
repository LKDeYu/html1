"use client";

import Link from "next/link";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { SkillRecord } from "@/lib/cms-types";
import { MarkdownView } from "@/components/markdown-view";

type SkillDetailOverlayProps = {
  skill: SkillRecord | null;
  onClose: () => void;
};

export function SkillDetailOverlay({ skill, onClose }: SkillDetailOverlayProps) {
  useEffect(() => {
    if (!skill) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, skill]);

  if (typeof document === "undefined" || !skill) {
    return null;
  }

  return createPortal(
    <div className="detail-overlay" role="dialog" aria-modal="true" aria-label={`${skill.title} 技能详情`}>
      <button className="detail-backdrop" type="button" aria-label="关闭详情" onClick={onClose} />
      <article className="detail-panel skill-detail-panel">
        <button className="detail-close" type="button" onClick={onClose} aria-label="关闭详情">
          <X size={18} />
        </button>

        <header className="detail-header">
          <p className="section-kicker">{skill.name}</p>
          <h2>{skill.title}</h2>
          <p>{skill.summary}</p>
          <div className="detail-meta">
            {skill.levelLabel ? <span>{skill.levelLabel}</span> : null}
            {skill.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </header>

        <MarkdownView>{skill.bodyMarkdown}</MarkdownView>

        <footer className="detail-actions">
          <Link href={`/skills/${skill.slug}`}>打开完整页面</Link>
        </footer>
      </article>
    </div>,
    document.body,
  );
}
