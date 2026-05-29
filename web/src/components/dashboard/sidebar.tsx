"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Mic,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session-store";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/practice", label: "Practice", icon: Mic },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/investor", label: "Investor Sim", icon: Users },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const isConnected = useSessionStore((s) => s.isConnected);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/[0.06] bg-[#0c0c10]/80 backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-white">PitchPilot</p>
          <p className="text-[10px] text-zinc-500">AI Pitch Coach</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "text-white"
                    : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
                )}
                whileHover={{ x: 2 }}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-white/[0.08]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-zinc-600"
            )}
          />
          <span className="text-xs text-zinc-500">
            {isConnected ? "Realtime connected" : "Offline"}
          </span>
        </div>
      </div>
    </aside>
  );
}
