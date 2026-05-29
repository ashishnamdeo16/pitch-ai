import OpenAI from "openai";
import { createHash } from "crypto";
import { getCachedAI, setCachedAI } from "./redis.js";
import type { InvestorPersonality } from "../types.js";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const PERSONALITY_PROMPTS: Record<InvestorPersonality, string> = {
  AGGRESSIVE_VC:
    "You are a top-tier aggressive VC. Be direct, challenge assumptions, ask hard metrics questions. Keep responses under 2 sentences.",
  TECHNICAL:
    "You are a technical investor focused on architecture, moats, and engineering risk. Ask precise technical follow-ups. Under 2 sentences.",
  FRIENDLY_ANGEL:
    "You are a supportive angel investor. Encourage the founder while gently probing weaknesses. Warm tone, under 2 sentences.",
  SKEPTICAL_PARTNER:
    "You are a skeptical GP partner. Question market size, defensibility, and team. Under 2 sentences.",
  SHARK_TANK:
    "You are in Shark Tank mode — dramatic, competitive, offer-or-walk-away energy. Under 2 sentences.",
};

function hashTranscript(text: string): string {
  return createHash("sha256").update(text.slice(-500)).digest("hex").slice(0, 16);
}

export async function streamPitchFeedback(
  sessionId: string,
  transcript: string,
  onToken: (token: string) => void
): Promise<string> {
  const hash = hashTranscript(transcript);
  const cached = await getCachedAI(sessionId, `feedback:${hash}`);
  if (cached) {
    onToken(cached);
    return cached;
  }

  if (!openai) {
    const fallback =
      "Strong opening — tighten your problem statement and lead with a specific metric.";
    onToken(fallback);
    return fallback;
  }

  const stream = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    stream: true,
    max_tokens: 120,
    messages: [
      {
        role: "system",
        content:
          "You are PitchPilot AI, an elite startup pitch coach. Give ONE actionable coaching tip based on the live transcript. Be specific, founder-friendly, under 25 words.",
      },
      {
        role: "user",
        content: `Live pitch transcript (last 500 chars):\n${transcript.slice(-500)}`,
      },
    ],
  });

  let full = "";
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || "";
    if (token) {
      full += token;
      onToken(token);
    }
  }

  await setCachedAI(sessionId, `feedback:${hash}`, full);
  return full;
}

export async function generateInvestorQuestion(
  sessionId: string,
  transcript: string,
  personality: InvestorPersonality
): Promise<string> {
  const hash = hashTranscript(transcript + personality);
  const cached = await getCachedAI(sessionId, `investor:${hash}`);
  if (cached) return cached;

  if (!openai) {
    return "What's your unfair advantage against incumbents in this space?";
  }

  const res = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    max_tokens: 80,
    messages: [
      { role: "system", content: PERSONALITY_PROMPTS[personality] },
      {
        role: "user",
        content: `Based on this pitch, ask ONE investor question:\n${transcript.slice(-800)}`,
      },
    ],
  });

  const question = res.choices[0]?.message?.content?.trim() || "Walk me through your unit economics.";
  await setCachedAI(sessionId, `investor:${hash}`, question);
  return question;
}

export async function streamImprovementSuggestions(
  sessionId: string,
  transcript: string,
  onToken: (token: string) => void
): Promise<string> {
  if (!openai) {
    const fb = "Add a concrete TAM number and name your top competitor explicitly.";
    onToken(fb);
    return fb;
  }

  const stream = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    stream: true,
    max_tokens: 150,
    messages: [
      {
        role: "system",
        content:
          "List 2-3 bullet improvements for this startup pitch. Ultra concise, actionable.",
      },
      { role: "user", content: transcript.slice(-1000) },
    ],
  });

  let full = "";
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || "";
    if (token) {
      full += token;
      onToken(token);
    }
  }
  return full;
}
