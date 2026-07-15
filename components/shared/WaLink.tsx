"use client";

import { type ComponentProps } from "react";
import { trackEvent } from "@/lib/analytics";

type WaLinkProps = ComponentProps<"a"> & { waContext: string };

// Raw WhatsApp text/number link that fires whatsapp_click (10-TECH §9 event #1) so WA entry points
// outside <WhatsAppCTA> (footer/contact number links) are not undercounted. GA4-only — never
// forwarded to ACTA-OS (09 §10.3).
export function WaLink({ waContext, onClick, children, ...props }: WaLinkProps) {
  return (
    <a
      {...props}
      onClick={(e) => {
        trackEvent("whatsapp_click", { context: waContext, item: null });
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
