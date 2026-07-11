import { Fragment } from "react";
import { CornerTicks } from "./CornerTicks";
import { cn } from "@/lib/utils";

export type SignalStage = {
  label: string;
  sublabel?: string;
  annotation?: string;
};

function Connector() {
  return (
    <div
      className="flex items-center justify-center py-1 md:w-10 md:py-0"
      aria-hidden
    >
      <div className="relative h-6 w-px bg-border md:h-px md:w-full">
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 bg-primary" />
      </div>
    </div>
  );
}

export function SignalChainDiagram({
  stages,
  className,
}: {
  stages: SignalStage[];
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col md:flex-row md:items-stretch", className)}
    >
      {stages.map((stage, i) => (
        <Fragment key={`${stage.label}-${i}`}>
          <div className="relative flex-1 rounded-sm bg-card p-5 ring-1 ring-border">
            <CornerTicks />
            <span className="mono-spec text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="heading-md mt-2">{stage.label}</p>
            {stage.sublabel ? (
              <p className="body-sm mt-1 text-muted-foreground">
                {stage.sublabel}
              </p>
            ) : null}
            {stage.annotation ? (
              <p className="mono-spec mt-4 text-accent-text">
                {stage.annotation}
              </p>
            ) : null}
          </div>
          {i < stages.length - 1 ? <Connector /> : null}
        </Fragment>
      ))}
    </div>
  );
}
