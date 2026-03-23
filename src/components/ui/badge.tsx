import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-[0.16em] uppercase",
  {
    variants: {
      variant: {
        default: "bg-[var(--surface-strong)] text-[var(--ink)]",
        success: "bg-[rgba(17,102,73,0.12)] text-[#116649]",
        warning: "bg-[rgba(191,118,25,0.12)] text-[#8d540f]",
        danger: "bg-[rgba(171,63,46,0.12)] text-[#8d2919]",
        accent: "bg-[rgba(14,90,118,0.14)] text-[var(--accent-strong)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
