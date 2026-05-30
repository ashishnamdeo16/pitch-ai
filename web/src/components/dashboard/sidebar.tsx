"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Menu,
  Mic,
  Settings,
  Users,
  X,
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const navContent = (
    <>
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">PitchPilot</p>
          <p className="text-[10px] text-zinc-500">AI Pitch Coach</p>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={cn(
                  "relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
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
                <Icon className="relative h-4 w-4 shrink-0" />
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
              "h-2 w-2 shrink-0 rounded-full",
              isConnected
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                : "bg-zinc-600"
            )}
          />
          <span className="truncate text-xs text-zinc-500">
            {isConnected ? "Realtime connected" : "Offline"}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#0c0c10]/90 px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/[0.06]"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="truncate font-semibold text-white">PitchPilot</span>
        </div>
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            isConnected ? "bg-emerald-400" : "bg-zinc-600"
          )}
          aria-hidden
        />
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            aria-label="Close menu overlay"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,90vw)] max-w-full flex-col border-r border-white/[0.06] bg-[#0c0c10]/95 backdrop-blur-xl transition-transform duration-300 ease-out lg:relative lg:z-auto lg:h-full lg:w-64 lg:translate-x-0 lg:shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
