import Image from "next/image";
import { cn } from "@/lib/utils";

// Real ACTA emblem (wordmark inside gold circuit-rings). Two variants swap by theme:
// black wordmark on light, white on dark. The dark: variant also fires inside any
// locally .dark-scoped surface (e.g. the footer), so this works in header + footer.
//
// Served pre-sized and `unoptimized`: the app runs a custom next/image loader (lib/image-loader.ts)
// that passes /public assets through untouched, so whatever sits on disk is what ships. The
// masters are 1898px/~670 KB each — the -192.webp variants are 192px/~19 KB, i.e. 4x the largest
// rendered size (h-10 = 40px tall, ~44px wide) with headroom for 3x-DPR screens.
// The full-resolution PNGs stay in /public for JSON-LD (lib/jsonld.ts) and print use.
export function ActaLogo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <span className={cn("relative block aspect-[1912/1730]", className)}>
      <Image
        src="/brand/logo-acta-black-192.webp"
        alt="ACTA"
        fill
        priority={priority}
        unoptimized
        className="object-contain dark:hidden"
      />
      <Image
        src="/brand/logo-acta-white-192.webp"
        alt="ACTA"
        fill
        priority={priority}
        unoptimized
        className="hidden object-contain dark:block"
      />
    </span>
  );
}
