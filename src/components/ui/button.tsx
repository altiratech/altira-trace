"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent)] px-4 py-2 text-[var(--accent-ink)] hover:bg-[var(--accent-strong)]",
        secondary:
          "bg-[var(--panel)] px-4 py-2 text-[var(--panel-ink)] hover:bg-[#17384b]",
        outline:
          "border border-[color:var(--line)] bg-transparent px-4 py-2 text-[var(--ink)] hover:bg-[var(--surface-strong)]",
        ghost: "px-3 py-2 text-[var(--ink-soft)] hover:bg-[var(--surface-strong)]",
      },
      size: {
        default: "h-10",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
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
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      type={type}
      {...props}
    />
  );
}
