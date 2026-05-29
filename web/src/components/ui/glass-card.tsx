"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function GlassCard({
  children,
  className,
  hover = false,
  glow = false,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
        hover && "transition-colors hover:border-white/[0.12] hover:bg-white/[0.05]",
        glow && "before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:bg-gradient-to-br before:from-violet-500/10 before:to-transparent before:blur-xl",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
