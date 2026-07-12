"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

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

// Interactive particle network on a 2D canvas — particles drift, connect with
// hairlines when close, and repel from the cursor. Token-driven (amber nodes,
// theme-adaptive links), reduced-motion safe, pauses off-screen.
export function ParticleNetwork({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const { resolvedTheme } = useTheme();
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

    const dot = readHsl(container, "--primary", [217, 150, 46]);
    const fg = readHsl(container, "--foreground", [235, 233, 224]);
    const dotColor = `rgba(${dot[0]},${dot[1]},${dot[2]},0.75)`;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const mouse: { x: number | null; y: number | null; radius: number } = { x: null, y: null, radius: 160 };
    type P = { x: number; y: number; vx: number; vy: number; size: number };
    let particles: P[] = [];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const build = () => {
      const n = Math.min(200, Math.round((w * h) / 9000));
      particles = Array.from({ length: n }, () => ({
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-0.2, 0.2),
        vy: rand(-0.2, 0.2),
        size: rand(1, 3),
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        if (!reduce) {
          if (p.x > w || p.x < 0) p.vx = -p.vx;
          if (p.y > h || p.y < 0) p.vy = -p.vy;
          if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < mouse.radius + p.size) {
              const f = (mouse.radius - dist) / mouse.radius;
              p.x -= (dx / dist) * f * 4;
              p.y -= (dy / dist) * f * 4;
            }
          }
          p.x += p.vx;
          p.y += p.vy;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
      }

      const maxD = (w / 7) * (h / 7);
      for (let a = 0; a < particles.length; a++) {
        const pa = particles[a]!;
        for (let b = a + 1; b < particles.length; b++) {
          const pb = particles[b]!;
          const d2 = (pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2;
          if (d2 >= maxD) continue;
          const op = 1 - d2 / 20000;
          if (op <= 0) continue;
          const near =
            mouse.x !== null && mouse.y !== null && Math.hypot(pa.x - mouse.x, pa.y - mouse.y) < mouse.radius;
          ctx.strokeStyle = near
            ? `rgba(${fg[0]},${fg[1]},${fg[2]},${op})`
            : `rgba(${dot[0]},${dot[1]},${dot[2]},${op * 0.45})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }
      }
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduce) draw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    if (reduce) {
      draw();
      return () => {
        ro.disconnect();
        canvas.remove();
      };
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);

    let raf = 0;
    let running = false;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver(([e]) => (e?.isIntersecting ? start() : stop()), {
      rootMargin: "120px",
    });
    io.observe(container);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      canvas.remove();
    };
  }, [reduce, resolvedTheme]);

  return <div ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0", className)} />;
}
