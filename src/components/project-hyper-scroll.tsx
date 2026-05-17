"use client";

import { useEffect, useMemo, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Project = {
  name: string;
  type: string;
  time: string;
  stack: string[];
  summary: string;
  takeaway: string;
};

type ProjectHyperScrollProps = {
  projects: Project[];
};

type HyperItem = {
  id: string;
  type: "card" | "text";
  title: string;
  eyebrow: string;
  footer: string;
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

const WORDS = ["IMPACT", "COYIN", "ECG", "SCRAPER", "MODEL", "CLOUD", "NOTES", "SYSTEM"];
const ITEM_COUNT = 16;
const STAR_COUNT = 120;
const Z_GAP = 640;
const LOOP_SIZE = ITEM_COUNT * Z_GAP;
const SCENE_STEP = 1.42;
const SCENE_COUNT = 8;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const seeded = (seed: number) => {
  const x = Math.sin(seed * 997.13) * 10000;
  return x - Math.floor(x);
};
const round = (value: number) => Number(value.toFixed(3));

function getProjectProgress(fallbackEl: HTMLElement) {
  const trigger = ScrollTrigger.getById("story-scroll");

  if (trigger) {
    const storyProgress = (window.scrollY - trigger.start) / (trigger.end - trigger.start);
    const totalUnits = SCENE_COUNT * SCENE_STEP;
    const start = (SCENE_STEP * 2) / totalUnits;
    const end = (SCENE_STEP * 3) / totalUnits;
    return clamp((storyProgress - start) / (end - start));
  }

  const rect = fallbackEl.getBoundingClientRect();
  return clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
}

function buildItems(projects: Project[]) {
  return Array.from({ length: ITEM_COUNT }, (_, index): HyperItem => {
    const isText = index % 4 === 0;
    const angle = (index / ITEM_COUNT) * Math.PI * 6;
    const radiusX = 360 + seeded(index + 2) * 220;
    const radiusY = 220 + seeded(index + 7) * 160;
    const project = projects[index % projects.length];
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
      title: project.name,
      eyebrow: `ID-${String(index).padStart(3, "0")}`,
      footer: project.stack.slice(0, 2).join(" / "),
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
    let last = getProjectProgress(root);
    let smoothVelocity = 0;
    const pointer = { x: 0, y: 0 };

    const onPointerMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const render = () => {
      frame = requestAnimationFrame(render);
      const progress = getProjectProgress(root);
      const targetVelocity = (progress - last) * 120;
      last = progress;
      smoothVelocity += (targetVelocity - smoothVelocity) * 0.14;

      const tiltX = pointer.y * 5 - smoothVelocity * 0.26;
      const tiltY = pointer.x * 6;
      const fov = 980 - Math.min(Math.abs(smoothVelocity) * 120, 520);
      const cameraZ = progress * LOOP_SIZE * 1.18;

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
        if (vizZ > 120 && type !== "star") {
          alpha = 1 - (vizZ - 120) / 460;
        }
        alpha = Math.max(0, alpha);
        el.style.opacity = String(alpha);

        if (alpha <= 0) {
          return;
        }

        let transform = `translate3d(${x}px, ${y}px, ${vizZ}px)`;

        if (type === "star") {
          const stretch = Math.max(1, Math.min(1 + Math.abs(smoothVelocity) * 0.8, 9));
          transform += ` scale3d(1, 1, ${stretch})`;
        } else if (type === "text") {
          transform += ` rotateZ(${rot}deg)`;
          if (Math.abs(smoothVelocity) > 0.8) {
            const offset = smoothVelocity * 10;
            el.style.textShadow = `${offset}px 0 #ff003c, ${-offset}px 0 #00f3ff`;
          } else {
            el.style.textShadow = "none";
          }
        } else {
          const float = Math.sin(performance.now() * 0.001 + x * 0.01) * 10;
          transform += ` rotateZ(${rot}deg) rotateY(${float}deg)`;
        }

        el.style.transform = transform;
      });
    };

    root.addEventListener("pointermove", onPointerMove);
    render();

    return () => {
      root.removeEventListener("pointermove", onPointerMove);
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
          <span>FPS: <strong>60</strong></span>
        </div>
        <p>SCROLL VELOCITY // <strong ref={velocityRef}>0.00</strong></p>
        <div>
          <span>COORD: <strong ref={coordRef}>000000</strong></span>
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
              key={item.id}
            >
              {item.type === "text" ? (
                <span>{item.title}</span>
              ) : (
                <article className="hyper-card">
                  <div className="hyper-card-header">
                    <span>{item.eyebrow}</span>
                    <b />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.footer}</p>
                  <em>{item.id.replace("card-", "").padStart(2, "0")}</em>
                </article>
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
