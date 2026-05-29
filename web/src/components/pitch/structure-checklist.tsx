"use client";

import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { PITCH_ELEMENTS } from "@/lib/constants";
import type { StructureItem } from "@/types";
import { cn } from "@/lib/utils";

interface StructureChecklistProps {
  structure: StructureItem[];
}

export function StructureChecklist({ structure }: StructureChecklistProps) {
  const map = new Map(structure.map((s) => [s.element, s]));

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {PITCH_ELEMENTS.map((el, i) => {
        const detected = map.get(el.id)?.detected ?? false;
        return (
          <motion.div
            key={el.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
              detected
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-white/[0.06] bg-white/[0.02] text-zinc-500"
            )}
          >
            {detected ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>
              {el.icon} {el.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
