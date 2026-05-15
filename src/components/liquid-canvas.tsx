"use client";

import { useEffect, useRef } from "react";

type LiquidCanvasProps = {
  className?: string;
};

type FluidBand = {
  y: number;
  amplitude: number;
  speed: number;
  hue: number;
  alpha: number;
  phase: number;
  thickness: number;
};

const lightPalette = [172, 188, 199, 210, 166];
const darkPalette = [196, 210, 236, 268, 172];

export function LiquidCanvas({ className = "" }: LiquidCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0, y: 0, active: false });

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
    let bands: FluidBand[] = [];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const createBands = () => {
      const count = 9;
      const palette = document.documentElement.classList.contains("dark")
        ? darkPalette
        : lightPalette;

      bands = Array.from({ length: count }, (_, index) => ({
        y: (height / (count + 1)) * (index + 1),
        amplitude: 26 + Math.random() * 54,
        speed: 0.18 + Math.random() * 0.42,
        hue: palette[index % palette.length],
        alpha: 0.2 + Math.random() * 0.16,
        phase: Math.random() * Math.PI * 2,
        thickness: 58 + Math.random() * 96,
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
      createBands();
    };

    const movePointer = (event: PointerEvent) => {
      mouse.current.x = event.clientX;
      mouse.current.y = event.clientY;
      mouse.current.active = true;
    };

    const leavePointer = () => {
      mouse.current.active = false;
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      const isDark = document.documentElement.classList.contains("dark");
      const base = ctx.createLinearGradient(0, 0, width, height);
      if (isDark) {
        base.addColorStop(0, "rgba(6, 12, 28, 0.82)");
        base.addColorStop(0.48, "rgba(8, 28, 46, 0.74)");
        base.addColorStop(1, "rgba(5, 5, 19, 0.84)");
      } else {
        base.addColorStop(0, "rgba(230, 255, 253, 0.72)");
        base.addColorStop(0.5, "rgba(219, 241, 255, 0.64)");
        base.addColorStop(1, "rgba(245, 255, 248, 0.74)");
      }
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = isDark ? "screen" : "source-over";
      const speed = reducedMotion.matches ? 0.1 : 1;
      const t = time * 0.001;

      for (const band of bands) {
        const gradient = ctx.createLinearGradient(0, band.y - band.thickness, width, band.y);
        gradient.addColorStop(0, `hsla(${band.hue}, 90%, 68%, 0)`);
        gradient.addColorStop(0.32, `hsla(${band.hue}, 90%, 68%, ${band.alpha})`);
        gradient.addColorStop(
          0.66,
          `hsla(${band.hue + 24}, 92%, 66%, ${band.alpha * 0.8})`,
        );
        gradient.addColorStop(1, `hsla(${band.hue + 44}, 94%, 68%, 0)`);

        ctx.save();
        ctx.filter = "blur(22px)";
        ctx.strokeStyle = gradient;
        ctx.lineWidth = band.thickness;
        ctx.lineCap = "round";
        ctx.beginPath();

        const pointerShift =
          mouse.current.active && Math.abs(mouse.current.y - band.y) < 220
            ? (1 - Math.abs(mouse.current.y - band.y) / 220) * 34
            : 0;

        for (let x = -80; x <= width + 80; x += 42) {
          const wave =
            Math.sin(x * 0.006 + t * band.speed * speed + band.phase) * band.amplitude +
            Math.sin(x * 0.014 - t * 0.35 + band.phase) * 18;
          const mouseWave =
            mouse.current.active && Math.abs(x - mouse.current.x) < 260
              ? pointerShift * Math.cos((x - mouse.current.x) * 0.018)
              : 0;
          const y = band.y + wave + mouseWave;

          if (x === -80) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      ctx.globalCompositeOperation = isDark ? "screen" : "multiply";
      ctx.strokeStyle = isDark ? "rgba(150, 230, 255, 0.08)" : "rgba(20, 170, 160, 0.08)";
      ctx.lineWidth = 1;

      for (let y = 0; y < height + 80; y += 72) {
        ctx.beginPath();
        for (let x = -40; x < width + 40; x += 40) {
          const wave = Math.sin(x * 0.008 + t * 0.8 + y * 0.01) * 12;
          if (x === -40) {
            ctx.moveTo(x, y + wave);
          } else {
            ctx.lineTo(x, y + wave);
          }
        }
        ctx.stroke();
      }

      animationFrame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", movePointer);
    window.addEventListener("pointerleave", leavePointer);
    animationFrame = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", movePointer);
      window.removeEventListener("pointerleave", leavePointer);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-30 h-screen w-screen ${className}`}
    />
  );
}
