"use client";

import { motion } from "framer-motion";
import { Bot, HelpCircle, Sparkles } from "lucide-react";
import type { AIFeedbackItem } from "@/types";
import { cn } from "@/lib/utils";

interface FeedbackTimelineProps {
  items: AIFeedbackItem[];
}

const icons = {
  feedback: Sparkles,
  question: HelpCircle,
  structure: Bot,
  improvement: Sparkles,
};

export function FeedbackTimeline({ items }: FeedbackTimelineProps) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-600">
        AI coaching tips will stream here as you pitch
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 8).map((item, i) => {
        const Icon = icons[item.type] || Sparkles;
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "rounded-xl border p-3 sm:p-4",
              item.type === "question"
                ? "border-amber-500/20 bg-amber-500/5"
                : "border-violet-500/20 bg-violet-500/5"
            )}
          >
            <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
              <Icon className="h-3.5 w-3.5" />
              <span className="capitalize">{item.type.replace("_", " ")}</span>
              {!item.done && item.content && (
                <span className="ml-auto animate-pulse text-violet-400">streaming…</span>
              )}
            </div>
            <p className="break-words text-sm leading-relaxed text-zinc-200">
              {item.content || "…"}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
