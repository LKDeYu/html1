"use client";

import { useEffect, useRef } from "react";

type StarfieldCanvasProps = {
  className?: string;
};

type Star = {
  x: number;
  y: number;
  z: number;
  size: number;
  twinkle: number;
  hue: number;
};

const starCount = 210;

export function StarfieldCanvas({ className = "" }: StarfieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

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

    const createStars = () => {
      stars = Array.from({ length: starCount }, () => ({
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: Math.random() * 0.9 + 0.1,
        size: Math.random() * 1.9 + 0.55,
        twinkle: Math.random() * Math.PI * 2,
        hue: 170 + Math.random() * 70,
      }));
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
      createStars();
    };

    const movePointer = (event: PointerEvent) => {
      pointer.current.tx = (event.clientX / width - 0.5) * 2;
      pointer.current.ty = (event.clientY / height - 0.5) * 2;
    };

    const draw = (time: number) => {
      const isDark = document.documentElement.classList.contains("dark");
      ctx.clearRect(0, 0, width, height);
      pointer.current.x += (pointer.current.tx - pointer.current.x) * 0.045;
      pointer.current.y += (pointer.current.ty - pointer.current.y) * 0.045;

      const centerX = width / 2;
      const centerY = height / 2;
      const focal = Math.min(width, height) * 0.72;
      const drift = reducedMotion.matches ? 0 : time * 0.000018;

      for (const star of stars) {
        const z = star.z;
        const rotate = drift * (1.05 - z);
        const cos = Math.cos(rotate);
        const sin = Math.sin(rotate);
        const rotatedX = star.x * cos - star.y * sin;
        const rotatedY = star.x * sin + star.y * cos;
        const px = centerX + rotatedX * focal * (1.05 + z) + pointer.current.x * 48 * z;
        const py = centerY + rotatedY * focal * (1.05 + z) + pointer.current.y * 34 * z;

        if (px < -20 || px > width + 20 || py < -20 || py > height + 20) {
          continue;
        }

        const pulse = 0.55 + Math.sin(time * 0.0015 + star.twinkle) * 0.28;
        const alpha = isDark ? 0.2 + pulse * 0.58 * z : 0.035 + pulse * 0.1 * z;
        const radius = star.size * (isDark ? 1.15 : 0.88) * (0.65 + z);
        const glow = ctx.createRadialGradient(px, py, 0, px, py, radius * 5);
        glow.addColorStop(0, `hsla(${star.hue}, 96%, ${isDark ? 78 : 56}%, ${alpha})`);
        glow.addColorStop(0.38, `hsla(${star.hue + 12}, 96%, 70%, ${alpha * 0.34})`);
        glow.addColorStop(1, `hsla(${star.hue + 28}, 96%, 68%, 0)`);

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, radius * 5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isDark) {
        ctx.strokeStyle = "rgba(142, 230, 255, 0.06)";
        ctx.lineWidth = 1;
        for (let i = 0; i < stars.length; i += 14) {
          const first = stars[i];
          const second = stars[(i + 9) % stars.length];
          const ax = centerX + first.x * focal * (1 + first.z) + pointer.current.x * 48 * first.z;
          const ay = centerY + first.y * focal * (1 + first.z) + pointer.current.y * 34 * first.z;
          const bx = centerX + second.x * focal * (1 + second.z) + pointer.current.x * 48 * second.z;
          const by = centerY + second.y * focal * (1 + second.z) + pointer.current.y * 34 * second.z;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", movePointer);
    animationFrame = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", movePointer);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-20 h-screen w-screen ${className}`}
    />
  );
}
