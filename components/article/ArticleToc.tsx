"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import type { Heading } from "@/lib/article";
import { cn } from "@/lib/utils";

export function ArticleToc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string | null>(headings[0]?.id ?? null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings]);

  const onJump = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setActive(id);
    history.replaceState(null, "", `#${id}`);
  };

  const list = (
    <ul className="space-y-2.5">
      {headings.map((h) => {
        const isActive = active === h.id;
        return (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(e) => onJump(e, h.id)}
              className="group flex items-center gap-3"
              aria-current={isActive ? "location" : undefined}
            >
              <span
                aria-hidden
                className={cn(
                  "h-0.5 shrink-0 rounded-full transition-all duration-300",
                  isActive ? "w-5 bg-primary" : "w-2.5 bg-border group-hover:bg-foreground/40",
                )}
              />
              <span className={cn("body-sm transition-colors", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                {h.text}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav aria-label="Daftar isi">
      <div className="hidden lg:block">
        <p className="mono-label mb-4 text-muted-foreground">DAFTAR ISI</p>
        {list}
      </div>
      <details className="rounded-lg border border-border px-4 py-3 lg:hidden">
        <summary className="mono-label cursor-pointer list-none text-muted-foreground [&::-webkit-details-marker]:hidden">
          DAFTAR ISI
        </summary>
        <div className="mt-4">{list}</div>
      </details>
    </nav>
  );
}
