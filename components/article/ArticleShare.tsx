"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

const iconBtn =
  "inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-inset ring-border text-muted-foreground transition-colors hover:text-foreground hover:ring-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ArticleShare({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [nativeShare, setNativeShare] = useState(false);

  useEffect(() => {
    setNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const currentUrl = () => (typeof window !== "undefined" ? window.location.href : "");
  const enc = encodeURIComponent;
  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="mono-label mr-1 text-muted-foreground">BAGIKAN</span>

      <button
        type="button"
        onClick={copy}
        className="inline-flex h-9 items-center gap-2 rounded-pill px-4 text-sm ring-1 ring-inset ring-border text-muted-foreground transition-colors hover:text-foreground hover:ring-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
          <path d="M9 13a4 4 0 0 0 5.66 0l3-3A4 4 0 1 0 12 4.34l-1 1M15 11a4 4 0 0 0-5.66 0l-3 3A4 4 0 1 0 12 19.66l1-1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {copied ? "Tersalin" : "Salin Link"}
      </button>

      {nativeShare ? (
        <button
          type="button"
          aria-label="Bagikan"
          onClick={() => navigator.share({ title, url: currentUrl() }).catch(() => {})}
          className={iconBtn}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 3v13M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}

      <button
        type="button"
        aria-label="Bagikan ke WhatsApp"
        onClick={() => {
          trackEvent("cta_click", { context: "share_whatsapp" });
          open(`https://wa.me/?text=${enc(`${title} ${currentUrl()}`)}`);
        }}
        className={iconBtn}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.03c-.24.68-1.42 1.32-1.94 1.36-.5.05-.96.24-3.22-.67-2.72-1.07-4.45-3.85-4.58-4.03-.13-.18-1.1-1.47-1.1-2.8 0-1.32.7-1.97.94-2.24.24-.27.53-.34.7-.34l.5.01c.16.01.38-.06.6.46.22.53.76 1.85.83 1.98.07.13.11.29.02.47-.09.18-.13.29-.27.44l-.4.47c-.13.13-.27.28-.12.54.16.27.7 1.15 1.5 1.87 1.03.92 1.9 1.2 2.17 1.34.27.13.42.11.58-.07.16-.18.67-.78.85-1.05.18-.27.35-.22.6-.13.24.09 1.55.73 1.82.86.27.13.44.2.51.31.07.11.07.63-.17 1.32Z" />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Bagikan ke LinkedIn"
        onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${enc(currentUrl())}`)}
        className={iconBtn}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M6.94 5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0ZM3.3 8.4h3.28V21H3.3V8.4Zm5.36 0h3.14v1.72h.05c.44-.83 1.5-1.7 3.1-1.7 3.31 0 3.92 2.18 3.92 5.02V21h-3.27v-4.98c0-1.19-.02-2.72-1.66-2.72-1.66 0-1.91 1.3-1.91 2.64V21H8.66V8.4Z" />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Bagikan ke X"
        onClick={() => open(`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(currentUrl())}`)}
        className={iconBtn}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
          <path d="M18.24 2.25h3.31l-7.23 8.26L22.5 21.75h-6.56l-5.14-6.72-5.88 6.72H1.6l7.74-8.84L1.5 2.25h6.73l4.64 6.14 5.37-6.14Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z" />
        </svg>
      </button>
    </div>
  );
}
