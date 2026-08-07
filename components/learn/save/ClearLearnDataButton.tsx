"use client";

import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { clearLearnData, isStorageAvailable } from "@/lib/learn/save/store";
import { LEARN_STORAGE_KEY } from "@/lib/learn/save/schema";
import { cn } from "@/lib/utils";

/**
 * The "Hapus data belajar saya" control required by the UU PDP page (04 §18 R10).
 *
 * UU PDP 27/2022 gives a subject the right to erase their data. For everything the
 * learn section stores that right has to be exercisable *by the person*, on the
 * device that holds it, because nothing is stored server-side — there is no account
 * to email and no record for ACTA to delete on request. A privacy page that only
 * *describes* the right without shipping the control would be a promise the site
 * cannot keep.
 *
 * Renders `null` until mounted: the store is localStorage-backed, so the button's
 * enabled state is unknowable during SSR and rendering it optimistically would
 * flash a control that may be inert in private browsing.
 */
export function ClearLearnDataButton() {
  const [mounted, setMounted] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAvailable(isStorageAvailable());
  }, []);

  if (!mounted) return null;

  if (!available) {
    return (
      <p className="mono-spec text-sm text-muted-foreground">
        Penyimpanan lokal tidak aktif di browser ini, jadi tidak ada data belajar yang tersimpan.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => {
          clearLearnData();
          setCleared(true);
        }}
        className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
      >
        Hapus data belajar saya
      </button>
      {cleared ? (
        <span className="mono-spec text-sm text-accent-text" role="status">
          Terhapus. Kunci <code>{LEARN_STORAGE_KEY}</code> sudah dikosongkan dari browser ini.
        </span>
      ) : null}
    </div>
  );
}
