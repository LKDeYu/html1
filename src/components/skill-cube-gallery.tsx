"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import dynamic from "next/dynamic";
import type { SkillRecord } from "@/lib/portfolio-types";
import { defaultSkills } from "@/lib/portfolio-seed";
import { getStorySceneProgress, isStorySceneActive } from "@/components/story-scene-timing";

type SkillCubeGalleryProps = {
  skills: SkillRecord[];
};

const FACE_SLOTS = ["top", "front", "right", "back", "left", "bottom"] as const;
const FACE_IMAGES = [
  "/images/skills/cube-01-720.webp",
  "/images/skills/cube-02-720.webp",
  "/images/skills/cube-03-720.webp",
  "/images/skills/cube-04-720.webp",
  "/images/skills/cube-05-720.webp",
  "/images/skills/cube-06-720.webp",
];

const SkillDetailOverlay = dynamic(
  () => import("@/components/skill-detail-overlay").then((mod) => mod.SkillDetailOverlay),
  { ssr: false },
);

const STOPS = [
  { rx: 90, ry: 0 },
  { rx: 0, ry: 0 },
  { rx: 0, ry: -90 },
  { rx: 0, ry: -180 },
  { rx: 0, ry: -270 },
  { rx: -90, ry: -360 },
];

const easeIO = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function buildFaces(skills: SkillRecord[]) {
  const source = [...(skills.length > 0 ? skills : defaultSkills)].sort((a, b) => a.sortOrder - b.sortOrder);
  return FACE_SLOTS.map((face, index) => {
    const skill = source[index % source.length];
    return {
      face,
      image: FACE_IMAGES[index],
      label: String(index + 1).padStart(2, "0"),
      skill,
    };
  });
}

export function SkillCubeGallery({ skills }: SkillCubeGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedSkill, setSelectedSkill] = useState<SkillRecord | null>(null);
  const faces = useMemo(() => buildFaces(skills), [skills]);

  useEffect(() => {
    const root = rootRef.current;
    const cube = cubeRef.current;
    if (!root || !cube) {
      return;
    }

    let frame = 0;
    let idleTimer = 0;
    let lastIndex = -1;

    const schedule = (delay = 0) => {
      if (delay > 0) {
        idleTimer = window.setTimeout(() => {
          idleTimer = 0;
          frame = requestAnimationFrame(draw);
        }, delay);
        return;
      }

      frame = requestAnimationFrame(draw);
    };

    const draw = () => {
      if (document.hidden || !isStorySceneActive(1, root, 0.4)) {
        schedule(document.hidden ? 500 : 180);
        return;
      }

      const sceneProgress = getStorySceneProgress(1, root, 0, 1);
      const hold = 0.18;
      const travel = clamp((sceneProgress - hold) / 0.74);
      const smooth = easeIO(travel);
      const t = smooth * (STOPS.length - 1);
      const index = Math.min(Math.floor(t), STOPS.length - 2);
      const f = easeIO(t - index);
      const a = STOPS[index];
      const b = STOPS[index + 1];
      const rx = a.rx + (b.rx - a.rx) * f;
      const ry = a.ry + (b.ry - a.ry) * f;
      const active = Math.min(faces.length - 1, Math.round(Math.max(0, smooth) * (faces.length - 1)));

      cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      root.style.setProperty("--cube-progress", `${smooth}`);

      if (active !== lastIndex) {
        lastIndex = active;
        setActiveIndex(active);
      }

      schedule();
    };

    schedule();

    return () => {
      window.clearTimeout(idleTimer);
      cancelAnimationFrame(frame);
    };
  }, [faces.length]);

  const activeFace = faces[activeIndex];

  return (
    <div ref={rootRef} className="skill-cube-gallery">
      <div className="skill-cube-scene">
        <div ref={cubeRef} className="skill-cube">
          {faces.map((face, index) => (
            <button
              className="skill-cube-face"
              data-face={face.face}
              type="button"
              onClick={() => setSelectedSkill(face.skill)}
              style={{ "--i": index } as CSSProperties}
              key={face.face}
            >
              <span className="skill-face-fallback" aria-hidden="true" />
              <img
                className="skill-face-image"
                src={face.image}
                alt=""
                loading={index < 2 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={index < 2 ? "high" : "low"}
              />
              <span className="skill-face-frame" aria-hidden="true" />
              <span className="skill-face-label">{face.label}</span>
              <strong>{face.skill.title}</strong>
              <p>{face.skill.name}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="skill-scene-strip" aria-hidden="true">
        {faces.map((face, index) => (
          <span className={index === activeIndex ? "active" : ""} key={face.face} />
        ))}
      </div>

      <button className="skill-cube-card" type="button" onClick={() => setSelectedSkill(activeFace.skill)}>
        <small>
          {activeFace.label} / {activeFace.skill.name}
        </small>
        <h3>{activeFace.skill.title}</h3>
        <p>{activeFace.skill.summary}</p>
      </button>

      <div className="skill-face-caption" aria-hidden="true">
        <span>{activeFace.label}</span>
        <strong>{activeFace.skill.name}</strong>
      </div>

      <SkillDetailOverlay skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
    </div>
  );
}
