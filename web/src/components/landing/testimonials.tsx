"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";

const testimonials = [
  {
    quote:
      "PitchPilot caught every 'um' and helped me restructure my YC application pitch. Game changer.",
    author: "Sarah Chen",
    role: "CEO, Nexus AI · YC W25",
    avatar: "SC",
  },
  {
    quote:
      "The investor simulation feels terrifyingly real. I walked into my Sequoia meeting prepared.",
    author: "Marcus Webb",
    role: "Founder, Flowstack · $4M seed",
    avatar: "MW",
  },
  {
    quote:
      "We use team practice rooms before every demo day. Our average pitch score went up 34%.",
    author: "Priya Sharma",
    role: "COO, Helix Health",
    avatar: "PS",
  },
];

export function Testimonials() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold text-white">
          Loved by founders
        </h2>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <GlassCard key={t.author} hover>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-sm leading-relaxed text-zinc-300">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.author}</p>
                    <p className="text-xs text-zinc-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
