/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef } from "react";
import { getStorySceneProgress, isStorySceneActive } from "@/components/story-scene-timing";

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
  "/images/campus/food-3-lite.jpg",
  "/images/campus/study-3.jpg",
  "/images/campus/game-3.jpg",
  "/images/campus/study-4-lite.jpg",
  "/images/campus/game-4.jpg",
  "/images/campus/game-5.jpg",
];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function CampusGallery() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    let frame = 0;
    let idleTimer = 0;

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
      if (document.hidden || !isStorySceneActive(3, root, 0.35)) {
        schedule(document.hidden ? 500 : 180);
        return;
      }

      const progress = getStorySceneProgress(3, root, 0.02, 0.56);
      root.style.setProperty("--gallery-progress", progress.toFixed(4));
      root.style.setProperty("--gallery-center-scale", String(2.5 - progress * 1.25));
      root.style.setProperty("--gallery-layer-alpha", String(clamp((progress - 0.04) / 0.18)));
      root.style.setProperty("--gallery-layer-scale", String(clamp((progress - 0.02) / 0.24)));
      schedule();
    };

    schedule();

    return () => {
      window.clearTimeout(idleTimer);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} className="campus-gallery">
      <div className="campus-gallery-grid" aria-hidden="true">
        <div className="campus-layer campus-layer-outer">
          {CAMPUS_IMAGES.slice(0, 6).map((src) => (
            <div key={src}>
              <img src={src} alt="" loading="lazy" decoding="async" />
            </div>
          ))}
        </div>
        <div className="campus-layer campus-layer-inner">
          {CAMPUS_IMAGES.slice(6, 12).map((src) => (
            <div key={src}>
              <img src={src} alt="" loading="lazy" decoding="async" />
            </div>
          ))}
        </div>
        <div className="campus-layer campus-layer-center">
          {CAMPUS_IMAGES.slice(12, 14).map((src) => (
            <div key={src}>
              <img src={src} alt="" loading="lazy" decoding="async" />
            </div>
          ))}
        </div>
        <div className="campus-scaler">
          <img
            src={CAMPUS_IMAGES[14]}
            alt="campus life photo"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      </div>
    </div>
  );
}
