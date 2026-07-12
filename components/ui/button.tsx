import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,background-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "rounded-pill bg-primary text-primary-foreground hover:bg-accent-hover hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        secondary:
          "rounded-pill bg-transparent text-foreground ring-1 ring-inset ring-border hover:bg-card hover:-translate-y-0.5",
        pill: "rounded-pill bg-transparent text-foreground ring-1 ring-inset ring-border hover:bg-card hover:-translate-y-0.5",
        glass:
          "rounded-pill bg-foreground/[0.08] text-foreground ring-1 ring-inset ring-foreground/25 backdrop-blur-xl shadow-[inset_0_1px_0_hsl(var(--foreground)/0.22),0_8px_24px_-12px_hsl(var(--foreground)/0.35)] hover:bg-foreground/[0.14] hover:ring-foreground/40 hover:-translate-y-0.5 active:translate-y-0",
        ghost: "rounded-pill text-foreground hover:bg-muted",
        whatsapp:
          "rounded-pill bg-primary text-primary-foreground hover:bg-accent-hover hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        destructive:
          "rounded-pill bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-accent-text underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-7 text-[0.95rem]",
        sm: "h-9 px-5 text-sm",
        lg: "h-[52px] px-8 text-base",
        icon: "h-10 w-10 rounded-pill",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
