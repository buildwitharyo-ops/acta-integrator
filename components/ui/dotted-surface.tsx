"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type DottedSurfaceProps = ComponentPropsWithoutRef<"div">;

const COLS = 46;
const ROWS = 22;

function readHsl(el: Element, name: string, fallback: [number, number, number]): [number, number, number] {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const m = raw.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!m) return fallback;
  const h = Number(m[1]);
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const o = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g] = [c, x];
  else if (h < 120) [r, g] = [x, c];
  else if (h < 180) [g, b] = [c, x];
  else if (h < 240) [g, b] = [x, c];
  else if (h < 300) [r, b] = [x, c];
  else [r, b] = [c, x];
  return [Math.round((r + o) * 255), Math.round((g + o) * 255), Math.round((b + o) * 255)];
}

// A wave field of dots receding into the distance — the same effect as the three.js
// "dotted surface", rebuilt on a lightweight 2D canvas (no WebGL dep), scoped to its
// parent section, token-themed, and reduced-motion safe.
export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;display:block";
    container.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      canvas.remove();
      return;
    }

    const base = readHsl(container, "--foreground", [235, 233, 224]);
    const accent = readHsl(container, "--primary", [217, 150, 46]);

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const draw = (count: number) => {
      ctx.clearRect(0, 0, width, height);
      if (width === 0 || height === 0) return;
      const cx = width / 2;
      const horizon = height * 0.14;
      const front = height * 1.02;
      const colGap = width / (COLS * 0.6);
      const amp = height * 0.055;

      for (let iy = 0; iy < ROWS; iy++) {
        const rowT = iy / (ROWS - 1);
        const persp = 0.32 + rowT * rowT * 0.68;
        const baseY = horizon + Math.pow(rowT, 1.7) * (front - horizon);
        const alpha = 0.05 + rowT * 0.32;
        const radius = 0.6 + rowT * 1.9;
        for (let ix = 0; ix < COLS; ix++) {
          const gx = ix - (COLS - 1) / 2;
          const wave = (Math.sin((ix + count) * 0.3) + Math.sin((iy + count) * 0.5)) * amp * persp;
          const x = cx + gx * colGap * persp;
          if (x < -6 || x > width + 6) continue;
          const y = baseY - wave;
          const crest = Math.max(0, (wave / (amp * persp) + 2) / 4 - 0.55) / 0.45;
          const r = base[0] + (accent[0] - base[0]) * crest * 0.9;
          const g = base[1] + (accent[1] - base[1]) * crest * 0.9;
          const b = base[2] + (accent[2] - base[2]) * crest * 0.9;
          ctx.beginPath();
          ctx.arc(x, y, radius * persp, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;
          ctx.fill();
        }
      }
    };

    if (reduce) {
      draw(0);
      return () => {
        ro.disconnect();
        canvas.remove();
      };
    }

    let raf = 0;
    let count = 0;
    let running = false;
    const loop = () => {
      draw(count);
      count += 0.08;
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    // Only animate while the surface is on screen.
    const io = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? start() : stop()),
      { rootMargin: "120px" },
    );
    io.observe(container);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      canvas.remove();
    };
  }, [reduce]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      {...props}
    />
  );
}
