"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mic, TrendingUp, Zap } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { useSessionStore } from "@/store/session-store";
import { formatDuration } from "@/lib/utils";

interface Session {
  id: string;
  title: string;
  overallScore: number | null;
  durationSeconds: number;
  fillerCount: number;
  createdAt: string;
  mode: string;
}

export function DashboardOverview({
  userName,
  sessions,
  userId,
}: {
  userName: string;
  sessions: Session[];
  userId: string;
}) {
  const metrics = useSessionStore((s) => s.metrics);
  const isConnected = useSessionStore((s) => s.isConnected);

  const avgScore =
    sessions.filter((s) => s.overallScore).length > 0
      ? Math.round(
          sessions
            .filter((s) => s.overallScore)
            .reduce((a, s) => a + (s.overallScore || 0), 0) /
            sessions.filter((s) => s.overallScore).length
        )
      : metrics.overallScore;

  return (
    <div className="page-shell max-w-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          Welcome back, {userName}
        </h1>
        <p className="mt-1 text-zinc-500">
          {isConnected ? "Live session active" : "Ready for your next pitch?"}
        </p>
      </motion.div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:gap-6 sm:grid-cols-2 md:grid-cols-3">
        {[
          { label: "Avg Score", value: avgScore, icon: TrendingUp, suffix: "/100" },
          { label: "Sessions", value: sessions.length, icon: Mic, suffix: "" },
          { label: "Live Score", value: metrics.overallScore, icon: Zap, suffix: "/100" },
        ].map((stat, i) => (
          <GlassCard key={stat.label}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">{stat.label}</span>
                <stat.icon className="h-4 w-4 text-violet-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                {stat.value}
                <span className="text-lg text-zinc-500">{stat.suffix}</span>
              </p>
            </motion.div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-3">
        <GlassCard className="min-w-0 lg:col-span-2">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-white">Recent sessions</h2>
            <Link href="/dashboard/practice">
              <Button size="sm">
                New session
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {sessions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-zinc-500">No sessions yet</p>
              <Link href="/dashboard/practice" className="mt-4 inline-block">
                <Button>Start your first pitch</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{s.title}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(s.createdAt).toLocaleDateString()} ·{" "}
                      {formatDuration(s.durationSeconds)} · {s.mode}
                    </p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-lg font-bold text-violet-400">
                      {s.overallScore ?? "—"}
                    </p>
                    <p className="text-xs text-zinc-600">{s.fillerCount} fillers</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <ActivityFeed />
          <p className="mt-4 text-xs text-zinc-600">User: {userId.slice(0, 8)}…</p>
        </GlassCard>
      </div>
    </div>
  );
}
