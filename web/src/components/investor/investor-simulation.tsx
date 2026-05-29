"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";
import { INVESTOR_PERSONALITIES } from "@/lib/constants";
import { waitForSessionReady } from "@/lib/wait-for-session-ready";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useSessionStore } from "@/store/session-store";
import { usePitchSocket } from "@/hooks/use-pitch-socket";
import { FeedbackTimeline } from "@/components/pitch/feedback-timeline";
import { cn } from "@/lib/utils";

export function InvestorSimulation({ userId }: { userId: string }) {
  const [selected, setSelected] = useState("SKEPTICAL_PARTNER");
  const [asking, setAsking] = useState(false);
  const {
    sessionId,
    setSessionId,
    feedback,
    investorPersonality,
    setInvestorPersonality,
    addActivity,
  } = useSessionStore();
  const { askInvestor } = usePitchSocket(userId);

  const initSession = async (): Promise<string | null> => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "investor" }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const id = data.session?.id as string | undefined;
    if (id) setSessionId(id);
    return id ?? null;
  };

  const handleAsk = async () => {
    if (asking) return;
    setAsking(true);
    setInvestorPersonality(selected);

    try {
      let sid = sessionId;
      if (!sid) sid = await initSession();
      if (!sid) {
        addActivity({ type: "session", message: "Could not start session" });
        return;
      }

      const ready = await waitForSessionReady();
      if (!ready) {
        addActivity({
          type: "ws",
          message: "Connection timed out — refresh and retry",
        });
        return;
      }

      askInvestor(selected);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white">Investor Simulation</h1>
      <p className="mt-1 text-zinc-500">
        Practice with AI investors — dynamic follow-up questioning in real time
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INVESTOR_PERSONALITIES.map((p) => (
          <motion.button
            key={p.id}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected(p.id)}
            className={cn(
              "rounded-2xl border p-5 text-left transition-all",
              selected === p.id
                ? "border-violet-500/50 bg-violet-500/10"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
            )}
          >
            <div
              className={cn(
                "mb-3 h-1 w-12 rounded-full bg-gradient-to-r",
                p.color
              )}
            />
            <h3 className="font-semibold text-white">{p.name}</h3>
            <p className="mt-1 text-xs text-zinc-500">{p.description}</p>
          </motion.button>
        ))}
      </div>

      <GlassCard className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <MessageCircle className="h-4 w-4" />
            Active: {INVESTOR_PERSONALITIES.find((p) => p.id === investorPersonality)?.name || "None"}
          </div>
          <Button onClick={handleAsk} disabled={asking}>
            <Send className="h-4 w-4" />
            {asking ? "Connecting…" : "Ask investor question"}
          </Button>
        </div>
        <div className="mt-6">
          <FeedbackTimeline
            items={feedback.filter((f) => f.type === "question")}
          />
        </div>
      </GlassCard>

      <GlassCard className="mt-6">
        <h3 className="font-medium text-white">Conversational mode</h3>
        <p className="mt-2 text-sm text-zinc-500">
          Start a practice session with microphone enabled — investor questions will
          interleave with your live pitch based on what you say.
        </p>
      </GlassCard>
    </div>
  );
}
