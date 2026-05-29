"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "How does real-time pitch analysis work?",
    a: "PitchPilot streams your speech through Web Speech API (or Deepgram on Pro), sends transcript chunks to our WebSocket server, and returns live metrics, structure detection, and GPT-4o coaching tips with sub-second latency.",
  },
  {
    q: "Do I need special hardware?",
    a: "Any modern browser with a microphone works. Mobile-responsive design supports iOS Safari and Chrome on Android.",
  },
  {
    q: "Is my pitch data private?",
    a: "Sessions are private by default. Pro users can generate shareable links. All data is encrypted at rest in PostgreSQL via Supabase.",
  },
  {
    q: "What's Shark Tank mode?",
    a: "An intense investor personality that simulates high-stakes TV pitch energy — dramatic questions, offer pressure, and rapid follow-ups.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="px-6 py-24">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-3xl font-bold text-white">FAQ</h2>
        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]"
            >
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-white"
              >
                {faq.q}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-zinc-500 transition-transform",
                    open === i && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm text-zinc-500">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
