"use client";

import { useEffect, useRef } from "react";

type StarfieldCanvasProps = {
  className?: string;
};

type Star = {
  x: number;
  y: number;
  z: number;
  drift: number;
  alpha: number;
  size: number;
};

const density = 2.9;
const maxInputVelocity = 52;

export function StarfieldCanvas({ className = "" }: StarfieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const velocity = useRef({ x: 0, y: 0, tx: 0, ty: 0, z: 0.00052 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      return;
    }

    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let stars: Star[] = [];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const random = (min: number, max: number) => Math.random() * (max - min) + min;

    const placeStar = (star: Star) => {
      star.x = random(-width * 0.12, width * 1.12);
      star.y = random(-height * 0.12, height * 1.12);
      star.z = random(0.2, 1);
      star.drift = random(-0.42, 0.42);
      star.alpha = random(0.22, 0.94);
      star.size = random(0.7, 1.9);
    };

    const recycleStar = (star: Star) => {
      const velocityState = velocity.current;

      if (star.x > width || star.x < 0 || star.y > height || star.y < 0) {
        if (Math.abs(velocityState.x) > Math.abs(velocityState.y)) {
          star.x = velocityState.x > 0 ? 0 : width;
          star.y = random(0, height);
        } else {
          star.x = random(0, width);
          star.y = velocityState.y > 0 ? 0 : height;
        }

        star.z = random(0.2, 1);
      }
    };

    const populate = () => {
      const count = Math.round((width + height) / density);
      stars = Array.from({ length: count }, () => {
        const star = { x: 0, y: 0, z: 0, drift: 0, alpha: 0, size: 1 };
        placeStar(star);
        return star;
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      pointer.current.x = width / 2;
      pointer.current.y = height / 2;
      pointer.current.ox = pointer.current.x;
      pointer.current.oy = pointer.current.y;
      populate();
    };

    const moveInput = (x: number, y: number) => {
      pointer.current.x = x;
      pointer.current.y = y;
      velocity.current.tx += (pointer.current.x - pointer.current.ox) * 0.06;
      velocity.current.ty += (pointer.current.y - pointer.current.oy) * 0.06;
      pointer.current.ox = pointer.current.x;
      pointer.current.oy = pointer.current.y;
    };

    const movePointer = (event: PointerEvent) => {
      moveInput(event.clientX, event.clientY);
    };

    const moveTouch = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      moveInput(touch.clientX, touch.clientY);
    };

    const draw = () => {
      animationFrame = requestAnimationFrame(draw);

      const velocityState = velocity.current;

      velocityState.tx *= 0.94;
      velocityState.ty *= 0.94;
      velocityState.x += (velocityState.tx - velocityState.x) * 0.18;
      velocityState.y += (velocityState.ty - velocityState.y) * 0.18;
      velocityState.x = Math.max(-maxInputVelocity, Math.min(maxInputVelocity, velocityState.x));
      velocityState.y = Math.max(-maxInputVelocity, Math.min(maxInputVelocity, velocityState.y));

      if (reducedMotion.matches) {
        velocityState.x *= 0.08;
        velocityState.y *= 0.08;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(3, 7, 18, 0.2)";
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (const star of stars) {
        star.x += velocityState.x * star.z;
        star.y += velocityState.y * star.z;
        star.x += star.drift * star.z;
        star.y += Math.sin(star.x * 0.004 + star.drift) * 0.08;

        star.x += (star.x - width / 2) * velocityState.z * star.z;
        star.y += (star.y - height / 2) * velocityState.z * star.z;
        star.z += velocityState.z;

        recycleStar(star);

        const tailX = velocityState.x * 2;
        const tailY = velocityState.y * 2;
        const tailZx = (star.x - width / 2) * velocityState.z * 26;
        const tailZy = (star.y - height / 2) * velocityState.z * 26;
        const z = Math.min(star.z, 1.8);
        const alpha = Math.min(0.86, star.alpha * z * 0.78);
        const hue = 192 + z * 34 + star.drift * 20;

        ctx.beginPath();
        ctx.lineWidth = Math.max(0.4, z * star.size);
        ctx.strokeStyle = `hsla(${hue}, 96%, 80%, ${alpha})`;
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x + tailX + tailZx, star.y + tailY + tailZy);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
    };

    resize();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", movePointer, { passive: true });
    window.addEventListener("touchmove", moveTouch, { passive: true });
    animationFrame = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", movePointer);
      window.removeEventListener("touchmove", moveTouch);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`rymd-canvas ${className}`} />;
}
