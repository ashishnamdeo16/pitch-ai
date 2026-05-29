"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [teleprompter, setTeleprompter] = useState("");
  const [language, setLanguage] = useState("en");
  const supabase = createClient();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <p className="mt-1 text-zinc-500">Customize your practice experience</p>

      <div className="mt-8 max-w-xl space-y-6">
        <GlassCard>
          <h3 className="font-medium text-white">Teleprompter script</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Paste your pitch script for rehearsal mode
          </p>
          <textarea
            value={teleprompter}
            onChange={(e) => setTeleprompter(e.target.value)}
            rows={6}
            className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
            placeholder="Our startup solves..."
          />
        </GlassCard>

        <GlassCard>
          <h3 className="font-medium text-white">Language</h3>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="hi">Hindi</option>
          </select>
          <p className="mt-2 text-xs text-zinc-600">Multi-language STT support</p>
        </GlassCard>

        <GlassCard>
          <h3 className="font-medium text-white">Account</h3>
          <Button variant="danger" className="mt-4" onClick={signOut}>
            Sign out
          </Button>
        </GlassCard>
      </div>
    </div>
  );
}
