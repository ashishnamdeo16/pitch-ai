"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:brightness-110",
        secondary:
          "bg-white/5 text-white border border-white/10 hover:bg-white/10 backdrop-blur-sm",
        ghost: "text-zinc-400 hover:text-white hover:bg-white/5",
        outline:
          "border border-violet-500/30 text-violet-300 hover:bg-violet-500/10",
        danger: "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30",
      },
      size: {
        sm: "h-10 min-h-10 px-4 text-sm sm:h-9",
        md: "h-11 min-h-11 px-6 text-sm",
        lg: "h-12 min-h-12 px-6 text-base sm:px-8",
        icon: "h-11 w-11 min-h-11 min-w-11 sm:h-10 sm:w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
