"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Waveform } from "@/components/pitch/waveform";

export function Hero() {
  return (
    <section className="relative px-6 pb-24 pt-32 md:pt-40">
      <div className="mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300"
        >
          <Sparkles className="h-4 w-4" />
          #1 Product on Product Hunt — AI Pitch Coach
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl font-bold tracking-tight text-white md:text-7xl"
        >
          Nail your pitch
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
            before Demo Day
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400"
        >
          PitchPilot AI analyzes your startup pitch in real time — filler words,
          pacing, structure, and investor-grade feedback while you speak.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/signup">
            <Button size="lg">
              Start practicing free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="secondary" size="lg">
            <Play className="h-4 w-4" />
            Watch demo
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="relative mx-auto mt-16 max-w-3xl overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 backdrop-blur-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-indigo-600/10" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Live session preview</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                Recording
              </span>
            </div>
            <Waveform isActive />
            <p className="mt-4 text-left font-mono text-sm text-zinc-400">
              We&apos;re building the{" "}
              <span className="rounded bg-amber-500/20 px-1 text-amber-300 line-through">
                basically
              </span>{" "}
              operating system for founder pitches — $2.4B TAM, 40% MoM growth…
            </p>
            <div className="mt-4 flex gap-4">
              {[
                { label: "Overall", value: 87 },
                { label: "Clarity", value: 92 },
                { label: "Energy", value: 78 },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex-1 rounded-lg border border-white/[0.06] bg-black/20 p-3 text-center"
                >
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-zinc-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
