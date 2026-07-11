import { cn } from "@/lib/utils";

export function CornerTicks({
  className,
  size = 10,
}: {
  className?: string;
  size?: number;
}) {
  const box = { width: size, height: size };
  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden
    >
      <span
        className="absolute left-0 top-0 border-l border-t border-foreground/30"
        style={box}
      />
      <span
        className="absolute right-0 top-0 border-r border-t border-foreground/30"
        style={box}
      />
      <span
        className="absolute bottom-0 left-0 border-b border-l border-foreground/30"
        style={box}
      />
      <span
        className="absolute bottom-0 right-0 border-b border-r border-foreground/30"
        style={box}
      />
    </div>
  );
}
