"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { STORY_TOTAL_UNITS, getStorySceneDuration, getStorySceneStart } from "@/components/story-scene-timing";

type DeferredStoryVisualProps = {
  sceneIndex: number;
  children: ReactNode;
  fallbackClassName?: string;
  initiallyReady?: boolean;
};

const getPreloadMargin = (sceneIndex: number) => {
  if (sceneIndex <= 0) {
    return 0.36;
  }

  if (sceneIndex <= 2) {
    return 1.25;
  }

  return 0.95;
};

export function DeferredStoryVisual({
  sceneIndex,
  children,
  fallbackClassName,
  initiallyReady = false,
}: DeferredStoryVisualProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(initiallyReady);

  useEffect(() => {
    if (ready) {
      return;
    }

    let cancelled = false;
    let frame = 0;
    let timer = 0;
    const sceneStart = getStorySceneStart(sceneIndex);
    const sceneEnd = sceneStart + getStorySceneDuration(sceneIndex);
    const preloadMargin = getPreloadMargin(sceneIndex);

    const shouldMount = () => {
      const trigger = ScrollTrigger.getById("story-scroll");

      if (trigger) {
        const storyUnit = ((window.scrollY - trigger.start) / (trigger.end - trigger.start)) * STORY_TOTAL_UNITS;
        return storyUnit >= sceneStart - preloadMargin && storyUnit <= sceneEnd + 0.35;
      }

      if (window.matchMedia("(min-width: 861px)").matches) {
        return false;
      }

      const el = rootRef.current;
      if (!el) {
        return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.top <= window.innerHeight * 1.8 && rect.bottom >= -window.innerHeight * 0.5;
    };

    const scheduleCheck = () => {
      if (cancelled || timer) {
        return;
      }

      timer = window.setTimeout(() => {
        timer = 0;
        frame = requestAnimationFrame(check);
      }, 180);
    };

    const check = () => {
      if (cancelled) {
        return;
      }

      if (shouldMount()) {
        setReady(true);
        return;
      }

      scheduleCheck();
    };

    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = requestAnimationFrame(() => {
        frame = 0;
        check();
      });
    };

    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [ready, sceneIndex]);

  return (
    <div ref={rootRef} className="deferred-story-visual">
      {ready ? children : <div className={fallbackClassName ?? "story-visual-placeholder"} aria-hidden="true" />}
    </div>
  );
}
