"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ProjectRecord } from "@/lib/cms-types";
import { getStorySceneProgress, isStorySceneActive } from "@/components/story-scene-timing";

type ProjectHyperScrollProps = {
  projects: ProjectRecord[];
};

type HyperItem = {
  id: string;
  type: "card" | "text";
  title: string;
  eyebrow: string;
  footer: string;
  project?: ProjectRecord;
  x: number;
  y: number;
  z: number;
  rot: number;
};

type HyperStar = {
  id: string;
  x: number;
  y: number;
  z: number;
};

const WORDS = ["IMPACT", "COYIN", "ECG", "SCRAPER", "MODEL", "CLOUD", "NOTES", "BUILD"];
const ITEM_COUNT = 16;
const STAR_COUNT = 90;
const Z_GAP = 760;
const LOOP_SIZE = ITEM_COUNT * Z_GAP;

const seeded = (seed: number) => {
  const x = Math.sin(seed * 997.13) * 10000;
  return x - Math.floor(x);
};

const round = (value: number) => Number(value.toFixed(3));

function buildItems(projects: ProjectRecord[]) {
  const sourceProjects = projects.length > 0 ? projects : [];
  return Array.from({ length: ITEM_COUNT }, (_, index): HyperItem => {
    const isText = index % 4 === 0;
    const angle = (index / ITEM_COUNT) * Math.PI * 6;
    const radiusX = 360 + seeded(index + 2) * 220;
    const radiusY = 220 + seeded(index + 7) * 160;
    const project = sourceProjects[index % Math.max(1, sourceProjects.length)];
    const word = WORDS[index % WORDS.length];

    if (isText) {
      return {
        id: `text-${index}`,
        type: "text",
        title: word,
        eyebrow: "PROJECT FIELD",
        footer: "LEARNING PROJECT",
        x: 0,
        y: round(Math.sin(angle) * 120),
        z: -index * Z_GAP,
        rot: round((seeded(index + 18) - 0.5) * 8),
      };
    }

    return {
      id: `card-${index}`,
      type: "card",
      title: project?.name ?? "Project",
      eyebrow: `ID-${String(index).padStart(3, "0")}`,
      footer: project?.stack.slice(0, 2).join(" / ") ?? "Portfolio",
      project,
      x: round(Math.cos(angle) * radiusX),
      y: round(Math.sin(angle) * radiusY),
      z: -index * Z_GAP,
      rot: round((seeded(index + 22) - 0.5) * 28),
    };
  });
}

function buildStars() {
  return Array.from({ length: STAR_COUNT }, (_, index): HyperStar => ({
    id: `star-${index}`,
    x: round((seeded(index + 31) - 0.5) * 2500),
    y: round((seeded(index + 61) - 0.5) * 1800),
    z: round(-seeded(index + 91) * LOOP_SIZE),
  }));
}

