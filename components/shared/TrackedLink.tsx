"use client";

import Link from "next/link";
import { forwardRef, type ComponentProps } from "react";
import { trackEvent } from "@/lib/analytics";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  ctaId: string;
  location: string;
};

// Drop-in for next/link that fires cta_click({cta_id, location}) on click (10-TECH §9 event #6:
// primary non-lead CTAs). forwardRef + prop spread so it works inside <Button asChild> (Radix Slot).
// Reserved for navigation CTAs — NOT lead CTAs (WA/form), which fire whatsapp_click/generate_lead.
export const TrackedLink = forwardRef<HTMLAnchorElement, TrackedLinkProps>(
  function TrackedLink({ ctaId, location, onClick, ...props }, ref) {
    return (
      <Link
        ref={ref}
        {...props}
        onClick={(e) => {
          trackEvent("cta_click", { cta_id: ctaId, location });
          onClick?.(e);
        }}
      />
    );
  },
);
