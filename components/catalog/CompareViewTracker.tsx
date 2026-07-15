"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

// Fires compare_view (10-TECH §9 event #4/#5) once when the compare PAGE is opened — covering
// direct links, back-nav and shared URLs, not just the in-tray "Bandingkan" click. Fires on mount
// only, so removing an item on the page (a soft nav) does not re-fire.
export function CompareViewTracker({ slugs }: { slugs: string[] }) {
  useEffect(() => {
    if (slugs.length === 0) return;
    trackEvent("compare_view", { product_slug: slugs.join(","), count: slugs.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
