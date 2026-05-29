import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHash } from "crypto";
import { getCachedAI, setCachedAI } from "./redis.js";
import type { InvestorPersonality } from "../types.js";

type AIProvider = "gemini" | "openai" | "fallback";

const geminiKey = process.env.GEMINI_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const provider: AIProvider = geminiKey
  ? "gemini"
  : openaiKey
    ? "openai"
    : "fallback";

const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
const gemini = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

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

const COACH_SYSTEM =
  "You are PitchPilot AI, an elite startup pitch coach. Give ONE actionable coaching tip based on the live transcript. Be specific, founder-friendly, under 25 words.";

function hashTranscript(text: string): string {
  return createHash("sha256").update(text.slice(-500)).digest("hex").slice(0, 16);
}

async function streamGemini(
  system: string,
  user: string,
  onToken: (token: string) => void,
  maxTokens = 120
): Promise<string> {
  if (!gemini) return "";

  const model = gemini.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: system,
    generationConfig: { maxOutputTokens: maxTokens + 256 },
  });

  const result = await model.generateContentStream(user);
  let full = "";
  for await (const chunk of result.stream) {
    const token = chunk.text();
    if (token) {
      full += token;
      onToken(token);
    }
  }
  return full;
}

async function completeGemini(
  system: string,
  user: string,
  maxTokens = 80
): Promise<string> {
  if (!gemini) return "";

  const model = gemini.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: system,
    generationConfig: { maxOutputTokens: maxTokens + 256 },
  });

  const result = await model.generateContent(user);
  return result.response.text().trim();
}

async function streamOpenAI(
  system: string,
  user: string,
  onToken: (token: string) => void,
  maxTokens = 120
): Promise<string> {
  if (!openai) return "";

  const stream = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    stream: true,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
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

async function completeOpenAI(
  system: string,
  user: string,
  maxTokens = 80
): Promise<string> {
  if (!openai) return "";

  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  return res.choices[0]?.message?.content?.trim() || "";
}

export function getAIProvider(): AIProvider {
  return provider;
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

  const user = `Live pitch transcript (last 500 chars):\n${transcript.slice(-500)}`;

  if (provider === "fallback") {
    const fallback =
      "Strong opening — tighten your problem statement and lead with a specific metric.";
    onToken(fallback);
    return fallback;
  }

  try {
    const full =
      provider === "gemini"
        ? await streamGemini(COACH_SYSTEM, user, onToken)
        : await streamOpenAI(COACH_SYSTEM, user, onToken);

    if (full) await setCachedAI(sessionId, `feedback:${hash}`, full);
    return full;
  } catch (err) {
    console.error(`[llm/${provider}] feedback error:`, err);
    const fallback =
      "Lead with a clear problem statement and one concrete metric investors can remember.";
    onToken(fallback);
    return fallback;
  }
}

export async function generateInvestorQuestion(
  sessionId: string,
  transcript: string,
  personality: InvestorPersonality
): Promise<string> {
  const hash = hashTranscript(transcript + personality);
  const cached = await getCachedAI(sessionId, `investor:${hash}`);
  if (cached) return cached;

  const system = PERSONALITY_PROMPTS[personality];
  const user = `Based on this pitch, ask ONE investor question:\n${transcript.slice(-800)}`;

  if (provider === "fallback") {
    return "What's your unfair advantage against incumbents in this space?";
  }

  try {
    const question =
      provider === "gemini"
        ? await completeGemini(system, user)
        : await completeOpenAI(system, user);

    const result =
      question || "Walk me through your unit economics.";
    await setCachedAI(sessionId, `investor:${hash}`, result);
    return result;
  } catch (err) {
    console.error(`[llm/${provider}] investor error:`, err);
    return "How do you acquire customers profitably at scale?";
  }
}

export async function streamImprovementSuggestions(
  sessionId: string,
  transcript: string,
  onToken: (token: string) => void
): Promise<string> {
  const system =
    "List 2-3 bullet improvements for this startup pitch. Ultra concise, actionable.";
  const user = transcript.slice(-1000);

  if (provider === "fallback") {
    const fb = "Add a concrete TAM number and name your top competitor explicitly.";
    onToken(fb);
    return fb;
  }

  try {
    return provider === "gemini"
      ? await streamGemini(system, user, onToken, 150)
      : await streamOpenAI(system, user, onToken, 150);
  } catch (err) {
    console.error(`[llm/${provider}] suggestions error:`, err);
    const fb = "Add a concrete TAM number and name your top competitor explicitly.";
    onToken(fb);
    return fb;
  }
}
