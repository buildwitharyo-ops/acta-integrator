import Image from "next/image";
import { cn } from "@/lib/utils";

// Real ACTA emblem (wordmark inside gold circuit-rings). Two variants swap by theme:
// black wordmark on light, white on dark. The dark: variant also fires inside any
// locally .dark-scoped surface (e.g. the footer), so this works in header + footer.
export function ActaLogo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <span className={cn("relative block aspect-[1912/1730]", className)}>
      <Image
        src="/brand/logo-acta-black.png"
        alt="ACTA"
        fill
        priority={priority}
        sizes="160px"
        className="object-contain dark:hidden"
      />
      <Image
        src="/brand/logo-acta-white.png"
        alt="ACTA"
        fill
        priority={priority}
        sizes="160px"
        className="hidden object-contain dark:block"
      />
    </span>
  );
}
