"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LiveTranscriptProps {
  text: string;
  className?: string;
}

/** Renders transcript with filler words highlighted via ⟦markers⟧ from server */
export function LiveTranscript({ text, className }: LiveTranscriptProps) {
  const parts = text.split(/(⟦[^⟧]+⟧)/g);

  return (
    <div
      className={cn(
        "max-h-48 overflow-y-auto overflow-x-hidden rounded-xl border border-white/[0.06] bg-black/20 p-3 font-mono text-xs leading-relaxed break-words sm:max-h-64 sm:p-4 sm:text-sm",
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={text.slice(-40)}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          className="text-zinc-300"
        >
          {parts.length > 1 ? (
            parts.map((part, i) => {
              const match = part.match(/⟦([^⟧]+)⟧/);
              if (match) {
                return (
                  <span
                    key={i}
                    className="rounded bg-amber-500/20 px-1 text-amber-300 line-through decoration-amber-500/50"
                  >
                    {match[1]}
                  </span>
                );
              }
              return <span key={i}>{part}</span>;
            })
          ) : (
            text || (
              <span className="text-zinc-600 italic">
                Start speaking — your live transcript will appear here…
              </span>
            )
          )}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="ml-0.5 inline-block h-4 w-0.5 bg-violet-400 align-middle"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
