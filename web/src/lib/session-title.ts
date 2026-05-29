import { prisma } from "@/lib/prisma";

const DEFAULT_TITLES: Record<string, string> = {
  practice: "Practice Session",
  investor: "Investor Simulation",
  demo_day: "Demo Day Session",
  shark_tank: "Shark Tank Session",
};

/** Next numbered title for a mode, e.g. "Practice Session 3". */
export async function nextSessionTitle(
  userId: string,
  mode: string,
  requestedTitle?: string
): Promise<string> {
  const base = DEFAULT_TITLES[mode] ?? "Session";
  const normalized = requestedTitle?.trim();

  const useAutoNumber =
    !normalized ||
    normalized === base ||
    normalized === DEFAULT_TITLES.practice;

  if (!useAutoNumber) {
    return normalized.slice(0, 120);
  }

  const count = await prisma.pitchSession.count({
    where: { userId, mode },
  });

  return `${base} ${count + 1}`;
}

export function sessionPdfFilename(title: string): string {
  const slug = title
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "pitch-report"}.pdf`;
}
