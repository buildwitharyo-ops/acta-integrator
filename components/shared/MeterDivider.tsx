import { SignalMeter } from "./SignalMeter";
import { cn } from "@/lib/utils";

export function MeterDivider({
  annotation,
  className,
}: {
  annotation?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <SignalMeter variant="divider" className="flex-1" />
      {annotation ? (
        <span className="mono-label shrink-0 text-muted-foreground">
          {annotation}
        </span>
      ) : null}
    </div>
  );
}
