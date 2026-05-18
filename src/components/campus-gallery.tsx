/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const CAMPUS_IMAGES = [
  "/images/campus/scenery-1.jpg",
  "/images/campus/food-1.jpg",
  "/images/campus/study-1.jpg",
  "/images/campus/game-1.jpg",
  "/images/campus/scenery-2.jpg",
  "/images/campus/food-2.jpg",
  "/images/campus/study-2.jpg",
  "/images/campus/game-2.jpg",
  "/images/campus/scenery-3.jpg",
  "/images/campus/food-3.jpg",
  "/images/campus/study-3.jpg",
  "/images/campus/game-3.jpg",
  "/images/campus/study-4.jpeg",
  "/images/campus/game-4.jpg",
  "/images/campus/game-5.jpg",
];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function getCampusProgress(fallbackEl: HTMLElement) {
  const trigger = ScrollTrigger.getById("story-scroll");

  if (trigger) {
    const sceneStep = 1.42;
    const totalUnits = 7 * sceneStep;
    const storyProgress = (window.scrollY - trigger.start) / (trigger.end - trigger.start);
    const start = (3 * sceneStep) / totalUnits;
    const end = (4 * sceneStep) / totalUnits;
    return clamp((storyProgress - start) / (end - start));
  }

  const rect = fallbackEl.getBoundingClientRect();
  return clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
}

export function CampusGallery() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    let frame = 0;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const progress = getCampusProgress(root);
      root.style.setProperty("--gallery-progress", progress.toFixed(4));
      root.style.setProperty("--gallery-center-scale", String(4.2 - progress * 3.2));
      root.style.setProperty("--gallery-layer-alpha", String(clamp((progress - 0.36) / 0.42)));
      root.style.setProperty("--gallery-layer-scale", String(clamp((progress - 0.24) / 0.58)));
    };

    draw();

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={rootRef} className="campus-gallery">
      <div className="campus-gallery-grid" aria-hidden="true">
        <div className="campus-layer campus-layer-outer">
          {CAMPUS_IMAGES.slice(0, 6).map((src) => (
            <div key={src}>
              <img src={src} alt="" />
            </div>
          ))}
        </div>
        <div className="campus-layer campus-layer-inner">
          {CAMPUS_IMAGES.slice(6, 12).map((src) => (
            <div key={src}>
              <img src={src} alt="" />
            </div>
          ))}
        </div>
        <div className="campus-layer campus-layer-center">
          {CAMPUS_IMAGES.slice(12, 14).map((src) => (
            <div key={src}>
              <img src={src} alt="" />
            </div>
          ))}
        </div>
        <div className="campus-scaler">
          <img src={CAMPUS_IMAGES[14]} alt="校园生活照片" />
        </div>
      </div>
    </div>
  );
}
