"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  z: number;
  alpha: number;
};

const STAR_COLOR = "#fff";
const STAR_SIZE = 2;
const STAR_MIN_SCALE = 0.2;
const OVERFLOW_THRESHOLD = 50;

export function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      return;
    }

    let frame = 0;
    let idleTimer = 0;
    let scale = 1;
    let width = 0;
    let height = 0;
    let pointerX: number | null = null;
    let pointerY: number | null = null;
    let touchInput = false;
    let stars: Star[] = [];
    const velocity = { x: 0, y: 0, tx: 0, ty: 0, z: 0.00042 };

    const getStarCount = () => Math.round(Math.min(480, Math.max(190, (window.innerWidth + window.innerHeight) / 7.2)));

    const placeStar = (star: Star) => {
      star.x = Math.random() * width;
      star.y = Math.random() * height;
    };

    const generate = () => {
      stars = Array.from({ length: getStarCount() }, () => ({
        x: 0,
        y: 0,
        z: STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE),
        alpha: 0.32 + Math.random() * 0.42,
      }));
      stars.forEach(placeStar);
    };

    const recycleStar = (star: Star) => {
      let direction = "z";
      const vx = Math.abs(velocity.x);
      const vy = Math.abs(velocity.y);

      if (vx > 1 || vy > 1) {
        const horizontal = vx > vy ? Math.random() < vx / (vx + vy) : Math.random() >= vy / (vx + vy);
        direction = horizontal ? (velocity.x > 0 ? "l" : "r") : velocity.y > 0 ? "t" : "b";
      }

      star.z = STAR_MIN_SCALE + Math.random() * (1 - STAR_MIN_SCALE);
      star.alpha = 0.32 + Math.random() * 0.42;

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
      } else {
        star.x = width * Math.random();
        star.y = height + OVERFLOW_THRESHOLD;
      }
    };

    const resize = () => {
      scale = Math.min(window.devicePixelRatio || 1, 1.35);
      width = Math.floor(window.innerWidth * scale);
      height = Math.floor(window.innerHeight * scale);
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
      context.clearRect(0, 0, width, height);
      context.lineCap = "round";
      context.strokeStyle = STAR_COLOR;

      stars.forEach((star) => {
        context.beginPath();
        context.lineWidth = STAR_SIZE * star.z * scale;
        context.globalAlpha = star.alpha;
        context.moveTo(star.x, star.y);

        const tailLimit = 14 * scale;
        let tailX = velocity.x * 0.68;
        let tailY = velocity.y * 0.68;
        const tailLength = Math.hypot(tailX, tailY);
        if (tailLength > tailLimit) {
          tailX = (tailX / tailLength) * tailLimit;
          tailY = (tailY / tailLength) * tailLimit;
        }
        if (Math.abs(tailX) < 0.1) {
          tailX = 0.28;
        }
        if (Math.abs(tailY) < 0.1) {
          tailY = 0.28;
        }

        context.lineTo(star.x + tailX, star.y + tailY);
        context.stroke();
      });
      context.globalAlpha = 1;
    };

    const schedule = (delay = 0) => {
      if (delay > 0) {
        idleTimer = window.setTimeout(() => {
          idleTimer = 0;
          frame = requestAnimationFrame(step);
        }, delay);
        return;
      }

      frame = requestAnimationFrame(step);
    };

    const step = () => {
      if (document.hidden) {
        schedule(500);
        return;
      }

      update();
      render();
      schedule();
    };

    const movePointer = (x: number, y: number) => {
      const nextX = x * scale;
      const nextY = y * scale;

      if (typeof pointerX === "number" && typeof pointerY === "number") {
        const ox = nextX - pointerX;
        const oy = nextY - pointerY;
        velocity.tx += (ox / (13 * scale)) * (touchInput ? 1 : -1);
        velocity.ty += (oy / (13 * scale)) * (touchInput ? 1 : -1);
        velocity.tx = Math.max(-20, Math.min(20, velocity.tx));
        velocity.ty = Math.max(-20, Math.min(20, velocity.ty));
      }

      pointerX = nextX;
      pointerY = nextY;
    };

    const onPointerMove = (event: PointerEvent) => {
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

    const onPointerLeave = () => {
      pointerX = null;
      pointerY = null;
    };

    resize();
    schedule();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("mouseleave", onPointerLeave);
      window.clearTimeout(idleTimer);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="rymd-canvas" />;
}
