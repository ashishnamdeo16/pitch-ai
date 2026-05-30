"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import { TrendingUp, Target, Mic } from "lucide-react";
import { logDevError, parseApiError } from "@/lib/user-messages";

interface AnalyticsData {
  scoreHistory: { session: number; score: number | null; date: string }[];
  fillerTrend: { session: number; fillers: number }[];
  improvement: number;
  totalSessions: number;
  avgScore: number;
}

export function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then(async (r) => {
        if (!r.ok) {
          setLoadError(await parseApiError(r));
          return null;
        }
        return r.json();
      })
      .then((json) => {
        if (json) setData(json);
      })
      .catch((e) => {
        logDevError("analytics/load", e);
        setLoadError("Unable to load analytics. Please refresh the page.");
      })
      .finally(() => setLoading(false));
  }, []);

  const scoreHistory = data?.scoreHistory ?? [];
  const fillerTrend = data?.fillerTrend ?? [];
  const hasSessions = (data?.totalSessions ?? 0) > 0;

  return (
    <div className="page-shell max-w-full">
      <h1 className="text-xl font-bold text-white sm:text-2xl">Analytics</h1>
      <p className="mt-1 text-zinc-500">Track your pitch improvement over time</p>

      {loadError && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {loadError}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 md:grid-cols-3">
        {[
          {
            label: "Avg Score",
            value: hasSessions ? data!.avgScore : "—",
            icon: Target,
            suffix: hasSessions ? "/100" : "",
          },
          {
            label: "Improvement",
            value: hasSessions ? data!.improvement : "—",
            icon: TrendingUp,
            suffix: hasSessions ? "%" : "",
          },
          {
            label: "Sessions",
            value: data?.totalSessions ?? 0,
            icon: Mic,
            suffix: "",
          },
        ].map((s) => (
          <GlassCard key={s.label}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">{s.label}</span>
              <s.icon className="h-4 w-4 text-violet-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              {s.value}
              <span className="text-lg text-zinc-500">{s.suffix}</span>
            </p>
          </GlassCard>
        ))}
      </div>

      {loading ? (
        <GlassCard className="mt-8 p-12 text-center text-zinc-500">
          Loading your pitch analytics…
        </GlassCard>
      ) : !hasSessions ? (
        <GlassCard className="mt-8 p-12 text-center">
          <p className="text-zinc-400">No completed sessions yet.</p>
          <p className="mt-2 text-sm text-zinc-600">
            Complete a practice pitch to see your score trends here.
          </p>
        </GlassCard>
      ) : (
        <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 lg:grid-cols-2">
          <GlassCard className="min-w-0">
            <h2 className="mb-4 text-sm font-semibold text-white sm:text-base">
              Pitch score over time
            </h2>
            <div className="h-[220px] w-full min-w-0 sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreHistory}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="session" stroke="#71717a" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#71717a" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#8b5cf6"
                  fill="url(#scoreGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="min-w-0">
            <h2 className="mb-4 text-sm font-semibold text-white sm:text-base">
              Filler word trend
            </h2>
            <div className="h-[220px] w-full min-w-0 sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fillerTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="session" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="fillers" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
