"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const FACE_DATA = [
  {
    face: "top",
    label: "01",
    name: "Programming",
    title: "C / C++",
    body: "用底层语言训练算法思维，理解数据结构、内存和程序执行过程。",
  },
  {
    face: "front",
    label: "02",
    name: "Python",
    title: "Python",
    body: "用于爬虫、数据处理、模型实验和自动化脚本，是当前学习实践的主力语言。",
  },
  {
    face: "right",
    label: "03",
    name: "PyTorch",
    title: "PyTorch",
    body: "围绕深度学习训练、推理和实验复盘，逐步建立 AI 项目实现能力。",
  },
  {
    face: "back",
    label: "04",
    name: "Machine Learning",
    title: "ML",
    body: "关注特征、模型、指标和实验流程，把算法知识落到可验证的结果上。",
  },
  {
    face: "left",
    label: "05",
    name: "Deep Learning",
    title: "DL",
    body: "从神经网络、训练技巧到医学信号分析项目，持续扩展模型理解。",
  },
  {
    face: "bottom",
    label: "06",
    name: "Cloud Deploy",
    title: "Cloud",
    body: "通过 Next.js、SQLite、Nginx 和阿里云 ECS 完成个人网站部署闭环。",
  },
];

const STOPS = [
  { rx: 90, ry: 0 },
  { rx: 0, ry: 0 },
  { rx: 0, ry: -90 },
  { rx: 0, ry: -180 },
  { rx: 0, ry: -270 },
  { rx: -90, ry: -360 },
];

const SCENE_STEP = 1.42;
const SCENE_COUNT = 8;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const easeIO = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

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

export function SkillCubeGallery() {
  const rootRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const cube = cubeRef.current;
    const progressFill = progressRef.current;
    if (!root || !cube || !progressFill) {
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
      const t = smooth * (FACE_DATA.length - 1);
      const index = Math.min(Math.floor(t), FACE_DATA.length - 2);
      const f = easeIO(t - index);
      const a = STOPS[index];
      const b = STOPS[index + 1];
      const rx = a.rx + (b.rx - a.rx) * f + pointer.y * -4;
      const ry = a.ry + (b.ry - a.ry) * f + pointer.x * 7;
      const active = Math.min(FACE_DATA.length - 1, Math.round(t));

      cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      progressFill.style.width = `${Math.round(smooth * 100)}%`;
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
  }, []);

  const activeFace = FACE_DATA[activeIndex];

  return (
    <div ref={rootRef} className="skill-cube-gallery">
      <div className="skill-cube-scene" aria-hidden="true">
        <div ref={cubeRef} className="skill-cube">
          {FACE_DATA.map((face, index) => (
            <div
              className="skill-cube-face"
              data-face={face.face}
              style={{ "--i": index } as CSSProperties}
              key={face.face}
            >
              <span className="skill-face-label">{face.label}</span>
              <strong>{face.title}</strong>
              <p>{face.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="skill-cube-hud">
        <span>{String(Math.round((activeIndex / (FACE_DATA.length - 1)) * 100)).padStart(3, "0")}%</span>
        <div className="skill-cube-progress">
          <div ref={progressRef} />
        </div>
        <strong>{activeFace.name}</strong>
      </div>

      <div className="skill-scene-strip" aria-hidden="true">
        {FACE_DATA.map((face, index) => (
          <span className={index === activeIndex ? "active" : ""} key={face.face} />
        ))}
      </div>

      <article className="skill-cube-card">
        <small>{activeFace.label} / {activeFace.name}</small>
        <h3>{activeFace.title}</h3>
        <p>{activeFace.body}</p>
      </article>

      <div className="skill-face-caption" aria-hidden="true">
        <span>{activeFace.label}</span>
        <strong>{activeFace.name}</strong>
      </div>
    </div>
  );
}
