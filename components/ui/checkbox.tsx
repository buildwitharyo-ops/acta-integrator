"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

// Token-styled native checkbox — accessible, no radix dependency.
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <span className="relative inline-flex h-[18px] w-[18px] shrink-0">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "peer h-[18px] w-[18px] cursor-pointer appearance-none rounded-[5px] border border-border bg-background transition-colors",
          "checked:border-primary checked:bg-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
        {...props}
      />
      <svg
        viewBox="0 0 12 12"
        className="pointer-events-none absolute inset-0 m-auto hidden h-3 w-3 text-primary-foreground peer-checked:block"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path d="M2.5 6.3l2.2 2.4 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  ),
);
Checkbox.displayName = "Checkbox";
