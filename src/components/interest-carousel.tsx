/* eslint-disable @next/next/no-img-element */
"use client";

import type { CSSProperties } from "react";

const INTEREST_IMAGES = [
  { src: "/images/interests/reading.png", label: "阅读" },
  { src: "/images/interests/running.png", label: "跑步" },
  { src: "/images/interests/fitness.png", label: "健身" },
  { src: "/images/interests/singing.png", label: "唱歌" },
  { src: "/images/interests/sudoku.jpg", label: "数独" },
  { src: "/images/interests/gomoku.jpg", label: "五子棋" },
  { src: "/images/interests/reading.png", label: "阅读" },
  { src: "/images/interests/running.png", label: "跑步" },
  { src: "/images/interests/fitness.png", label: "健身" },
  { src: "/images/interests/singing.png", label: "唱歌" },
  { src: "/images/interests/sudoku.jpg", label: "数独" },
  { src: "/images/interests/gomoku.jpg", label: "五子棋" },
];

export function InterestCarousel() {
  return (
    <div className="interest-carousel">
      <div className="interest-depth" aria-hidden="true" />
      <div
        className="interest-ring"
        style={{ "--n": INTEREST_IMAGES.length } as CSSProperties}
        aria-hidden="true"
      >
        {INTEREST_IMAGES.map((item, index) => (
          <img
            className="interest-card"
            src={item.src}
            alt=""
            loading="lazy"
            decoding="async"
            style={{ "--i": index, "--n": INTEREST_IMAGES.length } as CSSProperties}
            key={`${item.src}-${index}`}
          />
        ))}
      </div>
      <div className="interest-caption" aria-hidden="true">
        <span>{INTEREST_IMAGES.length}</span>
        <strong>life cards</strong>
      </div>
    </div>
  );
}