export function ProjectHyperScroll({ projects }: ProjectHyperScrollProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const velocityRef = useRef<HTMLElement>(null);
  const coordRef = useRef<HTMLElement>(null);
  const [featuredItemId, setFeaturedItemId] = useState<string | null>(null);
  const items = useMemo(() => buildItems(projects), [projects]);
  const stars = useMemo(() => buildStars(), []);

  useEffect(() => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    const world = worldRef.current;
    const velocityReadout = velocityRef.current;
    const coordReadout = coordRef.current;
    if (!root || !viewport || !world || !velocityReadout || !coordReadout) {
      return;
    }

    const elements = Array.from(world.querySelectorAll<HTMLElement>(".project-hyper-item"));
    let frame = 0;
    let idleTimer = 0;
    let last = getStorySceneProgress(2, root, 0.02, 0.98);
    let smoothVelocity = 0;
    let motionEnergy = 0;
    let lastFeaturedItemId: string | null = null;
    const pointer = { x: 0, y: 0 };

    const schedule = (delay = 0) => {
      if (delay > 0) {
        idleTimer = window.setTimeout(() => {
          idleTimer = 0;
          frame = requestAnimationFrame(render);
        }, delay);
        return;
      }

      frame = requestAnimationFrame(render);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const render = () => {
      if (document.hidden || !isStorySceneActive(2, root, 0.45)) {
        schedule(document.hidden ? 500 : 180);
        return;
      }

      const progress = getStorySceneProgress(2, root, 0.02, 0.98);
      const progressVelocity = (progress - last) * 150;
      last = progress;
      const storyVelocity = (ScrollTrigger.getById("story-scroll")?.getVelocity() ?? 0) / 960;
      const targetVelocity =
        Math.abs(storyVelocity) > 0.05
          ? storyVelocity
          : Math.abs(progressVelocity) > 0.1
            ? progressVelocity
            : 0;
      smoothVelocity += (targetVelocity - smoothVelocity) * 0.08;
      const targetEnergy = Math.abs(progressVelocity) > 0.06 ? Math.min(1, Math.abs(progressVelocity) / 2.6) : 0;
      motionEnergy = targetEnergy > 0 ? Math.max(motionEnergy * 0.9, targetEnergy) : motionEnergy * 0.94;
      if (motionEnergy < 0.025) {
        motionEnergy = 0;
      }

      const colorEnergy = motionEnergy;
      const tiltX = pointer.y * 5 - smoothVelocity * 0.26;
      const tiltY = pointer.x * 6;
      const fov = 1060 - Math.min(Math.abs(smoothVelocity) * 14, 220);
      const cameraZ = progress * LOOP_SIZE * 1.06;
      let bestItemId: string | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      viewport.style.perspective = `${fov}px`;
      world.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      velocityReadout.textContent = Math.abs(smoothVelocity).toFixed(2);
      coordReadout.textContent = String(Math.round(progress * 10000)).padStart(6, "0");

      elements.forEach((el) => {
        const baseZ = Number(el.dataset.z);
        const x = Number(el.dataset.x);
        const y = Number(el.dataset.y);
        const rot = Number(el.dataset.rot);
        const type = el.dataset.type;

        let vizZ = ((baseZ + cameraZ) % LOOP_SIZE + LOOP_SIZE) % LOOP_SIZE;
        if (vizZ > 500) {
          vizZ -= LOOP_SIZE;
        }

        let alpha = 1;
        if (vizZ < -3300) {
          alpha = 0;
        } else if (vizZ < -2300) {
          alpha = (vizZ + 3300) / 1000;
        }
        if (vizZ > 180 && type !== "star") {
          alpha = 1 - (vizZ - 180) / 560;
        }
        alpha = Math.max(0, alpha);
        el.style.opacity = String(alpha);

        if (alpha <= 0) {
          el.classList.remove("featured");
          return;
        }

        let transform = `translate3d(${x}px, ${y}px, ${vizZ}px)`;

        if (type === "star") {
          const stretch = Math.max(1, Math.min(1 + Math.abs(smoothVelocity) * 0.55, 7));
          transform += ` scale3d(1, 1, ${stretch})`;
        } else if (type === "text") {
          transform += ` rotateZ(${rot}deg)`;
          const offset = Math.max(2, Math.min(10, Math.abs(smoothVelocity) * 2 + colorEnergy * 3));
          el.style.textShadow =
            colorEnergy > 0.08
              ? `${offset}px 0 #ff003c, ${-offset}px 0 #00f3ff`
              : "none";
        } else {
          const float = Math.sin(performance.now() * 0.0007 + x * 0.01) * 6;
          transform += ` rotateZ(${rot}deg) rotateY(${float}deg)`;
          const distance = Math.abs(vizZ + 260) + Math.abs(x) * 0.12 + Math.abs(y) * 0.08;
          if (alpha > 0.42 && distance < bestDistance) {
            bestDistance = distance;
            bestItemId = el.dataset.itemId || null;
          }
        }

        el.style.transform = transform;
      });

      elements.forEach((el) => {
        el.classList.toggle("featured", Boolean(bestItemId && el.dataset.itemId === bestItemId));
      });
      if (bestItemId !== lastFeaturedItemId) {
        lastFeaturedItemId = bestItemId;
        setFeaturedItemId(bestItemId);
      }

      schedule();
    };

    root.addEventListener("pointermove", onPointerMove);
    schedule();

    return () => {
      root.removeEventListener("pointermove", onPointerMove);
      window.clearTimeout(idleTimer);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} className="project-hyper">
      <div className="project-scanlines" aria-hidden="true" />
      <div className="project-vignette" aria-hidden="true" />
      <div className="project-noise" aria-hidden="true" />

      <div className="project-hud" aria-hidden="true">
        <div>
          <span>PROJECTS.READY</span>
          <i />
          <span>
            FPS: <strong>60</strong>
          </span>
        </div>
        <p>
          SCROLL VELOCITY // <strong ref={velocityRef}>0.00</strong>
        </p>
        <div>
          <span>
            COORD: <strong ref={coordRef}>000000</strong>
          </span>
          <i />
          <span>VER 0.2</span>
        </div>
      </div>

      <div ref={viewportRef} className="project-hyper-viewport">
        <div ref={worldRef} className="project-hyper-world">
          {items.map((item) => (
            <div
              className={`project-hyper-item ${item.type === "text" ? "project-big-text" : ""}`}
              data-type={item.type}
              data-x={item.x}
              data-y={item.y}
              data-z={item.z}
              data-rot={item.rot}
              data-item-id={item.id}
              data-slug={item.project?.slug ?? ""}
              key={item.id}
            >
              {item.type === "text" ? (
                <span>{item.title}</span>
              ) : (
                <Link
                  className={`hyper-card ${featuredItemId === item.id ? "active" : ""}`}
                  href={item.project ? `/blog/${item.project.slug}` : "/blog"}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <div className="hyper-card-header">
                    <span>{item.eyebrow}</span>
                    <b />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.footer}</p>
                  <em>{item.id.replace("card-", "").padStart(2, "0")}</em>
                </Link>
              )}
            </div>
          ))}

          {stars.map((star) => (
            <span
              className="project-hyper-item hyper-star"
              data-type="star"
              data-x={star.x}
              data-y={star.y}
              data-z={star.z}
              data-rot="0"
              key={star.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
