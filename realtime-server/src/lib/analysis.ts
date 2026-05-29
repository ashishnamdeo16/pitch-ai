import {
  FILLER_WORDS,
  PITCH_STRUCTURE_ELEMENTS,
  type SessionMetrics,
  type StructureDetection,
} from "../types.js";

const STRUCTURE_KEYWORDS: Record<string, RegExp[]> = {
  problem: [/problem/i, /pain point/i, /struggle/i, /friction/i],
  market: [/market/i, /tam/i, /sam/i, /billion/i, /million users/i],
  solution: [/solution/i, /product/i, /platform/i, /we built/i],
  gtm: [/go-to-market/i, /gtm/i, /distribution/i, /sales/i, /acquisition/i],
  business_model: [/revenue/i, /pricing/i, /subscription/i, /monetiz/i],
  competition: [/competitor/i, /alternative/i, /versus/i, /differentiat/i],
  ask: [/raising/i, /seeking/i, /\$\d+[mk]/i, /round/i, /investment/i],
  vision: [/vision/i, /future/i, /years from now/i, /world where/i],
};

export function detectFillerWords(text: string): string[] {
  const lower = text.toLowerCase();
  return FILLER_WORDS.filter((w) => {
    const re = new RegExp(`\\b${w.replace(/\s/g, "\\s+")}\\b`, "gi");
    return re.test(lower);
  });
}

export function countFillers(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const w of FILLER_WORDS) {
    const re = new RegExp(`\\b${w.replace(/\s/g, "\\s+")}\\b`, "gi");
    const matches = lower.match(re);
    if (matches) count += matches.length;
  }
  return count;
}

export function computePacingWpm(text: string, durationSeconds: number): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (durationSeconds <= 0) return 0;
  return Math.round((words / durationSeconds) * 60);
}

export function computeMetrics(
  transcript: string,
  durationSeconds: number,
  structureDetected: number
): SessionMetrics {
  const fillerCount = countFillers(transcript);
  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  const pacingWpm = computePacingWpm(transcript, durationSeconds);

  // Heuristic scores — production can swap for ML models
  const fillerPenalty = Math.min(fillerCount * 3, 40);
  const pacingIdeal = pacingWpm >= 120 && pacingWpm <= 160;
  const pacingScore = pacingWpm === 0 ? 50 : pacingIdeal ? 90 : pacingWpm < 100 ? 65 : 75;

  const clarityScore = Math.max(20, 100 - fillerPenalty - (wordCount < 20 ? 20 : 0));
  const confidenceScore = Math.min(95, clarityScore + 5 + (wordCount > 50 ? 10 : 0));
  const energyScore = Math.min(
    95,
    pacingScore * 0.4 + confidenceScore * 0.3 + (wordCount > 100 ? 25 : 15)
  );
  const structureScore = (structureDetected / PITCH_STRUCTURE_ELEMENTS.length) * 100;
  const overallScore =
    clarityScore * 0.3 +
    confidenceScore * 0.25 +
    energyScore * 0.2 +
    pacingScore * 0.15 +
    structureScore * 0.1;

  return {
    confidenceScore: Math.round(confidenceScore),
    energyScore: Math.round(energyScore),
    clarityScore: Math.round(clarityScore),
    pacingWpm,
    fillerCount,
    structureScore: Math.round(structureScore),
    overallScore: Math.round(overallScore),
  };
}

export function analyzeStructure(transcript: string): StructureDetection[] {
  return PITCH_STRUCTURE_ELEMENTS.map((element) => {
    const patterns = STRUCTURE_KEYWORDS[element] || [];
    const detected = patterns.some((p) => p.test(transcript));
    let excerpt: string | undefined;
    if (detected) {
      const sentences = transcript.split(/[.!?]+/);
      excerpt = sentences.find((s) => patterns.some((p) => p.test(s)))?.trim();
    }
    return {
      element,
      detected,
      excerpt: excerpt?.slice(0, 120),
      confidence: detected ? 0.85 : 0,
    };
  });
}

export function highlightFillersInText(text: string): string {
  let result = text;
  for (const w of FILLER_WORDS) {
    const re = new RegExp(`(\\b${w.replace(/\s/g, "\\s+")}\\b)`, "gi");
    result = result.replace(re, "⟦$1⟧");
  }
  return result;
}
