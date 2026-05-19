"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";

export const STORY_SCROLL_DISTANCE = 20400;
export const STORY_SCENE_DURATIONS = [1.18, 2.35, 2.55, 1.45, 1.3, 1.2, 1.05] as const;
export const STORY_SCENE_COUNT = STORY_SCENE_DURATIONS.length;
export const STORY_TOTAL_UNITS = STORY_SCENE_DURATIONS.reduce((sum, duration) => sum + duration, 0);

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function getStorySceneStart(sceneIndex: number) {
  return STORY_SCENE_DURATIONS.slice(0, sceneIndex).reduce((sum, duration) => sum + duration, 0);
}

export function getStorySceneDuration(sceneIndex: number) {
  return STORY_SCENE_DURATIONS[sceneIndex] ?? STORY_SCENE_DURATIONS[STORY_SCENE_DURATIONS.length - 1];
}

export function getStorySceneProgress(sceneIndex: number, fallbackEl: HTMLElement, startFraction = 0, endFraction = 1) {
  const trigger = ScrollTrigger.getById("story-scroll");

  if (trigger) {
    const storyUnit = ((window.scrollY - trigger.start) / (trigger.end - trigger.start)) * STORY_TOTAL_UNITS;
    const sceneStart = getStorySceneStart(sceneIndex);
    const sceneDuration = getStorySceneDuration(sceneIndex);
    const start = sceneStart + clamp(startFraction) * sceneDuration;
    const end = sceneStart + clamp(endFraction, startFraction + 0.01, 1) * sceneDuration;
    return clamp((storyUnit - start) / (end - start));
  }

  const rect = fallbackEl.getBoundingClientRect();
  return clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
}

export function isStorySceneActive(sceneIndex: number, fallbackEl: HTMLElement, margin = 0.35) {
  const trigger = ScrollTrigger.getById("story-scroll");

  if (trigger) {
    const storyUnit = ((window.scrollY - trigger.start) / (trigger.end - trigger.start)) * STORY_TOTAL_UNITS;
    const start = getStorySceneStart(sceneIndex);
    const end = start + getStorySceneDuration(sceneIndex);
    return storyUnit >= start - margin && storyUnit <= end + margin;
  }

  const rect = fallbackEl.getBoundingClientRect();
  return rect.bottom >= -window.innerHeight * 0.25 && rect.top <= window.innerHeight * 1.25;
}
