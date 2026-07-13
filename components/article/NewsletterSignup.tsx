"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { subscribeNewsletter } from "@/lib/actions/newsletter";

export function NewsletterSignup() {
  const pathname = usePathname();
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("source_path", pathname);
    setStatus("submitting");
    const res = await subscribeNewsletter(fd);
    if (res.ok) {
      setStatus("done");
      form.reset();
    } else {
      setStatus("error");
      setError(res.error);
    }
  }

  return (
    <section className="container pb-expansive pt-compact">
      <div className="overflow-hidden rounded-[26px] bg-foreground px-6 py-12 text-background sm:px-12 sm:py-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="max-w-[38ch]">
            <p className="mono-label text-background/60">SIGNAL — MONTHLY</p>
            <p className="display-md mt-3 text-background">Insight AV langsung ke inbox Anda.</p>
            <p className="body-md mt-3 text-background/70">
              Kami kirim maksimal 1 email/bulan. Berhenti kapan saja.
            </p>
          </div>

          <div>
            {status === "done" ? (
              <div className="inline-flex items-center gap-2.5 rounded-pill bg-background/10 px-4 py-2.5 ring-1 ring-status/50">
                <span className="h-2 w-2 rounded-full bg-status" />
                <span className="mono-label text-background">TERDAFTAR</span>
                <span className="body-sm text-background/70">Terima kasih — cek inbox Anda.</span>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row" noValidate>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="nama@perusahaan.com"
                  aria-label="Alamat email"
                  className="h-12 flex-1 rounded-pill border border-background/25 bg-background/10 px-5 text-background placeholder:text-background/45 focus-visible:border-background/50 focus-visible:outline-none"
                />
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex h-12 shrink-0 items-center justify-center rounded-pill bg-primary px-7 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
                >
                  {status === "submitting" ? "Mengirim…" : "Berlangganan"}
                </button>
              </form>
            )}
            {status === "error" ? <p className="body-sm mt-2 text-background/70">{error}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
