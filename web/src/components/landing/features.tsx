"use client";

import { motion } from "framer-motion";
import { BarChart3, Brain, Mic, Users } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

const features = [
  {
    icon: Mic,
    title: "Real-time analysis",
    description:
      "Live transcript, filler detection, pacing, confidence & energy scores — updated every second.",
  },
  {
    icon: Users,
    title: "Investor simulation",
    description:
      "Practice with Aggressive VC, Technical, Angel, Skeptical Partner, or Shark Tank personalities.",
  },
  {
    icon: Brain,
    title: "Structure analyzer",
    description:
      "Auto-detect Problem, Market, Solution, GTM, Business Model, Competition, Ask & Vision.",
  },
  {
    icon: BarChart3,
    title: "Analytics dashboard",
    description:
      "Track improvement over time, export PDF reports, and compete on founder leaderboards.",
  },
];

export function Features() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-3xl font-bold text-white md:text-4xl"
        >
          How it works
        </motion.h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-zinc-500">
          Three steps to a YC-ready pitch
        </p>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <GlassCard key={f.title} hover className="h-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20">
                  <f.icon className="h-6 w-6 text-violet-400" />
                </div>
                <h3 className="font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {f.description}
                </p>
              </motion.div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
