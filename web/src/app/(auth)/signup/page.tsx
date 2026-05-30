"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { MeshBackground } from "@/components/ui/mesh-background";
import { logDevError, mapSupabaseAuthError } from "@/lib/user-messages";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/login`
        : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setError(mapSupabaseAuthError(error.message));
      setLoading(false);
      return;
    }

    // Supabase requires email confirmation — no session until link is clicked
    if (!data.session) {
      setInfo(
        "Account created. Check your email (and spam folder) for a confirmation link, then sign in."
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleResendFromSignup() {
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/login`
        : undefined;

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    });

    setLoading(false);

    if (error) {
      logDevError("auth/resend-confirmation", error);
      setError(mapSupabaseAuthError(error.message));
      return;
    }

    setInfo(
      "Confirmation email sent. Check your inbox and spam folder, then sign in."
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
        <h1 className="text-center text-xl font-bold text-white sm:text-2xl">
          Start practicing free
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-500">
          5 sessions/month on the free plan
        </p>
        <form onSubmit={handleSignup} className="mt-8 space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
          />
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
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
          />
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          {info && (
            <div className="space-y-3 rounded-xl border border-violet-500/20 bg-violet-500/10 p-4">
              <p className="text-sm text-violet-200" role="status">
                {info}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                disabled={loading}
                onClick={handleResendFromSignup}
              >
                Resend confirmation email
              </Button>
              <Link
                href="/login"
                className="block text-center text-sm text-violet-400 hover:underline"
              >
                Go to sign in
              </Link>
            </div>
          )}
          {!info && (
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          )}
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-400 hover:underline">
            Sign in
          </Link>
        </p>
      </GlassCard>
    </main>
  );
}
