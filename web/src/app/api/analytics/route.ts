import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/redis";
import { API_USER_ERRORS } from "@/lib/user-messages";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: API_USER_ERRORS.unauthorized }, { status: 401 });
    }

    const rl = await rateLimit(`analytics:${user.id}`, 30, 60);
    if (!rl.success) {
      return NextResponse.json({ error: API_USER_ERRORS.rateLimited }, { status: 429 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({
        scoreHistory: [],
        fillerTrend: [],
        improvement: 0,
        totalSessions: 0,
        avgScore: 0,
      });
    }

    const sessions = await prisma.pitchSession.findMany({
      where: {
        userId: dbUser.id,
        status: "COMPLETED",
        overallScore: { not: null },
      },
      orderBy: { createdAt: "asc" },
      take: 30,
      select: {
        overallScore: true,
        fillerCount: true,
        createdAt: true,
        clarityScore: true,
        confidenceScore: true,
      },
    });

    const scoreHistory = sessions.map((s, i) => ({
      session: i + 1,
      score: s.overallScore,
      date: s.createdAt.toISOString().slice(0, 10),
    }));

    const fillerTrend = sessions.map((s, i) => ({
      session: i + 1,
      fillers: s.fillerCount,
    }));

    const scores = sessions.map((s) => s.overallScore!).filter(Boolean);
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    const improvement =
      scores.length >= 2
        ? Math.round(
            ((scores[scores.length - 1] - scores[0]) / Math.max(scores[0], 1)) *
              100
          )
        : 0;

    return NextResponse.json({
      scoreHistory,
      fillerTrend,
      improvement,
      totalSessions: sessions.length,
      avgScore,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: API_USER_ERRORS.server }, { status: 500 });
  }
}
