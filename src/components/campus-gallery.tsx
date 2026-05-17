/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const CAMPUS_IMAGES = [
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1562774053-701939374585?w=900&auto=format&fit=crop&q=80",
];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function getCampusProgress(fallbackEl: HTMLElement) {
  const trigger = ScrollTrigger.getById("story-scroll");

  if (trigger) {
    const sceneStep = 1.42;
    const totalUnits = 8 * sceneStep;
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
          <img src={CAMPUS_IMAGES[14]} alt="校园生活占位图" />
        </div>
      </div>
    </div>
  );
}
