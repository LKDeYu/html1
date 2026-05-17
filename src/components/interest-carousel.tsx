/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const INTEREST_IMAGES = [
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=560&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=560&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=560&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=560&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=560&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=560&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=560&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=560&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=560&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=560&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=560&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=560&auto=format&fit=crop&q=70",
];

const SCENE_STEP = 1.42;
const SCENE_COUNT = 8;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function getInterestProgress(fallbackEl: HTMLElement) {
  const trigger = ScrollTrigger.getById("story-scroll");

  if (trigger) {
    const totalUnits = SCENE_COUNT * SCENE_STEP;
    const storyProgress = (window.scrollY - trigger.start) / (trigger.end - trigger.start);
    const start = (SCENE_STEP * 4) / totalUnits;
    const end = (SCENE_STEP * 5) / totalUnits;
    return clamp((storyProgress - start) / (end - start));
  }

  const rect = fallbackEl.getBoundingClientRect();
  return clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
}

export function InterestCarousel() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const ring = ringRef.current;
    if (!root || !ring) {
      return;
    }

    const cards = Array.from(ring.querySelectorAll<HTMLElement>(".interest-card"));
    let frame = 0;
    const pointer = { x: 0, y: 0 };

    const onPointerMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const render = () => {
      frame = requestAnimationFrame(render);
      const progress = getInterestProgress(root);
      const drift = performance.now() * 0.00018;
      const phase = progress * Math.PI * 2 + drift + pointer.x * 0.16;
      const rx = -7 + pointer.y * 5;
      const radiusX = Math.min(root.clientWidth * 0.24, 430);

      ring.style.transform = `translateX(24vw) rotateX(${rx}deg)`;
      root.style.setProperty("--interest-progress", progress.toFixed(4));
      root.style.setProperty("--interest-ring-alpha", String(clamp((progress - 0.08) / 0.22)));

      cards.forEach((card, index) => {
        const angle = phase + (index / cards.length) * Math.PI * 2;
        const depth = (Math.sin(angle) + 1) / 2;
        const x = Math.cos(angle) * radiusX;
        const y = Math.sin(angle * 1.35) * 34 + pointer.y * 10;
        const scale = 0.54 + depth * 0.56;
        const rotateY = Math.cos(angle) * -32;

        card.style.opacity = String(0.28 + depth * 0.72);
        card.style.zIndex = String(Math.round(depth * 100));
        card.style.filter = `saturate(${0.75 + depth * 0.45}) brightness(${0.78 + depth * 0.24})`;
        card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) rotateY(${rotateY}deg) scale(${scale})`;
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
    <div ref={rootRef} className="interest-carousel">
      <div className="interest-depth" aria-hidden="true" />
      <div
        ref={ringRef}
        className="interest-ring"
        style={{ "--n": INTEREST_IMAGES.length } as CSSProperties}
        aria-hidden="true"
      >
        {INTEREST_IMAGES.map((src, index) => (
          <img
            className="interest-card"
            src={src}
            alt=""
            style={{ "--i": index } as CSSProperties}
            key={`${src}-${index}`}
          />
        ))}
      </div>
      <div className="interest-caption" aria-hidden="true">
        <span>12</span>
        <strong>photo cards</strong>
      </div>
    </div>
  );
}
