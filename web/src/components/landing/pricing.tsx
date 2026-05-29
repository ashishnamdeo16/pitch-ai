"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check } from "lucide-react";
import { PRICING_PLANS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="pricing" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold text-white">Simple pricing</h2>
        <p className="mt-4 text-center text-zinc-500">
          Start free. Upgrade when you&apos;re fundraising.
        </p>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {PRICING_PLANS.map((plan, i) => (
            <GlassCard
              key={plan.name}
              className={cn(
                "relative",
                plan.highlighted && "border-violet-500/40 ring-1 ring-violet-500/20"
              )}
              glow={plan.highlighted}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-0.5 text-xs text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="mt-2">
                  <span className="text-4xl font-bold text-white">
                    {plan.price === 0 ? "Free" : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-zinc-500">{plan.period}</span>
                  )}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                      <Check className="h-4 w-4 shrink-0 text-violet-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="mt-8 block">
                  <Button
                    variant={plan.highlighted ? "default" : "secondary"}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
