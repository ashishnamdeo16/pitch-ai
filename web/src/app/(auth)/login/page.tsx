"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { MeshBackground } from "@/components/ui/mesh-background";
import {
  EMAIL_NOT_CONFIRMED_MESSAGE,
  isEmailNotConfirmed,
  logDevError,
  mapSupabaseAuthError,
} from "@/lib/user-messages";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    setNeedsEmailConfirm(false);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const unconfirmed = isEmailNotConfirmed(error.message);
      setNeedsEmailConfirm(unconfirmed);
      setError(mapSupabaseAuthError(error.message));
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleResendConfirmation() {
    if (!email.trim()) {
      setError("Enter your email address above, then resend the confirmation link.");
      return;
    }

    setResending(true);
    setError("");
    setInfo("");

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/login`
        : undefined;

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    });

    setResending(false);

    if (error) {
      logDevError("auth/resend-confirmation", error);
      setError(mapSupabaseAuthError(error.message));
      return;
    }

    setInfo(
      "Confirmation email sent. Check your inbox and spam folder, then click the link before signing in."
    );
  }

  return (
    <main className="relative flex min-h-[100dvh] w-full max-w-[100vw] items-center justify-center overflow-x-hidden px-4 py-8 sm:px-6">
      <MeshBackground />
      <GlassCard className="mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-white">PitchPilot AI</span>
        </div>
        <h1 className="text-center text-xl font-bold text-white sm:text-2xl">Welcome back</h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          Sign in to continue practicing
        </p>
        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
          />
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-emerald-400" role="status">
              {info}
            </p>
          )}
          {needsEmailConfirm && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-200">{EMAIL_NOT_CONFIRMED_MESSAGE}</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3 w-full"
                disabled={resending}
                onClick={handleResendConfirmation}
              >
                {resending ? "Sending…" : "Resend confirmation email"}
              </Button>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          No account?{" "}
          <Link href="/signup" className="text-violet-400 hover:underline">
            Sign up free
          </Link>
        </p>
      </GlassCard>
    </main>
  );
}
