export const FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "basically",
  "honestly",
  "you know",
] as const;

export const PITCH_ELEMENTS = [
  { id: "problem", label: "Problem", icon: "⚡" },
  { id: "market", label: "Market", icon: "📊" },
  { id: "solution", label: "Solution", icon: "💡" },
  { id: "gtm", label: "GTM", icon: "🚀" },
  { id: "business_model", label: "Business Model", icon: "💰" },
  { id: "competition", label: "Competition", icon: "⚔️" },
  { id: "ask", label: "The Ask", icon: "🎯" },
  { id: "vision", label: "Vision", icon: "🔮" },
] as const;

export const INVESTOR_PERSONALITIES = [
  {
    id: "AGGRESSIVE_VC",
    name: "Aggressive VC",
    description: "Direct, metrics-driven, no fluff",
    color: "from-red-500 to-orange-600",
  },
  {
    id: "TECHNICAL",
    name: "Technical Investor",
    description: "Architecture, moats, engineering depth",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "FRIENDLY_ANGEL",
    name: "Friendly Angel",
    description: "Supportive with gentle probing",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "SKEPTICAL_PARTNER",
    name: "Skeptical Partner",
    description: "Questions defensibility & market",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "SHARK_TANK",
    name: "Shark Tank Mode",
    description: "High-stakes, dramatic energy",
    color: "from-amber-500 to-red-600",
  },
] as const;

export const PRICING_PLANS = [
  {
    name: "Starter",
    price: 0,
    period: "forever",
    features: ["5 sessions/month", "Basic analytics", "Web Speech STT"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: 49,
    period: "/month",
    features: [
      "Unlimited sessions",
      "Investor simulation",
      "PDF reports",
      "Groq Whisper fallback",
      "Shark Tank mode",
    ],
    cta: "Go Pro",
    highlighted: true,
  },
  {
    name: "Team",
    price: 149,
    period: "/month",
    features: [
      "Everything in Pro",
      "Team practice rooms",
      "Shareable sessions",
      "Priority support",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
] as const;

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

