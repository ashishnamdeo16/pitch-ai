"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WaveformProps {
  isActive: boolean;
  bars?: number;
  className?: string;
}

export function Waveform({ isActive, bars = 24, className }: WaveformProps) {
  return (
    <div className={cn("flex h-16 items-center justify-center gap-[3px]", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-violet-600 to-indigo-400"
          animate={
            isActive
              ? {
                  height: [8, 12 + Math.random() * 40, 8],
                  opacity: [0.5, 1, 0.5],
                }
              : { height: 8, opacity: 0.3 }
          }
          transition={{
            duration: 0.4 + (i % 5) * 0.08,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          style={{ height: 8 }}
        />
      ))}
    </div>
  );
}
