"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SkillRecord } from "@/lib/cms-types";
import { defaultSkills } from "@/lib/cms-seed";
import { SkillDetailOverlay } from "@/components/skill-detail-overlay";

type SkillCubeGalleryProps = {
  skills: SkillRecord[];
};

const FACE_SLOTS = ["front", "right", "back", "left", "top", "bottom"] as const;

const STOPS = [
  { rx: 0, ry: 0 },
  { rx: 0, ry: -90 },
  { rx: 0, ry: -180 },
  { rx: 0, ry: -270 },
  { rx: 90, ry: -360 },
  { rx: -90, ry: -360 },
];

const SCENE_STEP = 1.42;
const SCENE_COUNT = 7;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const easeIO = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

function buildFaces(skills: SkillRecord[]) {
  const source = skills.length > 0 ? skills : defaultSkills;
  return FACE_SLOTS.map((face, index) => {
    const skill = source[index % source.length];
    return {
      face,
      label: String(index + 1).padStart(2, "0"),
      skill,
    };
  });
}

function getStorySegmentProgress(startUnit: number, endUnit: number, fallbackEl: HTMLElement) {
  const trigger = ScrollTrigger.getById("story-scroll");

  if (trigger) {
    const totalUnits = SCENE_COUNT * SCENE_STEP;
    const scroll = window.scrollY;
    const storyProgress = (scroll - trigger.start) / (trigger.end - trigger.start);
    const start = startUnit / totalUnits;
    const end = endUnit / totalUnits;
    return clamp((storyProgress - start) / (end - start));
  }

  const rect = fallbackEl.getBoundingClientRect();
  return clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
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
    let lastIndex = -1;
    const pointer = { x: 0, y: 0 };

    const onPointerMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const draw = () => {
      frame = requestAnimationFrame(draw);

      const smooth = getStorySegmentProgress(SCENE_STEP, SCENE_STEP * 2, root);
      const t = smooth * (faces.length - 1);
      const index = Math.min(Math.floor(t), faces.length - 2);
      const f = easeIO(t - index);
      const a = STOPS[index];
      const b = STOPS[index + 1];
      const rx = a.rx + (b.rx - a.rx) * f + pointer.y * -4;
      const ry = a.ry + (b.ry - a.ry) * f + pointer.x * 7;
      const active = Math.min(faces.length - 1, Math.round(t));

      cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      root.style.setProperty("--cube-progress", `${smooth}`);

      if (active !== lastIndex) {
        lastIndex = active;
        setActiveIndex(active);
      }
    };

    root.addEventListener("pointermove", onPointerMove);
    draw();

    return () => {
      root.removeEventListener("pointermove", onPointerMove);
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
        <small>{activeFace.label} / {activeFace.skill.name}</small>
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
