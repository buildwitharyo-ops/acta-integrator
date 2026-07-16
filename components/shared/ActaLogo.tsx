import Image from "next/image";
import { cn } from "@/lib/utils";

// Real ACTA emblem (wordmark inside gold circuit-rings). Two variants swap by theme:
// black wordmark on light, white on dark. The dark: variant also fires inside any
// locally .dark-scoped surface (e.g. the footer), so this works in header + footer.
//
// sizes must track the largest actual rendered size (every call site caps at h-10 = 40px
// tall, ~44px wide at this aspect ratio) — a stale "160px" hint (08 §8 LCP audit finding)
// made next/image request a 640px-wide source variant ~3.5x bigger than ever displayed.
export function ActaLogo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <span className={cn("relative block aspect-[1912/1730]", className)}>
      <Image
        src="/brand/logo-acta-black.png"
        alt="ACTA"
        fill
        priority={priority}
        sizes="48px"
        className="object-contain dark:hidden"
      />
      <Image
        src="/brand/logo-acta-white.png"
        alt="ACTA"
        fill
        priority={priority}
        sizes="48px"
        className="hidden object-contain dark:block"
      />
    </span>
  );
}
