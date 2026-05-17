"use client";

import { useEffect, useRef } from "react";

type StarfieldCanvasProps = {
  className?: string;
};

type Star = {
  x: number;
  y: number;
  z: number;
};

const STAR_COLOR = "#fff";
const STAR_SIZE = 3;
const STAR_MIN_SCALE = 0.2;
const OVERFLOW_THRESHOLD = 50;

export function StarfieldCanvas({ className = "" }: StarfieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let scale = window.devicePixelRatio || 1;
    let width = 0;
    let height = 0;
    let frame = 0;
    let pointerX: number | null = null;
    let pointerY: number | null = null;
    let touchInput = false;
    let stars: Star[] = [];
    const velocity = { x: 0, y: 0, tx: 0, ty: 0, z: 0.00072 };

    const starCount = () => Math.round((window.innerWidth + window.innerHeight) / 5.2);

    const placeStar = (star: Star) => {
      star.x = Math.random() * width;
      star.y = Math.random() * height;
    };

    const generate = () => {
      stars = Array.from({ length: starCount() }, () => ({
        x: 0,
        y: 0,
        z: STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE),
      }));
      stars.forEach(placeStar);
    };

    const recycleStar = (star: Star) => {
      let direction = "z";
      const vx = Math.abs(velocity.x);
      const vy = Math.abs(velocity.y);

      if (vx > 1 || vy > 1) {
        let axis: "h" | "v";

        if (vx > vy) {
          axis = Math.random() < vx / (vx + vy) ? "h" : "v";
        } else {
          axis = Math.random() < vy / (vx + vy) ? "v" : "h";
        }

        if (axis === "h") {
          direction = velocity.x > 0 ? "l" : "r";
        } else {
          direction = velocity.y > 0 ? "t" : "b";
        }
      }

      star.z = STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE);

      if (direction === "z") {
        star.z = 0.1;
        star.x = Math.random() * width;
        star.y = Math.random() * height;
      } else if (direction === "l") {
        star.x = -OVERFLOW_THRESHOLD;
        star.y = height * Math.random();
      } else if (direction === "r") {
        star.x = width + OVERFLOW_THRESHOLD;
        star.y = height * Math.random();
      } else if (direction === "t") {
        star.x = width * Math.random();
        star.y = -OVERFLOW_THRESHOLD;
      } else if (direction === "b") {
        star.x = width * Math.random();
        star.y = height + OVERFLOW_THRESHOLD;
      }
    };

    const resize = () => {
      scale = window.devicePixelRatio || 1;
      width = window.innerWidth * scale;
      height = window.innerHeight * scale;

      canvas.width = width;
      canvas.height = height;
      generate();
    };

    const update = () => {
      velocity.tx *= 0.96;
      velocity.ty *= 0.96;
      velocity.x += (velocity.tx - velocity.x) * 0.8;
      velocity.y += (velocity.ty - velocity.y) * 0.8;

      stars.forEach((star) => {
        star.x += velocity.x * star.z;
        star.y += velocity.y * star.z;

        star.x += (star.x - width / 2) * velocity.z * star.z;
        star.y += (star.y - height / 2) * velocity.z * star.z;
        star.z += velocity.z;

        if (
          star.x < -OVERFLOW_THRESHOLD ||
          star.x > width + OVERFLOW_THRESHOLD ||
          star.y < -OVERFLOW_THRESHOLD ||
          star.y > height + OVERFLOW_THRESHOLD
        ) {
          recycleStar(star);
        }
      });
    };

    const render = () => {
      stars.forEach((star) => {
        context.beginPath();
        context.lineCap = "round";
        context.lineWidth = STAR_SIZE * star.z * scale;
        context.globalAlpha = 0.5 + 0.5 * Math.random();
        context.strokeStyle = STAR_COLOR;

        context.moveTo(star.x, star.y);

        let tailX = velocity.x * 2;
        let tailY = velocity.y * 2;

        if (Math.abs(tailX) < 0.1) {
          tailX = 0.5;
        }
        if (Math.abs(tailY) < 0.1) {
          tailY = 0.5;
        }

        context.lineTo(star.x + tailX, star.y + tailY);
        context.stroke();
      });
      context.globalAlpha = 1;
    };

    const step = () => {
      context.clearRect(0, 0, width, height);
      update();
      render();
      frame = requestAnimationFrame(step);
    };

    const movePointer = (x: number, y: number) => {
      const scaledX = x * scale;
      const scaledY = y * scale;

      if (typeof pointerX === "number" && typeof pointerY === "number") {
        const ox = scaledX - pointerX;
        const oy = scaledY - pointerY;

        velocity.tx += (ox / (8 * scale)) * (touchInput ? 1 : -1);
        velocity.ty += (oy / (8 * scale)) * (touchInput ? 1 : -1);
      }

      pointerX = scaledX;
      pointerY = scaledY;
    };

    const onMouseMove = (event: PointerEvent) => {
      touchInput = false;
      movePointer(event.clientX, event.clientY);
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      touchInput = true;
      movePointer(touch.clientX, touch.clientY);
    };

    const onMouseLeave = () => {
      pointerX = null;
      pointerY = null;
    };

    resize();
    frame = requestAnimationFrame(step);

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`rymd-canvas ${className}`} />;
}
