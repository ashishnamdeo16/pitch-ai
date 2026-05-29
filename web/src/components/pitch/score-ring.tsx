"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  label: string;
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  color?: string;
}

const sizes = {
  sm: { box: 64, stroke: 4, text: "text-sm" },
  md: { box: 88, stroke: 5, text: "text-lg" },
  lg: { box: 120, stroke: 6, text: "text-2xl" },
};

export function ScoreRing({
  label,
  value,
  max = 100,
  size = "md",
  color = "#8b5cf6",
}: ScoreRingProps) {
  const s = sizes[size];
  const radius = (s.box - s.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: s.box, height: s.box }}>
        <svg width={s.box} height={s.box} className="-rotate-90">
          <circle
            cx={s.box / 2}
            cy={s.box / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={s.stroke}
          />
          <motion.circle
            cx={s.box / 2}
            cy={s.box / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center font-semibold text-white",
            s.text
          )}
        >
          {Math.round(value)}
        </div>
      </div>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}
