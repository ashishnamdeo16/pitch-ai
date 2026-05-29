import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Testimonials } from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { MeshBackground } from "@/components/ui/mesh-background";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09090b]">
      <MeshBackground />
      <Navbar />
      <Hero />
      <Features />
      <Testimonials />

      {/* Social proof bar */}
      <section className="border-y border-white/[0.06] bg-white/[0.02] py-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 px-6 text-center text-sm text-zinc-500">
          <span>Trusted by 2,400+ founders</span>
          <span className="hidden md:inline">·</span>
          <span>Featured on Product Hunt #1</span>
          <span className="hidden md:inline">·</span>
          <span>4.9★ average rating</span>
        </div>
      </section>

      <Pricing />
      <FAQ />

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-600/20 to-indigo-600/10 p-12 text-center backdrop-blur-xl">
          <h2 className="text-3xl font-bold text-white">
            Ready to pitch like a pro?
          </h2>
          <p className="mt-4 text-zinc-400">
            Join thousands of founders practicing with AI before Demo Day.
          </p>
          <Link href="/signup" className="mt-8 inline-block">
            <Button size="lg">
              Start free today
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-8 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} PitchPilot AI. Built for founders, by founders.
      </footer>
    </main>
  );
}
