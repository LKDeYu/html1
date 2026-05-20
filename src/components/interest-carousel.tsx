/* eslint-disable @next/next/no-img-element */
"use client";

import type { CSSProperties } from "react";

const INTEREST_IMAGES = [
  { src: "/images/interests/cards/reading.webp", label: "Reading" },
  { src: "/images/interests/cards/running.webp", label: "Running" },
  { src: "/images/interests/cards/fitness.webp", label: "Fitness" },
  { src: "/images/interests/cards/singing.webp", label: "Singing" },
  { src: "/images/interests/cards/sudoku.webp", label: "Sudoku" },
  { src: "/images/interests/cards/gomoku.webp", label: "Gomoku" },
  { src: "/images/interests/cards/reading.webp", label: "Reading" },
  { src: "/images/interests/cards/running.webp", label: "Running" },
  { src: "/images/interests/cards/fitness.webp", label: "Fitness" },
  { src: "/images/interests/cards/singing.webp", label: "Singing" },
  { src: "/images/interests/cards/sudoku.webp", label: "Sudoku" },
  { src: "/images/interests/cards/gomoku.webp", label: "Gomoku" },
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
